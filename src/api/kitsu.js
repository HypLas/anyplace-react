const BASE = "https://kitsu.io/api/edge";

/* Recherche un anime par titre, retourne le premier résultat */
export async function kitsuSearchAnime(title) {
  const res  = await fetch(`${BASE}/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=3`);
  const json = await res.json();
  return json.data?.[0] || null;
}

/* Récupère les épisodes d'un anime Kitsu (avec thumbnails) */
export async function kitsuGetEpisodes(kitsuId, total = 200) {
  const limit = Math.min(total, 20);
  let   url   = `${BASE}/episodes?filter[mediaId]=${kitsuId}&sort=number&page[limit]=${limit}`;
  const all   = [];

  while (url && all.length < total) {
    const res  = await fetch(url);
    const json = await res.json();
    all.push(...(json.data || []));
    url = json.links?.next || null;
  }
  return all;
}
