/* ============================================================
   Any'place – firebase.js (npm package)
   Config Firebase + helpers Auth & Firestore
   ============================================================ */
import { initializeApp }                           from "firebase/app";
import { getAuth, createUserWithEmailAndPassword,
         signInWithEmailAndPassword, signOut,
         onAuthStateChanged }                       from "firebase/auth";
import { getFirestore, collection, doc,
         addDoc, getDocs, getDoc, deleteDoc,
         updateDoc, setDoc, query, orderBy,
         serverTimestamp }                          from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyBboWvcBnORbhF0B8e_IuBNlM6OPvXiats",
  authDomain:        "aniverse-66615.firebaseapp.com",
  projectId:         "aniverse-66615",
  storageBucket:     "aniverse-66615.firebasestorage.app",
  messagingSenderId: "772541583089",
  appId:             "1:772541583089:web:077504313f74ae2ccb2350",
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export const OWNERS       = ["hyplas@gmail.com", "chuchux@gmail.com"];
export const HENTAI_OWNER = "hyplas@gmail.com";

/* ── Auth ── */
export async function register(email, password) {
  return (await createUserWithEmailAndPassword(auth, email, password)).user;
}
export async function login(email, password) {
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}
export async function logout() { await signOut(auth); }
export function onAuth(cb)    { return onAuthStateChanged(auth, cb); }

/* ── Catalogue ── */
const CATALOGUE_REF = collection(db, "catalogue");

