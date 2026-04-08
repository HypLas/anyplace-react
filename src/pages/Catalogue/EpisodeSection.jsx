import { useState, useRef } from "react";
import { updateAnimeTables } from "../../firebase";

function EpSidenav({ tables, activeIdx, isOwner, onSelect, onReorder }) {
  const dragSrc = useRef(null);

  return (
    <nav className="bg-noir border-r border-gris flex flex-col gap-0.5 py-2 overflow-y-auto" style={{minWidth:180}}>
      {!tables || tables.length === 0 ? (
        <p className="font-heading text-[.65rem] tracking-[.15em] text-gris-lt p-4 text-center">Aucun tableau</p>
      ) : tables.map((table, i) => (
        <div key={i}
             className={`ep-sidenav-item ${i === activeIdx ? "active" : ""}`}
             draggable={isOwner}
             onDragStart={e => { dragSrc.current = i; e.dataTransfer.effectAllowed="move"; }}
             onDragOver={e => e.preventDefault()}
             onDrop={e => { e.preventDefault(); if (dragSrc.current !== null && dragSrc.current !== i) onReorder(dragSrc.current, i); dragSrc.current=null; }}
             onClick={() => onSelect(i)}>
          {isOwner && <span className="font-heading text-[1rem] text-gris-lt cursor-grab mr-1 select-none" title="Déplacer">⠿</span>}
          <span className="w-[7px] h-[7px] rounded-full flex-shrink-0 transition-colors duration-300" style={{background: i===activeIdx ? "var(--or)":"var(--gris-lt)"}} />
          <span className="font-heading text-[.68rem] tracking-[.1em] text-creme-dim overflow-hidden text-ellipsis whitespace-nowrap flex-1 transition-colors duration-300">{table.title}</span>
        </div>
      ))}
    </nav>
  );
}

