import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getManhwaById, updateManhwa, loadReadChapters, saveReadChapters } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useManhwaMedia  from "../hooks/useManhwaMedia";
import useManhwaPoster from "../hooks/useManhwaPoster";
import { GENRES_MANHWA, STATUTS_MANHWA, TYPES_MANHWA, SITES_LECTURE } from "../constants";

const STATUS_COLOR = {
  "En cours":  { bg:"rgba(46,204,113,.15)", border:"rgba(46,204,113,.4)",  text:"#2ecc71" },
  "Terminé":   { bg:"rgba(201,168,76,.12)", border:"rgba(201,168,76,.4)",  text:"var(--or)" },
  "Abandonné": { bg:"rgba(232,0,28,.12)",   border:"rgba(232,0,28,.35)",   text:"var(--rouge)" },
  "En pause":  { bg:"rgba(150,150,150,.12)",border:"rgba(150,150,150,.3)", text:"rgba(255,255,255,.5)" },
};

/* ── Logo site ── */
function SiteLogo({ site }) {
  const info = SITES_LECTURE.find(s => s.name === site.name);
  const [imgErr, setImgErr] = useState(false);
  if (info?.logo && !imgErr) {
    const isLocal = info.logo.startsWith("/");
    return <img src={info.logo} alt={site.name}
                className={`flex-shrink-0 ${isLocal ? "w-7 h-7 object-cover" : "w-5 h-5 object-contain"}`}
                style={isLocal ? { borderRadius:6 } : {}}
                onError={() => setImgErr(true)} />;
  }
  return <span style={{ fontSize: "1rem" }}>{info?.icon || "📖"}</span>;
}

/* ── Date picker inline ── */
function DateInput({ value, onChange, cls }) {
  function fromIso(iso) { if (!iso) return ""; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }
  return (
    <div className="flex items-center gap-1.5">
      <input value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder="jj/mm/aaaa" />
      <label className="cursor-pointer flex-shrink-0 text-white/25 hover:text-or transition-colors relative"
             style={{ fontSize:".9rem", lineHeight:1 }}>
        📅
        <input type="date" className="absolute w-0 h-0 opacity-0"
               onChange={e => { if(e.target.value) onChange(fromIso(e.target.value)); }} />
      </label>
    </div>
  );
}

/* ── Date par chapitre ── */
function ChapDateInput({ value, onChange, isOwner }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  function fromIso(iso) { if (!iso) return ""; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }
  function commit() { setEditing(false); onChange(draft); }

  if (editing) return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
             onBlur={commit}
             onKeyDown={e => { if (e.key==="Enter") commit(); if (e.key==="Escape") { setDraft(value); setEditing(false); } }}
             placeholder="jj/mm/aaaa"
             className="bg-transparent border-b border-or/40 outline-none text-or font-body text-[.72rem] w-24" />
      <label className="relative cursor-pointer text-white/25 hover:text-or transition-colors" style={{ fontSize:".8rem", lineHeight:1 }}>
        📅
        <input type="date" className="absolute w-0 h-0 opacity-0"
               onChange={e => { if (e.target.value) { setDraft(fromIso(e.target.value)); } }} />
      </label>
    </div>
  );

  if (value) return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <span className="font-body text-[.72rem]" style={{ color:"rgba(255,255,255,.35)" }}>{value}</span>
      {isOwner && (
        <button onClick={() => { setDraft(value); setEditing(true); }}
                className="bg-transparent border-none cursor-pointer text-white/15 hover:text-or/60 transition-colors"
                style={{ fontSize:".6rem", padding:0 }}>✏</button>
      )}
    </div>
  );

  if (!isOwner) return null;
  return (
    <button onClick={e => { e.stopPropagation(); setDraft(""); setEditing(true); }}
            className="bg-transparent border-none cursor-pointer text-white/10 hover:text-white/30 transition-colors font-body text-[.68rem]">
      + date
    </button>
  );
}