export async function loadAnimes() {
  const q    = query(CATALOGUE_REF, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}
export async function saveAnime(anime) {
  const { _id, ...data } = anime;
  const ref = await addDoc(CATALOGUE_REF, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}
export async function deleteAnime(id)             { await deleteDoc(doc(db, "catalogue", id)); }
export async function updateAnime(id, data)       { const { _id, ...clean } = data; await updateDoc(doc(db, "catalogue", id), clean); }
export async function updateAnimeTables(id, tables){ await updateDoc(doc(db, "catalogue", id), { tables }); }

/* ── News ── */
const NEWS_REF = collection(db, "news");
export async function loadNews() {
  const snap = await getDocs(query(NEWS_REF, orderBy("createdAt", "desc")));
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}
export async function saveNews(data)    { return (await addDoc(NEWS_REF, { ...data, createdAt: serverTimestamp() })).id; }
export async function deleteNews(id)   { await deleteDoc(doc(db, "news", id)); }

/* ── Liste perso ── */
function userListRef(uid) { return collection(db, "users", uid, "list"); }
export async function loadUserList(uid)          { const snap = await getDocs(userListRef(uid)); return snap.docs.map(d => ({ animeId: d.id, ...d.data() })); }
export async function addToUserList(uid, id, tab){ await setDoc(doc(db, "users", uid, "list", id), { tab, addedAt: serverTimestamp() }); }
export async function removeFromUserList(uid, id){ await deleteDoc(doc(db, "users", uid, "list", id)); }
export async function moveInUserList(uid, id, tab){ await updateDoc(doc(db, "users", uid, "list", id), { tab }); }

/* ── Épisodes vus ── */
export async function loadWatched(uid, animeId) {
  try { const s = await getDoc(doc(db, "users", uid, "watched", animeId)); return s.exists() ? (s.data().episodes || {}) : {}; }
  catch { return {}; }
}
export async function saveWatched(uid, animeId, episodes) {
  await setDoc(doc(db, "users", uid, "watched", animeId), { episodes });
}

/* ── Manhwa ── */
const MANHWA_REF = collection(db, "manhwa");

export async function loadManhwas() {
  const q    = query(MANHWA_REF, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}
export async function saveManhwa(data) {
  const { _id, ...clean } = data;
  return (await addDoc(MANHWA_REF, { ...clean, createdAt: serverTimestamp() })).id;
}
export async function deleteManhwa(id)          { await deleteDoc(doc(db, "manhwa", id)); }
export async function updateManhwa(id, data)    { const { _id, ...clean } = data; await updateDoc(doc(db, "manhwa", id), clean); }

/* ── Liste perso Manhwa ── */
function userManhwaListRef(uid) { return collection(db, "users", uid, "manhwaList"); }

export async function loadUserManhwaList(uid)            { const snap = await getDocs(userManhwaListRef(uid)); return snap.docs.map(d => ({ animeId: d.id, ...d.data() })); }
export async function addToUserManhwaList(uid, id, tab)  { await setDoc(doc(db, "users", uid, "manhwaList", id), { tab, addedAt: serverTimestamp() }); }
export async function removeFromUserManhwaList(uid, id)  { await deleteDoc(doc(db, "users", uid, "manhwaList", id)); }

/* ── Chapitres lus ── */
export async function loadReadChapters(uid, manhwaId) {
  try { const s = await getDoc(doc(db, "users", uid, "readChapters", manhwaId)); return s.exists() ? (s.data().chapters || {}) : {}; }
  catch { return {}; }
}
export async function saveReadChapters(uid, manhwaId, chapters) {
  await setDoc(doc(db, "users", uid, "readChapters", manhwaId), { chapters });
}

export async function getManhwaById(id) {
  const snap = await getDoc(doc(db, "manhwa", id));
  return snap.exists() ? { _id: snap.id, ...snap.data() } : null;
}

export async function getAnimeById(id) {
  const snap = await getDoc(doc(db, "catalogue", id));
  return snap.exists() ? { _id: snap.id, ...snap.data() } : null;
}

/* ── Hentai Anime ── */
const HENTAI_ANIME_REF = collection(db, "hentaiAnime");
export async function loadHentaiAnimes() {
  const snap = await getDocs(query(HENTAI_ANIME_REF, orderBy("createdAt","desc")));
  return snap.docs.map(d => ({ _id:d.id, ...d.data() }));
}
export async function getHentaiAnimeById(id) {
  const snap = await getDoc(doc(db, "hentaiAnime", id));
  return snap.exists() ? { _id: snap.id, ...snap.data() } : null;
}
export async function saveHentaiAnime(data)        { const {_id,...c}=data; return (await addDoc(HENTAI_ANIME_REF,{...c,createdAt:serverTimestamp()})).id; }
export async function deleteHentaiAnime(id)        { await deleteDoc(doc(db,"hentaiAnime",id)); }
export async function updateHentaiAnime(id,data)   { const {_id,...c}=data; await updateDoc(doc(db,"hentaiAnime",id),c); }

/* ── Hentai Manga/Manhwa ── */
const HENTAI_MANGA_REF = collection(db, "hentaiManga");
export async function loadHentaiMangas() {
  const snap = await getDocs(query(HENTAI_MANGA_REF, orderBy("createdAt","desc")));
  return snap.docs.map(d => ({ _id:d.id, ...d.data() }));
}
export async function saveHentaiManga(data)        { const {_id,...c}=data; return (await addDoc(HENTAI_MANGA_REF,{...c,createdAt:serverTimestamp()})).id; }
export async function deleteHentaiManga(id)        { await deleteDoc(doc(db,"hentaiManga",id)); }
export async function updateHentaiManga(id,data)   { const {_id,...c}=data; await updateDoc(doc(db,"hentaiManga",id),c); }

/* ── Liste perso Hentai ── */
function userHentaiListRef(uid,type) { return collection(db,"users",uid,`hentaiList_${type}`); }
export async function loadUserHentaiList(uid,type)          { const snap=await getDocs(userHentaiListRef(uid,type)); return snap.docs.map(d=>({animeId:d.id,...d.data()})); }
export async function addToUserHentaiList(uid,id,tab,type)  { await setDoc(doc(db,"users",uid,`hentaiList_${type}`,id),{tab,addedAt:serverTimestamp()}); }
export async function removeFromUserHentaiList(uid,id,type) { await deleteDoc(doc(db,"users",uid,`hentaiList_${type}`,id)); }

/* ── Épisodes / Chapitres hentai vus ── */
export async function loadHentaiWatched(uid,id,type) {
  try { const s=await getDoc(doc(db,"users",uid,`hentaiWatched_${type}`,id)); return s.exists()?(s.data().data||{}):{} } catch{return{}}
}
export async function saveHentaiWatched(uid,id,type,data) {
  await setDoc(doc(db,"users",uid,`hentaiWatched_${type}`,id),{data});
}
