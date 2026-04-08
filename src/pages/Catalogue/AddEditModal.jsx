import { useState } from "react";
import { GENRES, STATUTS, LANGUES, PLATEFORMES, randomIcon } from "../../constants";
import { saveAnime, updateAnime } from "../../firebase";

export default function AddEditModal({ editAnime, onClose, onSaved }) {
  const editing = !!editAnime;

  const [title,       setTitle]       = useState(editAnime?.title || "");
  const [synopsis,    setSynopsis]    = useState(editAnime?.synopsis || "");
  const [selectedG,   setSelectedG]   = useState(editAnime ? (Array.isArray(editAnime.genres) && editAnime.genres.length > 0 ? editAnime.genres : (editAnime.genre ? [editAnime.genre] : [])) : []);
  const [status,      setStatus]      = useState(editAnime?.status || "");
  const [lang,        setLang]        = useState(editAnime?.lang   || "");
  const [episodes,    setEpisodes]    = useState(editAnime?.episodes || "");
  const [seasons,     setSeasons]     = useState(editAnime?.seasons  || "");
  const [annee,       setAnnee]       = useState(editAnime?.annee   || "");
  const [releaseDate, setReleaseDate] = useState(editAnime?.releaseDate || "");

  const [img1] = useState(editAnime?.img1 || "");
  const [img2] = useState(editAnime?.img2 || "");

  const allPlats = Array.isArray(editAnime?.platforms) && editAnime.platforms.length > 0
    ? editAnime.platforms : (editAnime?.platform ? [{ name:editAnime.platform, url:editAnime.watchLink||null }] : []);
  const [selectedPlats, setSelectedPlats] = useState(allPlats.map(p => p.name));
  const [platLinks,     setPlatLinks]     = useState(Object.fromEntries(allPlats.map(p => [p.name, p.url || ""])));

  const [errs,    setErrs]    = useState({});
  const [loading, setLoading] = useState(false);

  function toggleGenre(g) { setSelectedG(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev, g]); }
  function togglePlat(name) { setSelectedPlats(prev => prev.includes(name) ? prev.filter(x=>x!==name) : [...prev, name]); }

  async function handleSubmit() {
    const e = {};
    if (!title.trim())            e.title    = "Titre requis";
    if (selectedG.length === 0)   e.genres   = "Sélectionnez au moins un genre";
    if (!status)                  e.status   = "Statut requis";
    if (!episodes || +episodes<1) e.episodes = "Nombre d'épisodes requis";
    setErrs(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const platforms = selectedPlats.map(name => ({ name, url: platLinks[name] || null }));
      const data = {
        title: title.trim(), synopsis: synopsis.trim() || null,
        genres: selectedG, genre: selectedG[0] || "",
        status, lang: lang || null, episodes: +episodes,
        seasons: seasons ? +seasons : null,
        annee: annee || null,
        img1: img1 || null, img2: img2 || null,
        platforms, platform: platforms[0]?.name || null,
        watchLink: platforms[0]?.url || null,
        releaseDate: status === "À venir" ? (releaseDate.trim() || null) : null,
      };
      if (editing) {
        await updateAnime(editAnime._id, data);
        onSaved({ ...editAnime, ...data }, true);
      } else {
        data.icon = randomIcon(selectedG[0] || "Action");
        const id = await saveAnime(data);
        onSaved({ ...data, _id: id }, false);
      }
      onClose();
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  }

  const inp = "w-full bg-transparent border-b border-white/10 text-creme font-body text-[.95rem] px-0 py-2.5 outline-none transition-all duration-200 focus:border-or placeholder:text-white/15";
  const sel = `${inp} appearance-none cursor-pointer`;
  const lbl = "font-heading font-semibold text-[.68rem] tracking-[.2em] uppercase mb-1.5 block";

  function SectionTitle({ color = "var(--rouge)", children }) {
    return (
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex-shrink-0 w-[3px] h-5 rounded-sm" style={{ background: color }} />
        <span className="font-heading font-bold text-[.82rem] tracking-[.18em] uppercase" style={{ color }}>{children}</span>
        <span className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${color}22, transparent)` }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
         style={{ paddingTop: 88, background: "rgba(0,0,0,.85)", backdropFilter: "blur(10px)" }}
         onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-[750px] mb-10"
           style={{ animation: "fade-up .22s cubic-bezier(.4,0,.2,1) forwards", border: "1px solid rgba(255,255,255,.08)", background: "#0f0f15" }}>

        {/* Top accent line rouge → or */}
        <div style={{ height: 2, background: "linear-gradient(90deg, var(--rouge) 0%, var(--or) 100%)" }} />

        {/* Header */}
        <div className="relative px-8 pt-7 pb-6 overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
          {/* Big decorative letter */}
          <span className="absolute right-5 top-1 font-display font-black select-none pointer-events-none"
                style={{ fontSize: "5.5rem", lineHeight: 1, color: "rgba(192,21,42,.05)", letterSpacing: "-.04em" }}>
            {editing ? "✏" : "＋"}
          </span>
          <p className="font-heading text-[.57rem] tracking-[.35em] uppercase mb-2" style={{ color: "var(--rouge)" }}>
            {editing ? "Modifier" : "Nouveau"} · Anime
          </p>
          <h2 className="font-display font-black text-creme" style={{ fontSize: "1.25rem", letterSpacing: "-.01em" }}>
            {editing
              ? <>{title || "L'anime"} <span style={{ color: "var(--or)", fontWeight: 400, fontSize: ".85em" }}>— édition</span></>
              : <>Ajouter un <span style={{ color: "var(--or)" }}>anime</span></>
            }
          </h2>
          <button onClick={onClose}
                  className="absolute top-4 right-5 text-white/20 hover:text-white/70 transition-colors text-[.75rem] bg-transparent border-none cursor-pointer p-1">
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-7 flex flex-col gap-8">

          {/* ── Identité ── */}
          <div>
            <SectionTitle color="var(--rouge)">Identité</SectionTitle>
            <div className="flex flex-col gap-5">

              {/* Titre */}
              <div>
                <label className={lbl} style={{ color: errs.title ? "var(--rouge)" : "rgba(255,255,255,.4)" }}>
                  Titre {errs.title && <span className="normal-case tracking-normal ml-1" style={{ color: "var(--rouge)", opacity: .8 }}>— {errs.title}</span>}
                </label>
                <input className={`${inp} ${errs.title ? "border-rouge" : ""}`}
                       value={title} onChange={e => setTitle(e.target.value)}
                       placeholder="ex : Demon Slayer" />
              </div>

              {/* Statut + Langue */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={lbl} style={{ color: errs.status ? "var(--rouge)" : "rgba(255,255,255,.4)" }}>
                    Statut {errs.status && <span style={{ color: "var(--rouge)", opacity: .8 }}>*</span>}
                  </label>
                  <div className="relative">
                    <select className={`${sel} ${errs.status ? "border-rouge" : ""}`} value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="">—</option>
                      {STATUTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[.5rem] text-white/20">▼</span>
                  </div>
                </div>
                <div>
                  <label className={lbl} style={{ color: "rgba(255,255,255,.4)" }}>Langue</label>
                  <div className="relative">
                    <select className={sel} value={lang} onChange={e => setLang(e.target.value)}>
                      <option value="">—</option>
                      {LANGUES.map(l => <option key={l}>{l}</option>)}
                    </select>
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[.5rem] text-white/20">▼</span>
                  </div>
                </div>
              </div>

              {/* Épisodes + Saisons + Année */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl} style={{ color: errs.episodes ? "var(--rouge)" : "rgba(255,255,255,.4)" }}>
                    Épisodes {errs.episodes && <span style={{ color: "var(--rouge)" }}>*</span>}
                  </label>
                  <input type="number" className={`${inp} ${errs.episodes ? "border-rouge" : ""}`}
                         value={episodes} onChange={e => setEpisodes(e.target.value)} placeholder="24" min={1} />
                </div>
                <div>
                  <label className={lbl} style={{ color: "rgba(255,255,255,.4)" }}>Saisons</label>
                  <input type="number" className={inp} value={seasons} onChange={e => setSeasons(e.target.value)} placeholder="—" min={1} />
                </div>
                <div>
                  <label className={lbl} style={{ color: "rgba(255,255,255,.4)" }}>Année</label>
                  <input type="number" className={inp} value={annee} onChange={e => setAnnee(e.target.value)} placeholder="2024" min={1900} max={2099} />
                </div>
              </div>

              {/* Date de sortie */}
              {status === "À venir" && (
                <div style={{ animation: "fade-up .2s ease both" }}>
                  <label className={lbl} style={{ color: "rgba(255,255,255,.4)" }}>Date de sortie</label>
                  <div className="flex items-center gap-3">
                    <input className={inp} value={releaseDate} onChange={e => setReleaseDate(e.target.value)} placeholder="jj/mm/aaaa" />
                    <label className="cursor-pointer text-white/20 hover:text-or transition-colors flex-shrink-0 text-[.9rem]">
                      📅
                      <input type="date" className="absolute w-0 h-0 opacity-0"
                             onChange={e => { if (!e.target.value) return; const [y,m,d] = e.target.value.split("-"); setReleaseDate(`${d}/${m}/${y}`); }} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Genres ── */}
          <div>
            <SectionTitle color="var(--rouge)">
              Genres {errs.genres && <span className="normal-case tracking-normal" style={{ color: "var(--rouge)", opacity: .7 }}>— {errs.genres}</span>}
            </SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(g => (
                <button key={g} type="button" onClick={() => toggleGenre(g)}
                        className="font-heading text-[.68rem] tracking-[.07em] px-3 py-1.5 cursor-pointer transition-all duration-150 border-none"
                        style={selectedG.includes(g)
                          ? { background: "rgba(192,21,42,.18)", outline: "1px solid rgba(192,21,42,.55)", color: "var(--creme)", boxShadow: "0 0 10px rgba(192,21,42,.15)" }
                          : { background: "rgba(255,255,255,.03)", outline: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.28)" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* ── Synopsis ── */}
          <div>
            <SectionTitle color="var(--or)">Synopsis</SectionTitle>
            <textarea className={`${inp} resize-none`} rows={3}
                      value={synopsis} onChange={e => setSynopsis(e.target.value)}
                      placeholder="Résumé de l'anime…"
                      style={{ borderBottom: "1px solid rgba(255,255,255,.1)", lineHeight: 1.65 }} />
          </div>

          {/* ── Plateformes ── */}
          <div>
            <SectionTitle color="var(--or)">Plateformes</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {PLATEFORMES.map(p => (
                <button key={p.name} type="button" onClick={() => togglePlat(p.name)}
                        className="flex items-center gap-1.5 font-heading text-[.68rem] tracking-[.07em] px-3 py-1.5 cursor-pointer transition-all duration-150 border-none"
                        style={selectedPlats.includes(p.name)
                          ? { background: "rgba(201,168,76,.15)", outline: "1px solid rgba(201,168,76,.45)", color: "var(--or)", boxShadow: "0 0 10px rgba(201,168,76,.1)" }
                          : { background: "rgba(255,255,255,.03)", outline: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.28)" }}>
                  {p.icon} {p.name}
                </button>
              ))}
            </div>
            {selectedPlats.length > 0 && (
              <div className="flex flex-col gap-4 mt-5">
                {selectedPlats.map(name => (
                  <div key={name} style={{ animation: "fade-up .15s ease both" }}>
                    <label className={lbl} style={{ color: "rgba(201,168,76,.5)" }}>Lien {name}</label>
                    <input className={inp} type="url" value={platLinks[name] || ""}
                           onChange={e => setPlatLinks(prev => ({ ...prev, [name]: e.target.value }))}
                           placeholder="https://…" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4" style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <p className="font-heading text-[.55rem] tracking-[.2em] uppercase text-white/15">
            {editing ? "Modification" : "Création"} · Anime
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-ghost" style={{ padding: "8px 18px", fontSize: ".75rem" }}>Annuler</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: "8px 22px", fontSize: ".75rem" }}>
              {loading ? "…" : editing ? "✓ Enregistrer" : "✓ Ajouter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
