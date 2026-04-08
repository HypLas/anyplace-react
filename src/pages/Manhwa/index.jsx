import { useState, useEffect } from "react";
import useManhwaPoster from "../../hooks/useManhwaPoster";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  loadManhwas,
  loadUserManhwaList, addToUserManhwaList, removeFromUserManhwaList,
  loadReadChapters,   saveReadChapters,
} from "../../firebase";
import Navbar from "../../components/Navbar";
import { GENRES_MANHWA, STATUTS_MANHWA } from "../../constants";

/* ── Onglets ── */
const TABS = [
  { id:"en-cours",  label:"En cours",  icon:"📖", desc:"En cours de lecture" },
  { id:"termine",   label:"Terminé",   icon:"✓",  desc:"Lectures terminées" },
];

const STATUS_CLS = {
  "En cours":"status-ongoing","Terminé":"status-finished",
  "Abandonné":"status-abandoned","En pause":"status-abandoned","À venir":"status-upcoming",
};

/* ── Carte manhwa liste perso ── */
function ManhwaCard({ manhwa, onRemove, onOpen, deleteMode }) {
  const genres    = Array.isArray(manhwa.genres) && manhwa.genres.length > 0
    ? manhwa.genres : (manhwa.genre ? [manhwa.genre] : []);
  const posterSrc = useManhwaPoster(manhwa.img, manhwa.title);

  return (
    <div className="anime-card" onClick={() => onOpen(manhwa)}>
      <div className="relative overflow-hidden">
        {/* Bouton retirer */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(manhwa); }}
          className={`absolute top-2 right-2 z-10 w-[26px] h-[26px] bg-rouge text-white text-[.75rem] border-none cursor-pointer items-center justify-center transition-colors duration-200 hover:bg-rouge-dk ${deleteMode ? "flex" : "hidden"}`}
          style={{ borderRadius: 2 }}
        >✕</button>

        {/* Badge type */}
        {manhwa.type && (
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 font-heading text-[.55rem] tracking-[.12em] uppercase pointer-events-none"
               style={{ background: "rgba(10,10,15,.85)", border: "1px solid rgba(201,168,76,.35)", color: "var(--or)", backdropFilter: "blur(4px)" }}>
            {manhwa.type}
          </div>
        )}

        {/* Image portrait */}
        {posterSrc ? (
          <img src={posterSrc} alt={manhwa.title} loading="lazy"
               className="w-full object-cover block transition-all duration-300"
               style={{ aspectRatio: "2/3", filter: "brightness(.85)" }}
               onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
        ) : null}
        <div className={`w-full flex items-center justify-center text-[2.8rem] ${posterSrc ? "hidden" : "flex"}`}
             style={{ aspectRatio: "2/3", background: "linear-gradient(135deg,#1A1A25,#2A2A38)" }}>
          {manhwa.icon || "📖"}
        </div>
        {/* Overlay hover */}
        <div className="card-overlay">
          <div className="card-overlay-genres">
            {genres.slice(0, 3).map(g => <span key={g} className="card-overlay-genre">{g}</span>)}
          </div>
          <span className="card-overlay-status">{manhwa.status}</span>
        </div>
      </div>

      <p className="font-heading font-semibold text-[.87rem] tracking-[.02em] text-creme leading-snug px-2.5 pt-2 pb-2.5 text-center">
        {manhwa.title}
      </p>

    </div>
  );
}

