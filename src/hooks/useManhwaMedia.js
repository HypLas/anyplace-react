import { useState, useEffect } from "react";

const MANGADEX = "https://api.mangadex.org";
const MDX_CDN  = "https://uploads.mangadex.org";
const COMICK   = "https://api.comick.fun";

/* ─── Helpers titre ─── */
function norm(s) {
  if (!s) return "";
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function similarity(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wa = new Set(na.split(" ")), wb = new Set(nb.split(" "));
  const inter = [...wa].filter(w => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return union === 0 ? 0 : inter / union;
}
function bestScore(titleVariants, candidateTitles) {
  return Math.max(...titleVariants.map(tv =>
    Math.max(...candidateTitles.filter(Boolean).map(ct => similarity(tv, ct)))
  ));
}

/* ─── ComicK ─── */
async function searchComicK(titleVariants) {
  for (const title of titleVariants) {
    if (!title) continue;
    try {
      const res   = await fetch(`${COMICK}/v1.0/search?q=${encodeURIComponent(title)}&limit=8`);
      const comics = await res.json();
      if (!Array.isArray(comics) || !comics.length) continue;

      let best = null, top = 0;
      for (const c of comics) {
        const titles = [c.title, ...(c.md_titles?.map(t => t.title) || [])];
        const score  = bestScore(titleVariants, titles);
        if (score > top) { top = score; best = c; }
      }
      if (best && top >= 0.55) return best; // { slug, title, cover_url, links:{md?} }
    } catch {}
  }
  return null;
}

/* ─── MangaDex ─── */
const MDX_RATINGS = "&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic";

async function searchMDX(titleVariants) {
  for (const title of titleVariants) {
    if (!title) continue;
    try {
      const res  = await fetch(`${MANGADEX}/manga?title=${encodeURIComponent(title)}&limit=10&includes[]=cover_art${MDX_RATINGS}`);
      const json = await res.json();
      const candidates = json.data || [];
      if (!candidates.length) continue;

      let best = null, top = 0;
      for (const manga of candidates) {
        const titles = [
          manga.attributes?.title?.en,
          manga.attributes?.title?.fr,
          manga.attributes?.title?.["ja-ro"],
          manga.attributes?.title?.ko,
          ...(manga.attributes?.altTitles?.flatMap(o => Object.values(o)) || []),
        ];
        const score = bestScore(titleVariants, titles);
        if (score > top) { top = score; best = manga; }
      }
      if (best && top >= 0.55) return best;
    } catch {}
  }
  return null;
}

async function fetchMDXById(mdxId) {
  try {
    const res  = await fetch(`${MANGADEX}/manga/${mdxId}?includes[]=cover_art`);
    const json = await res.json();
    return json.data || null;
  } catch { return null; }
}

async function fetchChapters(mdxId) {
  try {
    const res  = await fetch(
      `${MANGADEX}/manga/${mdxId}/feed?limit=500&order[chapter]=asc&translatedLanguage[]=fr&translatedLanguage[]=en${MDX_RATINGS}`
    );
    const json = await res.json();

    // Dédoublonner par numéro (préférer FR)
    const byNum = new Map();
    for (const ch of json.data || []) {
      const num  = parseFloat(ch.attributes?.chapter);
      if (isNaN(num)) continue;
      const lang = ch.attributes?.translatedLanguage;
      if (!byNum.has(num) || lang === "fr") byNum.set(num, ch);
    }

    return [...byNum.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([num, ch]) => {
        const hash  = ch.attributes?.hash;
        const pages = ch.attributes?.dataSaver || ch.attributes?.data || [];
        const thumb = hash && pages[0] ? `${MDX_CDN}/data-saver/${hash}/${pages[0]}` : null;
        return { num, thumb };
      });
  } catch { return []; }
}

/* ════════════════════════════════════════
   Hook principal
════════════════════════════════════════ */
function slugify(t) {
  return (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[''`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function probeLocal(folder, title) {
  const full  = slugify(title);
  const short = full.split("-").slice(0, 4).join("-");
  const exts  = ["webp", "jpg", "png"];
  for (const p of [...new Set([full, short])]) {
    for (const e of exts) {
      try {
        const r = await fetch(`/${folder}/${p}.${e}`, { method: "HEAD" });
        if (r.ok && r.headers.get("content-type")?.startsWith("image/")) return `/${folder}/${p}.${e}`;
      } catch {}
    }
  }
  return null;
}

export default function useManhwaMedia(title, existingImg) {
  const [banner,   setBanner]   = useState(null);
  const [cover,    setCover]    = useState(null);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    if (!title) return;
    let cancelled = false;

    async function run() {
      const titleVariants = [title];

      // Cherche d'abord des fichiers locaux (priorité absolue)
      const [localBanner, localCover] = await Promise.all([
        probeLocal("banners", title),
        probeLocal("covers", title),
      ]);
      if (localBanner && !cancelled) setBanner(localBanner);
      if (localCover  && !cancelled) setCover(localCover);

      // ── 1. AniList → banner + titres alternatifs ──
      try {
        const res  = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `query($t:String){Media(search:$t,type:MANGA){
              bannerImage coverImage{extraLarge}
              title{romaji english native}
            }}`,
            variables: { t: title },
          }),
        });
        const json  = await res.json();
        const media = json?.data?.Media;
        if (media && !cancelled) {
          if (media.bannerImage) setBanner(prev => prev || media.bannerImage);
          if (!existingImg && media.coverImage?.extraLarge) setCover(prev => prev || media.coverImage.extraLarge);
          const { romaji, english, native } = media.title || {};
          [romaji, english, native].forEach(t => { if (t && !titleVariants.includes(t)) titleVariants.push(t); });
        }
      } catch {}

      // ── 2. ComicK → meilleure couverture manhwa ──
      let mdxIdFromComicK = null;
      try {
        const comic = await searchComicK(titleVariants);
        if (comic && !cancelled) {
          // Couverture ComicK en fallback
          if (!existingImg && comic.cover_url) setCover(prev => prev || comic.cover_url);

          // ID MangaDex récupéré via ComicK (évite le matching par titre sur MDX)
          if (comic.links?.md) mdxIdFromComicK = comic.links.md;
        }
      } catch {}

      if (cancelled) return;

      // ── 3. MangaDex → cover portrait + chapitres avec thumbnails ──
      try {
        let manga = null;

        if (mdxIdFromComicK) {
          // On a l'ID exact → pas besoin de chercher par titre
          manga = await fetchMDXById(mdxIdFromComicK);
        } else {
          // Fallback : recherche par titre avec scoring
          manga = await searchMDX(titleVariants);
        }

        if (!manga || cancelled) return;

        // Cover portrait MangaDex
        if (!existingImg) {
          const coverRel = manga.relationships?.find(r => r.type === "cover_art");
          const fileName = coverRel?.attributes?.fileName;
          if (fileName) setCover(prev => prev || `${MDX_CDN}/covers/${manga.id}/${fileName}.512.jpg`);
        }

        // Chapitres
        const result = await fetchChapters(manga.id);
        if (!cancelled) setChapters(result);
      } catch {}
    }

    run();
    return () => { cancelled = true; };
  }, [title, existingImg]);

  return { banner, cover: existingImg || cover, chapters };
}
