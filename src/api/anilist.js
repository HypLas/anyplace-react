const ENDPOINT = "https://graphql.anilist.co";

const QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME, isAdult: false) {
    coverImage { extraLarge large }
  }
}`;

export async function anilistSearchAnime(title) {
  const res  = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { search: title } }),
  });
  const json = await res.json();
  return json.data?.Media || null;
}
