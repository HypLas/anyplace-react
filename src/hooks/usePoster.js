import { useState, useEffect } from "react";
import { tmdbSearch }         from "../api/tmdb";
import { anilistSearchAnime } from "../api/anilist";
import { jikanSearchAnime }   from "../api/jikan";
import { kitsuSearchAnime }   from "../api/kitsu";

const cache = new Map();

async function fetchPoster(title) {
  if (cache.has(title)) return cache.get(title);

  // 1. TMDB
  try {
    const show = await tmdbSearch(title);
    if (show?.poster_path) {
      const src = `https://image.tmdb.org/t/p/w342${show.poster_path}`;
      cache.set(title, src);
      return src;
    }
  } catch {}

  // 2. AniList
  try {
    const media = await anilistSearchAnime(title);
    const src   = media?.coverImage?.extraLarge || media?.coverImage?.large;
    if (src) { cache.set(title, src); return src; }
  } catch {}

  // 3. Jikan (MAL)
  try {
    const anime = await jikanSearchAnime(title);
    const src   = anime?.images?.webp?.large_image_url
               || anime?.images?.jpg?.large_image_url;
    if (src) { cache.set(title, src); return src; }
  } catch {}

  // 4. Kitsu
  try {
    const k   = await kitsuSearchAnime(title);
    const src = k?.attributes?.posterImage?.large
             || k?.attributes?.posterImage?.original;
    if (src) { cache.set(title, src); return src; }
  } catch {}

  cache.set(title, null);
  return null;
}

export default function usePoster(title, existingImg) {
  const [poster, setPoster] = useState(null);

  useEffect(() => {
    if (existingImg || !title) return;
    let cancelled = false;
    fetchPoster(title).then(src => { if (!cancelled) setPoster(src); });
    return () => { cancelled = true; };
  }, [title, existingImg]);

  return existingImg || poster;
}
