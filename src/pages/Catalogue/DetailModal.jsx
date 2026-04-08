import { useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import EpisodeSection from "./EpisodeSection";
import { getGenreList, getStatusClass, getPlatforms, formatCountdown } from "../../constants";

export default function DetailModal({ anime, onClose, onEdit, onTablesUpdated }) {
  const { isOwner } = useAuth();
  const watchBtnRef = useRef(null);

  if (!anime) return null;

  const genres    = getGenreList(anime);
  const status    = getStatusClass(anime.status);
  const platforms = getPlatforms(anime);
  const countdown = anime.status === "À venir" ? formatCountdown(anime.releaseDate) : null;

  function handleWatch(e) {
    e.preventDefault();
    if (platforms.length === 1) { window.open(platforms[0].url, "_blank", "noopener"); return; }
    // Multi-plateforme → picker simple inline
    const picker = document.getElementById("watchPickerInline");
    if (picker) picker.style.display = picker.style.display === "none" ? "block" : "none";
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
         style={{paddingTop:88,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)"}}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-5xl my-auto bg-noir-2 border border-gris corner-gold"
           style={{animation:"fade-up .35s cubic-bezier(.4,0,.2,1) forwards"}}>

        {/* Close */}
        <button onClick={onClose}
                className="absolute top-3.5 right-3.5 z-10 w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer transition-all duration-300 hover:border-rouge hover:text-creme text-[.8rem]"
                style={{background:"rgba(10,10,15,.7)",backdropFilter:"blur(4px)"}}>
          ✕
        </button>

        {/* Corps */}
        <div className="px-12 py-11 relative z-10">
          <p className="font-heading text-[.7rem] tracking-[.4em] text-or mb-2.5 uppercase">{genres.join(' · ')}</p>
          <h2 className="font-display text-creme mb-4.5 leading-tight break-words"
              style={{fontSize:"clamp(1.4rem,4vw,2.4rem)",textShadow:"0 2px 20px rgba(0,0,0,.6)"}}>
            {anime.title}
          </h2>

          <div className="flex gap-2.5 flex-wrap mb-7">
            <span className={`font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 ${status}`}>{anime.status}</span>
          </div>

          {/* Countdown */}
          {countdown !== null && countdown >= 0 && (
            <div className="relative mb-5 p-3.5 px-4.5 self-start overflow-hidden"
                 style={{background:"rgba(192,21,42,.08)",border:"1px solid rgba(192,21,42,.25)"}}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{background:"linear-gradient(to bottom,var(--rouge),var(--or))"}} />
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-[1.8rem] text-or-lt leading-none" style={{textShadow:"0 0 20px rgba(201,168,76,.25)"}}>{countdown === 0 ? "Aujourd'hui !" : countdown}</span>
                {countdown > 0 && <span className="font-heading text-[.65rem] tracking-[.2em] uppercase text-creme-dim">jour{countdown>1?"s":""} avant la sortie</span>}
              </div>
              <p className="font-heading text-[.62rem] tracking-[.15em] uppercase text-creme-dim/65 mt-1">Sortie prévue le {anime.releaseDate}</p>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-12 flex-wrap pt-6 border-t border-gris mb-7">
            {[
              { label:"Épisodes", val:anime.episodes },
              ...(anime.seasons ? [{ label:"Saisons", val:anime.seasons }] : []),
              ...(anime.lang    ? [{ label:"Langue",  val:anime.lang    }] : []),
            ].map(s => (
              <div key={s.label} className="flex flex-col gap-1.5">
                <span className="font-heading text-[.62rem] tracking-[.25em] uppercase text-creme-dim">{s.label}</span>
                <span className="font-display text-[1.6rem] text-or-lt leading-none">{s.val}</span>
              </div>
            ))}
          </div>

          {/* Plateformes */}
          {(() => {
            const allPlats = Array.isArray(anime.platforms) && anime.platforms.length > 0
              ? anime.platforms : (anime.platform ? [{ name:anime.platform, url:anime.watchLink||null }] : []);
            return allPlats.length > 0 ? (
              <div className="flex flex-col gap-2 mb-7">
                <span className="font-heading text-[.68rem] tracking-[.18em] uppercase text-creme-dim">Disponible sur</span>
                <div className="flex flex-wrap gap-2">
                  {allPlats.map(p => (
                    <span key={p.name} className="font-heading text-[.82rem] tracking-[.1em] text-or border border-or-dk px-4 py-1">{p.name}</span>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Actions */}
          <div className="flex items-center gap-3.5 flex-wrap mt-1 relative">
            {platforms.length > 0 && (
              <div className="relative">
                <button ref={watchBtnRef} onClick={handleWatch}
                        className="btn-primary" style={{padding:"13px 28px"}}>
                  ▶ Regarder maintenant
                </button>
                {platforms.length > 1 && (
                  <div id="watchPickerInline" style={{display:"none",position:"absolute",bottom:"calc(100% + 8px)",left:0,background:"var(--noir-2)",border:"1px solid var(--gris)",minWidth:200,zIndex:50,boxShadow:"0 8px 24px rgba(0,0,0,.5)"}}>
                    {platforms.map(p => (
                      <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                         className="flex items-center justify-between px-4 py-3 border-b border-white/[.04] no-underline text-creme font-heading text-[.78rem] tracking-[.1em] hover:bg-rouge/12 transition-colors duration-300 last:border-none">
                        {p.name} <span className="text-gris-lt">→</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isOwner && (
              <button onClick={onEdit}
                      className="btn-ghost inline-flex items-center gap-2" style={{padding:"13px 28px"}}>
                ✏ Modifier
              </button>
            )}
          </div>
        </div>

        {/* Section épisodes */}
        <EpisodeSection anime={anime} isOwner={isOwner} onTablesUpdated={onTablesUpdated} />
      </div>
    </div>
  );
}
