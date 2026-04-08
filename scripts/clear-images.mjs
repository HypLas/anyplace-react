/**
 * clear-images.mjs
 * Vide les champs image (img1, img2, img) dans Firestore
 * pour que l'auto-fetch TMDB/Kitsu prenne le relai.
 *
 * Usage : node scripts/clear-images.mjs
 *   --dry    Affiche ce qui serait modifié sans toucher la base
 *   --only=catalogue|manhwa|hentaiAnime|hentaiManga  (une collection seulement)
 */

import { initializeApp }                    from "firebase/app";
import { getFirestore, collection, getDocs,
         updateDoc, doc, deleteField }       from "firebase/firestore";

const firebaseConfig = {
  apiKey:            "AIzaSyBboWvcBnORbhF0B8e_IuBNlM6OPvXiats",
  authDomain:        "aniverse-66615.firebaseapp.com",
  projectId:         "aniverse-66615",
  storageBucket:     "aniverse-66615.firebasestorage.app",
  messagingSenderId: "772541583089",
  appId:             "1:772541583089:web:077504313f74ae2ccb2350",
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const args   = process.argv.slice(2);
const DRY    = args.includes("--dry");
const onlyArg = args.find(a => a.startsWith("--only="));
const ONLY   = onlyArg ? onlyArg.split("=")[1] : null;

// Chaque entrée : { name, fields }
const COLLECTIONS = [
  { name: "catalogue",    fields: ["img1", "img2"] },
  { name: "manhwa",       fields: ["img"]          },
  { name: "hentaiAnime",  fields: ["img1"]         },
  { name: "hentaiManga",  fields: ["img"]          },
];

async function clearCollection({ name, fields }) {
  const snap = await getDocs(collection(db, name));
  let updated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const toRemove = fields.filter(f => data[f]);   // seulement les champs renseignés
    if (toRemove.length === 0) { skipped++; continue; }

    const patch = Object.fromEntries(toRemove.map(f => [f, deleteField()]));
    console.log(`  [${name}] ${data.title || d.id}  →  supprime : ${toRemove.join(", ")}`);

    if (!DRY) await updateDoc(doc(db, name, d.id), patch);
    updated++;
  }

  console.log(`  ✓ ${name} : ${updated} doc(s) modifié(s), ${skipped} ignoré(s)${DRY ? " [DRY RUN]" : ""}\n`);
}

async function main() {
  console.log(DRY ? "\n=== DRY RUN — aucune modification ===\n" : "\n=== Suppression des images en base ===\n");

  const toProcess = ONLY
    ? COLLECTIONS.filter(c => c.name === ONLY)
    : COLLECTIONS;

  if (toProcess.length === 0) {
    console.error(`Collection inconnue : "${ONLY}". Choix : ${COLLECTIONS.map(c=>c.name).join(", ")}`);
    process.exit(1);
  }

  for (const col of toProcess) await clearCollection(col);

  console.log("Terminé.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
