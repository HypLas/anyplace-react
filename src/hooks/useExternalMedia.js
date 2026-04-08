import { useState, useEffect } from "react";
import { kitsuSearchAnime, kitsuGetEpisodes } from "../api/kitsu";
import { tmdbSearch, tmdbGetShow, tmdbGetSeasons, tmdbBackdrop } from "../api/tmdb";

/**
 * Récupère automatiquement banner + épisodes groupés par saison
 * depuis TMDB (HD) puis Kitsu (fallback) selon le titre.
 *
 * @param {string|null} title     - Titre de l'anime
 * @param {string|null} customImg - Image déjà définie (img1/img2) — skip banner si fournie
 * @returns {{
 *   banner: string|null,
 *   seasons: { banner: string|null, eps: {number,name,still}[] }[]
 * }}
 */
export default function useExternalMedia(title, customImg) {
  const [banner,  setBanner]  = useState(null);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    if (!title) return;
    let cancelled = false;

    async function run() {
      // ── TMDB (priorité HD, backdrops paysage) ──
      try {
        const show = await tmdbSearch(title);
        if (show && !cancelled) {
          const detail = await tmdbGetShow(show.id);
          if (!cancelled) {
            setBanner(tmdbBackdrop(detail, "original") || tmdbBackdrop(show, "w1280"));
            const seasonCount = detail.number_of_seasons || 1;
            const data = await tmdbGetSeasons(show.id, seasonCount);
            if (!cancelled) { setSeasons(data); return; }
          }
        }
      } catch {}

      // ── Kitsu (fallback) ──
      try {
        const k = await kitsuSearchAnime(title);
        if (k && !cancelled) {
          const attrs = k.attributes;
          setBanner(attrs.coverImage?.original || attrs.posterImage?.large || null);
          const kitsuEps = await kitsuGetEpisodes(k.id, attrs.episodeCount || 200);
          if (!cancelled)
            setSeasons([{
              banner: null,
              eps: kitsuEps.map(e => ({
                number: e.attributes?.number,
                name:   e.attributes?.canonicalTitle || "",
                still:  e.attributes?.thumbnail?.original || null,
              })),
            }]);
        }
      } catch {}
    }

    run();
    return () => { cancelled = true; };
  }, [title, customImg]);

  return { banner, seasons };
}
