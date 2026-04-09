import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAnimeById, updateAnimeTables, loadWatched, saveWatched } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AddEditModal from "./Catalogue/AddEditModal";
import { getGenreList, getStatusClass, getPlatforms, formatCountdown } from "../constants";
import useExternalMedia from "../hooks/useExternalMedia";
import usePoster        from "../hooks/usePoster";

/* ── Controlled date input with calendar picker ── */
function EpDateInput({ defaultValue, onSave, cls }) {
  const [val, setVal] = useState(defaultValue || "");

  function fromIso(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function toIso(str) {
    if (!str) return "";
    const p = str.split("/");
    if (p.length !== 3 || p[2].length !== 4) return "";
    return `${p[2]}-${p[1]}-${p[0]}`;
  }

  return (
    <div className="flex items-center gap-1.5">
      <input value={val}
             onChange={e => setVal(e.target.value)}
             onBlur={() => onSave(val)}
             className={cls} placeholder="jj/mm/aaaa" />
      <div className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center">
        <span className="text-white/25 pointer-events-none" style={{ fontSize: ".95rem" }}>📅</span>
        <input type="date" value={toIso(val)}
               onChange={e => {
                 if (!e.target.value) return;
                 const formatted = fromIso(e.target.value);
                 setVal(formatted);
                 onSave(formatted);
               }}
               className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
               style={{ zIndex: 1 }} />
      </div>
    </div>
  );
}

/* ── Episode card grid with inline editing ── */
function EpisodeGrid({ tables: initTables, isOwner, anime, onTablesUpdated, kitsuEps, activeIdx, onSeasonChange, watched, onToggleWatched, onMarkAllWatched }) {
  const [tables,         setTables]         = useState(initTables || []);
  const setActiveIdx = onSeasonChange;
  const [editMode,       setEditMode]       = useState(false);
  const [newTableVal,    setNewTableVal]    = useState("");
  const [addingTable,    setAddingTable]    = useState(false);
  const [bulkCount,      setBulkCount]      = useState("");
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [bulkSelected,   setBulkSelected]   = useState([]);

  async function save(newTables) {
    await updateAnimeTables(anime._id, newTables);
    setTables(newTables);
    onTablesUpdated(newTables);
  }

  async function updateCell(rowIdx, field, value) {
    const t = JSON.parse(JSON.stringify(tables));
    t[activeIdx].rows[rowIdx][field] = value;
    await save(t);
  }

  function openEpisode(row) {
    if (row.link) { window.open(row.link, "_blank", "noopener,noreferrer"); return; }
    // fallback → première plateforme disponible
    const plat = (anime.platforms || []).find(p => p.url) || (anime.watchLink ? { url: anime.watchLink } : null);
    if (plat?.url) window.open(plat.url, "_blank", "noopener,noreferrer");
  }

  async function addRows(count = 1) {
    const t = JSON.parse(JSON.stringify(tables));
    const rows = t[activeIdx].rows;
    const n = parseInt(count) || 1;
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;
    for (let i = 1; i <= n; i++) {
      rows.push({ num: rows.length + 1, title: "", date: todayStr });
    }
    await save(t);
    setBulkCount("");
  }

  async function delRow(rowIdx) {
    if (!confirm("Supprimer cet épisode ?")) return;
    const t = JSON.parse(JSON.stringify(tables));
    t[activeIdx].rows.splice(rowIdx, 1);
    await save(t);
  }

  async function addTable() {
    if (!newTableVal.trim()) return;
    const t = [...tables, { title: newTableVal.trim(), rows: [] }];
    await save(t);
    setActiveIdx(t.length - 1);
    setNewTableVal(""); setAddingTable(false);
  }

  async function delTable(idx) {
    if (!confirm(`Supprimer "${tables[idx].title}" ?`)) return;
    const t = tables.filter((_, i) => i !== idx);
    await save(t);
    setActiveIdx(Math.max(0, idx - 1));
  }

  async function bulkDelete() {
    if (bulkSelected.length === 0) return;
    if (!confirm(`Supprimer ${bulkSelected.length} épisode(s) ?`)) return;
    const t = JSON.parse(JSON.stringify(tables));
    const idxSet = new Set(bulkSelected);
    t[activeIdx].rows = t[activeIdx].rows.filter((_, i) => !idxSet.has(i));
    await save(t);
    setBulkSelected([]);
    setBulkDeleteMode(false);
  }

  function toggleSelect(i) {
    setBulkSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  const table = tables[activeIdx];

  const inCls = "bg-transparent border-b border-gris focus:border-rouge outline-none text-creme font-body text-[.78rem] py-0.5 w-full transition-colors duration-200";

  return (
    <div>
      {/* Season tabs */}
      <div className="flex items-center gap-2 px-[12%] pt-8 pb-4 flex-wrap">
        {tables.map((t, i) => (
          <div key={i} className="relative flex items-center gap-1">
            <button onClick={() => setActiveIdx(i)}
                    className={`font-heading font-bold text-[1rem] tracking-[.02em] bg-transparent border-none cursor-pointer transition-colors duration-200 pb-1 relative ${i === activeIdx ? "text-creme" : "text-creme-dim hover:text-creme"}`}>
              {t.title}
              {i === activeIdx && <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--rouge)" }} />}
            </button>
            {editMode && isOwner && (
              <button onClick={() => delTable(i)}
                      className="text-gris-lt hover:text-rouge text-[.65rem] bg-transparent border-none cursor-pointer transition-colors ml-1">✕</button>
            )}
          </div>
        ))}

        {/* Add table */}
        {isOwner && (
          addingTable ? (
            <div className="flex items-center gap-2 ml-2">
              <input autoFocus value={newTableVal} onChange={e => setNewTableVal(e.target.value)}
                     onKeyDown={e => e.key === "Enter" && addTable()}
                     placeholder="Nom (ex: Saison 2)"
                     className="bg-noir-3 border border-gris text-creme font-body text-[.78rem] px-2.5 py-1 outline-none focus:border-rouge transition-colors w-40" />
              <button onClick={addTable} className="font-heading text-[.65rem] tracking-[.1em] uppercase text-creme bg-rouge px-2.5 py-1 border-none cursor-pointer">OK</button>
              <button onClick={() => { setAddingTable(false); setNewTableVal(""); }} className="font-heading text-[.65rem] text-gris-lt bg-transparent border-none cursor-pointer">✕</button>
            </div>
          ) : (
            <button onClick={() => setAddingTable(true)}
                    className="ml-2 font-heading text-[.7rem] tracking-[.1em] uppercase text-creme-dim border border-gris px-2.5 py-1 cursor-pointer hover:border-rouge hover:text-creme transition-all duration-200 bg-transparent">
              + Saison
            </button>
          )
        )}

        {/* Edit toggle + bulk delete */}
        {isOwner && tables.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            {editMode && !bulkDeleteMode && (
              <button onClick={() => { setBulkDeleteMode(true); setBulkSelected([]); }}
                      className="font-heading text-[.68rem] tracking-[.12em] uppercase border border-gris text-creme-dim px-3.5 py-1.5 cursor-pointer transition-all duration-200 bg-transparent hover:border-rouge hover:text-creme">
                🗑 Sélection
              </button>
            )}
            {bulkDeleteMode && (
              <>
                <button onClick={bulkDelete} disabled={bulkSelected.length === 0}
                        className="font-heading text-[.68rem] tracking-[.12em] uppercase border px-3.5 py-1.5 cursor-pointer transition-all duration-200"
                        style={{ borderColor: bulkSelected.length > 0 ? "var(--rouge)" : "rgba(255,255,255,.15)", color: bulkSelected.length > 0 ? "var(--rouge)" : "rgba(255,255,255,.2)", background: "transparent" }}>
                  🗑 Supprimer ({bulkSelected.length})
                </button>
                <button onClick={() => { setBulkDeleteMode(false); setBulkSelected([]); }}
                        className="font-heading text-[.68rem] tracking-[.12em] uppercase border border-gris text-creme-dim px-3.5 py-1.5 cursor-pointer transition-all duration-200 bg-transparent hover:border-rouge hover:text-creme">
                  ✕ Annuler
                </button>
              </>
            )}
            {!bulkDeleteMode && (
              <button onClick={() => { setEditMode(v => !v); if (editMode) { setBulkDeleteMode(false); setBulkSelected([]); } }}
                      className={`font-heading text-[.68rem] tracking-[.12em] uppercase border px-3.5 py-1.5 cursor-pointer transition-all duration-200 bg-transparent ${editMode ? "border-rouge text-rouge" : "border-gris text-creme-dim hover:border-rouge hover:text-creme"}`}>
                {editMode ? "✓ Terminer" : "✏ Éditer"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Barre de progression saison active */}
      {table && table.rows?.length > 0 && (() => {
        const total    = table.rows.length;
        const seen     = table.rows.filter((_, ri) => watched?.[`${activeIdx}_${ri}`]).length;
        const pct      = Math.round((seen / total) * 100);
        const allSeen  = seen === total;
        const allKeys  = table.rows.map((_, ri) => `${activeIdx}_${ri}`);
        return (
          <div className="flex items-center gap-3 px-[12%] mb-4">
            <div className="flex-1 h-1 bg-gris overflow-hidden" style={{ borderRadius: 2 }}>
              <div className="h-full transition-all duration-500"
                   style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--rouge),var(--or))", borderRadius: 2 }} />
            </div>
            <span className="font-heading text-[.65rem] tracking-[.1em] flex-shrink-0"
                  style={{ color: pct === 100 ? "var(--or)" : "rgba(255,255,255,.3)" }}>
              {seen}/{total} · {pct}%
            </span>
            {onMarkAllWatched && (
              <button onClick={() => onMarkAllWatched(allKeys, !allSeen)}
                      className="font-heading text-[.65rem] tracking-[.1em] uppercase border px-3 py-1 cursor-pointer transition-all duration-200 bg-transparent flex-shrink-0"
                      style={{ borderColor: allSeen ? "rgba(46,204,113,.5)" : "rgba(255,255,255,.15)", color: allSeen ? "rgba(46,204,113,.8)" : "rgba(255,255,255,.3)" }}>
                {allSeen ? "↺ Tout réinitialiser" : "✓ Tout vu"}
              </button>
            )}
          </div>
        );
      })()}

      {/* Episode grid */}
      <div className="px-[12%] pb-14">
        {!table || tables.length === 0 ? (
          isOwner ? (
            <p className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim py-6">
              Ajoutez une saison avec le bouton <span style={{ color: "var(--rouge)" }}>+ Saison</span> ci-dessus.
            </p>
          ) : null
        ) : !table.rows || table.rows.length === 0 ? (
          <p className="font-heading text-[.78rem] tracking-[.15em] text-creme-dim py-6">
            {isOwner ? "Aucun épisode — cliquez sur + Épisode pour commencer." : "Aucun épisode."}
          </p>
        ) : (
          <div className="grid gap-x-4 gap-y-6"
               style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            {table.rows.map((row, i) => {
              const epNum  = Number(row.num ?? i + 1);
              const wKey   = `${activeIdx}_${i}`;
              const seen   = !!watched?.[wKey];
              const extEp  = kitsuEps?.find(e => Number(e.number) === epNum) || kitsuEps?.[i];
              const thumb  = extEp?.still || null;
              return (
              <div key={i} className="group relative">

                {/* Thumbnail — Kitsu si dispo, sinon placeholder */}
                {(() => {
                  const imgSrc = thumb || null;
                  const hasLink = !!(row.link || (anime.platforms || []).find(p => p.url) || anime.watchLink);
                  return (
                    <div className={`relative overflow-hidden mb-2.5 ${!editMode && hasLink ? "cursor-pointer" : ""}`}
                         style={{ aspectRatio: "16/9", borderRadius: 2 }}
                         onClick={!editMode && !bulkDeleteMode ? () => openEpisode(row) : undefined}>
                      {imgSrc ? (
                        <img src={imgSrc} alt={`Épisode ${epNum}`}
                             className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105"
                             style={seen ? { filter: "brightness(.45) saturate(.3)" } : {}} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                             style={{ background: seen ? "rgba(46,204,113,.08)" : "linear-gradient(135deg,var(--noir-2),var(--gris))" }}>
                          <span className="font-display font-black text-white/20 select-none"
                                style={{ fontSize: "clamp(2rem,6vw,3.5rem)" }}>
                            {String(epNum).padStart(2, "0")}
                          </span>
                        </div>
                      )}

                      {/* Overlay vu */}
                      {seen && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="font-heading text-[.6rem] tracking-[.15em] uppercase px-2 py-1"
                                style={{ background: "rgba(46,204,113,.9)", color: "#fff", borderRadius: 2 }}>
                            ✓ Vu
                          </span>
                        </div>
                      )}

                      {/* Numéro épisode */}
                      {imgSrc && !seen && (
                        <span className="absolute bottom-2 right-2.5 font-display font-black text-white/25 select-none pointer-events-none"
                              style={{ fontSize: "clamp(1.4rem,4vw,2.2rem)", lineHeight: 1 }}>
                          {String(epNum).padStart(2, "0")}
                        </span>
                      )}

                      {/* Bouton play hover */}
                      {!editMode && !bulkDeleteMode && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                               style={{ background: row.link ? "rgba(232,0,28,.88)" : "rgba(60,60,80,.88)", boxShadow: row.link ? "0 0 20px rgba(232,0,28,.5)" : "none" }}>
                            <span className="text-white text-[.9rem] ml-0.5">▶</span>
                          </div>
                        </div>
                      )}

                      {/* Checkbox vu — toujours visible */}
                      {!editMode && onToggleWatched && (
                        <button onClick={e => { e.stopPropagation(); onToggleWatched(wKey); }}
                                className="absolute top-1.5 left-1.5 z-10 w-6 h-6 flex items-center justify-center transition-all duration-200 border cursor-pointer"
                                style={{ borderRadius: 2, background: seen ? "#2ecc71" : "rgba(0,0,0,.6)", borderColor: seen ? "#27ae60" : "rgba(255,255,255,.3)", backdropFilter: "blur(4px)" }}>
                          {seen && <span className="text-white text-[.6rem] font-bold leading-none">✓</span>}
                        </button>
                      )}

                      {editMode && isOwner && !bulkDeleteMode && (
                        <button onClick={() => delRow(i)}
                                className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center bg-rouge text-white text-[.7rem] border-none cursor-pointer hover:bg-rouge-dk transition-colors"
                                style={{ borderRadius: 2 }}>
                          ✕
                        </button>
                      )}
                      {bulkDeleteMode && (
                        <button onClick={() => toggleSelect(i)}
                                className="absolute top-1.5 right-1.5 z-10 w-6 h-6 flex items-center justify-center border cursor-pointer transition-all duration-150"
                                style={{ borderRadius: 2, background: bulkSelected.includes(i) ? "var(--rouge)" : "rgba(0,0,0,.6)", borderColor: bulkSelected.includes(i) ? "var(--rouge-dk)" : "rgba(255,255,255,.3)", backdropFilter: "blur(4px)" }}>
                          {bulkSelected.includes(i) && <span className="text-white text-[.6rem] font-bold leading-none">✓</span>}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Info — editable or static */}
                {editMode && isOwner ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input defaultValue={row.num ?? i + 1}
                             onBlur={e => updateCell(i, "num", e.target.value)}
                             className={inCls} style={{ width: 36 }} placeholder="N°" />
                      <input defaultValue={row.title}
                             onBlur={e => updateCell(i, "title", e.target.value)}
                             className={inCls} placeholder="Titre de l'épisode…" />
                    </div>
                    <EpDateInput defaultValue={row.date} onSave={v => updateCell(i, "date", v)} cls={inCls} />
                    <input defaultValue={row.link || ""}
                           onBlur={e => updateCell(i, "link", e.target.value || null)}
                           className={inCls} placeholder="🔗 Lien direct (https://…)" type="url" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-heading font-semibold text-[.82rem] leading-snug mb-0.5"
                         style={{ color: seen ? "rgba(46,204,113,.7)" : "var(--creme)" }}>
                        E{row.num ?? i + 1}{row.title ? <span className="font-normal" style={{ color: seen ? "rgba(46,204,113,.5)" : "var(--creme-dim)" }}> — {row.title}</span> : ""}
                      </p>
                      {row.date && <p className="font-body text-[.7rem] text-creme-dim/60">{row.date}</p>}
                    </div>
                    {row.link && (
                      <a href={row.link} target="_blank" rel="noopener noreferrer"
                         onClick={e => e.stopPropagation()}
                         className="flex-shrink-0 font-heading text-[.6rem] tracking-[.08em] uppercase px-2 py-0.5 no-underline transition-colors duration-200"
                         style={{ color: "var(--rouge)", border: "1px solid rgba(232,0,28,.3)" }}>
                        ▶
                      </a>
                    )}
                  </div>
                )}
              </div>
              );
            })}

            {/* Bulk add card */}
            {editMode && isOwner && (
              <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-gris"
                   style={{ aspectRatio: "16/9", borderRadius: 2, background: "var(--noir-3)" }}>
                <span className="font-heading text-[.65rem] tracking-[.12em] uppercase text-creme-dim">Ajouter</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={1} max={100} value={bulkCount}
                         onChange={e => setBulkCount(e.target.value)}
                         onKeyDown={e => e.key === "Enter" && addRows(bulkCount || 1)}
                         placeholder="1"
                         className="w-14 text-center bg-noir-2 border border-gris text-creme font-body text-[.82rem] px-2 py-1 outline-none focus:border-rouge transition-colors"
                         style={{ borderRadius: 2 }} />
                  <button onClick={() => addRows(bulkCount || 1)}
                          className="font-heading text-[.65rem] tracking-[.1em] uppercase px-3 py-1 bg-rouge text-white border-none cursor-pointer hover:bg-rouge-dk transition-colors"
                          style={{ borderRadius: 2 }}>
                    + Ep
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add episode when no rows yet */}
        {editMode && isOwner && table && table.rows?.length === 0 && (
          <div className="flex items-center gap-2 mt-3">
            <input type="number" min={1} max={100} value={bulkCount}
                   onChange={e => setBulkCount(e.target.value)}
                   onKeyDown={e => e.key === "Enter" && addRows(bulkCount || 1)}
                   placeholder="Nb d'épisodes"
                   className="w-36 bg-noir-3 border border-gris text-creme font-body text-[.82rem] px-3 py-2 outline-none focus:border-rouge transition-colors"
                   style={{ borderRadius: 2 }} />
            <button onClick={() => addRows(bulkCount || 1)}
                    className="font-heading text-[.7rem] tracking-[.12em] uppercase px-4 py-2 bg-rouge text-white border-none cursor-pointer hover:bg-rouge-dk transition-colors"
                    style={{ borderRadius: 2 }}>
              + Ajouter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ Page principale ══ */
export default function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner, user } = useAuth();

  const [anime,            setAnime]            = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [editOpen,         setEditOpen]         = useState(false);
  const [pickerOpen,       setPickerOpen]       = useState(false);
  const [synExpanded,      setSynExpanded]      = useState(false);
  const [activeSeasonIdx,  setActiveSeasonIdx]  = useState(0);
  const [watched,          setWatched]          = useState({});

  useEffect(() => {
    getAnimeById(id)
      .then(a => { setAnime(a); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    loadWatched(user.uid, id).then(w => setWatched(w || {}));
  }, [user, id]);

  async function handleToggleWatched(key) {
    const updated = { ...watched, [key]: !watched[key] };
    setWatched(updated);
    if (user) saveWatched(user.uid, id, updated).catch(() => {});
  }

  async function handleBulkWatched(keys, value) {
    const updated = { ...watched };
    keys.forEach(k => { updated[k] = value; });
    setWatched(updated);
    if (user) saveWatched(user.uid, id, updated).catch(() => {});
  }

  const { banner: extBanner, seasons: extSeasons } = useExternalMedia(anime?.title);
  const posterSrc = usePoster(anime?.title, anime?.img1);

  if (loading) return (
    <div className="min-h-screen bg-noir flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="loader-orb" />
        <p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p>
      </div>
    </div>
  );

  if (!anime) return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center gap-4">
      <p className="font-heading text-[1rem] tracking-[.2em] text-creme-dim uppercase">Anime introuvable.</p>
      <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: "10px 24px" }}>
        ← Retour
      </button>
    </div>
  );

  const genres    = getGenreList(anime);
  const status    = getStatusClass(anime.status);
  const platforms = getPlatforms(anime);
  const countdown = anime.status === "À venir" ? formatCountdown(anime.releaseDate) : null;
  const tables    = anime.tables || [];

  const activeSeason = extSeasons[activeSeasonIdx] || null;
  const seasonBanner = activeSeason?.banner || null;
  const seasonEps    = activeSeason?.eps    || extSeasons[0]?.eps || [];
  // Hero : uniquement images paysage (jamais img1 qui est portrait)
  const bannerSrc    = seasonBanner || extBanner || anime.img2 || null;

  const allPlats = Array.isArray(anime.platforms) && anime.platforms.length > 0
    ? anime.platforms
    : (anime.platform ? [{ name: anime.platform, url: anime.watchLink || null }] : []);

  const SYN_LIMIT  = 220;
  const synShort   = anime.synopsis?.length > SYN_LIMIT
    ? anime.synopsis.slice(0, SYN_LIMIT) + "…" : anime.synopsis;

  // Premier épisode non vu (toutes saisons)
  function getNextEp() {
    for (let si = 0; si < tables.length; si++) {
      const rows = tables[si]?.rows || [];
      for (let ri = 0; ri < rows.length; ri++) {
        if (!watched[`${si}_${ri}`]) return { row: rows[ri], si, ri };
      }
    }
    return null; // tout vu
  }
  const nextEp = getNextEp();

  function handleWatch() {
    if (nextEp?.row?.link) { window.open(nextEp.row.link, "_blank", "noopener,noreferrer"); return; }
    if (platforms.length === 1) { window.open(platforms[0].url, "_blank", "noopener,noreferrer"); return; }
    setPickerOpen(v => !v);
  }
  function handleSaved(updated) { setAnime(updated); setEditOpen(false); }
  function handleTablesUpdated(newTables) { setAnime(prev => ({ ...prev, tables: newTables })); }

  return (
    <div className="min-h-screen bg-noir flex flex-col">
      <Navbar embedded />

      {/* ── Hero ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "clamp(420px, 58vh, 680px)" }}>

        {/* Image paysage pleine largeur */}
        {bannerSrc ? (
          <div key={bannerSrc} className="absolute inset-0 bg-cover bg-center bg-no-repeat"
               style={{ backgroundImage: `url("${bannerSrc}")`, animation: "fadein .5s ease" }} />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#13131A,#1C1C26)" }} />
        )}

        {/* Dégradé gauche → droite (texte lisible à gauche) */}
        <div className="absolute inset-0"
             style={{ background: "linear-gradient(to right, rgba(13,13,18,.97) 0%, rgba(13,13,18,.88) 30%, rgba(13,13,18,.55) 55%, rgba(13,13,18,.1) 78%, rgba(13,13,18,0) 100%)" }} />

        {/* Fondu bas */}
        <div className="absolute inset-x-0 bottom-0 h-44"
             style={{ background: "linear-gradient(to bottom, rgba(13,13,18,0) 0%, rgba(13,13,18,1) 100%)" }} />

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-[12%] pb-10 pt-20"
             style={{ maxWidth: "min(72%, 1000px)" }}>

          <button onClick={() => navigate(-1)}
                  className="btn-primary absolute top-4 left-[10%] flex items-center gap-2"
                  style={{ padding: "10px 20px", fontSize: ".72rem" }}>
            ← Retour
          </button>

          <p className="font-heading text-[.65rem] tracking-[.35em] uppercase mb-3"
             style={{ color: "var(--or)" }}>
            {genres.join("  ·  ")}
          </p>

          <h1 className="font-display font-black text-creme leading-[1.08] break-words mb-4"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", textShadow: "0 2px 30px rgba(0,0,0,.95)" }}>
            {anime.title}
          </h1>

          <div className="flex items-center gap-2.5 flex-wrap mb-5 text-creme-dim font-body text-[.82rem]">
            <span className={`font-heading text-[.65rem] tracking-[.1em] px-2 py-0.5 ${status}`}>{anime.status}</span>
            {anime.annee    && <><span className="opacity-40">•</span><span>{anime.annee}</span></>}
            {anime.lang     && <><span className="opacity-40">•</span><span>{anime.lang}</span></>}
            {anime.episodes && <><span className="opacity-40">•</span><span>{anime.episodes} épisode{anime.episodes > 1 ? "s" : ""}</span></>}
            {anime.seasons  && <><span className="opacity-40">•</span><span>{anime.seasons} saison{anime.seasons > 1 ? "s" : ""}</span></>}
          </div>

          {countdown !== null && countdown >= 0 && (
            <div className="inline-flex items-baseline gap-2.5 mb-5 px-4 py-3 relative overflow-hidden"
                 style={{ background: "rgba(232,0,28,.08)", border: "1px solid rgba(232,0,28,.2)" }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "var(--rouge)" }} />
              <span className="font-display text-[1.6rem] leading-none" style={{ color: "var(--or-lt)" }}>
                {countdown === 0 ? "Aujourd'hui !" : countdown}
              </span>
              {countdown > 0 && (
                <span className="font-heading text-[.62rem] tracking-[.15em] uppercase text-creme-dim">
                  jour{countdown > 1 ? "s" : ""} avant la sortie
                </span>
              )}
            </div>
          )}

          {allPlats.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {allPlats.map(p => (
                <span key={p.name}
                      className="font-heading text-[.7rem] tracking-[.08em] text-or border border-or-dk px-3 py-1">
                  {p.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap mb-6 relative">
            {platforms.length > 0 && (
              <div className="relative">
                <button onClick={handleWatch}
                        className="btn-primary flex items-center gap-2.5"
                        style={{ padding: "13px 28px", fontSize: ".8rem", letterSpacing: ".12em" }}>
                  <span className="text-[1.1rem] leading-none">▶</span>
                  {nextEp
                    ? nextEp.si > 0
                      ? `Regarder S${nextEp.si + 1}·E${nextEp.ri + 1}`
                      : `Regarder E${nextEp.ri + 1}`
                    : "Regarder"}
                </button>
                {pickerOpen && platforms.length > 1 && (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[200px] border border-gris"
                       style={{ background: "var(--noir-2)", boxShadow: "0 8px 24px rgba(0,0,0,.7)" }}>
                    {platforms.map(p => (
                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                         onClick={() => setPickerOpen(false)}
                         className="flex items-center justify-between px-4 py-3 border-b border-white/[.04] no-underline text-creme font-heading text-[.78rem] tracking-[.1em] hover:bg-rouge/12 transition-colors duration-300 last:border-none">
                        {p.name} <span className="text-gris-lt">→</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isOwner && (
              <button onClick={() => setEditOpen(true)}
                      className="btn-ghost inline-flex items-center gap-2"
                      style={{ padding: "13px 24px" }}>
                ✏ Modifier
              </button>
            )}
          </div>

          {anime.synopsis && (
            <div>
              <p className="font-body text-[.875rem] leading-relaxed text-creme-dim" style={{ maxWidth: 500 }}>
                {synExpanded ? anime.synopsis : synShort}
              </p>
              {anime.synopsis.length > SYN_LIMIT && (
                <button onClick={() => setSynExpanded(v => !v)}
                        className="font-heading text-[.7rem] tracking-[.12em] uppercase mt-2 bg-transparent border-none cursor-pointer transition-colors duration-200 hover:opacity-80"
                        style={{ color: "var(--rouge)" }}>
                  {synExpanded ? "Réduire" : "Plus de détails"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Episodes ── */}
      <div className="relative z-10 flex-1"
           style={{ background: "linear-gradient(to bottom, #0a0a10 0%, #16161f 30%, #1a1a26 60%, #0d0d14 100%)" }}>
        <EpisodeGrid tables={tables}
                     isOwner={isOwner} anime={anime} onTablesUpdated={handleTablesUpdated}
                     kitsuEps={seasonEps}
                     activeIdx={activeSeasonIdx} onSeasonChange={setActiveSeasonIdx}
                     watched={watched} onToggleWatched={user ? handleToggleWatched : null}
                     onMarkAllWatched={user ? handleBulkWatched : null} />
      </div>

      <Footer />

      {editOpen && (
        <AddEditModal editAnime={anime} onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