/* ── Modale recherche manhwa ── */
function SearchModal({ allManhwas, userList, currentTab, onAdd, onClose }) {
  const [q, setQ] = useState("");
  const inTab = userList.filter(i => i.tab === currentTab).map(i => i.animeId);

  const filtered = allManhwas
    .filter(m => {
      const t  = q.toLowerCase();
      const gl = (Array.isArray(m.genres) ? m.genres : [m.genre || ""]).join(" ").toLowerCase();
      return (!t || m.title.toLowerCase().includes(t) || gl.includes(t) || (m.auteur||"").toLowerCase().includes(t))
          && !inTab.includes(m._id);
    })
    .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }))
    .slice(0, 30);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6"
         style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[680px] bg-noir-2 border border-gris corner-gold flex flex-col"
           style={{ maxHeight: "80vh", animation: "fade-up .3s ease forwards" }}>

        <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-gris flex-shrink-0">
          <div>
            <span className="block font-heading text-[.65rem] tracking-[.4em] text-or mb-1.5">— Catalogue —</span>
            <h3 className="font-display text-[1.15rem] tracking-[.1em]">Ajouter un <span className="text-or">Manhwa</span></h3>
          </div>
          <button onClick={onClose}
                  className="w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge bg-transparent flex-shrink-0">✕</button>
        </div>

        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gris bg-noir flex-shrink-0">
          <span className="text-gris-lt text-[1.1rem]">🔍</span>
          <input autoFocus
                 className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.95rem] py-1 placeholder:text-gris-lt"
                 placeholder="Titre, genre, auteur…"
                 value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="overflow-y-auto flex-1 py-2">
          {filtered.length === 0 ? (
            <p className="text-center py-10 font-heading text-[.75rem] tracking-[.18em] text-gris-lt uppercase">
              {q ? `Aucun résultat pour "${q}".` : "Catalogue manhwa vide."}
            </p>
          ) : filtered.map(m => {
            const inOther = userList.find(i => i.animeId === m._id);
            return (
              <div key={m._id} className="flex items-center gap-3.5 px-5 py-2.5 border-b border-white/[.04] hover:bg-white/[.03] transition-colors duration-300">
                {/* Thumb carré */}
                {m.img
                  ? <img src={m.img} alt="" className="flex-shrink-0 object-cover rounded-sm" style={{ width: 40, height: 40 }}
                         onError={e => e.target.style.display = "none"} />
                  : <div className="flex-shrink-0 flex items-center justify-center text-[1.3rem] rounded-sm"
                         style={{ width: 40, height: 40, background: "var(--noir-3)" }}>{m.icon || "📖"}</div>}

                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[.82rem] tracking-[.06em] text-creme truncate mb-0.5">{m.title}</p>
                  <p className="text-[.7rem] text-creme-dim">
                    {m.type && <span className="text-or mr-2">{m.type}</span>}
                    {(Array.isArray(m.genres) ? m.genres : [m.genre || ""]).slice(0, 2).join(" · ")}
                    {m.auteur && <span className="text-creme-dim/60 ml-2">· {m.auteur}</span>}
                  </p>
                </div>

                <button onClick={() => onAdd(m)}
                        className="flex-shrink-0 px-4 py-1.5 border border-or-dk text-or font-heading text-[.65rem] tracking-[.12em] uppercase cursor-pointer transition-all duration-300 hover:bg-or/10 hover:border-or bg-transparent whitespace-nowrap">
                  {inOther ? "Déplacer ici" : "+ Ajouter"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Modale détail + suivi chapitres ── */
function DetailModal({ manhwa, readChapters, onReadChange, onClose }) {
  const genres = Array.isArray(manhwa.genres) && manhwa.genres.length > 0
    ? manhwa.genres : (manhwa.genre ? [manhwa.genre] : []);
  const status = STATUS_CLS[manhwa.status] || "status-finished";

  /* Génère la liste des chapitres à partir de manhwa.chapitres (nombre) */
  const totalChap = manhwa.chapitres ? parseInt(manhwa.chapitres) : 0;
  const chapList  = Array.from({ length: totalChap }, (_, i) => i + 1);

  const seenCount = chapList.filter(n => readChapters[n]).length;
  const pct       = totalChap > 0 ? Math.round((seenCount / totalChap) * 100) : 0;

  /* Tout cocher / décocher */
  function toggleAll() {
    const allDone = seenCount === totalChap;
    const updated = {};
    if (!allDone) chapList.forEach(n => { updated[n] = true; });
    onReadChange(updated);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 overflow-y-auto"
         style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-4xl my-auto bg-noir-2 border border-gris corner-gold"
           style={{ animation: "fade-up .35s cubic-bezier(.4,0,.2,1) forwards" }}>

        {/* Layout image + infos */}
        <div className="flex flex-col sm:flex-row">
          {/* Image carrée */}
          <div className="flex-shrink-0 relative" style={{ width: "100%", maxWidth: 220 }}>
            <button onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge"
                    style={{ background: "rgba(10,10,15,.7)", backdropFilter: "blur(4px)" }}>✕</button>
            {manhwa.img ? (
              <img src={manhwa.img} alt={manhwa.title} className="w-full object-cover block"
                   style={{ aspectRatio: "1/1", minHeight: 180 }} />
            ) : (
              <div className="w-full flex items-center justify-center text-[3.5rem]"
                   style={{ aspectRatio: "1/1", background: "linear-gradient(135deg,#1A1A25,#2A2A38)", minHeight: 180 }}>
                {manhwa.icon || "📖"}
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 p-7 min-w-0">
            {manhwa.type && (
              <span className="inline-block font-heading text-[.6rem] tracking-[.18em] uppercase px-2.5 py-1 mb-3"
                    style={{ background: "rgba(201,168,76,.12)", border: "1px solid var(--or-dk)", color: "var(--or)" }}>
                {manhwa.type}
              </span>
            )}
            <p className="font-heading text-[.65rem] tracking-[.35em] text-or mb-2 uppercase">{genres.join(" · ")}</p>
            <h2 className="font-display leading-tight break-words mb-3"
                style={{ fontSize: "clamp(1.1rem,3vw,1.7rem)", color: "var(--creme)" }}>
              {manhwa.title}
            </h2>

            {(manhwa.auteur || manhwa.artiste) && (
              <p className="text-[.78rem] text-creme-dim mb-3">
                {manhwa.auteur && <span>✍ {manhwa.auteur}</span>}
                {manhwa.artiste && manhwa.artiste !== manhwa.auteur && <span className="ml-3">🎨 {manhwa.artiste}</span>}
              </p>
            )}

            <div className="flex gap-2 flex-wrap mb-4">
              <span className={`font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 ${status}`}>{manhwa.status}</span>
              {manhwa.annee && <span className="font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 border border-gris text-creme-dim">{manhwa.annee}</span>}
            </div>

            {/* Stats */}
            <div className="flex gap-8 flex-wrap pt-4 border-t border-gris mb-4">
              {manhwa.chapitres && (
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-[.62rem] tracking-[.25em] uppercase text-creme-dim">Chapitres</span>
                  <span className="font-display text-[1.5rem] leading-none" style={{ color: "var(--or-lt)" }}>{manhwa.chapitres}</span>
                </div>
              )}
              {manhwa.volumes && (
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-[.62rem] tracking-[.25em] uppercase text-creme-dim">Volumes</span>
                  <span className="font-display text-[1.5rem] leading-none" style={{ color: "var(--or-lt)" }}>{manhwa.volumes}</span>
                </div>
              )}
            </div>

            {manhwa.synopsis && (
              <p className="text-[.85rem] font-light leading-relaxed mb-4 text-creme-dim"
                 style={{ borderLeft: "2px solid var(--or-dk)", paddingLeft: 12 }}>
                {manhwa.synopsis}
              </p>
            )}

            {/* Liens lecture */}
            {(manhwa.sites || []).filter(s => s.url).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {manhwa.sites.filter(s => s.url).map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener"
                     className="font-heading text-[.7rem] tracking-[.12em] uppercase px-4 py-2 border border-or-dk text-or no-underline transition-all duration-300 hover:bg-or/10 hover:border-or">
                    📖 {s.name} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Suivi des chapitres ── */}
        <div className="px-8 pb-10 border-t border-gris">
          <div className="flex items-center gap-4 py-6">
            <div className="h-px w-[60px]" style={{ background: "linear-gradient(90deg,transparent,var(--or-dk))" }} />
            <h3 className="font-heading text-[.85rem] tracking-[.3em] uppercase text-creme whitespace-nowrap">Chapitres lus</h3>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,var(--or-dk),transparent)" }} />

            {/* Progression */}
            {totalChap > 0 && (
              <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                <span className="font-heading text-[.68rem] tracking-[.15em] text-creme-dim">{seenCount} / {totalChap}</span>
                <div className="w-24 h-1 bg-gris rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm transition-all duration-500"
                       style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--rouge),var(--or))" }} />
                </div>
              </div>
            )}
          </div>

          {totalChap === 0 ? (
            <p className="text-center py-6 font-heading text-[.75rem] tracking-[.18em] text-gris-lt">
              Aucun chapitre renseigné.
            </p>
          ) : (
            <>
              {/* Bouton tout cocher */}
              <div className="flex justify-end mb-4">
                <button onClick={toggleAll}
                        className="font-heading text-[.65rem] tracking-[.12em] uppercase border cursor-pointer transition-all duration-300 px-4 py-2 hover:bg-or/10"
                        style={{ borderColor: "var(--or-dk)", color: "var(--or)" }}>
                  {seenCount === totalChap ? "✕ Tout décocher" : "✓ Tout cocher"}
                </button>
              </div>

              {/* Grille de chapitres */}
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))" }}>
                {chapList.map(n => {
                  const isRead = !!readChapters[n];
                  return (
                    <label key={n}
                           className="flex items-center justify-center gap-1.5 cursor-pointer px-2 py-2.5 border transition-all duration-200 select-none"
                           style={{
                             borderColor: isRead ? "#27ae60" : "var(--gris)",
                             background:  isRead ? "rgba(46,204,113,.1)" : "var(--noir-3)",
                             color:       isRead ? "#2ecc71" : "var(--creme-dim)",
                           }}>
                      <input type="checkbox" className="hidden" checked={isRead}
                             onChange={() => onReadChange({ ...readChapters, [n]: !isRead })} />
                      <span className={`text-[.62rem] font-heading tracking-[.05em] ${isRead ? "text-[#2ecc71]" : "text-or"}`}>
                        {isRead ? "✓" : ""}
                      </span>
                      <span className="font-heading text-[.72rem] tracking-[.06em]">Ch. {n}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════ */
export default function ManhwaPage() {
  const { user } = useAuth();

  const navigate   = useNavigate();
  const [activeTab,    setActiveTab]    = useState(sessionStorage.getItem("manhwaTab") || "en-cours");
  const [allManhwas,   setAllManhwas]   = useState([]);
  const [userList,     setUserList]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTab,    setSearchTab]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterGenre,  setFilterGenre]  = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [deleteMode,   setDeleteMode]   = useState(false);

  useEffect(() => {
    setSearch(""); setFilterGenre(""); setFilterStatut(""); setDeleteMode(false);
  }, [activeTab]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([loadManhwas(), loadUserManhwaList(user.uid)])
      .then(([m, l]) => { setAllManhwas(m); setUserList(l); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleAdd(manhwa) {
    await addToUserManhwaList(user.uid, manhwa._id, searchTab);
    setUserList(prev => {
      const ex = prev.find(i => i.animeId === manhwa._id);
      if (ex) return prev.map(i => i.animeId === manhwa._id ? { ...i, tab: searchTab } : i);
      return [...prev, { animeId: manhwa._id, tab: searchTab }];
    });
  }

  async function handleRemove(manhwa) {
    await removeFromUserManhwaList(user.uid, manhwa._id);
    setUserList(prev => prev.filter(i => i.animeId !== manhwa._id));
  }

  function getGrid(tab) {
    const ids = userList.filter(i => i.tab === tab).map(i => i.animeId);
    const q   = search.toLowerCase();
    return allManhwas
      .filter(m => {
        if (!ids.includes(m._id)) return false;
        const gl = (Array.isArray(m.genres) ? m.genres : [m.genre || ""]).join(" ").toLowerCase();
        return (!q || m.title.toLowerCase().includes(q) || gl.includes(q))
            && (!filterGenre  || (Array.isArray(m.genres) ? m.genres : [m.genre || ""]).includes(filterGenre))
            && (!filterStatut || m.status === filterStatut);
      })
      .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));
  }

  /* ── Mur non-connecté ── */
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-noir flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16"
             style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%,rgba(139,14,28,.2),transparent),var(--noir)" }}>
          <div className="text-center flex flex-col items-center gap-5">
            <span className="text-[3rem] opacity-50">📖</span>
            <h2 className="font-display" style={{ fontSize: "clamp(1.8rem,5vw,3rem)", letterSpacing: ".1em" }}>
              Accès <span className="text-or">réservé</span>
            </h2>
            <p className="font-heading text-[.8rem] tracking-[.22em] uppercase text-creme-dim max-w-[360px]">
              Connectez-vous pour accéder à votre liste personnelle.
            </p>
            <Link to="/login" className="btn-primary">Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir flex flex-col">

      {/* ══ Bloc sticky : navbar + onglets + filtres ══ */}
      <div className="sticky top-0 z-[100] w-full" style={{ background: "var(--noir-2)" }}>
        <Navbar embedded />

        {/* Onglets */}
        <div className="flex w-full border-b border-gris">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); sessionStorage.setItem("manhwaTab", t.id); }}
                    className={`flex items-center gap-2.5 px-7 py-[16px] border-none font-heading font-semibold text-[.78rem] tracking-[.05em] uppercase cursor-pointer relative whitespace-nowrap transition-colors duration-200 bg-transparent flex-1 justify-center ${activeTab === t.id ? "text-creme" : "text-creme-dim hover:text-creme"}`}>
              <span className="text-[1.1rem]">{t.icon}</span>
              <span>{t.label}</span>
              <span className="font-body normal-case text-[.65rem] tracking-[.05em] text-creme-dim/50 ml-0.5 hidden sm:inline">— {t.desc}</span>
              <span className="absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-300 origin-center"
                    style={{ background: "var(--rouge)", transform: activeTab === t.id ? "scaleX(1)" : "scaleX(0)" }} />
            </button>
          ))}
        </div>

        {/* Barre filtres */}
        <div className="flex items-center gap-4 px-[12%] py-3 flex-wrap w-full border-b border-gris">
          <div className="flex items-center flex-1 min-w-[200px] bg-noir-3 border border-gris px-4 focus-within:border-rouge transition-colors duration-200">
            <span className="text-gris-lt mr-2.5">🔍</span>
            <input className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.92rem] py-3 placeholder:text-gris-lt"
                   placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select className="appearance-none bg-noir-2 border border-gris text-creme-dim font-body text-[.85rem] px-4 py-3 pr-10 cursor-pointer outline-none transition-colors duration-200 focus:border-rouge"
                      value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
                <option value="">Tous les genres</option>
                {GENRES_MANHWA.map(g => <option key={g}>{g}</option>)}
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
            </div>
          </div>
          <span className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim whitespace-nowrap">
            <span className="text-rouge">{getGrid(activeTab).length}</span> résultats
          </span>
          <button onClick={() => setDeleteMode(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 border font-heading text-[.72rem] tracking-[.15em] uppercase cursor-pointer transition-all duration-300 ${deleteMode ? "border-rouge text-[#FF6B7A] bg-rouge/15" : "border-gris text-creme-dim hover:border-rouge bg-transparent"}`}>
            🗑 {deleteMode ? "Terminer" : "Supprimer"}
          </button>
          <button onClick={() => setSearchTab(activeTab)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rouge border border-rouge-dk text-creme font-heading text-[.72rem] tracking-[.15em] uppercase cursor-pointer transition-all duration-300 hover:bg-rouge-dk">
            <span className="text-[1.1rem] font-light leading-none">+</span> Ajouter
          </button>
        </div>
      </div>

      {/* Panels */}
      <main className="flex-1 px-[12%] pt-8 pb-24 w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-5">
              <div className="loader-orb" />
              <p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p>
            </div>
          </div>
        ) : TABS.map(t => {
          const grid = getGrid(t.id);
          return (
            <section key={t.id} className={activeTab === t.id ? "block" : "hidden"}
                     style={{ animation: "fade-up .4s ease both" }}>
              <div className="grid gap-[20px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {grid.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center gap-4 py-20 text-creme-dim">
                    <span className="text-[2.5rem] opacity-40">{t.icon}</span>
                    <p className="font-heading text-[.78rem] tracking-[.2em] uppercase">
                      {search || filterGenre || filterStatut ? "Aucun résultat pour ces filtres." : "Aucun titre. Cliquez sur « + Ajouter »."}
                    </p>
                  </div>
                ) : grid.map(manhwa => (
                  <ManhwaCard key={manhwa._id} manhwa={manhwa} onRemove={handleRemove}
                              deleteMode={deleteMode}
                              onOpen={m => navigate(`/manhwa/${m._id}`)} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Modales */}
      {searchTab && (
        <SearchModal allManhwas={allManhwas} userList={userList} currentTab={searchTab}
                     onAdd={handleAdd} onClose={() => setSearchTab(null)} />
      )}

    </div>
  );
}
