import { useState } from "react";
import {
  GENRES_HENTAI, STATUTS_HENTAI, TYPES_HENTAI_MANGA,
  LANGUES, SITES_HENTAI_ANIME, SITES_HENTAI_MANGA,
} from "../../constants";
import { saveHentaiAnime, updateHentaiAnime, saveHentaiManga, updateHentaiManga } from "../../firebase";

const H_ICONS = ["🔞","🌸","💋","🎌","🌙","🔥","💜","✨","🎭","🌹"];
function rIcon() { return H_ICONS[Math.floor(Math.random()*H_ICONS.length)]; }

export default function AddHentaiModal({ editItem, defaultSection, onClose, onSaved }) {
  const [section, setSection] = useState(editItem?.section || defaultSection || "anime");
  const editing = !!editItem;
  const isAnime = section === "anime";

  const [title,     setTitle]     = useState(editItem?.title    || "");
  const [selectedG, setSelectedG] = useState(editItem?.genres   || []);
  const [status,    setStatus]    = useState(editItem?.status   || "");
  const [censured,  setCensured]  = useState(editItem?.censured ?? false);
  const [synopsis,  setSynopsis]  = useState(editItem?.synopsis || "");

  const [episodes,  setEpisodes]  = useState(editItem?.episodes || "");
  const [lang,      setLang]      = useState(editItem?.lang     || "");
  const [img1]                    = useState(editItem?.img1     || "");
  const initAnimeSites = editItem?.section==="anime" ? (editItem?.sites||[]) : [];
  const [selAnSites,  setSelAnSites]  = useState(initAnimeSites.map(s=>s.name));
  const [anSiteLinks, setAnSiteLinks] = useState(Object.fromEntries(initAnimeSites.map(s=>[s.name,s.url||""])));

  const [type,      setType]      = useState(editItem?.type     || "Doujin");
  const [chapitres, setChapitres] = useState(editItem?.chapitres|| "");
  const [auteur,    setAuteur]    = useState(editItem?.auteur   || "");
  const [artiste,   setArtiste]   = useState(editItem?.artiste  || "");
  const [annee,     setAnnee]     = useState(editItem?.annee    || "");
  const [img]                     = useState(editItem?.img      || "");
  const initMangaSites = editItem?.section==="manga" ? (editItem?.sites||[]) : [];
  const [selMgSites,  setSelMgSites]  = useState(initMangaSites.map(s=>s.name));
  const [mgSiteLinks, setMgSiteLinks] = useState(Object.fromEntries(initMangaSites.map(s=>[s.name,s.url||""])));

  const [errs,    setErrs]    = useState({});
  const [loading, setLoading] = useState(false);

  function toggleG(g)  { setSelectedG(p=>p.includes(g)?p.filter(x=>x!==g):[...p,g]); }
  function toggleAS(n) { setSelAnSites(p=>p.includes(n)?p.filter(x=>x!==n):[...p,n]); }
  function toggleMS(n) { setSelMgSites(p=>p.includes(n)?p.filter(x=>x!==n):[...p,n]); }

  async function handleSubmit() {
    const e={};
    if(!title.trim()) e.title="Titre requis";
    if(selectedG.length===0) e.genres="Genre requis";
    if(!status) e.status="Statut requis";
    if(isAnime && (!episodes||+episodes<1)) e.episodes="Épisodes requis";
    if(!isAnime && (!chapitres||+chapitres<1)) e.chapitres="Chapitres requis";
    setErrs(e);
    if(Object.keys(e).length) return;

    setLoading(true);
    try {
      if(isAnime) {
        const sites = selAnSites.map(n=>({name:n,url:anSiteLinks[n]||null}));
        const data = { section:"anime", title:title.trim(), genres:selectedG, status,
          episodes:+episodes, lang:lang||null, censured, synopsis:synopsis.trim()||null,
          img1:img1||null, sites };
        if(editing) { await updateHentaiAnime(editItem._id,data); onSaved({...editItem,...data},true); }
        else        { data.icon=rIcon(); const id=await saveHentaiAnime(data); onSaved({...data,_id:id},false); }
      } else {
        const sites = selMgSites.map(n=>({name:n,url:mgSiteLinks[n]||null}));
        const data = { section:"manga", type, title:title.trim(), genres:selectedG, status,
          chapitres:+chapitres, auteur:auteur.trim()||null, artiste:artiste.trim()||null,
          annee:annee?+annee:null, censured, synopsis:synopsis.trim()||null,
          img:img||null, sites };
        if(editing) { await updateHentaiManga(editItem._id,data); onSaved({...editItem,...data},true); }
        else        { data.icon=rIcon(); const id=await saveHentaiManga(data); onSaved({...data,_id:id},false); }
      }
      onClose();
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  }

  const inp = "w-full bg-noir border-b border-gris text-creme font-body text-[.88rem] px-0 py-2.5 outline-none transition-all duration-200 focus:border-rouge/60 placeholder:text-white/20";
  const lbl = "font-heading text-[.58rem] tracking-[.25em] uppercase mb-1 block";
  const sel = `${inp} appearance-none cursor-pointer`;

  const selSites  = isAnime ? selAnSites  : selMgSites;
  const siteLinks = isAnime ? anSiteLinks : mgSiteLinks;
  const toggleSite = isAnime ? toggleAS : toggleMS;
  const setSiteLink = (n, v) => isAnime
    ? setAnSiteLinks(p=>({...p,[n]:v}))
    : setMgSiteLinks(p=>({...p,[n]:v}));

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
         style={{paddingTop:88,background:"rgba(0,0,0,.85)",backdropFilter:"blur(8px)"}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="w-full max-w-[520px] mb-10 bg-noir-2"
           style={{animation:"fade-up .25s cubic-bezier(.4,0,.2,1) forwards",border:"1px solid rgba(255,255,255,.07)"}}>

        {/* Accent rouge */}
        <div style={{height:2,background:"linear-gradient(90deg,var(--rouge),#ff6090)"}} />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5" style={{borderBottom:"1px solid rgba(255,255,255,.05)"}}>
          <div>
            <p className="font-heading text-[.58rem] tracking-[.3em] uppercase mb-0.5" style={{color:"rgba(255,255,255,.25)"}}>
              {editing ? "Modifier" : "Nouveau"} · Hentai
            </p>
            <h2 className="font-display text-[1rem] text-creme leading-none">
              {editing ? "Modifier le " : "Ajouter un "}<span style={{color:"var(--rouge)"}}>hentai</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors text-[.8rem] bg-transparent border-none cursor-pointer">✕</button>
        </div>

        {/* Toggle Anime / Manga */}
        {!editing && (
          <div className="flex" style={{borderBottom:"1px solid rgba(255,255,255,.05)"}}>
            {[{id:"anime",label:"🎬 Anime"},{id:"manga",label:"📖 Manga / Doujin"}].map(s=>(
              <button key={s.id} onClick={()=>{setSection(s.id);setErrs({});}}
                      className="flex-1 py-3 font-heading text-[.65rem] tracking-[.15em] uppercase relative cursor-pointer border-none transition-all duration-200"
                      style={{
                        background: section===s.id ? "rgba(192,21,42,.08)" : "transparent",
                        color: section===s.id ? "var(--creme)" : "rgba(255,255,255,.25)"
                      }}>
                {s.label}
                {section===s.id && <span className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{background:"var(--rouge)"}} />}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="px-8 py-7 flex flex-col gap-6">

          <div>
            <label className={lbl} style={{color: errs.title ? "var(--rouge)" : "rgba(255,255,255,.35)"}}>Titre</label>
            <input className={`${inp} ${errs.title?"border-rouge":""}`}
                   value={title} onChange={e=>setTitle(e.target.value)} placeholder="ex : Overflow" />
          </div>

          {!isAnime && (
            <div>
              <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Type</label>
              <div className="relative">
                <select className={sel} value={type} onChange={e=>setType(e.target.value)}>
                  {TYPES_HENTAI_MANGA.map(t=><option key={t}>{t}</option>)}
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-[.55rem]">▼</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={lbl} style={{color: errs.status ? "var(--rouge)" : "rgba(255,255,255,.35)"}}>Statut</label>
              <div className="relative">
                <select className={`${sel} ${errs.status?"border-rouge":""}`} value={status} onChange={e=>setStatus(e.target.value)}>
                  <option value="">—</option>
                  {STATUTS_HENTAI.map(s=><option key={s}>{s}</option>)}
                </select>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-[.55rem]">▼</span>
              </div>
            </div>
            <div>
              <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Censure</label>
              <button type="button" onClick={()=>setCensured(!censured)}
                      className="w-full flex items-center justify-between py-2.5 border-b cursor-pointer bg-transparent transition-all duration-200"
                      style={{borderColor: censured ? "rgba(192,21,42,.5)" : "rgba(255,255,255,.12)", color: censured ? "var(--rouge)" : "rgba(255,255,255,.25)"}}>
                <span className="font-heading text-[.7rem] tracking-[.08em]">{censured ? "🔒 Censuré" : "Non censuré"}</span>
                <span className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200"
                      style={{background: censured ? "var(--rouge)" : "transparent", border: `1px solid ${censured ? "var(--rouge)" : "rgba(255,255,255,.2)"}`}} />
              </button>
            </div>
          </div>

          {isAnime ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={lbl} style={{color: errs.episodes ? "var(--rouge)" : "rgba(255,255,255,.35)"}}>Épisodes</label>
                <input type="number" className={`${inp} ${errs.episodes?"border-rouge":""}`}
                       value={episodes} onChange={e=>setEpisodes(e.target.value)} placeholder="2" min={1} />
              </div>
              <div>
                <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Langue</label>
                <div className="relative">
                  <select className={sel} value={lang} onChange={e=>setLang(e.target.value)}>
                    <option value="">—</option>
                    {LANGUES.map(l=><option key={l}>{l}</option>)}
                  </select>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-[.55rem]">▼</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={lbl} style={{color: errs.chapitres ? "var(--rouge)" : "rgba(255,255,255,.35)"}}>Chapitres</label>
                <input type="number" className={`${inp} ${errs.chapitres?"border-rouge":""}`}
                       value={chapitres} onChange={e=>setChapitres(e.target.value)} placeholder="8" min={1} />
              </div>
              <div>
                <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Année</label>
                <input type="number" className={inp} value={annee} onChange={e=>setAnnee(e.target.value)} placeholder="2022" />
              </div>
            </div>
          )}

          {!isAnime && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Auteur</label>
                <input className={inp} value={auteur} onChange={e=>setAuteur(e.target.value)} placeholder="ex : Ishikei" />
              </div>
              <div>
                <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Artiste</label>
                <input className={inp} value={artiste} onChange={e=>setArtiste(e.target.value)} placeholder="ex : Nise Nanashi" />
              </div>
            </div>
          )}

          <div>
            <label className={lbl} style={{color: errs.genres ? "var(--rouge)" : "rgba(255,255,255,.35)"}}>Tags</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {GENRES_HENTAI.map(g=>(
                <button key={g} type="button" onClick={()=>toggleG(g)}
                        className="font-heading text-[.62rem] tracking-[.08em] px-2.5 py-1 cursor-pointer transition-all duration-150 border-none"
                        style={selectedG.includes(g)
                          ? {background:"rgba(192,21,42,.2)",outline:"1px solid rgba(192,21,42,.5)",color:"var(--creme)"}
                          : {background:"rgba(255,255,255,.04)",outline:"1px solid rgba(255,255,255,.06)",color:"rgba(255,255,255,.3)"}}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>Synopsis</label>
            <textarea className={`${inp} resize-y min-h-[72px]`} value={synopsis}
                      onChange={e=>setSynopsis(e.target.value)} placeholder="Courte description…" />
          </div>

          <div style={{borderTop:"1px solid rgba(255,255,255,.05)",paddingTop:20}}>
            <label className={lbl} style={{color:"rgba(255,255,255,.35)"}}>
              {isAnime ? "Sites de visionnage" : "Sites de lecture"}
            </label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(isAnime ? SITES_HENTAI_ANIME : SITES_HENTAI_MANGA).map(s=>(
                <button key={s.name} type="button" onClick={()=>toggleSite(s.name)}
                        className="flex items-center gap-1.5 font-heading text-[.62rem] tracking-[.08em] px-2.5 py-1 cursor-pointer transition-all duration-150 border-none"
                        style={selSites.includes(s.name)
                          ? {background:"rgba(192,21,42,.15)",outline:"1px solid rgba(192,21,42,.4)",color:"#FF8090"}
                          : {background:"rgba(255,255,255,.04)",outline:"1px solid rgba(255,255,255,.06)",color:"rgba(255,255,255,.3)"}}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
            {selSites.length > 0 && (
              <div className="flex flex-col gap-4 mt-5">
                {selSites.map(n=>(
                  <div key={n} style={{animation:"fade-up .15s ease both"}}>
                    <label className={lbl} style={{color:"rgba(255,255,255,.25)"}}>Lien {n}</label>
                    <input className={inp} type="url" value={siteLinks[n]||""}
                           onChange={e=>setSiteLink(n,e.target.value)} placeholder="https://…" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-4" style={{borderTop:"1px solid rgba(255,255,255,.05)"}}>
          <button onClick={onClose} className="btn-ghost" style={{padding:"8px 18px",fontSize:".75rem"}}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary"
                  style={{padding:"8px 20px",fontSize:".75rem",background:"var(--rouge)",borderColor:"var(--rouge)"}}>
            {loading ? "…" : editing ? "✓ Enregistrer" : "🔞 Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
