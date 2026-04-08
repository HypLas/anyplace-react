import { useAuth } from "../../context/AuthContext";

const STATUS_CLS = {
  "En cours":"status-ongoing","Terminé":"status-finished",
  "Abandonné":"status-abandoned","En pause":"status-abandoned","À venir":"status-upcoming",
};

export default function ManhwaDetailModal({ manhwa, onClose, onEdit }) {
  const { isOwner } = useAuth();
  if (!manhwa) return null;

  const genres  = Array.isArray(manhwa.genres) && manhwa.genres.length > 0 ? manhwa.genres : (manhwa.genre?[manhwa.genre]:[]);
  const status  = STATUS_CLS[manhwa.status] || "status-finished";
  const sites   = (manhwa.sites||[]).filter(s=>s.url);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto"
         style={{paddingTop:88,background:"rgba(0,0,0,.75)",backdropFilter:"blur(6px)"}}
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="relative w-full max-w-3xl my-auto bg-noir-2 border border-gris corner-gold"
           style={{animation:"fade-up .35s cubic-bezier(.4,0,.2,1) forwards"}}>

        {/* Close */}
        <button onClick={onClose}
                className="absolute top-3 right-3 z-10 w-[34px] h-[34px] flex items-center justify-center border border-gris text-creme-dim cursor-pointer text-[.8rem] transition-all duration-300 hover:border-rouge"
                style={{background:"rgba(10,10,15,.7)",backdropFilter:"blur(4px)"}}>✕</button>

        {/* Infos */}
        <div className="p-8 flex flex-col min-w-0">
            <div>
              {/* Type badge */}
              {manhwa.type && (
                <span className="inline-block font-heading text-[.6rem] tracking-[.18em] uppercase px-2.5 py-1 mb-3"
                      style={{background:"rgba(201,168,76,.12)",border:"1px solid var(--or-dk)",color:"var(--or)"}}>
                  {manhwa.type}
                </span>
              )}

              <p className="font-heading text-[.65rem] tracking-[.35em] text-or mb-2 uppercase">{genres.join(" · ")}</p>
              <h2 className="font-display leading-tight break-words mb-3" style={{fontSize:"clamp(1.2rem,3vw,1.8rem)",color:"var(--creme)"}}>
                {manhwa.title}
              </h2>

              {/* Auteur / Artiste */}
              {(manhwa.auteur || manhwa.artiste) && (
                <div className="flex flex-wrap gap-4 mb-3 text-[.78rem] text-creme-dim">
                  {manhwa.auteur  && <span>✍ {manhwa.auteur}</span>}
                  {manhwa.artiste && manhwa.artiste !== manhwa.auteur && <span>🎨 {manhwa.artiste}</span>}
                </div>
              )}

              <div className="flex gap-2 flex-wrap mb-5">
                <span className={`font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 ${status}`}>{manhwa.status}</span>
                {manhwa.annee && <span className="font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 border border-gris text-creme-dim">{manhwa.annee}</span>}
              </div>

              {/* Stats */}
              <div className="flex gap-8 flex-wrap pt-4 border-t border-gris mb-5">
                {[
                  ...(manhwa.chapitres ? [{ l:"Chapitres", v:manhwa.chapitres }] : []),
                  ...(manhwa.volumes   ? [{ l:"Volumes",   v:manhwa.volumes   }] : []),
                ].map(s=>(
                  <div key={s.l} className="flex flex-col gap-1.5">
                    <span className="font-heading text-[.62rem] tracking-[.25em] uppercase text-creme-dim">{s.l}</span>
                    <span className="font-display text-[1.6rem] leading-none" style={{color:"var(--or-lt)"}}>{s.v}</span>
                  </div>
                ))}
              </div>

              {/* Synopsis */}
              {manhwa.synopsis && (
                <p className="text-[.88rem] font-light leading-relaxed mb-5"
                   style={{color:"var(--creme-dim)",borderLeft:"2px solid var(--or-dk)",paddingLeft:14}}>
                  {manhwa.synopsis}
                </p>
              )}

              {/* Sites */}
              {(manhwa.sites||[]).length > 0 && (
                <div className="flex flex-col gap-2 mb-5">
                  <span className="font-heading text-[.65rem] tracking-[.2em] uppercase text-creme-dim">Disponible sur</span>
                  <div className="flex flex-wrap gap-2">
                    {manhwa.sites.map(s=>(
                      <span key={s.name} className="font-heading text-[.78rem] tracking-[.1em] text-or border border-or-dk px-3.5 py-1">{s.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {sites.length === 1 && (
                <a href={sites[0].url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{padding:"11px 24px"}}>
                  📖 Lire maintenant
                </a>
              )}
              {sites.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {sites.map(s=>(
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                       className="font-heading text-[.7rem] tracking-[.12em] uppercase px-4 py-2.5 border border-or-dk text-or no-underline transition-all duration-300 hover:bg-or/10 hover:border-or">
                      {s.name} →
                    </a>
                  ))}
                </div>
              )}
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
