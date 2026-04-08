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

/* ══════════════════════════════════════
   MANHWA / SCAN
══════════════════════════════════════ */
export const GENRES_MANHWA = [
  "Action","Aventure","Comédie","Drame","Fantasy","Harem","Historique",
  "Horreur","Isekai","Josei","Martial Arts","Mature","Mecha","Mystère","Psychologique",
  "Romance","School Life","Science-fiction","Seinen","Shōjo","Shōnen","Slice of Life",
  "Surnaturel","Thriller","Webtoon","Yaoi","Yuri",
];
export const STATUTS_MANHWA = ["En cours","Terminé","Abandonné","En pause","À venir"];
export const TYPES_MANHWA   = ["Manhwa","Manhua","Manga","Webtoon","OEL Manga"];

/* Sites lecture manhwa — MÀJ demandée */
export const SITES_LECTURE = [
  { name:"Webtoon",       icon:"🟦", logo:"/webtoon-logo.png" },
  { name:"Scan-Manga",    icon:"🇫🇷", logo:"/scan-manga-logo.png" },
  { name:"Asura Scans",   icon:"⚡",  logo:"/aura-scans-logo.png" },
  { name:"Crunchyscan",   icon:"🍊",  logo:"/crunchyscan-logo.png" },
  { name:"MangaScantrad", icon:"📜",  logo:null },
  { name:"ONO",           icon:"📖",  logo:"/ono-logo.png" },
];

/* ══════════════════════════════════════
   HENTAI
══════════════════════════════════════ */
export const GENRES_HENTAI = [
  "Ahegao","Anal","BDSM","Blowjob","Censored","Cosplay","Creampie","Femdom",
  "Futanari","Gangbang","Harem","Inceste","Lolicon","Magie","Mature","MILF",
  "Netorare","Paizuri","Rape","Romance","School","Shotacon","Surnaturel",
  "Tentacle","Tsundere","Vanilla","Yaoi","Yuri",
];
export const STATUTS_HENTAI  = ["En cours","Terminé","Abandonné","À venir"];
export const TYPES_HENTAI_MANGA = ["Doujin","Manhwa H","Manhua H","Manga H","Webtoon H","CG Set"];

/* Sites visionnage hentai anime */
export const SITES_HENTAI_ANIME = [
  { name:"Hanime.tv",      icon:"🎬" },
  { name:"HentaiHaven",    icon:"🌸" },
  { name:"Anime-Sama",     icon:"⛩️" },
  { name:"VoirAnime",      icon:"🎌" },
  { name:"Crunchyscan",    icon:"🍊" },
];

/* Sites lecture hentai manga/manhwa */
export const SITES_HENTAI_MANGA = [
  { name:"Nhentai",        icon:"🔖" },
  { name:"Hitomi.la",      icon:"💜" },
  { name:"E-Hentai",       icon:"🌸" },
  { name:"Crunchyscan",    icon:"🍊" },
  { name:"MangaScantrad",  icon:"📜" },
  { name:"Asura Scans",    icon:"⚡" },
];
