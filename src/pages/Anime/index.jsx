import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  loadAnimes, loadUserList, addToUserList, removeFromUserList,
} from "../../firebase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { SkeletonGrid } from "../../components/SkeletonCard";
import { getGenreList, LANG_MAP, GENRES, STATUTS } from "../../constants";
import usePoster from "../../hooks/usePoster";

const TABS = [
  { id: "simulcast", label: "Simulcast", icon: "📡", desc: "Diffusion simultanée" },
  { id: "en-cours",  label: "En cours",  icon: "▶",  desc: "En cours de visionnage" },
  { id: "termine",   label: "Terminé",   icon: "✓",  desc: "Séries terminées" },
  { id: "a-voir",    label: "À voir",    icon: "🔖", desc: "Ma liste à regarder" },
];

/* ── Prochain épisode : dernier épisode daté + 7 jours ── */
function getNextEp(tables) {
  if (!tables?.length) return null;
  const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  // Collecter tous les épisodes datés
  const dated = [];
  for (const table of tables) {
    for (const row of table.rows || []) {
      if (!row.date) continue;
      const parts = row.date.split("/");
      if (parts.length !== 3) continue;
      const d = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      if (isNaN(d)) continue;
      dated.push({ d, num: row.num });
    }
  }
  if (!dated.length) return null;

  // Trouver la date la plus récente et le numéro d'épisode le plus élevé
  const lastDate = dated.reduce((max, e) => e.d > max ? e.d : max, dated[0].d);
  const maxNum   = Math.max(...dated.filter(e => e.num != null).map(e => e.num));

  const next = new Date(lastDate); next.setDate(next.getDate() + 7);
  const dd = String(next.getDate()).padStart(2, "0");
  const mm = String(next.getMonth() + 1).padStart(2, "0");
  return { day: JOURS[next.getDay()], label: `${dd}/${mm}`, num: isFinite(maxNum) ? maxNum + 1 : "?" };
}

/* ── Carte anime ── */
function AnimeCard({ anime, onRemove, onOpen, deleteMode, showNextEp }) {
  const langInfo  = anime.lang ? LANG_MAP[anime.lang] : null;
  const genres    = getGenreList(anime).slice(0, 2);
  const posterSrc = usePoster(anime.title, anime.img1);
  const nextEp    = showNextEp ? getNextEp(anime.tables) : null;

  return (
    <div className="anime-card cursor-pointer" onClick={() => !deleteMode && onOpen && onOpen(anime)}>
      <div className="relative overflow-hidden">
        {langInfo && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 rounded-sm px-1.5 py-1 pointer-events-none"
               style={{ background: "rgba(10,10,15,.82)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.1)" }}>
            {langInfo.codes.map(c => <img key={c} src={`https://flagcdn.com/w20/${c}.png`} alt={c} className="w-[18px] h-auto rounded-sm" />)}
            <span className="font-heading text-[.58rem] tracking-[.1em] uppercase text-white/85">{langInfo.label}</span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onRemove(anime); }}
                className={`absolute top-2 right-2 z-10 w-[26px] h-[26px] bg-rouge text-white text-[.75rem] border-none cursor-pointer items-center justify-center transition-colors duration-200 hover:bg-rouge-dk ${deleteMode ? "flex" : "hidden"}`}
                style={{ borderRadius: 2 }}>
          ✕
        </button>
        {posterSrc
          ? <img src={posterSrc} alt={anime.title} loading="lazy"
                 className="w-full object-cover block transition-all duration-300"
                 style={{ aspectRatio: "2/3", filter: "brightness(.85)" }}
                 onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          : null}
        <div className={`w-full flex items-center justify-center text-[3rem] ${posterSrc ? "hidden" : "flex"}`}
             style={{ aspectRatio: "2/3", background: "linear-gradient(135deg,#1A1A25,#2A2A38)" }}>
          {anime.icon || "🎌"}
        </div>
        {nextEp && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-2.5 py-2 pointer-events-none"
               style={{ background: "linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.7) 60%, transparent 100%)" }}>
            <span className="font-heading text-[.66rem] tracking-[.06em] uppercase text-white/50">Ép. {nextEp.num}</span>
            <span className="font-heading text-[.75rem] tracking-[.04em] font-bold"
                  style={{ color: "var(--or)" }}>
              {nextEp.day} {nextEp.label}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 pb-3.5">
        <p className="font-heading text-[.8rem] tracking-[.06em] text-creme mb-1.5 truncate" title={anime.title}>{anime.title}</p>
        <div className="flex gap-1.5 flex-wrap mb-1.5">
          {genres.map(g => <span key={g} className="font-heading text-[.58rem] tracking-[.08em] border border-or-dk text-or px-1.5 py-0.5">{g}</span>)}
        </div>
        <p className="text-[.72rem] text-creme-dim font-light">{anime.episodes} éps.</p>
      </div>
    </div>
  );
}

