import { useState, useRef } from "react";
import { GENRES_MANHWA, STATUTS_MANHWA, TYPES_MANHWA, SITES_LECTURE } from "../../constants";
import { saveManhwa, updateManhwa } from "../../firebase";

const MANHWA_ICONS = ["📖","⚔️","🐉","🌸","💀","🔥","🌙","🎭","🌀","👊","🗡️","✨"];
function randomManhwaIcon() { return MANHWA_ICONS[Math.floor(Math.random()*MANHWA_ICONS.length)]; }

function DatePickerInput({ value, onChange, cls }) {
  const ref = useRef(null);
  function fromIso(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return (
    <div className="flex items-center gap-1.5 w-full">
      <input value={value} onChange={ev => onChange(ev.target.value)}
             className={cls} placeholder="jj/mm/aaaa" />
      <input ref={ref} type="date"
             style={{ position: "fixed", top: -9999, left: -9999, opacity: 0, pointerEvents: "none" }}
             onChange={ev => { if (ev.target.value) onChange(fromIso(ev.target.value)); }} />
      <button type="button"
              onClick={() => { try { ref.current?.showPicker(); } catch { ref.current?.click(); } }}
              className="flex-shrink-0 bg-transparent border-none cursor-pointer text-white/25 hover:text-or transition-colors duration-200"
              style={{ fontSize: ".95rem", lineHeight: 1 }}>
        📅
      </button>
    </div>
  );
}

function SectionTitle({ label, color = "var(--rouge)" }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span className="font-heading font-semibold tracking-[.18em] uppercase"
            style={{ fontSize: ".82rem", color }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}33, transparent)` }} />
    </div>
  );
}

export default function AddManhwaModal({ editManhwa, onClose, onSaved }) {
  const editing = !!editManhwa;

  const [title,           setTitle]           = useState(editManhwa?.title           || "");
  const [type,            setType]            = useState(editManhwa?.type            || "Manhwa");
  const [selectedG,       setSelectedG]       = useState(editManhwa?.genres || (editManhwa?.genre ? [editManhwa.genre] : []));
  const [status,          setStatus]          = useState(editManhwa?.status          || "");
  const [chapitres,       setChapitres]       = useState(editManhwa?.chapitres       || "");
  const [synopsis,        setSynopsis]        = useState(editManhwa?.synopsis        || "");
  const [derniereLecture, setDerniereLecture] = useState(editManhwa?.derniereLecture || "");

  const [img] = useState(editManhwa?.img || "");

  const initSites = editManhwa?.sites || [];
  const [selectedSites, setSelectedSites] = useState(initSites.map(s => s.name));
  const [siteLinks,     setSiteLinks]     = useState(Object.fromEntries(initSites.map(s => [s.name, s.url || ""])));

  const [errs,    setErrs]    = useState({});
  const [loading, setLoading] = useState(false);

  function toggleGenre(g) { setSelectedG(p => p.includes(g) ? p.filter(x => x !== g) : [...p, g]); }
  function toggleSite(n)  { setSelectedSites(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]); }

  async function handleSubmit() {
    const e = {};
    if (!title.trim())                e.title     = "Titre requis";
    if (selectedG.length === 0)       e.genres    = "Genre requis";
    if (!status)                      e.status    = "Statut requis";
    if (!chapitres || +chapitres < 1) e.chapitres = "Chapitres requis";
    setErrs(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const sites = selectedSites.map(name => ({ name, url: siteLinks[name] || null }));
      const data = {
        title: title.trim(), type, genres: selectedG, genre: selectedG[0] || "",
        status, chapitres: +chapitres,
        synopsis: synopsis.trim() || null,
        derniereLecture: derniereLecture.trim() || null,
        img: img || null, sites,
      };
      if (editing) {
        await updateManhwa(editManhwa._id, data);
        onSaved({ ...editManhwa, ...data }, true);
      } else {
        data.icon = randomManhwaIcon();
        const id = await saveManhwa(data);
        onSaved({ ...data, _id: id }, false);
      }
      onClose();
    } catch(err) { console.error(err); alert("Erreur lors de la sauvegarde : " + err.message); }
    finally { setLoading(false); }
  }

  const inp = "w-full bg-noir-3 border border-gris text-creme font-body text-[.95rem] px-3.5 py-2.5 outline-none transition-all duration-200 focus:border-or placeholder:text-white/20";
  const lbl = "font-heading font-semibold text-[.68rem] tracking-[.15em] uppercase mb-2 block text-creme-dim";
  const sel = `${inp} appearance-none cursor-pointer`;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
         style={{ paddingTop: 72, paddingBottom: 40, background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[680px]"
           style={{ background: "#0f0f15", border: "1px solid rgba(255,255,255,.08)", animation: "fade-up .25s cubic-bezier(.4,0,.2,1) forwards" }}>

        {/* Barre accent */}
        <div style={{ height: 2, background: "linear-gradient(90deg,var(--rouge),var(--or))" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div>
            <span className="block font-heading text-[.62rem] tracking-[.35em] uppercase mb-1.5" style={{ color: "var(--or)" }}>
              — {editing ? "Modifier" : "Nouveau"} · Manhwa —
            </span>
            <h2 className="font-display text-[1.2rem] tracking-[.08em] text-creme leading-none">
              {editing ? "Modifier le " : "Ajouter un "}<span style={{ color: "var(--or)" }}>manhwa</span>
            </h2>
          </div>
          <button onClick={onClose}
                  className="w-[36px] h-[36px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.85rem] transition-all duration-200 hover:border-rouge bg-transparent">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-8 flex flex-col gap-8">

          {/* ── Identité ── */}
          <section>
            <SectionTitle label="Identité" color="var(--rouge)" />
            <div className="flex flex-col gap-5">
              <div>
                <label className={lbl} style={{ color: errs.title ? "var(--rouge)" : undefined }}>Titre</label>
                <input className={`${inp} ${errs.title ? "border-rouge" : ""}`}
                       value={title} onChange={e => setTitle(e.target.value)} placeholder="ex : Solo Leveling" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={lbl}>Type</label>
                  <div className="relative">
                    <select className={sel} value={type} onChange={e => setType(e.target.value)}>
                      {TYPES_MANHWA.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
                  </div>
                </div>
                <div>
                  <label className={lbl} style={{ color: errs.status ? "var(--rouge)" : undefined }}>Statut</label>
                  <div className="relative">
                    <select className={`${sel} ${errs.status ? "border-rouge" : ""}`} value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="">—</option>
                      {STATUTS_MANHWA.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-or-dk pointer-events-none text-[.6rem]">▼</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={lbl} style={{ color: errs.chapitres ? "var(--rouge)" : undefined }}>Chapitres lus</label>
                  <input type="number" className={`${inp} ${errs.chapitres ? "border-rouge" : ""}`}
                         value={chapitres} onChange={e => setChapitres(e.target.value)} placeholder="179" min={1} />
                </div>
                <div>
                  <label className={lbl}>Dernière lecture</label>
                  <DatePickerInput value={derniereLecture} onChange={setDerniereLecture} cls={inp} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Genres ── */}
          <section>
            <SectionTitle label="Genres" color="var(--rouge)" />
            {errs.genres && <p className="text-rouge text-[.72rem] mb-2">{errs.genres}</p>}
            <div className="flex flex-wrap gap-2">
              {GENRES_MANHWA.map(g => (
                <button key={g} type="button" onClick={() => toggleGenre(g)}
                        className="font-heading text-[.7rem] tracking-[.08em] px-3 py-1.5 cursor-pointer transition-all duration-150 border-none"
                        style={selectedG.includes(g)
                          ? { background: "rgba(192,21,42,.2)", outline: "1px solid rgba(192,21,42,.55)", color: "var(--creme)", boxShadow: "0 0 8px rgba(192,21,42,.2)" }
                          : { background: "rgba(255,255,255,.04)", outline: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.35)" }}>
                  {g}
                </button>
              ))}
            </div>
          </section>

          {/* ── Synopsis ── */}
          <section>
            <SectionTitle label="Synopsis" color="var(--or)" />
            <textarea className={`${inp} resize-y min-h-[90px]`} value={synopsis}
                      onChange={e => setSynopsis(e.target.value)} placeholder="Courte description…" />
          </section>

          {/* ── Sites de lecture ── */}
          <section>
            <SectionTitle label="Sites de lecture" color="var(--or)" />
            <div className="flex flex-wrap gap-2">
              {SITES_LECTURE.map(s => (
                <button key={s.name} type="button" onClick={() => toggleSite(s.name)}
                        className="flex items-center gap-2 font-heading text-[.7rem] tracking-[.08em] px-3 py-1.5 cursor-pointer transition-all duration-150 border-none"
                        style={selectedSites.includes(s.name)
                          ? { background: "rgba(201,168,76,.15)", outline: "1px solid rgba(201,168,76,.45)", color: "var(--or)", boxShadow: "0 0 8px rgba(201,168,76,.15)" }
                          : { background: "rgba(255,255,255,.04)", outline: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.35)" }}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
            {selectedSites.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-5">
                {selectedSites.map(name => (
                  <div key={name} style={{ animation: "fade-up .15s ease both" }}>
                    <label className={lbl}>Lien {name}</label>
                    <input className={inp} type="url" value={siteLinks[name] || ""}
                           onChange={e => setSiteLinks(p => ({ ...p, [name]: e.target.value }))} placeholder="https://…" />
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5" style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <button onClick={onClose} className="btn-ghost" style={{ padding: "10px 22px", fontSize: ".82rem" }}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: "10px 24px", fontSize: ".82rem" }}>
            {loading ? "…" : editing ? "✓ Enregistrer" : "✓ Ajouter"}
          </button>
        </div>

      </div>
    </div>
  );
}