function EpTable({ table, tableIdx, tables, isOwner, animeId, onSaved }) {
  async function save(newTables) {
    await updateAnimeTables(animeId, newTables);
    onSaved(newTables);
  }

  async function updateCell(ri, field, value) {
    const t = JSON.parse(JSON.stringify(tables));
    t[tableIdx].rows[ri][field] = value;
    await save(t);
  }

  async function addRow() {
    const t = JSON.parse(JSON.stringify(tables));
    t[tableIdx].rows.push({ num: t[tableIdx].rows.length + 1, title: "", date: "" });
    await save(t);
  }

  async function delRow(ri) {
    const t = JSON.parse(JSON.stringify(tables));
    t[tableIdx].rows.splice(ri, 1);
    await save(t);
  }

  function handleDatePicker(ri, raw) {
    if (!raw) return;
    const [y,m,d] = raw.split("-");
    updateCell(ri, "date", `${d}/${m}/${y}`);
  }

  const cellCls = "ep-cell-input";
  const thCls   = "font-heading text-[.62rem] tracking-[.2em] uppercase text-creme-dim px-4 py-2.5 text-left border-b border-gris";

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-noir border-b border-gris flex-wrap">
        <h4 className="font-heading text-[.8rem] tracking-[.2em] uppercase text-or">{table.title}</h4>
        {isOwner && (
          <div className="flex gap-2.5">
            <button onClick={addRow}
                    className="font-heading text-[.62rem] tracking-[.1em] uppercase px-3.5 py-1.5 border cursor-pointer transition-all duration-300 hover:bg-or/10"
                    style={{borderColor:"var(--or-dk)",color:"var(--or)"}}>
              + Épisode
            </button>
          </div>
        )}
      </div>

      <table className="w-full border-collapse font-body">
        <thead>
          <tr>
            <th className={thCls} style={{width:80}}>Épisode</th>
            <th className={thCls}>Titre</th>
            <th className={thCls} style={{width:160}}>Date de sortie</th>
            {isOwner && <th className={thCls} style={{width:36}} />}
          </tr>
        </thead>
        <tbody>
          {!table.rows || table.rows.length === 0 ? (
            <tr><td colSpan={isOwner?4:3} className="text-center p-6 font-heading text-[.78rem] tracking-[.15em] text-gris-lt">Aucun épisode</td></tr>
          ) : table.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-white/[.04] hover:bg-white/[.03] transition-colors duration-300">
              <td className="px-4 py-2.5">
                {isOwner
                  ? <input className={cellCls} defaultValue={row.num ?? ri+1} onBlur={e=>updateCell(ri,"num",e.target.value)} style={{width:56,textAlign:"center",color:"var(--or)",fontFamily:"'Cinzel',serif",fontSize:".72rem"}} />
                  : <span className="font-heading text-[.72rem] tracking-[.1em] text-or">{row.num ?? ri+1}</span>}
              </td>
              <td className="px-4 py-2.5">
                {isOwner
                  ? <input className={cellCls} defaultValue={row.title} placeholder="Titre…" onBlur={e=>updateCell(ri,"title",e.target.value)} />
                  : <span className="text-[.86rem] text-creme">{row.title || "—"}</span>}
              </td>
              <td className="px-4 py-2.5">
                {isOwner
                  ? <div className="flex items-center gap-1.5 relative">
                      <input className={`${cellCls} text-creme-dim text-[.8rem]`} defaultValue={row.date} placeholder="jj/mm/aaaa" onBlur={e=>updateCell(ri,"date",e.target.value)} />
                      <label className="cursor-pointer text-[.95rem] opacity-60 hover:opacity-100 transition-opacity">
                        📅<input type="date" className="absolute w-0 h-0 opacity-0 pointer-events-none" onChange={e=>handleDatePicker(ri,e.target.value)} />
                      </label>
                    </div>
                  : <span className="text-[.78rem] text-creme-dim">{row.date || "—"}</span>}
              </td>
              {isOwner && (
                <td className="px-4 py-2.5">
                  <button onClick={() => delRow(ri)} className="text-gris-lt hover:text-[#FF6B7A] text-[.78rem] bg-transparent border-none cursor-pointer transition-colors duration-300 px-1.5 py-1">✕</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EpisodeSection({ anime, isOwner, onTablesUpdated }) {
  const [tables,    setTables]    = useState(anime.tables || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptVal,  setPromptVal]  = useState("");
  const [promptEps,  setPromptEps]  = useState("");
  const [renaming,   setRenaming]   = useState(false);
  const [renameVal,  setRenameVal]  = useState("");

  function handleSaved(newTables) {
    setTables(newTables);
    onTablesUpdated?.(newTables);
  }

  async function addTable() {
    if (!promptVal.trim()) return;
    const rows = [];
    const n = parseInt(promptEps) || 0;
    for (let i = 1; i <= n; i++) rows.push({ num: i, title: "", date: "" });
    const t = [...tables, { title: promptVal.trim(), rows }];
    await updateAnimeTables(anime._id, t);
    handleSaved(t);
    setActiveIdx(t.length - 1);
    setShowPrompt(false);
    setPromptVal(""); setPromptEps("");
  }

  async function delTable(idx) {
    if (!confirm(`Supprimer "${tables[idx].title}" ?`)) return;
    const t = tables.filter((_, i) => i !== idx);
    await updateAnimeTables(anime._id, t);
    handleSaved(t);
    setActiveIdx(Math.max(0, idx - 1));
  }

  async function reorder(from, to) {
    const t = [...tables];
    const [m] = t.splice(from, 1); t.splice(to, 0, m);
    await updateAnimeTables(anime._id, t);
    handleSaved(t); setActiveIdx(to);
  }

  async function renameTable() {
    if (!renameVal.trim()) return;
    const t = JSON.parse(JSON.stringify(tables));
    t[activeIdx].title = renameVal.trim();
    await updateAnimeTables(anime._id, t);
    handleSaved(t); setRenaming(false);
  }

  return (
    <div className="px-12 pb-12 border-t border-gris mt-2">
      {/* Header */}
      <div className="flex items-center gap-4 py-7">
        <div className="h-px w-[60px]" style={{background:"linear-gradient(90deg,transparent,var(--or-dk))"}} />
        <h3 className="font-heading text-[.85rem] tracking-[.3em] uppercase text-creme whitespace-nowrap">Épisodes</h3>
        <div className="h-px flex-1" style={{background:"linear-gradient(90deg,var(--or-dk),transparent)"}} />
        {isOwner && (
          <button onClick={() => setShowPrompt(true)}
                  className="ml-auto font-heading text-[.68rem] tracking-[.15em] uppercase border cursor-pointer transition-all duration-300 flex-shrink-0 inline-flex items-center gap-2 px-4 py-2"
                  style={{borderColor:"var(--or-dk)",color:"var(--or)"}}>
            + Ajouter un tableau
          </button>
        )}
      </div>

      {/* Prompt nouveau tableau */}
      {showPrompt && (
        <div className="mb-5 border border-or-dk p-5 flex items-center gap-3.5 flex-wrap" style={{background:"var(--noir-3)"}}>
          <span className="font-heading text-[.7rem] tracking-[.2em] uppercase text-or whitespace-nowrap">Nom du tableau</span>
          <input autoFocus value={promptVal} onChange={e=>setPromptVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTable()}
                 placeholder="ex : Saison 1, OAV, Films…"
                 className="flex-1 min-w-[180px] bg-noir-2 border border-gris text-creme font-body text-[.9rem] px-3.5 py-2.5 outline-none transition-colors duration-300 focus:border-or-dk placeholder:text-gris-lt" />
          <input type="number" min={1} max={500} value={promptEps} onChange={e=>setPromptEps(e.target.value)}
                 placeholder="Nb épisodes (optionnel)"
                 className="w-52 bg-noir-2 border border-gris text-or font-body text-[.9rem] px-3.5 py-2.5 outline-none transition-colors duration-300 focus:border-or-dk placeholder:text-gris-lt italic" />
          <div className="flex gap-2.5">
            <button onClick={()=>setShowPrompt(false)} className="btn-ghost" style={{padding:"9px 16px",fontSize:".72rem"}}>Annuler</button>
            <button onClick={addTable} className="btn-primary" style={{padding:"9px 16px",fontSize:".72rem"}}>Créer</button>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="grid border border-gris min-h-[240px]" style={{gridTemplateColumns:"180px 1fr"}}>
        <EpSidenav tables={tables} activeIdx={activeIdx} isOwner={isOwner} onSelect={setActiveIdx} onReorder={reorder} />
        <div className="bg-noir-2 flex flex-col overflow-x-hidden">
          {tables.length === 0 ? (
            <p className="p-10 text-center font-heading text-[.75rem] tracking-[.18em] text-gris-lt">
              {isOwner ? "Cliquez sur « + Ajouter un tableau »." : "Aucun tableau d'épisodes."}
            </p>
          ) : tables[activeIdx] ? (
            <>
              {/* Barre renommer / supprimer */}
              {isOwner && (
                <div className="flex items-center gap-3 px-5 py-2 border-b border-gris bg-noir/50 flex-wrap">
                  {renaming ? (
                    <>
                      <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&renameTable()}
                             className="flex-1 bg-transparent border-b border-or-dk text-or font-heading text-[.8rem] tracking-[.15em] uppercase px-0 py-1 outline-none" />
                      <button onClick={renameTable} className="font-heading text-[.62rem] tracking-[.1em] uppercase border border-or-dk text-or px-3 py-1 cursor-pointer bg-transparent hover:bg-or/10 transition-all duration-300">OK</button>
                      <button onClick={()=>setRenaming(false)} className="font-heading text-[.62rem] text-gris-lt cursor-pointer bg-transparent border-none">Annuler</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>{setRenaming(true);setRenameVal(tables[activeIdx].title);}}
                              className="text-gris-lt hover:text-or text-[.85rem] bg-transparent border-none cursor-pointer transition-colors duration-300">✏</button>
                      <button onClick={()=>delTable(activeIdx)}
                              className="ml-auto font-heading text-[.62rem] tracking-[.1em] uppercase border cursor-pointer transition-all duration-300 px-3.5 py-1.5 hover:bg-rouge/12"
                              style={{borderColor:"var(--rouge-dk)",color:"#FF6B7A"}}>
                        🗑 Retirer
                      </button>
                    </>
                  )}
                </div>
              )}
              {tables.length > 1 && (
                <div className="flex items-center gap-3.5 px-5 py-2.5 border-b border-gris bg-black/10">
                  <span className="font-heading text-[.68rem] tracking-[.15em] text-creme-dim">{activeIdx+1} / {tables.length}</span>
                </div>
              )}
              <EpTable table={tables[activeIdx]} tableIdx={activeIdx} tables={tables}
                       isOwner={isOwner} animeId={anime._id} onSaved={handleSaved} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