/* ── Ligne anime dans la modale ── */
function SearchRow({ anime, inOther, fromTab, onAdd }) {
  const posterSrc = usePoster(anime.title, anime.img1);
  return (
    <div className="flex items-center gap-3.5 px-5 py-2.5 border-b border-white/[.04] hover:bg-white/[.03] transition-colors duration-300">
      {posterSrc
        ? <img src={posterSrc} alt="" className="w-[38px] h-[54px] object-cover flex-shrink-0" onError={e => { e.target.style.display = "none"; }} />
        : <div className="w-[38px] h-[54px] bg-noir-3 flex items-center justify-center text-[1.4rem] flex-shrink-0">{anime.icon || "🎌"}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-heading text-[.82rem] tracking-[.06em] text-creme truncate mb-1">{anime.title}</p>
        <div className="flex items-center gap-2">
          <p className="text-[.72rem] text-creme-dim">{getGenreList(anime).slice(0, 2).join(" · ")}</p>
          {fromTab && (
            <span className="font-heading text-[.6rem] tracking-[.08em] px-1.5 py-0.5 flex-shrink-0"
                  style={{ background: "rgba(232,0,28,.15)", color: "var(--rouge)", border: "1px solid rgba(232,0,28,.3)" }}>
              {fromTab}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onAdd(anime)}
              className={`flex-shrink-0 px-4 py-1.5 border font-heading text-[.65rem] tracking-[.12em] uppercase cursor-pointer transition-all duration-300 bg-transparent whitespace-nowrap ${inOther ? "border-rouge text-rouge hover:bg-rouge/10" : "border-or-dk text-or hover:bg-or/10 hover:border-or"}`}>
        {inOther ? "↗ Déplacer ici" : "+ Ajouter"}
      </button>
    </div>
  );
}

/* ── Modale recherche ── */
function SearchModal({ allAnimes, userList, currentTab, onAdd, onClose }) {
  const [q, setQ] = useState("");
  const inCurrentTab = userList.filter(i => i.tab === currentTab).map(i => i.animeId);

  const filtered = allAnimes
    .filter(a => {
      if (inCurrentTab.includes(a._id)) return false;
      const t  = q.toLowerCase();
      const gl = getGenreList(a).join(" ").toLowerCase();
      return !t || a.title.toLowerCase().includes(t) || gl.includes(t);
    })
    .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));

  const TAB_LABELS = { simulcast: "Simulcast", "en-cours": "En cours", termine: "Terminé", "a-voir": "À voir" };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6"
         style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[680px] bg-noir-2 border border-gris flex flex-col"
           style={{ maxHeight: "80vh", animation: "fade-up .3s ease forwards" }}>
        <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-gris flex-shrink-0">
          <div>
            <span className="block font-heading text-[.65rem] tracking-[.4em] text-or mb-1.5">— Anime —</span>
            <h3 className="font-display text-[1.15rem] tracking-[.1em]">Ajouter à <span className="text-or">{TAB_LABELS[currentTab]}</span></h3>
          </div>
          <button onClick={onClose}
                  className="w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge bg-transparent flex-shrink-0">
            ✕
          </button>
        </div>
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gris bg-noir flex-shrink-0">
          <span className="text-gris-lt text-[1.1rem]">🔍</span>
          <input autoFocus className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.95rem] py-1 placeholder:text-gris-lt"
                 placeholder="Rechercher dans le catalogue…" value={q} onChange={e => setQ(e.target.value)} />
          <span className="font-heading text-[.68rem] text-gris-lt flex-shrink-0">{filtered.length} résultats</span>
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {filtered.length === 0
            ? <p className="text-center py-10 font-heading text-[.75rem] tracking-[.18em] text-gris-lt uppercase">{q ? `Aucun résultat pour "${q}".` : "Tous les animes sont déjà dans cet onglet."}</p>
            : filtered.map(anime => {
                const inOther = userList.find(i => i.animeId === anime._id);
                const fromTab = inOther ? TAB_LABELS[inOther.tab] : null;
                return <SearchRow key={anime._id} anime={anime} inOther={!!inOther} fromTab={fromTab} onAdd={onAdd} />;
              })
          }
        </div>
      </div>
    </div>
  );
}

