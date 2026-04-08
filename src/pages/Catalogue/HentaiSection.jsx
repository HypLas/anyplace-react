import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadHentaiAnimes, loadHentaiMangas, deleteHentaiAnime, deleteHentaiManga } from "../../firebase";
import AddHentaiModal from "./AddHentaiModal";
import { GENRES_HENTAI, getStatusClass } from "../../constants";
import usePoster from "../../hooks/usePoster";

/* ── Card générique hentai ── */
function HentaiCard({ item, isOwner, deleteMode, onDelete, onClick }) {
  const genres    = Array.isArray(item.genres) ? item.genres : [];
  const isAnime   = item.section === "anime";
  const status    = getStatusClass(item.status);
  const storedImg = isAnime ? item.img1 : item.img;
  const posterSrc = usePoster(item.title, storedImg);

  return (
    <div className="anime-card" onClick={() => !deleteMode && onClick(item)}>
      <div className="relative overflow-hidden">
        {/* Badge rouge 🔞 */}
        <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 font-heading text-[.6rem] tracking-[.1em] pointer-events-none"
             style={{background:"rgba(192,21,42,.9)",color:"#fff",backdropFilter:"blur(4px)"}}>
          🔞 {isAnime ? "ANIME" : (item.type || "MANGA")}
        </div>

        {/* Badge censuré */}
        {item.censured && (
          <div className="absolute top-2 right-8 z-10 px-1.5 py-0.5 font-heading text-[.55rem] tracking-[.08em] pointer-events-none"
               style={{background:"rgba(0,0,0,.75)",color:"var(--creme-dim)",backdropFilter:"blur(4px)"}}>
            🔒
          </div>
        )}

        {/* Bouton supprimer */}
        {isOwner && item._id && (
          <button onClick={e=>{e.stopPropagation();onDelete(item);}}
                  className={`absolute top-2 right-2 z-10 w-[28px] h-[28px] bg-rouge text-white text-[.8rem] border-none cursor-pointer items-center justify-center transition-all duration-300 hover:bg-rouge-dk ${deleteMode?"flex":"hidden"}`}>
            ✕
          </button>
        )}

        {/* Image — portrait 2:3 */}
        {posterSrc ? (
          <img src={posterSrc} alt={item.title} loading="lazy"
               className="w-full object-cover block transition-all duration-300"
               style={{aspectRatio:"2/3", filter:"brightness(.82)"}}
               onError={e=>{e.target.style.display="none";e.target.nextElementSibling.style.display="flex";}} />
        ) : null}
        <div className={`w-full flex items-center justify-center text-[2.8rem] ${posterSrc?"hidden":"flex"}`}
             style={{aspectRatio:"2/3",background:"linear-gradient(135deg,#1a0508,#2a0a10)"}}>
          {item.icon || "🔞"}
        </div>

        {/* Overlay hover */}
        <div className="card-overlay">
          <div className="card-overlay-genres">
            {genres.slice(0, 3).map(g => <span key={g} className="card-overlay-genre">{g}</span>)}
          </div>
          <span className="card-overlay-status">{item.status}</span>
        </div>
      </div>

      {/* Titre sous l'image */}
      <p className="font-heading font-semibold text-[.87rem] tracking-[.02em] text-creme leading-snug px-2.5 pt-2 pb-2.5 text-center">
        {item.title}
      </p>
    </div>
  );
}