export default function ManhwaDetail() {
  const { id }             = useParams();
  const navigate           = useNavigate();
  const { user, isOwner }  = useAuth();

  const [manhwa,    setManhwa]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("chapitres");
  const [read,             setRead]             = useState({});
  const [editMode,         setEditMode]         = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [chapterTitles,    setChapterTitles]    = useState({});
  const [chapterNumbers,   setChapterNumbers]   = useState({});
  const [chapterDates,     setChapterDates]     = useState({});
  const [editingChapTitle, setEditingChapTitle] = useState(null);
  const [chapTitleDraft,   setChapTitleDraft]   = useState("");
  const [editingChapNum,   setEditingChapNum]   = useState(null);
  const [chapNumDraft,     setChapNumDraft]     = useState("");

  // Champs éditables
  const [eTitle,     setETitle]     = useState("");
  const [eType,      setEType]      = useState("");
  const [eStatus,    setEStatus]    = useState("");
  const [eChapitres, setEChapitres] = useState("");
  const [eDernier,   setEDernier]   = useState("");
  const [eSynopsis,  setESynopsis]  = useState("");
  const [eGenres,    setEGenres]    = useState([]);
  const [eSiteLinks, setESiteLinks] = useState({});
  const [eSelSites,  setESelSites]  = useState([]);

  const { banner, chapters: mdxChapters } = useManhwaMedia(manhwa?.title, manhwa?.img);
  const posterSrc = useManhwaPoster(manhwa?.title);


  useEffect(() => {
    getManhwaById(id).then(m => {
      setManhwa(m);
      setChapterTitles(m?.chapterTitles || {});
      setChapterNumbers(m?.chapterNumbers || {});
      setChapterDates(m?.chapterDates || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    loadReadChapters(user.uid, id).then(r => setRead(r || {}));
  }, [user, id]);

  function openEdit() {
    setETitle(manhwa.title || "");
    setEType(manhwa.type || "Manhwa");
    setEStatus(manhwa.status || "");
    setEChapitres(manhwa.chapitres || "");
    setEDernier(manhwa.derniereLecture || "");
    setESynopsis(manhwa.synopsis || "");
    setEGenres(manhwa.genres || (manhwa.genre ? [manhwa.genre] : []));
    const sites = manhwa.sites || [];
    setESelSites(sites.map(s => s.name));
    setESiteLinks(Object.fromEntries(sites.map(s => [s.name, s.url || ""])));
    setEditMode(true);
  }

  async function saveEdit() {
    setSaving(true);
    const sites = eSelSites.map(name => ({ name, url: eSiteLinks[name] || null }));
    const data = {
      title: eTitle.trim(), type: eType, status: eStatus,
      chapitres: +eChapitres || 0, derniereLecture: eDernier.trim() || null,
      synopsis: eSynopsis.trim() || null,
      genres: eGenres, genre: eGenres[0] || "",
      img: manhwa.img || null, sites,
    };
    try {
      await updateManhwa(id, data);
      setManhwa(prev => ({ ...prev, ...data }));
      setEditMode(false);
    } catch(err) { alert("Erreur : " + err.message); }
    finally { setSaving(false); }
  }

  async function toggleRead(idx) {
    const updated = { ...read, [idx]: !read[idx] };
    setRead(updated);
    if (user) saveReadChapters(user.uid, id, updated).catch(() => {});
  }

  async function saveChapTitle(chapNum) {
    const updated = { ...chapterTitles };
    const trimmed = chapTitleDraft.trim();
    if (trimmed) updated[chapNum] = trimmed;
    else delete updated[chapNum];
    setChapterTitles(updated);
    setEditingChapTitle(null);
    await updateManhwa(id, { chapterTitles: updated }).catch(() => {});
  }

  async function saveChapNum(idx) {
    const updated = { ...chapterNumbers };
    const trimmed = chapNumDraft.trim();
    if (trimmed) updated[idx] = trimmed;
    else delete updated[idx];
    setChapterNumbers(updated);
    setEditingChapNum(null);
    await updateManhwa(id, { chapterNumbers: updated }).catch(() => {});
  }

  async function saveChapDate(idx, dateStr) {
    const updated = { ...chapterDates };
    const trimmed = dateStr.trim();
    if (trimmed) updated[idx] = trimmed;
    else delete updated[idx];
    setChapterDates(updated);
    await updateManhwa(id, { chapterDates: updated }).catch(() => {});
  }

  async function markAllRead(value) {
    const total = manhwa?.chapitres || 0;
    const updated = {};
    for (let i = 0; i < total; i++) updated[i] = value;
    setRead(updated);
    if (user) saveReadChapters(user.uid, id, updated).catch(() => {});
  }

  if (loading) return (
    <div className="min-h-screen bg-noir flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="loader-orb" />
        <p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p>
      </div>
    </div>
  );

  if (!manhwa) return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center gap-4">
      <p className="font-heading text-[1rem] tracking-[.2em] text-creme-dim uppercase">Manhwa introuvable.</p>
      <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding:"10px 24px" }}>← Retour</button>
    </div>
  );

  const genres   = manhwa.genres?.length ? manhwa.genres : (manhwa.genre ? [manhwa.genre] : []);
  const sites    = (manhwa.sites || []).filter(s => s.url);
  const total    = manhwa.chapitres || 0;
  const readCount= Object.values(read).filter(Boolean).length;
  const pct      = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const allRead  = readCount === total && total > 0;
  const stColor  = STATUS_COLOR[manhwa.status] || STATUS_COLOR["En cours"];

  const inp = "bg-noir-3 border border-gris text-creme font-body text-[.88rem] px-3 py-2 outline-none focus:border-or transition-colors w-full";
  const lbl = "font-heading text-[.6rem] tracking-[.18em] uppercase text-white/30 mb-1.5 block";

  const TABS = [
    { id:"chapitres", label:"Chapitres" },
    { id:"infos",     label:"Résumé & Infos" },
    { id:"sites",     label:"Sites de lecture" },
  ];

  const pageBg = banner || posterSrc || null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background:"var(--noir)" }}>
      <Navbar embedded />


      {/* ══ HERO ══ */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio:"2549/637" }}>

        {/* Image de fond — uniquement si banner large disponible */}
        {banner ? (
          <div key={banner} className="absolute inset-0 bg-cover bg-center bg-no-repeat"
               style={{ backgroundImage:`url("${banner}")`, animation:"fadein .5s ease" }} />
        ) : (
          <div className="absolute inset-0" style={{ background:"linear-gradient(135deg,#0d0d12,#16161f 50%,#1a1a26)" }} />
        )}

        {/* Dégradé gauche → droite (toujours, pour lisibilité du texte) */}
        <div className="absolute inset-0"
             style={{ background:"linear-gradient(to right, rgba(13,13,18,.98) 0%, rgba(13,13,18,.92) 35%, rgba(13,13,18,.65) 55%, rgba(13,13,18,.15) 75%, rgba(13,13,18,0) 100%)" }} />

        {/* Fondu bas */}
        <div className="absolute inset-x-0 bottom-0 h-40"
             style={{ background:"linear-gradient(to bottom, rgba(13,13,18,0) 0%, rgba(13,13,18,1) 100%)" }} />

        {/* Contenu */}
        <div className="absolute inset-0 z-10 flex gap-7 items-end px-[8%] pb-10 pt-20"
             style={{ maxWidth:"min(80%, 1100px)" }}>

          {/* Cover portrait */}
          <div className="flex-shrink-0 hidden sm:block" style={{ width:150, borderRadius:3, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.9)", marginBottom:2 }}>
            {posterSrc
              ? <img src={posterSrc} alt={manhwa.title} className="w-full h-full object-cover block" style={{ aspectRatio:"2/3" }} />
              : <div className="w-full flex items-center justify-center text-[3rem]" style={{ aspectRatio:"2/3", background:"linear-gradient(135deg,#1A1A25,#2A2A38)" }}>{manhwa.icon||"📖"}</div>}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate(-1)}
                    className="btn-primary absolute flex items-center gap-2"
                    style={{ padding:"10px 20px", fontSize:".72rem", top:16, left:"8%" }}>
              ← Retour
            </button>

            <p className="font-heading text-[.65rem] tracking-[.35em] uppercase mb-3" style={{ color:"var(--or)" }}>
              {genres.join("  ·  ")}
            </p>

            <h1 className="font-display font-black text-creme leading-[1.08] break-words mb-3"
                style={{ fontSize:"clamp(1.6rem,3.5vw,2.8rem)", textShadow:"0 2px 30px rgba(0,0,0,.95)" }}>
              {manhwa.title}
            </h1>

            <div className="flex items-center gap-2.5 flex-wrap mb-5 font-body text-[.82rem] text-creme-dim">
              {manhwa.type && (
                <span className="font-heading text-[.65rem] tracking-[.1em] uppercase px-2 py-0.5"
                      style={{ background:"rgba(201,168,76,.15)", border:"1px solid rgba(201,168,76,.35)", color:"var(--or)" }}>
                  {manhwa.type}
                </span>
              )}
              <span className="font-heading text-[.65rem] tracking-[.1em] uppercase px-2 py-0.5"
                    style={{ background:stColor.bg, border:`1px solid ${stColor.border}`, color:stColor.text }}>
                {manhwa.status}
              </span>
              <span className="opacity-40">•</span>
              <span>{total} chapitre{total > 1 ? "s" : ""}</span>
              {manhwa.derniereLecture && <><span className="opacity-40">•</span><span>Lu le {manhwa.derniereLecture}</span></>}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {sites.length === 1 && (
                <a href={sites[0].url} target="_blank" rel="noopener noreferrer"
                   className="btn-primary flex items-center gap-2" style={{ padding:"13px 28px", fontSize:".8rem", letterSpacing:".12em" }}>
                  <SiteLogo site={sites[0]} /> Lire sur {sites[0].name}
                </a>
              )}
              {sites.length > 1 && sites.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 font-heading text-[.7rem] tracking-[.08em] uppercase px-4 py-2.5 border border-or-dk text-or no-underline transition-all duration-300 hover:bg-or/10"
                   style={{ borderRadius:2 }}>
                  <SiteLogo site={s} /> {s.name}
                </a>
              ))}
              {isOwner && !editMode && (
                <button onClick={openEdit} className="btn-ghost inline-flex items-center gap-2" style={{ padding:"13px 24px" }}>
                  ✏ Modifier
                </button>
              )}
              {isOwner && editMode && (
                <>
                  <button onClick={saveEdit} disabled={saving} className="btn-primary" style={{ padding:"13px 24px", fontSize:".8rem" }}>
                    {saving ? "…" : "✓ Sauvegarder"}
                  </button>
                  <button onClick={() => setEditMode(false)} className="btn-ghost" style={{ padding:"13px 24px", fontSize:".8rem" }}>
                    ✕ Annuler
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ ONGLETS ══ */}
      <div className="sticky top-0 z-[50] border-b border-gris" style={{ background:"var(--noir-2)" }}>
        <div className="flex items-center px-[8%]">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className="relative px-6 py-4 font-heading font-semibold text-[.8rem] tracking-[.04em] bg-transparent border-none cursor-pointer transition-colors duration-200 whitespace-nowrap"
                    style={{ color: activeTab===t.id ? "var(--creme)" : "rgba(255,255,255,.38)" }}>
              {t.label}
              {activeTab===t.id && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background:"var(--rouge)" }} />}
            </button>
          ))}

          {/* ── Contrôles + / − chapitres (owner, toujours visibles) ── */}
          {isOwner && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-heading text-[.62rem] tracking-[.1em] uppercase text-white/25">chap.</span>
              <button onClick={async () => { const n = total - 1; if (n < 0) return; setManhwa(p => ({ ...p, chapitres: n })); await updateManhwa(id, { chapitres: n }).catch(() => {}); }}
                      className="w-6 h-6 flex items-center justify-center border border-white/15 text-white/40 hover:border-rouge hover:text-rouge bg-transparent cursor-pointer transition-all duration-150 font-bold text-[.85rem]"
                      style={{ borderRadius:3 }} disabled={total <= 0}>−</button>
              <span className="font-heading text-[.82rem] text-creme min-w-[2ch] text-center">{total}</span>
              <button onClick={async () => { const n = total + 1; setManhwa(p => ({ ...p, chapitres: n })); await updateManhwa(id, { chapitres: n }).catch(() => {}); }}
                      className="w-6 h-6 flex items-center justify-center border border-white/15 text-white/40 hover:border-or hover:text-or bg-transparent cursor-pointer transition-all duration-150 font-bold text-[.85rem]"
                      style={{ borderRadius:3 }}>+</button>
            </div>
          )}
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <main className="relative z-10 flex-1 px-[8%] py-8 pb-24"
            style={{ background: "linear-gradient(to bottom, #0a0a10 0%, #16161f 30%, #1a1a26 60%, #0d0d14 100%)" }}>

        {/* ── Chapitres ── */}
        {activeTab === "chapitres" && (
          <div>

            {total > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-1.5 bg-gris overflow-hidden" style={{ borderRadius:4 }}>
                  <div className="h-full transition-all duration-500"
                       style={{ width:`${pct}%`, background:"linear-gradient(90deg,var(--rouge),var(--or))", borderRadius:4 }} />
                </div>
                <span className="font-heading text-[.7rem] tracking-[.08em] flex-shrink-0"
                      style={{ color: pct===100 ? "var(--or)" : "rgba(255,255,255,.3)" }}>
                  {readCount}/{total} · {pct}%
                </span>
                {user && (
                  <button onClick={() => markAllRead(!allRead)}
                          className="font-heading text-[.65rem] tracking-[.1em] uppercase border px-3 py-1 cursor-pointer transition-all duration-200 bg-transparent flex-shrink-0 whitespace-nowrap"
                          style={{ borderColor:allRead?"rgba(46,204,113,.5)":"rgba(255,255,255,.15)", color:allRead?"#2ecc71":"rgba(255,255,255,.3)", borderRadius:2 }}>
                    {allRead ? "↺ Tout réinitialiser" : "✓ Tout lu"}
                  </button>
                )}
              </div>
            )}
            {total === 0
              ? <p className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim py-10 text-center">Aucun chapitre enregistré.</p>
              : <div className="flex flex-col gap-1">
                  {Array.from({ length: total }, (_, i) => {
                    const chapNum = total - i;
                    const idx     = chapNum - 1;
                    const isRead  = !!read[idx];
                    const mdxCh   = mdxChapters.find(c => Math.round(c.num)===chapNum || c.num===chapNum);
                    const thumb   = mdxCh?.thumb || null;
                    return (
                      <div key={chapNum} className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/[.035] transition-colors duration-150 cursor-default"
                           style={{ borderBottom:"1px solid rgba(255,255,255,.04)" }}>

                        {/* Checkbox lu */}
                        {user && (
                          <button onClick={() => toggleRead(idx)}
                                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center border cursor-pointer transition-all duration-150 bg-transparent"
                                  style={{ borderRadius:4, borderColor:isRead?"#2ecc71":"rgba(255,255,255,.2)", background:isRead?"#2ecc71":"transparent" }}>
                            {isRead && <span className="text-white text-[.6rem] font-bold leading-none">✓</span>}
                          </button>
                        )}

                        {/* Thumbnail */}
                        <div className="flex-shrink-0 overflow-hidden relative"
                             style={{ width:112, height:72, borderRadius:6, background:"rgba(255,255,255,.05)" }}>
                          <img src={thumb || posterSrc || ""} alt={`Ch.${chapNum}`}
                               className="w-full h-full object-cover block"
                               style={{ filter: isRead ? "brightness(.4) saturate(.2)" : "none" }}
                               onError={e => { e.target.style.display="none"; e.target.nextElementSibling.style.display="flex"; }} />
                          <div className="w-full h-full items-center justify-center hidden absolute inset-0">
                            <span className="font-display font-black text-white/15 text-[1rem]">{String(chapNum).padStart(2,"0")}</span>
                          </div>
                          {isRead && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white/80 text-[1rem] font-bold">✓</span>
                            </div>
                          )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          {/* Titre numéro */}
                          <div className="flex items-center gap-2">
                            {editingChapNum === idx ? (
                              <input autoFocus value={chapNumDraft}
                                     onChange={e => setChapNumDraft(e.target.value)}
                                     onBlur={() => saveChapNum(idx)}
                                     onKeyDown={e => { if (e.key==="Enter") saveChapNum(idx); if (e.key==="Escape") setEditingChapNum(null); }}
                                     placeholder={String(chapNum)}
                                     className="bg-transparent border-b border-or/40 outline-none text-or font-heading text-[.95rem] w-20"
                                     onClick={e => e.stopPropagation()} />
                            ) : (
                              <p className="font-heading font-semibold text-[.95rem]"
                                 style={{ color: isRead ? "rgba(46,204,113,.6)" : "var(--creme)" }}>
                                Chapitre {chapterNumbers[idx] ?? chapNum}
                              </p>
                            )}
                            {isOwner && editingChapNum !== idx && (
                              <button onClick={e => { e.stopPropagation(); setEditingChapNum(idx); setChapNumDraft(String(chapterNumbers[idx] ?? chapNum)); }}
                                      className="flex-shrink-0 bg-transparent border-none cursor-pointer text-white/15 hover:text-or/60 transition-colors"
                                      style={{ fontSize:".6rem", padding:0 }}>✏</button>
                            )}
                          </div>

                          {/* Titre textuel */}
                          {editingChapTitle === chapNum ? (
                            <input autoFocus value={chapTitleDraft}
                                   onChange={e => setChapTitleDraft(e.target.value)}
                                   onBlur={() => saveChapTitle(chapNum)}
                                   onKeyDown={e => { if (e.key==="Enter") saveChapTitle(chapNum); if (e.key==="Escape") setEditingChapTitle(null); }}
                                   placeholder="Titre du chapitre…"
                                   className="mt-1 bg-transparent border-b border-or/40 outline-none text-or font-body text-[.82rem] w-full"
                                   onClick={e => e.stopPropagation()} />
                          ) : (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-body text-[.82rem] truncate"
                                    style={{ color: chapterTitles[chapNum] ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.15)" }}>
                                {chapterTitles[chapNum] || `— titre —`}
                              </span>
                              {isOwner && (
                                <button onClick={e => { e.stopPropagation(); setEditingChapTitle(chapNum); setChapTitleDraft(chapterTitles[chapNum] || ""); }}
                                        className="flex-shrink-0 bg-transparent border-none cursor-pointer text-white/12 hover:text-or/60 transition-colors"
                                        style={{ fontSize:".6rem", padding:0 }}>✏</button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Date + badge Lu */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <ChapDateInput
                            value={chapNum === total ? (chapterDates[idx] || manhwa.derniereLecture || "") : (chapterDates[idx] || "")}
                            onChange={dateStr => saveChapDate(idx, dateStr)}
                            isOwner={isOwner}
                          />
                          {isRead && (
                            <span className="font-heading text-[.6rem] tracking-[.1em] uppercase px-2 py-0.5"
                                  style={{ background:"rgba(46,204,113,.12)", color:"#2ecc71", border:"1px solid rgba(46,204,113,.25)", borderRadius:2 }}>
                              Lu
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* ── Résumé & Infos ── */}
        {activeTab === "infos" && (
          <div className="max-w-[720px] flex flex-col gap-8">
            {!editMode ? (
              <>
                {manhwa.synopsis && (
                  <div>
                    <h3 className={lbl} style={{ fontSize:".72rem" }}>Synopsis</h3>
                    <p className="font-body text-[.95rem] leading-relaxed text-creme-dim/80"
                       style={{ borderLeft:"2px solid var(--or-dk)", paddingLeft:16 }}>
                      {manhwa.synopsis}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className={lbl} style={{ fontSize:".72rem" }}>Informations</h3>
                  <div className="grid grid-cols-2 gap-x-8">
                    {[
                      { label:"Type",            value:manhwa.type },
                      { label:"Statut",          value:manhwa.status },
                      { label:"Chapitres",       value:manhwa.chapitres },
                      { label:"Dernière lecture",value:manhwa.derniereLecture },
                    ].filter(r => r.value).map(r => (
                      <div key={r.label} className="flex flex-col gap-1 py-3 border-b border-white/[.05]">
                        <span className={lbl}>{r.label}</span>
                        <span className="font-heading text-[.85rem] text-creme">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {genres.length > 0 && (
                  <div>
                    <h3 className={lbl} style={{ fontSize:".72rem" }}>Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {genres.map(g => (
                        <span key={g} className="font-heading text-[.7rem] tracking-[.08em] px-3 py-1.5"
                              style={{ background:"rgba(201,168,76,.1)", border:"1px solid rgba(201,168,76,.25)", color:"var(--or)", borderRadius:2 }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ── Mode édition ── */
              <div className="flex flex-col gap-6">
                <div style={{ borderLeft:"2px solid var(--rouge)", paddingLeft:16, marginBottom:4 }}>
                  <p className="font-heading text-[.7rem] tracking-[.15em] uppercase" style={{ color:"var(--rouge)" }}>Mode édition actif — modifiez directement les champs</p>
                </div>

                <div>
                  <label className={lbl}>Titre</label>
                  <input className={inp} value={eTitle} onChange={e => setETitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Type</label>
                    <div className="relative">
                      <select className={inp + " appearance-none cursor-pointer pr-8"} value={eType} onChange={e => setEType(e.target.value)}>
                        {TYPES_MANHWA.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Statut</label>
                    <div className="relative">
                      <select className={inp + " appearance-none cursor-pointer pr-8"} value={eStatus} onChange={e => setEStatus(e.target.value)}>
                        <option value="">—</option>
                        {STATUTS_MANHWA.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Chapitres lus</label>
                    <input type="number" min={0} className={inp} value={eChapitres} onChange={e => setEChapitres(e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Dernière lecture</label>
                    <DateInput value={eDernier} onChange={setEDernier} cls={inp} />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Synopsis</label>
                  <textarea className={inp + " resize-y min-h-[100px]"} value={eSynopsis} onChange={e => setESynopsis(e.target.value)} />
                </div>

                <div>
                  <label className={lbl}>Genres</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {GENRES_MANHWA.map(g => (
                      <button key={g} type="button"
                              onClick={() => setEGenres(p => p.includes(g) ? p.filter(x => x!==g) : [...p,g])}
                              className="font-heading text-[.7rem] tracking-[.06em] px-3 py-1.5 cursor-pointer border-none transition-all duration-150"
                              style={eGenres.includes(g)
                                ? { background:"rgba(192,21,42,.2)", outline:"1px solid rgba(192,21,42,.5)", color:"var(--creme)" }
                                : { background:"rgba(255,255,255,.04)", outline:"1px solid rgba(255,255,255,.07)", color:"rgba(255,255,255,.35)" }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={saveEdit} disabled={saving} className="btn-primary" style={{ padding:"10px 24px", fontSize:".82rem" }}>
                    {saving ? "…" : "✓ Sauvegarder"}
                  </button>
                  <button onClick={() => setEditMode(false)} className="btn-ghost" style={{ padding:"10px 24px", fontSize:".82rem" }}>
                    ✕ Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Sites de lecture ── */}
        {activeTab === "sites" && (
          <div className="max-w-[560px] flex flex-col gap-4">
            {!editMode ? (
              (manhwa.sites || []).length === 0
                ? <p className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim py-10 text-center">Aucun site enregistré.</p>
                : (manhwa.sites || []).map(s => (
                    <div key={s.name} className="flex items-center justify-between gap-4 p-4 border border-gris hover:border-or/30 transition-colors duration-200"
                         style={{ background:"var(--noir-2)", borderRadius:2 }}>
                      <div className="flex items-center gap-3">
                        <SiteLogo site={s} />
                        <span className="font-heading font-semibold text-[.88rem] tracking-[.04em] text-creme">{s.name}</span>
                      </div>
                      {s.url
                        ? <a href={s.url} target="_blank" rel="noopener noreferrer"
                             className="font-heading text-[.7rem] tracking-[.1em] uppercase px-4 py-2 border border-or-dk text-or no-underline transition-all duration-300 hover:bg-or/10"
                             style={{ borderRadius:2, flexShrink:0 }}>
                            Lire →
                          </a>
                        : <span className="font-heading text-[.65rem] text-white/20">Pas de lien</span>}
                    </div>
                  ))
            ) : (
              /* ── Édition sites ── */
              <div className="flex flex-col gap-6">
                <div style={{ borderLeft:"2px solid var(--rouge)", paddingLeft:16 }}>
                  <p className="font-heading text-[.7rem] tracking-[.15em] uppercase" style={{ color:"var(--rouge)" }}>Mode édition — Sites de lecture</p>
                </div>

                <div>
                  <label className={lbl}>Sites disponibles</label>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {SITES_LECTURE.map(s => {
                      const sel = eSelSites.includes(s.name);
                      return (
                        <button key={s.name} type="button"
                                onClick={() => setESelSites(p => p.includes(s.name) ? p.filter(x=>x!==s.name) : [...p,s.name])}
                                className="flex items-center gap-2 font-heading text-[.7rem] tracking-[.06em] px-3 py-1.5 cursor-pointer border-none transition-all duration-150"
                                style={sel
                                  ? { background:"rgba(201,168,76,.15)", outline:"1px solid rgba(201,168,76,.45)", color:"var(--or)" }
                                  : { background:"rgba(255,255,255,.04)", outline:"1px solid rgba(255,255,255,.07)", color:"rgba(255,255,255,.35)" }}>
                          {s.logo
                            ? <img src={s.logo} alt={s.name} className="w-4 h-4 object-contain" onError={e => {e.target.style.display="none";}} />
                            : <span style={{ fontSize:".9rem" }}>{s.icon}</span>}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  {eSelSites.map(name => (
                    <div key={name} className="mb-4">
                      <label className={lbl}>Lien {name}</label>
                      <div className="flex items-center gap-2">
                        <SiteLogo site={{ name }} />
                        <input className={inp} type="url" value={eSiteLinks[name]||""} placeholder="https://…"
                               onChange={e => setESiteLinks(p => ({ ...p, [name]:e.target.value }))} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={saveEdit} disabled={saving} className="btn-primary" style={{ padding:"10px 24px", fontSize:".82rem" }}>
                    {saving ? "…" : "✓ Sauvegarder"}
                  </button>
                  <button onClick={() => setEditMode(false)} className="btn-ghost" style={{ padding:"10px 24px", fontSize:".82rem" }}>
                    ✕ Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