/* ── Modale détail + suivi épisodes ── */

/* ── Page principale ── */
export default function Anime() {
  const { user } = useAuth();

  const navigate = useNavigate();
  const [activeTab,    setActiveTab]    = useState(() => sessionStorage.getItem("animeTab") || "simulcast");
  const [allAnimes,    setAllAnimes]    = useState([]);
  const [userList,     setUserList]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchTab,    setSearchTab]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterGenre,  setFilterGenre]  = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [deleteMode,   setDeleteMode]   = useState(false);

  useEffect(() => {
    sessionStorage.setItem("animeTab", activeTab);
    setSearch(""); setFilterGenre(""); setFilterStatut(""); setDeleteMode(false);
  }, [activeTab]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([loadAnimes(), loadUserList(user.uid)])
      .then(([a, l]) => { setAllAnimes(a); setUserList(l); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleAdd(anime) {
    await addToUserList(user.uid, anime._id, searchTab);
    setUserList(prev => {
      const ex = prev.find(i => i.animeId === anime._id);
      if (ex) return prev.map(i => i.animeId === anime._id ? { ...i, tab: searchTab } : i);
      return [...prev, { animeId: anime._id, tab: searchTab }];
    });
  }

  async function handleRemove(anime) {
    await removeFromUserList(user.uid, anime._id);
    setUserList(prev => prev.filter(i => i.animeId !== anime._id));
  }

  function getGrid(tab) {
    const ids = userList.filter(i => i.tab === tab).map(i => i.animeId);
    return allAnimes
      .filter(a => {
        if (!ids.includes(a._id)) return false;
        const gl = getGenreList(a).join(" ").toLowerCase();
        const q  = search.toLowerCase();
        return (!q || a.title.toLowerCase().includes(q) || gl.includes(q))
            && (!filterGenre  || getGenreList(a).includes(filterGenre))
            && (!filterStatut || a.status === filterStatut);
      })
      .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));
  }

  const grid   = getGrid(activeTab);
  const selCls = "appearance-none bg-noir-2 border border-gris text-creme-dim font-body text-[.85rem] px-4 py-3 pr-10 cursor-pointer outline-none transition-colors duration-200 focus:border-rouge";
  const activeTabInfo = TABS.find(t => t.id === activeTab);

  /* Mur non connecté */
  if (!loading && !user) return (
    <div className="min-h-screen bg-noir flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-16"
           style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%,rgba(139,14,28,.2),transparent),var(--noir)" }}>
        <div className="text-center flex flex-col items-center gap-5">
          <span className="text-[3rem] opacity-50">⛩</span>
          <h2 className="font-display" style={{ fontSize: "clamp(1.8rem,5vw,3rem)", letterSpacing: ".1em" }}>
            <span className="text-or">Anime</span>
          </h2>
          <p className="font-heading text-[.8rem] tracking-[.22em] uppercase text-creme-dim max-w-[360px]">
            Connectez-vous pour accéder à votre liste anime.
          </p>
          <Link to="/login" className="btn-primary">Se connecter</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-noir flex flex-col">

      {/* ══ Bloc sticky : Navbar + onglets + filtres ══ */}
      <div className="sticky top-0 z-[100] w-full" style={{ background: "var(--noir-2)" }}>
        <Navbar embedded />

        {/* Onglets */}
        <div className="flex w-full border-b border-gris">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2.5 px-7 py-[16px] border-none font-heading font-semibold text-[.78rem] tracking-[.05em] uppercase cursor-pointer relative whitespace-nowrap transition-colors duration-200 bg-transparent flex-1 justify-center
                      ${activeTab === t.id ? "text-creme" : "text-creme-dim hover:text-creme"}`}>
              <span className="text-[1.1rem]">{t.icon}</span>
              <span>{t.label}</span>
              <span className="font-body normal-case text-[.65rem] tracking-[.05em] text-creme-dim/50 ml-0.5 hidden sm:inline">— {t.desc}</span>
              <span className="absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-300 origin-center"
                    style={{ background: "var(--rouge)", transform: activeTab === t.id ? "scaleX(1)" : "scaleX(0)" }} />
            </button>
          ))}
        </div>

        {/* Barre filtres — identique au Catalogue */}
        <div className="flex items-center gap-4 px-[12%] py-3 flex-wrap w-full border-b border-gris"
             style={{ background: "var(--noir-2)" }}>
          <div className="flex items-center flex-1 min-w-[200px] bg-noir-3 border border-gris px-4 focus-within:border-rouge transition-colors duration-200">
            <span className="text-gris-lt mr-2.5">🔍</span>
            <input className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.92rem] py-3 placeholder:text-gris-lt"
                   placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select className={selCls} value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
                <option value="">Tous les genres</option>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
            </div>
          </div>
          <span className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim whitespace-nowrap">
            <span className="text-rouge">{grid.length}</span> résultats
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

      {/* ══ Contenu ══ */}
      <main className="px-[12%] pt-8 pb-24 w-full">
        {loading ? (
          <SkeletonGrid count={14} ratio="2/3" />
        ) : (
          <section style={{ animation: "fade-up .4s ease both" }}>

            {/* Header section — identique au Catalogue */}
            <div className="flex items-end justify-between gap-5 mb-8 pb-5 border-b border-gris flex-wrap">
              <div>
                <h2 className="font-display text-[clamp(1.2rem,3vw,1.8rem)] tracking-[.1em] mb-1.5">
                  {activeTabInfo?.label}
                </h2>
                <p className="font-heading text-[.7rem] tracking-[.2em] uppercase text-creme-dim">{activeTabInfo?.desc}</p>
              </div>
              <span className="font-heading text-[.72rem] tracking-[.18em] text-or whitespace-nowrap">
                {grid.length} série{grid.length !== 1 ? "s" : ""}
              </span>
            </div>

            {grid.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-creme-dim">
                <span className="text-[2.5rem] opacity-40">{activeTabInfo?.icon}</span>
                <p className="font-heading text-[.78rem] tracking-[.2em] uppercase">
                  {search || filterGenre || filterStatut ? "Aucun résultat pour ces filtres." : "Aucune série. Cliquez sur « + Ajouter »."}
                </p>
              </div>
            ) : (
              <div className="grid gap-[20px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {grid.map(anime => (
                  <AnimeCard key={anime._id} anime={anime}
                             onRemove={handleRemove} onOpen={a => navigate(`/anime/${a._id}`, { state: { tab: activeTab } })}
                             deleteMode={deleteMode} showNextEp={activeTab === "simulcast"} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />

      {searchTab && (
        <SearchModal allAnimes={allAnimes} userList={userList} currentTab={searchTab}
                     onAdd={handleAdd} onClose={() => setSearchTab(null)} />
      )}
    </div>
  );
}
