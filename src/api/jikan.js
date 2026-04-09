const BASE = "https://api.jikan.moe/v4";

export async function jikanSearchAnime(title) {
  const res  = await fetch(`${BASE}/anime?q=${encodeURIComponent(title)}&limit=5&sfw=true`);
  const json = await res.json();
  const data = json.data || [];
  return data[0] || null;
}
