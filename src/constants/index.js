/* ══════════════════════════════════════
   ANIME
══════════════════════════════════════ */
export const GENRES = [
  "Action","Aventure","Bara","Biographique","Comédie","Drame","Ecchi","Érotique",
  "Fantastique","Fantasy","Furyo","Gekiga","Hentai","Historique","Horreur / Épouvante",
  "Isekai","Josei","Kodomo","Lolicon","Magical girls","Mature","Mecha","Moe","Mystère",
  "Nekketsu","Psychologique","Romance","School Life","Science-Fantasy","Science-fiction",
  "Seinen","Shōjo","Shōjo-Ai","Shōnen","Shōnen-Ai","Shotacon","Slice of Life",
  "Space opera","Sport","Surnaturel","Thriller","Yaoi","Yuri",
];
export const STATUTS  = ["En cours","Terminé","Abandonné","À venir"];
export const LANGUES  = ["VF","VOSTFR","VO","VF & VOSTFR","Coréen","Chinois Mandarin","Japonais"];
export const PLATEFORMES = [
  { name:"Crunchyroll", icon:"🎌" },
  { name:"ADN",         icon:"🔵" },
  { name:"Netflix",     icon:"🔴" },
  { name:"Disney+",     icon:"🔷" },
  { name:"Prime Video", icon:"🔹" },
  { name:"Anime-Sama",  icon:"⛩️" },
  { name:"VoirAnime",   icon:"🎌" },
];
export const LANG_MAP = {
  "VF":               { codes:["fr"],      label:"VF" },
  "VOSTFR":           { codes:["jp"],      label:"VOSTFR" },
  "VO":               { codes:["jp"],      label:"VO" },
  "VF & VOSTFR":      { codes:["fr","jp"], label:"VF & VOSTFR" },
  "Coréen":           { codes:["kr"],      label:"Coréen" },
  "Chinois Mandarin": { codes:["cn"],      label:"Mandarin" },
  "Japonais":         { codes:["jp"],      label:"JAP" },
};
export const GENRE_ICONS = {
  "Action":["⚔️","💥","🔥","⚡","👊"],"Aventure":["🗺️","⛵","🏔️","🧭","🌍"],
  "Comédie":["😂","🎭","🤣","🎪","😄"],"Drame":["🎭","💔","😢","🌧️","🕯️"],
  "Fantasy":["🔮","🏰","⚗️","🪄","🐉"],"Isekai":["🌀","🚪","✨","🌐","⭐"],
  "Romance":["💌","🌸","💕","🎀","🌹"],"Seinen":["🎭","📖","🌙","🕯️","🦅"],
  "Shōnen":["⚡","🌟","💫","🎯","🏃"],"Slice of Life":["☕","🌻","🏡","🎵","🌈"],
  "Horreur / Épouvante":["👻","🩸","💀","🕷️","😱"],"Science-fiction":["🚀","🤖","🌌","⚡","🛸"],
  "Mecha":["🤖","⚙️","🔩","🛡️","🚀"],"Psychologique":["🧠","🌀","😵","🔮","👁️"],
  "Thriller":["🔪","😰","🌑","⚡","🕵️"],"Sport":["🏆","💪","🎽","⚽","🏅"],
};
export function randomIcon(genre) {
  const list = GENRE_ICONS[genre] || ["🎬"];
  return list[Math.floor(Math.random() * list.length)];
}
export function getGenreList(a) {
  return Array.isArray(a.genres) && a.genres.length > 0 ? a.genres : (a.genre ? [a.genre] : []);
}
export function getPlatforms(a) {
  return Array.isArray(a.platforms) && a.platforms.length > 0
    ? a.platforms.filter(p => p.url)
    : (a.watchLink ? [{ name: a.platform || "Regarder", url: a.watchLink }] : []);
}
export function getStatusClass(s) {
  return s === "En cours" ? "status-ongoing" : s === "Abandonné" ? "status-abandoned"
       : s === "À venir"  ? "status-upcoming" : "status-finished";
}
export function formatCountdown(releaseDate) {
  if (!releaseDate) return null;
  const p = releaseDate.split("/");
  if (p.length !== 3) return null;
  const target = new Date(+p[2], +p[1]-1, +p[0]);
  const now = new Date(); now.setHours(0,0,0,0); target.setHours(0,0,0,0);
  return Math.round((target - now) / 86400000);
}

