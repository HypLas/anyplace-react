import { SkeletonGrid } from "../../components/SkeletonCard";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadAnimes, deleteAnime, loadManhwas, deleteManhwa } from "../../firebase";
import Navbar           from "../../components/Navbar";
import Footer           from "../../components/Footer";
import AnimeCard        from "./AnimeCard";
import AddEditModal     from "./AddEditModal";
import ManhwaCard       from "./ManhwaCard";
import ManhwaDetailModal from "./ManhwaDetailModal";
import AddManhwaModal   from "./AddManhwaModal";
import HentaiSection    from "./HentaiSection";
import { GENRES, STATUTS, GENRES_MANHWA, STATUTS_MANHWA, getGenreList } from "../../constants";

function Toast({ msg, type }) {
  return msg ? <div className={`toast show ${type==="err"?"toast-err":""}`}>{msg}</div> : null;
}

/* ── Barre recherche/filtres ── */
function Controls({ search, onSearch, genre, onGenre, statut, onStatut, genres, statuts, count, isOwner, deleteMode, onDeleteMode, onAdd }) {
  const selCls = "appearance-none bg-noir-2 border border-gris text-creme-dim font-body text-[.85rem] px-4 py-3 pr-10 cursor-pointer outline-none transition-colors duration-200 focus:border-rouge";
  return (
    <div className="flex items-center gap-4 px-[12%] py-3 flex-wrap w-full border-b border-gris"
         style={{ background: "var(--noir-2)" }}>
      <div className="flex items-center flex-1 min-w-[200px] bg-noir-3 border border-gris px-4 focus-within:border-rouge transition-colors duration-200">
        <span className="text-gris-lt mr-2.5">🔍</span>
        <input className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.92rem] py-3 placeholder:text-gris-lt"
               placeholder="Rechercher…" value={search} onChange={e => onSearch(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <div className="relative">
          <select className={selCls} value={genre} onChange={e => onGenre(e.target.value)}>
            <option value="">Tous les genres</option>
            {genres.map(g => <option key={g}>{g}</option>)}
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
        </div>
        <div className="relative">
          <select className={selCls} value={statut} onChange={e => onStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {statuts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
        </div>
      </div>
      <span className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim whitespace-nowrap">
        <span className="text-rouge">{count}</span> résultats
      </span>
      {isOwner && (
        <>
          <button onClick={onDeleteMode}
                  className={`flex items-center gap-2 px-4 py-2.5 border font-heading text-[.72rem] tracking-[.15em] uppercase cursor-pointer transition-all duration-300 ${deleteMode ? "border-rouge text-[#FF6B7A] bg-rouge/15" : "border-gris text-creme-dim hover:border-rouge bg-transparent"}`}>
            🗑 {deleteMode ? "Terminer" : "Supprimer"}
          </button>
          <button onClick={onAdd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rouge border border-rouge-dk text-creme font-heading text-[.72rem] tracking-[.15em] uppercase cursor-pointer transition-all duration-300 hover:bg-rouge-dk">
            <span className="text-[1.1rem] font-light leading-none">+</span> Ajouter
          </button>
        </>
      )}
    </div>
  );
}

function AnimeSection({ isOwner, search, genre, statut, deleteMode, onCountChange, addTrigger }) {
  const navigate = useNavigate();
  const [animes,    setAnimes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editAnime, setEditAnime] = useState(undefined);
  const [toast,     setToast]     = useState({ msg: "", type: "ok" });

  function showToast(m, t = "ok") { setToast({ msg: m, type: t }); setTimeout(() => setToast({ msg: "", type: "ok" }), 3200); }
  useEffect(() => { loadAnimes().then(a => { setAnimes(a); setLoading(false); }).catch(() => setLoading(false)); }, []);
  useEffect(() => { if (addTrigger > 0) setEditAnime(null); }, [addTrigger]);

  const filtered = animes
    .filter(a => {
      const gl = getGenreList(a).join(" ").toLowerCase();
      const q  = search.toLowerCase();
      return (!q || a.title.toLowerCase().includes(q) || gl.includes(q))
          && (!genre  || getGenreList(a).includes(genre))
          && (!statut || a.status === statut);
    })
    .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));

  useEffect(() => { onCountChange(loading ? 0 : filtered.length); }, [filtered.length, loading]);

  async function handleDelete(a) { if (!confirm(`Supprimer "${a.title}" ?`)) return; await deleteAnime(a._id); setAnimes(p => p.filter(x => x._id !== a._id)); showToast(`🗑 "${a.title}" supprimé`, "err"); }
  function handleSaved(a, isEdit) { if (isEdit) { setAnimes(p => p.map(x => x._id === a._id ? a : x)); showToast("✓ Anime modifié !"); } else { setAnimes(p => [a, ...p]); showToast("✓ Anime ajouté !"); } }

  return (<>
    <main className="px-[12%] pt-8 pb-24 w-full">
      {loading ? (<SkeletonGrid count={14} ratio="2/3" />)
       : filtered.length === 0 ? (<p className="text-center py-20 font-heading text-[.9rem] tracking-[.15em] text-creme-dim">Aucun anime trouvé.</p>)
       : (<div className="grid gap-[20px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {filtered.map((a, i) => <AnimeCard key={a._id || i} anime={a} isOwner={isOwner} deleteMode={deleteMode} onDelete={handleDelete} onClick={x => navigate('/anime/' + x._id)} />)}
          </div>)}
    </main>
    {editAnime !== undefined && <AddEditModal editAnime={editAnime} onClose={() => setEditAnime(undefined)} onSaved={handleSaved} />}
    <Toast {...toast} />
  </>);
}

function ManhwaSection({ isOwner, search, genre, statut, deleteMode, onCountChange, addTrigger }) {
  const navigate = useNavigate();
  const [manhwas,    setManhwas]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [editManhwa, setEditManhwa] = useState(undefined);
  const [toast,      setToast]      = useState({ msg: "", type: "ok" });

  function showToast(m, t = "ok") { setToast({ msg: m, type: t }); setTimeout(() => setToast({ msg: "", type: "ok" }), 3200); }
  useEffect(() => { loadManhwas().then(m => { setManhwas(m); setLoading(false); }).catch(() => setLoading(false)); }, []);
  useEffect(() => { if (addTrigger > 0) setEditManhwa(null); }, [addTrigger]);

  const filtered = manhwas
    .filter(m => {
      const gl = (Array.isArray(m.genres) ? m.genres : [m.genre || ""]).join(" ").toLowerCase();
      const q  = search.toLowerCase();
      return (!q || m.title.toLowerCase().includes(q) || gl.includes(q) || (m.auteur || "").toLowerCase().includes(q))
          && (!genre  || (Array.isArray(m.genres) ? m.genres : [m.genre || ""]).includes(genre))
          && (!statut || m.status === statut);
    })
    .sort((a, b) => a.title.localeCompare(b.title, "fr", { sensitivity: "base" }));

  useEffect(() => { onCountChange(loading ? 0 : filtered.length); }, [filtered.length, loading]);

  async function handleDelete(m) { if (!confirm(`Supprimer "${m.title}" ?`)) return; await deleteManhwa(m._id); setManhwas(p => p.filter(x => x._id !== m._id)); showToast(`🗑 "${m.title}" supprimé`, "err"); }
  function handleSaved(m, isEdit) { if (isEdit) { setManhwas(p => p.map(x => x._id === m._id ? m : x)); showToast("✓ Manhwa modifié !"); } else { setManhwas(p => [m, ...p]); showToast("✓ Manhwa ajouté !"); } }

  return (<>
    <main className="px-[12%] pt-8 pb-24 w-full">
      {loading ? (<SkeletonGrid count={14} ratio="2/3" />)
       : filtered.length === 0 ? (<p className="text-center py-20 font-heading text-[.9rem] tracking-[.15em] text-creme-dim">Aucun manhwa trouvé.</p>)
       : (<div className="grid gap-[20px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {filtered.map((m, i) => <ManhwaCard key={m._id || i} manhwa={m} isOwner={isOwner} deleteMode={deleteMode} onDelete={handleDelete} onClick={x => navigate(`/manhwa/${x._id}`)} />)}
          </div>)}
    </main>
    {editManhwa !== undefined && <AddManhwaModal editManhwa={editManhwa} onClose={() => setEditManhwa(undefined)} onSaved={handleSaved} />}
    <Toast {...toast} />
  </>);
}

/* ── Onglets catalogue ── */
const ALL_TABS = [
  { id: "anime",  label: "Anime",  icon: "⚔️",  desc: "Animation japonaise" },
  { id: "manhwa", label: "Manhwa", icon: "📖",  desc: "Manhwa · Manhua · Manga" },
  { id: "hentai", label: "Hentai", icon: "🔞",  desc: "Contenu adulte", rouge: true, hentaiOnly: true },
];

export default function Catalogue() {
  const { isOwner, canHentai } = useAuth();
  const [activeTab,   setActiveTab]   = useState(() => sessionStorage.getItem("catalogueTab") || "anime");
  const [search,      setSearch]      = useState("");
  const [genre,       setGenre]       = useState("");
  const [statut,      setStatut]      = useState("");
  const [deleteMode,  setDeleteMode]  = useState(false);
  const [count,       setCount]       = useState(0);
  const [addTrigger,  setAddTrigger]  = useState(0);
  const CATALOGUE_TABS = ALL_TABS.filter(t => !t.hentaiOnly || canHentai);

  useEffect(() => {
    sessionStorage.setItem("catalogueTab", activeTab);
    setSearch(""); setGenre(""); setStatut(""); setDeleteMode(false);
  }, [activeTab]);

  const genres  = activeTab === "anime" ? GENRES  : GENRES_MANHWA;
  const statuts = activeTab === "anime" ? STATUTS : STATUTS_MANHWA;

  return (
    <div className="min-h-screen bg-noir flex flex-col">
      {/* ══ BLOC ENTIER STICKY — navbar + onglets + filtres ══ */}
      <div className="sticky top-0 z-[100] w-full" style={{ background: "var(--noir-2)" }}>

        {/* Navbar */}
        <Navbar embedded />

        {/* Onglets */}
        <div className="flex w-full border-b border-gris" style={{ background: "var(--noir-2)" }}>
          {CATALOGUE_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2.5 px-7 py-[16px] border-none font-heading font-semibold text-[.78rem] tracking-[.05em] uppercase cursor-pointer relative whitespace-nowrap transition-colors duration-200 bg-transparent flex-1 justify-center
                      ${activeTab === t.id ? "text-creme" : "text-creme-dim hover:text-creme"}`}>
              <span className="text-[1.1rem]">{t.icon}</span>
              <span>{t.label}</span>
              <span className="font-body normal-case text-[.65rem] tracking-[.05em] text-creme-dim/50 ml-0.5 hidden sm:inline">— {t.desc}</span>
              <span className="absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-300 origin-center"
                    style={{
                      background: "var(--rouge)",
                      transform: activeTab === t.id ? "scaleX(1)" : "scaleX(0)"
                    }} />
            </button>
          ))}
        </div>

        {/* Barre de filtres — Anime et Manhwa uniquement */}
        {activeTab !== "hentai" && (
          <Controls
            search={search} onSearch={setSearch}
            genre={genre}   onGenre={setGenre}
            statut={statut} onStatut={setStatut}
            genres={genres} statuts={statuts}
            count={count}
            isOwner={isOwner}
            deleteMode={deleteMode}
            onDeleteMode={() => setDeleteMode(!deleteMode)}
            onAdd={() => setAddTrigger(n => n + 1)}
          />
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1">
        {activeTab === "anime"  && <AnimeSection  isOwner={isOwner} search={search} genre={genre} statut={statut} deleteMode={deleteMode} onCountChange={setCount} addTrigger={addTrigger} />}
        {activeTab === "manhwa" && <ManhwaSection isOwner={isOwner} search={search} genre={genre} statut={statut} deleteMode={deleteMode} onCountChange={setCount} addTrigger={addTrigger} />}
        {activeTab === "hentai" && <HentaiSection isOwner={isOwner} />}
      </div>

      <Footer />
    </div>
  );
}
