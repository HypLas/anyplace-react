import useManhwaPoster from "../../hooks/useManhwaPoster";

export default function ManhwaCard({ manhwa, isOwner, deleteMode, onDelete, onClick }) {
  const genres    = Array.isArray(manhwa.genres) && manhwa.genres.length > 0
    ? manhwa.genres : (manhwa.genre ? [manhwa.genre] : []);
  const posterSrc = useManhwaPoster(manhwa.title);

  return (
    <div className="anime-card" onClick={() => !deleteMode && onClick(manhwa)}>
      <div className="relative overflow-hidden">

        {/* Badge type */}
        {manhwa.type && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="font-heading font-semibold text-[.6rem] tracking-[.04em] uppercase text-white px-2 py-1"
                  style={{ background:"rgba(13,13,18,.88)", backdropFilter:"blur(4px)", borderRadius:2 }}>
              {manhwa.type}
            </span>
          </div>
        )}

        {/* Bouton supprimer */}
        {isOwner && manhwa._id && (
          <button onClick={e => { e.stopPropagation(); onDelete(manhwa); }}
                  className={`absolute top-2 right-2 z-10 w-[26px] h-[26px] bg-rouge text-white text-[.75rem] border-none cursor-pointer items-center justify-center transition-colors duration-200 hover:bg-rouge-dk ${deleteMode ? "flex" : "hidden"}`}
                  style={{ borderRadius:2 }}>
            ✕
          </button>
        )}

        {posterSrc ? (
          <img src={posterSrc} alt={manhwa.title} loading="lazy"
               className="w-full object-cover block"
               style={{ aspectRatio:"2/3" }}
               onError={e => { e.target.style.display="none"; e.target.nextElementSibling.style.display="flex"; }} />
        ) : null}
        <div className={`w-full flex items-center justify-center text-[2.5rem] ${posterSrc ? "hidden" : "flex"}`}
             style={{ aspectRatio:"2/3", background:"linear-gradient(135deg,var(--noir-3),var(--gris))" }}>
          {manhwa.icon || "📖"}
        </div>

        {/* Overlay hover */}
        <div className="card-overlay">
          <div className="card-overlay-genres">
            {genres.slice(0, 3).map(g => <span key={g} className="card-overlay-genre">{g}</span>)}
          </div>
          <span className="card-overlay-status">
            {manhwa.status || (manhwa.chapitres ? `${manhwa.chapitres} chap.` : "")}
          </span>
        </div>
      </div>

      {/* Titre sous l'image */}
      <p className="font-heading font-semibold text-[.87rem] tracking-[.02em] text-creme leading-snug px-2.5 pt-2 pb-2.5 text-center">
        {manhwa.title}
      </p>
    </div>
  );
}
