import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  loadHentaiAnimes, loadHentaiMangas,
  loadUserHentaiList, addToUserHentaiList, removeFromUserHentaiList,
  loadHentaiWatched,  saveHentaiWatched,
} from "../../firebase";
import Navbar from "../../components/Navbar";

const TABS = [
  { id:"simulcast", label:"Simulcast", icon:"📡" },
  { id:"en-cours",  label:"En cours",  icon:"▶" },
  { id:"termine",   label:"Terminé",   icon:"✓" },
];
const SECTIONS = [
  { id:"anime", label:"🎬 Anime Hentai",   desc:"Séries animées adultes" },
  { id:"manga", label:"📖 Manga / Doujin", desc:"Scans & doujins" },
];

/* ── Mur accès refusé ── */
function AccessDenied({ user }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-noir flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-16"
           style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%,rgba(139,14,28,.2),transparent),var(--noir)" }}>
        <div className="text-center flex flex-col items-center gap-5 max-w-md" style={{ animation: "fade-up .7s ease forwards" }}>
          <span className="text-[4rem] opacity-60">🔒</span>
          <h2 className="font-display" style={{ fontSize: "clamp(1.8rem,5vw,2.8rem)", letterSpacing: ".1em" }}>
            Accès <span style={{ color: "var(--rouge)" }}>refusé</span>
          </h2>
          <p className="font-heading text-[.82rem] tracking-[.2em] uppercase text-creme-dim leading-relaxed">
            Cette section est réservée à un compte spécifique.
          </p>
          {!user && (
            <p className="font-body text-[.85rem] text-creme-dim/70">
              Connectez-vous avec le bon compte pour accéder à ce contenu.
            </p>
          )}
          <div className="flex gap-3 mt-2">
            {!user
              ? <Link to="/login" className="btn-primary" style={{ padding: "11px 28px" }}>Se connecter</Link>
              : <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: "11px 28px" }}>← Retour</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Petite carte ── */
function HCard({ item, onRemove, onOpen }) {
  const isAnime = item.section === "anime";
  return (
    <div className="anime-card" onClick={() => onOpen(item)}>
      <div className="relative overflow-hidden"
           onMouseEnter={e => e.currentTarget.querySelector(".rmv-btn")?.style.setProperty("display","flex")}
           onMouseLeave={e => e.currentTarget.querySelector(".rmv-btn")?.style.setProperty("display","none")}>
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 font-heading text-[.55rem] tracking-[.1em] pointer-events-none"
             style={{ background: "rgba(192,21,42,.9)", color: "#fff", backdropFilter: "blur(4px)" }}>🔞</div>
        <button className="rmv-btn absolute top-2 right-2 z-10 w-[26px] h-[26px] bg-rouge/85 text-white text-[.75rem] border-none cursor-pointer items-center justify-center transition-colors duration-300 hover:bg-rouge-dk"
                style={{ display: "none" }}
                onClick={e => { e.stopPropagation(); onRemove(item); }}>✕</button>
        {(isAnime ? item.img1 : item.img) ? (
          <img src={isAnime ? item.img1 : item.img} alt={item.title} loading="lazy"
               className="w-full object-cover block transition-all duration-300"
               style={{ aspectRatio: isAnime ? "2/3" : "1/1", filter: "brightness(.82)" }}
               onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
        ) : null}
        <div className={`w-full flex items-center justify-center text-[2.8rem] ${(isAnime ? item.img1 : item.img) ? "hidden" : "flex"}`}
             style={{ aspectRatio: isAnime ? "2/3" : "1/1", background: "linear-gradient(135deg,#1a0508,#2a0a10)" }}>
          {item.icon || "🔞"}
        </div>
        {/* Overlay hover */}
        <div className="card-overlay">
          <p className="card-overlay-title">{item.title}</p>
          {item.auteur && <p className="font-body text-[.65rem] text-creme-dim/80 mb-1">✍ {item.auteur}</p>}
          <span className="card-overlay-status">{isAnime ? `${item.episodes||"?"} éps.` : `${item.chapitres||"?"} chap.`}</span>
        </div>
      </div>
      <div className="p-3 pb-3.5">
        <p className="font-heading text-[.78rem] tracking-[.06em] text-creme mb-1 truncate" title={item.title}>{item.title}</p>
        {item.auteur && <p className="text-[.65rem] text-creme-dim/65 mb-1 truncate">✍ {item.auteur}</p>}
        <p className="text-[.72rem] text-creme-dim font-light">{isAnime ? `${item.episodes||"?"} éps.` : `${item.chapitres||"?"} chap.`}</p>
      </div>
    </div>
  );
}

