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

export const OWNERS = ["hyplas@gmail.com", "chuchux@gmail.com"];

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

export async function getAnimeById(id) {
  const snap = await getDoc(doc(db, "catalogue", id));
  return snap.exists() ? { _id: snap.id, ...snap.data() } : null;
}

