import { useState, useEffect } from "react";
import { kitsuSearchAnime } from "../api/kitsu";
import { tmdbSearch } from "../api/tmdb";

/**
 * Retourne une image portrait (2:3) pour une carte anime.
 * TMDB en priorité (poster_path), Kitsu en fallback.
 * N'écrase PAS une image déjà définie dans Firebase.
 */
export default function usePoster(title, existingImg) {
  const [poster, setPoster] = useState(null);

  useEffect(() => {
    if (existingImg || !title) return;
    let cancelled = false;

    async function run() {
      // ── TMDB — meilleure couverture, portrait garanti ──
      try {
        const show = await tmdbSearch(title);
        if (show?.poster_path && !cancelled) {
          setPoster(`https://image.tmdb.org/t/p/w342${show.poster_path}`);
          return;
        }
      } catch {}

      // ── Kitsu fallback ──
      try {
        const k = await kitsuSearchAnime(title);
        if (k && !cancelled) {
          const src = k.attributes?.posterImage?.large
                   || k.attributes?.posterImage?.original
                   || null;
          if (src) setPoster(src);
        }
      } catch {}
    }

    run();
    return () => { cancelled = true; };
  }, [title, existingImg]);

  return existingImg || poster;
}