/* ── Modale recherche ── */
function SearchModal({ all, userList, currentTab, onAdd, onClose }) {
  const [q, setQ] = useState("");
  const inTab = userList.filter(i => i.tab === currentTab).map(i => i.animeId);
  const filtered = all
    .filter(i => { const t = q.toLowerCase(); return (!t || i.title.toLowerCase().includes(t) || (i.auteur||"").toLowerCase().includes(t)) && !inTab.includes(i._id); })
    .sort((a,b) => a.title.localeCompare(b.title,"fr",{sensitivity:"base"}))
    .slice(0,30);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6"
         style={{ background: "rgba(0,0,0,.82)", backdropFilter: "blur(6px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[640px] bg-noir-2 border border-gris corner-gold flex flex-col"
           style={{ maxHeight: "80vh", animation: "fade-up .3s ease forwards" }}>
        <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-gris flex-shrink-0">
          <div>
            <span className="block font-heading text-[.65rem] tracking-[.4em] mb-1.5" style={{ color: "var(--rouge)" }}>— Catalogue —</span>
            <h3 className="font-display text-[1.15rem] tracking-[.1em]">Ajouter <span style={{ color: "var(--rouge)" }}>un Hentai</span></h3>
          </div>
          <button onClick={onClose} className="w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge bg-transparent flex-shrink-0">✕</button>
        </div>
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gris bg-noir flex-shrink-0">
          <span className="text-gris-lt text-[1.1rem]">🔍</span>
          <input autoFocus className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.95rem] py-1 placeholder:text-gris-lt"
                 placeholder="Titre, auteur…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="overflow-y-auto flex-1 py-2">
          {filtered.length === 0
            ? <p className="text-center py-10 font-heading text-[.75rem] tracking-[.18em] text-gris-lt uppercase">{q ? "Aucun résultat." : "Catalogue vide."}</p>
            : filtered.map(item => {
                const inOther = userList.find(i => i.animeId === item._id);
                const img = item.section === "anime" ? item.img1 : item.img;
                return (
                  <div key={item._id} className="flex items-center gap-3.5 px-5 py-2.5 border-b border-white/[.04] hover:bg-white/[.03] transition-colors duration-300">
                    {img
                      ? <img src={img} alt="" className="flex-shrink-0 object-cover rounded-sm" style={{ width:40, height:40 }} onError={e => e.target.style.display="none"} />
                      : <div className="flex-shrink-0 flex items-center justify-center text-[1.3rem] rounded-sm" style={{ width:40, height:40, background:"var(--noir-3)" }}>{item.icon||"🔞"}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-[.82rem] tracking-[.06em] text-creme truncate mb-0.5">{item.title}</p>
                      <p className="text-[.7rem] text-creme-dim">
                        <span className="mr-2" style={{ color:"#FF8090" }}>{item.section==="anime"?"Anime":"Manga"}</span>
                        {item.auteur && `· ${item.auteur}`}
                      </p>
                    </div>
                    <button onClick={() => onAdd(item)}
                            className="flex-shrink-0 px-4 py-1.5 border font-heading text-[.65rem] tracking-[.12em] uppercase cursor-pointer transition-all duration-300 bg-transparent whitespace-nowrap"
                            style={{ borderColor:"rgba(192,21,42,.4)", color:"#FF8090" }}>
                      {inOther ? "Déplacer ici" : "+ Ajouter"}
                    </button>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

/* ── Modale détail + suivi ── */
function DetailModal({ item, watchedData, onWatchedChange, onClose }) {
  const isAnime = item.section === "anime";
  const total   = isAnime ? (parseInt(item.episodes)||0) : (parseInt(item.chapitres)||0);
  const list    = Array.from({ length:total }, (_,i) => i+1);
  const seen    = list.filter(n => watchedData[n]).length;
  const pct     = total>0 ? Math.round((seen/total)*100) : 0;
  const img     = isAnime ? item.img1 : item.img;
  const sites   = (item.sites||[]).filter(s => s.url);

  function toggleAll() {
    const updated = {};
    if (seen !== total) list.forEach(n => { updated[n] = true; });
    onWatchedChange(updated);
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center p-4 overflow-y-auto"
         style={{ background: "rgba(0,0,0,.85)", backdropFilter: "blur(6px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-4xl my-auto bg-noir-2 border border-gris corner-gold"
           style={{ animation: "fade-up .35s cubic-bezier(.4,0,.2,1) forwards" }}>
        <div className="flex flex-col sm:flex-row">
          <div className="flex-shrink-0 relative" style={{ width:"100%", maxWidth:isAnime?200:220 }}>
            <button onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge"
                    style={{ background:"rgba(10,10,15,.7)", backdropFilter:"blur(4px)" }}>✕</button>
            {img
              ? <img src={img} alt={item.title} className="w-full object-cover block" style={{ aspectRatio:isAnime?"2/3":"1/1", minHeight:180 }} />
              : <div className="w-full flex items-center justify-center text-[3.5rem]"
                     style={{ aspectRatio:isAnime?"2/3":"1/1", background:"linear-gradient(135deg,#1a0508,#2a0a10)", minHeight:180 }}>{item.icon||"🔞"}</div>}
          </div>
          <div className="flex-1 p-7 min-w-0 flex flex-col">
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="font-heading text-[.6rem] tracking-[.15em] uppercase px-2.5 py-1"
                    style={{ background:"rgba(192,21,42,.15)", border:"1px solid var(--rouge)", color:"var(--rouge)" }}>
                🔞 {isAnime ? "Anime Hentai" : (item.type||"Manga Hentai")}
              </span>
              {item.censured && <span className="font-heading text-[.6rem] tracking-[.1em] uppercase px-2.5 py-1" style={{ background:"rgba(74,74,96,.2)", border:"1px solid var(--gris-lt)", color:"var(--gris-lt)" }}>🔒 Censuré</span>}
            </div>
            <p className="font-heading text-[.65rem] tracking-[.35em] mb-2 uppercase" style={{ color:"#FF8090" }}>{(item.genres||[]).join(" · ")}</p>
            <h2 className="font-display leading-tight break-words mb-3" style={{ fontSize:"clamp(1.1rem,3vw,1.7rem)", color:"var(--creme)" }}>{item.title}</h2>
            {(item.auteur||item.artiste) && (
              <p className="text-[.78rem] text-creme-dim mb-3">
                {item.auteur && <span>✍ {item.auteur}</span>}
                {item.artiste && item.artiste!==item.auteur && <span className="ml-3">🎨 {item.artiste}</span>}
              </p>
            )}
            <div className="flex gap-8 pt-4 border-t border-gris mb-4">
              <div className="flex flex-col gap-1">
                <span className="font-heading text-[.62rem] tracking-[.25em] uppercase text-creme-dim">{isAnime?"Épisodes":"Chapitres"}</span>
                <span className="font-display text-[1.5rem] leading-none" style={{ color:"var(--or-lt)" }}>{isAnime?item.episodes:item.chapitres}</span>
              </div>
            </div>
            {item.synopsis && <p className="text-[.85rem] font-light leading-relaxed mb-4 text-creme-dim" style={{ borderLeft:"2px solid rgba(192,21,42,.4)", paddingLeft:12 }}>{item.synopsis}</p>}
            {sites.length>0 && (
              <div className="flex flex-wrap gap-2 mt-auto">
                {sites.map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener"
                     className="font-heading text-[.7rem] tracking-[.12em] uppercase px-4 py-2 no-underline transition-all duration-300"
                     style={{ border:"1px solid rgba(192,21,42,.4)", color:"#FF8090" }}>
                    {isAnime?"▶":"📖"} {s.name} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suivi */}
        <div className="px-8 pb-10 border-t border-gris">
          <div className="flex items-center gap-4 py-6">
            <div className="h-px w-[60px]" style={{ background:"linear-gradient(90deg,transparent,rgba(192,21,42,.4))" }}/>
            <h3 className="font-heading text-[.85rem] tracking-[.3em] uppercase text-creme whitespace-nowrap">{isAnime?"Épisodes vus":"Chapitres lus"}</h3>
            <div className="h-px flex-1" style={{ background:"linear-gradient(90deg,rgba(192,21,42,.4),transparent)" }}/>
            {total>0 && (
              <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                <span className="font-heading text-[.68rem] tracking-[.15em] text-creme-dim">{seen}/{total}</span>
                <div className="w-24 h-1 bg-gris rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm transition-all duration-500" style={{ width:`${pct}%`, background:"linear-gradient(90deg,var(--rouge),var(--or))" }}/>
                </div>
              </div>
            )}
          </div>
          {total===0
            ? <p className="text-center py-6 font-heading text-[.75rem] tracking-[.18em] text-gris-lt">Aucun {isAnime?"épisode":"chapitre"} renseigné.</p>
            : (<>
                <div className="flex justify-end mb-4">
                  <button onClick={toggleAll} className="font-heading text-[.65rem] tracking-[.12em] uppercase border cursor-pointer transition-all duration-300 px-4 py-2"
                          style={{ borderColor:"rgba(192,21,42,.4)", color:"#FF8090" }}>
                    {seen===total?"✕ Tout décocher":"✓ Tout cocher"}
                  </button>
                </div>
                <div className="grid gap-2" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(70px,1fr))" }}>
                  {list.map(n => {
                    const isRead = !!watchedData[n];
                    return (
                      <label key={n} className="flex items-center justify-center gap-1 cursor-pointer px-2 py-2.5 border transition-all duration-200 select-none"
                             style={{ borderColor:isRead?"#27ae60":"var(--gris)", background:isRead?"rgba(46,204,113,.1)":"var(--noir-3)" }}>
                        <input type="checkbox" className="hidden" checked={isRead} onChange={() => onWatchedChange({...watchedData,[n]:!isRead})}/>
                        <span className="font-heading text-[.72rem] tracking-[.06em]" style={{ color:isRead?"#2ecc71":"var(--creme-dim)" }}>
                          {isRead?"✓ ":""}{isAnime?"Ép.":"Ch."}{n}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </>)
          }
        </div>
      </div>
    </div>
  );
}

/* ══ PAGE PRINCIPALE ══ */
export default function HentaiPage() {
  const { user, canHentai, loading: authLoading } = useAuth();

  const [activeTab,      setActiveTab]      = useState("simulcast");
  const [activeSection,  setActiveSection]  = useState("anime");
  const [allAnimes,      setAllAnimes]      = useState([]);
  const [allMangas,      setAllMangas]      = useState([]);
  const [animeList,      setAnimeList]      = useState([]);
  const [mangaList,      setMangaList]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchTab,      setSearchTab]      = useState(null);
  const [detail,         setDetail]         = useState(null);
  const [watchedData,    setWatchedData]    = useState({});
  const [watchCache,     setWatchCache]     = useState({});

  useEffect(() => {
    if (!user || !canHentai) { setLoading(false); return; }
    Promise.all([
      loadHentaiAnimes(), loadHentaiMangas(),
      loadUserHentaiList(user.uid,"anime"), loadUserHentaiList(user.uid,"manga"),
    ]).then(([ha,hm,al,ml]) => {
      setAllAnimes(ha); setAllMangas(hm);
      setAnimeList(al); setMangaList(ml);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, canHentai]);

  /* ── Accès refusé si pas le bon compte ── */
  if (!authLoading && !canHentai) return <AccessDenied user={user} />;

  async function handleOpen(item) {
    const type = item.section, key = `${type}_${item._id}`;
    let w = watchCache[key];
    if (!w) { w = await loadHentaiWatched(user.uid, item._id, type); setWatchCache(p=>({...p,[key]:w})); }
    setWatchedData(w||{}); setDetail(item);
  }

  async function handleWatchedChange(updated) {
    setWatchedData(updated);
    const key = `${detail.section}_${detail._id}`;
    setWatchCache(p=>({...p,[key]:updated}));
    try { await saveHentaiWatched(user.uid, detail._id, detail.section, updated); } catch(e){console.error(e);}
  }

  async function handleAdd(item) {
    await addToUserHentaiList(user.uid, item._id, searchTab, item.section);
    const setList = item.section==="anime" ? setAnimeList : setMangaList;
    setList(prev => {
      const ex = prev.find(i=>i.animeId===item._id);
      if(ex) return prev.map(i=>i.animeId===item._id?{...i,tab:searchTab}:i);
      return [...prev, {animeId:item._id,tab:searchTab}];
    });
  }

  async function handleRemove(item) {
    await removeFromUserHentaiList(user.uid, item._id, item.section);
    const setList = item.section==="anime" ? setAnimeList : setMangaList;
    setList(prev => prev.filter(i=>i.animeId!==item._id));
  }

  function getGrid(tab, section) {
    const all  = section==="anime" ? allAnimes : allMangas;
    const list = section==="anime" ? animeList : mangaList;
    const ids  = list.filter(i=>i.tab===tab).map(i=>i.animeId);
    return all.filter(m=>ids.includes(m._id)).sort((a,b)=>a.title.localeCompare(b.title,"fr",{sensitivity:"base"}));
  }

  const allForSearch = activeSection==="anime" ? allAnimes : allMangas;
  const listForSearch= activeSection==="anime" ? animeList : mangaList;

  return (
    <div className="min-h-screen bg-noir">
      <Navbar />

      {/* Hero */}
      <div className="relative text-center overflow-hidden" style={{ padding:"calc(72px + 60px) 5% 50px" }}>
        <div className="absolute inset-0 z-0" style={{ background:"radial-gradient(ellipse 70% 60% at 50% 0%,rgba(139,14,28,.3),transparent 70%),var(--noir)" }}/>
        <h1 className="relative z-10 font-display uppercase tracking-[.12em]" style={{ fontSize:"clamp(2rem,6vw,3.5rem)" }}>
          Ma Liste <span style={{ color:"var(--rouge)" }}>🔞</span>
        </h1>
        <p className="relative z-10 font-heading text-[.78rem] tracking-[.28em] uppercase text-creme-dim mt-3.5">Anime · Manga · Doujin</p>
        {user && <p className="relative z-10 font-heading text-[.68rem] tracking-[.15em] mt-2" style={{ color:"rgba(192,21,42,.6)" }}>{user.email}</p>}
      </div>

      {/* Sections */}
      <div className="flex border-b border-gris/60 max-w-[1400px] mx-auto px-[3%] mt-2">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-none font-heading text-[.72rem] tracking-[.15em] uppercase cursor-pointer relative whitespace-nowrap transition-colors duration-300 bg-transparent ${activeSection===s.id?"":"text-creme-dim hover:text-creme"}`}
                  style={{ color:activeSection===s.id?"var(--rouge)":undefined }}>
            {s.label}
            <span className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-center"
                  style={{ background:"linear-gradient(90deg,var(--rouge),var(--or-dk))", transform:activeSection===s.id?"scaleX(1)":"scaleX(0)" }}/>
          </button>
        ))}
      </div>

      {/* Onglets sticky */}
      <div className="sticky top-[72px] z-50 border-b border-gris" style={{ background:"rgba(10,10,15,.95)", backdropFilter:"blur(12px)" }}>
        <div className="flex max-w-[1400px] mx-auto px-[3%]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-7 py-[18px] border-none font-heading text-[.72rem] tracking-[.18em] uppercase cursor-pointer relative whitespace-nowrap transition-colors duration-300 bg-transparent ${activeTab===t.id?"":"text-creme-dim hover:text-creme"}`}
                    style={{ color:activeTab===t.id?"var(--rouge)":undefined }}>
              <span>{t.icon}</span>{t.label}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-center"
                    style={{ background:"linear-gradient(90deg,var(--rouge),var(--or-dk))", transform:activeTab===t.id?"scaleX(1)":"scaleX(0)" }}/>
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      <main className="max-w-[1400px] mx-auto px-[3%] py-10 pb-20">
        {loading ? (
          <div className="flex justify-center py-20"><div className="flex flex-col items-center gap-5"><div className="loader-orb"/><p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p></div></div>
        ) : TABS.map(t => {
          const grid = getGrid(t.id, activeSection);
          return (
            <section key={t.id} className={activeTab===t.id?"block":"hidden"} style={{ animation:"fade-up .4s ease both" }}>
              <div className="flex items-end justify-between gap-5 mb-8 pb-5 border-b border-gris flex-wrap">
                <div>
                  <h2 className="font-display tracking-[.1em] mb-1.5" style={{ fontSize:"clamp(1.2rem,3vw,1.8rem)" }}>{t.label}</h2>
                  <p className="font-heading text-[.7rem] tracking-[.2em] uppercase text-creme-dim">{SECTIONS.find(s=>s.id===activeSection)?.desc}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-heading text-[.72rem] tracking-[.18em] whitespace-nowrap" style={{ color:"var(--rouge)" }}>
                    {grid.length} titre{grid.length!==1?"s":""}
                  </span>
                  <button onClick={() => setSearchTab(t.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 border text-creme font-heading text-[.7rem] tracking-[.15em] uppercase cursor-pointer transition-all duration-300 bg-transparent"
                          style={{ borderColor:"var(--rouge)" }}>
                    + Ajouter
                  </button>
                </div>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))" }}>
                {grid.length===0
                  ? <div className="col-span-full flex flex-col items-center gap-4 py-20 text-creme-dim">
                      <span className="text-[2.5rem] opacity-40">{t.icon}</span>
                      <p className="font-heading text-[.78rem] tracking-[.2em] uppercase">Aucun titre. Cliquez sur « + Ajouter ».</p>
                    </div>
                  : grid.map(item => <HCard key={item._id} item={item} onRemove={handleRemove} onOpen={handleOpen}/>)
                }
              </div>
            </section>
          );
        })}
      </main>

      {searchTab && (
        <SearchModal all={allForSearch} userList={listForSearch} currentTab={searchTab}
                     onAdd={handleAdd} onClose={() => setSearchTab(null)}/>
      )}
      {detail && (
        <DetailModal item={detail} watchedData={watchedData}
                     onWatchedChange={handleWatchedChange} onClose={() => setDetail(null)}/>
      )}
    </div>
  );
}