/* ── Modale détail hentai ── */
function HentaiDetailModal({ item, onClose, onEdit, isOwner }) {
  if (!item) return null;
  const isAnime = item.section === "anime";
  const genres  = Array.isArray(item.genres) ? item.genres : [];
  const status  = getStatusClass(item.status);
  const sites   = (item.sites||[]).filter(s=>s.url);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
         style={{paddingTop:88,background:"rgba(0,0,0,.82)",backdropFilter:"blur(6px)"}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="relative w-full max-w-3xl my-auto bg-noir-2 border border-gris corner-gold"
           style={{animation:"fade-up .35s cubic-bezier(.4,0,.2,1) forwards"}}>

        {/* Close */}
        <button onClick={onClose}
                className="absolute top-3 right-3 z-10 w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge"
                style={{background:"rgba(10,10,15,.7)",backdropFilter:"blur(4px)"}}>✕</button>

        {/* Infos */}
        <div className="p-7 flex flex-col min-w-0">
            <div>
              {/* Badges type + censure */}
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="font-heading text-[.6rem] tracking-[.15em] uppercase px-2.5 py-1"
                      style={{background:"rgba(192,21,42,.15)",border:"1px solid var(--rouge)",color:"var(--rouge)"}}>
                  🔞 {isAnime ? "Anime Hentai" : (item.type||"Manga Hentai")}
                </span>
                {item.censured && (
                  <span className="font-heading text-[.6rem] tracking-[.1em] uppercase px-2.5 py-1"
                        style={{background:"rgba(74,74,96,.2)",border:"1px solid var(--gris-lt)",color:"var(--gris-lt)"}}>
                    🔒 Censuré
                  </span>
                )}
              </div>

              <p className="font-heading text-[.65rem] tracking-[.35em] mb-2 uppercase" style={{color:"#FF8090"}}>{genres.join(" · ")}</p>
              <h2 className="font-display leading-tight break-words mb-3" style={{fontSize:"clamp(1.1rem,3vw,1.7rem)",color:"var(--creme)"}}>
                {item.title}
              </h2>

              {(item.auteur||item.artiste) && (
                <p className="text-[.78rem] text-creme-dim mb-3">
                  {item.auteur && <span>✍ {item.auteur}</span>}
                  {item.artiste && item.artiste!==item.auteur && <span className="ml-3">🎨 {item.artiste}</span>}
                </p>
              )}

              <div className="flex gap-2 flex-wrap mb-4">
                <span className={`font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 ${status}`}>{item.status}</span>
                {item.annee && <span className="font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 border border-gris text-creme-dim">{item.annee}</span>}
                {item.lang  && <span className="font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 border border-gris text-creme-dim">{item.lang}</span>}
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4 border-t border-gris mb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-[.62rem] tracking-[.25em] uppercase text-creme-dim">{isAnime?"Épisodes":"Chapitres"}</span>
                  <span className="font-display text-[1.5rem] leading-none" style={{color:"var(--or-lt)"}}>{isAnime?item.episodes:item.chapitres}</span>
                </div>
              </div>

              {item.synopsis && (
                <p className="text-[.85rem] font-light leading-relaxed mb-4 text-creme-dim"
                   style={{borderLeft:"2px solid rgba(192,21,42,.4)",paddingLeft:12}}>
                  {item.synopsis}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {sites.length===1 && (
                <a href={sites[0].url} target="_blank" rel="noopener noreferrer"
                   className="btn-primary" style={{padding:"11px 24px",background:"var(--rouge)",borderColor:"var(--rouge)"}}>
                  {isAnime ? "▶ Regarder" : "📖 Lire"}
                </a>
              )}
              {sites.length>1 && sites.map(s=>(
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                   className="font-heading text-[.7rem] tracking-[.12em] uppercase px-4 py-2.5 no-underline transition-all duration-300"
                   style={{border:"1px solid rgba(192,21,42,.4)",color:"#FF8090"}}>
                  {s.name} →
                </a>
              ))}
              {isOwner && (
                <button onClick={onEdit} className="btn-ghost inline-flex items-center gap-2" style={{padding:"11px 24px"}}>
                  ✏ Modifier
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

/* ══ Section principale Hentai dans le catalogue ══ */
export default function HentaiSection({ isOwner }) {
  const { canHentai } = useAuth();
  const navigate = useNavigate();

  // Double vérification côté rendu (la vraie protection est dans le catalogue)
  if (!canHentai) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <span className="text-[3rem] opacity-40">🔒</span>
      <p className="font-heading text-[.82rem] tracking-[.2em] uppercase text-creme-dim">Accès restreint.</p>
    </div>
  );

  const [animes,    setAnimes]    = useState([]);
  const [mangas,    setMangas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [subTab,    setSubTab]    = useState("anime");
  const [search,    setSearch]    = useState("");
  const [genreF,    setGenreF]    = useState("");
  const [deleteMode,setDeleteMode]= useState(false);
  const [detail,    setDetail]    = useState(null);
  const [editItem,  setEditItem]  = useState(undefined);
  const [toast,     setToast]     = useState({ msg:"", type:"ok" });

  function showToast(msg, type="ok") { setToast({msg,type}); setTimeout(()=>setToast({msg:"",type:"ok"}),3200); }

  useEffect(() => {
    Promise.all([loadHentaiAnimes(), loadHentaiMangas()])
      .then(([a,m])=>{ setAnimes(a); setMangas(m); setLoading(false); })
      .catch(()=>setLoading(false));
  }, []);

  const list = subTab === "anime" ? animes : mangas;
  const setList = subTab === "anime" ? setAnimes : setMangas;

  const filtered = list
    .filter(i => {
      const gl = (i.genres||[]).join(" ").toLowerCase();
      const q  = search.toLowerCase();
      return (!q || i.title.toLowerCase().includes(q) || gl.includes(q) || (i.auteur||"").toLowerCase().includes(q))
          && (!genreF || (i.genres||[]).includes(genreF));
    })
    .sort((a,b) => a.title.localeCompare(b.title,"fr",{sensitivity:"base"}));

  async function handleDelete(item) {
    if (!confirm(`Supprimer "${item.title}" ?`)) return;
    if (subTab==="anime") await deleteHentaiAnime(item._id);
    else                  await deleteHentaiManga(item._id);
    setList(p => p.filter(x => x._id !== item._id));
    showToast(`🗑 "${item.title}" supprimé`, "err");
  }

  function handleSaved(item, isEdit) {
    const targetList = item.section==="anime" ? setAnimes : setMangas;
    if (isEdit) targetList(p => p.map(x => x._id===item._id ? item : x));
    else        targetList(p => [item, ...p]);
    showToast(isEdit ? "✓ Modifié !" : "✓ Ajouté !");
  }

  const selCls = "appearance-none bg-noir-3 border border-gris text-creme-dim font-body text-[.85rem] px-4 py-3 pr-10 cursor-pointer outline-none transition-colors duration-200 focus:border-rouge";

  return (
    <>
      {/* Sous-onglets Anime / Manga — sticky sous les onglets principaux */}
      <div className="sticky z-39 flex border-b border-gris w-full"
           style={{top:129,background:"var(--noir-2)"}}>
        {[
          { id:"anime", label:"🎬 Anime Hentai",     count: animes.length },
          { id:"manga", label:"📖 Manga / Doujin",   count: mangas.length },
        ].map(s=>(
          <button key={s.id} onClick={()=>setSubTab(s.id)}
                  className={`flex items-center gap-2.5 px-6 py-3.5 border-none font-heading font-semibold text-[.76rem] tracking-[.05em] uppercase cursor-pointer relative whitespace-nowrap transition-colors duration-200 bg-transparent ${subTab===s.id?"text-creme":"text-creme-dim hover:text-creme"}`}>
            {s.label}
            <span className="font-body normal-case text-[.62rem] text-creme-dim/50">({s.count})</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform duration-300 origin-center"
                  style={{background:"linear-gradient(90deg,var(--rouge),var(--or-dk))",transform:subTab===s.id?"scaleX(1)":"scaleX(0)"}} />
          </button>
        ))}
      </div>

      {/* Barre de recherche + filtres */}
      <div className="sticky z-[49] flex items-center gap-4 px-[12%] py-3 flex-wrap w-full border-b border-gris"
           style={{top:178,background:"var(--noir-2)"}}>
        <div className="flex items-center flex-1 min-w-[240px] bg-noir-2 border border-gris px-4 transition-colors duration-300 focus-within:border-rouge/50">
          <span className="text-gris-lt mr-2.5">🔍</span>
          <input className="flex-1 bg-transparent border-none outline-none text-creme font-body text-[.92rem] py-3.5 placeholder:text-gris-lt"
                 placeholder="Titre, tag, auteur…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className={selCls} value={genreF} onChange={e=>setGenreF(e.target.value)}>
            <option value="">Tous les tags</option>
            {GENRES_HENTAI.map(g=><option key={g}>{g}</option>)}
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
        </div>
        <span className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim whitespace-nowrap">
          <span className="text-rouge">{filtered.length}</span> résultats
        </span>
        {isOwner && (
          <button onClick={()=>setDeleteMode(!deleteMode)}
                  className={`flex items-center gap-2 px-5 py-2.5 border font-heading text-[.72rem] tracking-[.15em] uppercase cursor-pointer transition-all duration-300 ${deleteMode?"border-rouge text-[#FF6B7A] bg-rouge/15":"border-gris text-creme-dim hover:border-rouge bg-transparent"}`}>
            🗑 {deleteMode?"Terminer":"Supprimer"}
          </button>
        )}
      </div>

      {/* Grille */}
      <main className="px-[12%] pt-8 pb-24 w-full">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-5">
              <div className="loader-orb" />
              <p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p>
            </div>
          </div>
        ) : filtered.length===0 ? (
          <p className="text-center py-16 font-heading text-[.9rem] tracking-[.15em] text-creme-dim">Aucun résultat.</p>
        ) : (
          <div className="grid gap-[20px]" style={{gridTemplateColumns:"repeat(7,1fr)"}}>
            {filtered.map((item,i)=>(
              <HentaiCard key={item._id||i} item={item} isOwner={isOwner}
                          deleteMode={deleteMode} onDelete={handleDelete}
                          onClick={x => x.section === "anime" ? navigate('/hentai/anime/' + x._id) : setDetail(x)} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      {isOwner && (
        <button onClick={()=>setEditItem(null)}
                className="fixed bottom-10 right-10 z-[90] flex items-center gap-2.5 h-[52px] px-6 text-creme font-heading text-[.78rem] tracking-[.18em] uppercase cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
                style={{background:"var(--rouge)",border:"1px solid var(--rouge-dk)",boxShadow:"0 8px 30px rgba(192,21,42,.5)"}}>
          <span className="text-[1.5rem] font-light leading-none">+</span> Ajouter
        </button>
      )}

      {/* Modales */}
      {detail && (
        <HentaiDetailModal item={detail} isOwner={isOwner} onClose={()=>setDetail(null)}
                           onEdit={()=>{setEditItem(detail);setDetail(null);}} />
      )}
      {editItem!==undefined && (
        <AddHentaiModal editItem={editItem} defaultSection={subTab}
                        onClose={()=>setEditItem(undefined)} onSaved={handleSaved} />
      )}

      {toast.msg && (
        <div className={`toast show ${toast.type==="err"?"toast-err":""}`}>{toast.msg}</div>
      )}
    </>
  );
}
