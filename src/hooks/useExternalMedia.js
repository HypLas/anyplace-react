import { useState, useEffect } from "react";
import { kitsuSearchAnime, kitsuGetEpisodes } from "../api/kitsu";
import { tmdbSearch, tmdbGetShow, tmdbGetSeasons, tmdbBackdrop } from "../api/tmdb";
import { anilistSearchAnime } from "../api/anilist";

export default function useExternalMedia(title) {
  const [banner,  setBanner]  = useState(null);
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    if (!title) return;
    let cancelled = false;

    async function run() {
      let hasBanner  = false;
      let hasSeasons = false;

      // ── 1. TMDB — backdrop HD + saisons ──
      try {
        const show = await tmdbSearch(title);
        if (show && !cancelled) {
          const detail = await tmdbGetShow(show.id);
          const b = tmdbBackdrop(detail, "original") || tmdbBackdrop(show, "w1280");
          if (b && !cancelled) { setBanner(b); hasBanner = true; }
          const seasonCount = detail.number_of_seasons || 1;
          const data = await tmdbGetSeasons(show.id, seasonCount);
          if (!cancelled) { setSeasons(data); hasSeasons = true; }
        }
      } catch {}

      if (hasBanner && hasSeasons) return;

      // ── 2. AniList — banner paysage ──
      if (!hasBanner) {
        try {
          const media = await anilistSearchAnime(title);
          if (media?.bannerImage && !cancelled) { setBanner(media.bannerImage); hasBanner = true; }
        } catch {}
      }

      // ── 3. Kitsu — épisodes + banner fallback ──
      if (!hasSeasons) {
        try {
          const k = await kitsuSearchAnime(title);
          if (k && !cancelled) {
            const attrs = k.attributes;
            if (!hasBanner) {
              const b = attrs.coverImage?.original || attrs.posterImage?.large || null;
              if (b && !cancelled) setBanner(b);
            }
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
    }

    run();
    return () => { cancelled = true; };
  }, [title]);

  return { banner, seasons };
}
