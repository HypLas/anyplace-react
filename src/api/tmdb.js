const KEY  = import.meta.env.VITE_TMDB_KEY;
const BASE = "https://api.themoviedb.org/3";
const IMG  = "https://image.tmdb.org/t/p";

function ok() { return !!KEY; }

/* Recherche une série TV par titre — préfère les résultats animation (genre 16) */
export async function tmdbSearch(title) {
  if (!ok()) return null;
  const res  = await fetch(`${BASE}/search/tv?api_key=${KEY}&query=${encodeURIComponent(title)}&language=fr-FR`);
  const json = await res.json();
  const results = json.results || [];
  // Préférer un résultat avec genre animation (16) pour éviter les faux positifs (ex: chaîne Arte)
  const animated = results.find(r => r.genre_ids?.includes(16));
  return animated || results[0] || null;
}

/* Backdrop paysage HD — jamais portrait */
export function tmdbBackdrop(show, size = "w1280") {
  const path = show?.backdrop_path;
  return path ? `${IMG}/${size}${path}` : null;
}

/* Épisodes d'une saison avec leur vignette (16/9) */
export async function tmdbGetSeason(tmdbId, season = 1) {
  if (!ok()) return [];
  const res  = await fetch(`${BASE}/tv/${tmdbId}/season/${season}?api_key=${KEY}&language=fr-FR`);
  const json = await res.json();
  return (json.episodes || []).map(ep => ({
    number: ep.episode_number,
    name:   ep.name,
    still:  ep.still_path ? `${IMG}/w500${ep.still_path}` : null,
  }));
}

/**
 * Retourne pour chaque saison :
 *   - banner : backdrop paysage spécifique à la saison (null si introuvable)
 *   - eps    : liste d'épisodes { number, name, still }
 */
export async function tmdbGetSeasons(tmdbId, seasonCount) {
  if (!ok()) return [];
  return Promise.all(
    Array.from({ length: seasonCount }, async (_, i) => {
      const sNum = i + 1;
      try {
        const [epRes, imgRes] = await Promise.all([
          fetch(`${BASE}/tv/${tmdbId}/season/${sNum}?api_key=${KEY}&language=fr-FR`),
          fetch(`${BASE}/tv/${tmdbId}/season/${sNum}/images?api_key=${KEY}`),
        ]);
        const epJson  = await epRes.json();
        const imgJson = await imgRes.json();

        // Backdrop paysage uniquement — jamais poster portrait
        const backdropPath = imgJson.backdrops?.[0]?.file_path || null;
        const banner = backdropPath ? `${IMG}/original${backdropPath}` : null;

        const eps = (epJson.episodes || []).map(ep => ({
          number: ep.episode_number,
          name:   ep.name,
          still:  ep.still_path ? `${IMG}/w500${ep.still_path}` : null,
        }));

        return { banner, eps };
      } catch {
        return { banner: null, eps: [] };
      }
    })
  );
}

/* Détail complet de la série (nb saisons, backdrop, etc.) */
export async function tmdbGetShow(tmdbId) {
  if (!ok()) return null;
  const res  = await fetch(`${BASE}/tv/${tmdbId}?api_key=${KEY}&language=fr-FR&append_to_response=images`);
  return await res.json();
}
