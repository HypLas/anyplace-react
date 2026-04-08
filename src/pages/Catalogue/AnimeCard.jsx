import { getGenreList, LANG_MAP, formatCountdown } from "../../constants";
import usePoster from "../../hooks/usePoster";

export default function AnimeCard({ anime, isOwner, onDelete, onClick, deleteMode }) {
  const genres     = getGenreList(anime);
  const langInfo   = anime.lang ? LANG_MAP[anime.lang] : null;
  const isUpcoming = anime.status === "À venir";
  const countdown  = isUpcoming ? formatCountdown(anime.releaseDate) : null;
  const posterSrc  = usePoster(anime.title, anime.img1);

  return (
    <div className="anime-card" onClick={() => !deleteMode && onClick(anime)}>
      <div className="relative overflow-hidden">

        {/* Badge langue */}
        {langInfo && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1 py-1 pointer-events-none"
               style={{ filter:"drop-shadow(0 1px 3px rgba(0,0,0,.8))" }}>
            {langInfo.codes.map(c => (
              <img key={c} src={`https://flagcdn.com/w20/${c}.png`} alt={c}
                   style={{ width:20, height:"auto", display:"block", border:"none" }} />
            ))}
          </div>
        )}

        {/* Bouton supprimer */}
        {isOwner && anime._id && (
          <button onClick={e => { e.stopPropagation(); onDelete(anime); }}
                  className={`absolute top-2 right-2 z-10 w-[26px] h-[26px] bg-rouge text-white text-[.75rem] border-none cursor-pointer items-center justify-center transition-colors duration-200 hover:bg-rouge-dk ${deleteMode ? "flex" : "hidden"}`}
                  style={{ borderRadius:2 }}>
            ✕
          </button>
        )}

        {/* Jours restants "À venir" centré sur l'image */}
        {isUpcoming && countdown !== null && countdown >= 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none gap-1"
               style={{ opacity: 0.65 }}>
            <span className="font-display font-black text-white text-center leading-none"
                  style={{ fontSize:"clamp(1.6rem,5vw,2.4rem)", textShadow:"0 2px 16px rgba(0,0,0,.95)" }}>
              {countdown === 0 ? "Aujourd'hui" : countdown}
            </span>
            {countdown > 0 && (
              <span className="font-heading text-white text-center uppercase"
                    style={{ fontSize:".6rem", letterSpacing:".18em", textShadow:"0 1px 8px rgba(0,0,0,.9)" }}>
                jours restants
              </span>
            )}
          </div>
        )}

        {posterSrc ? (
          <img src={posterSrc} alt={anime.title} loading="lazy"
               className="w-full object-cover object-center block"
               style={{ aspectRatio:"2/3", width:"100%", height:"auto", display:"block" }}
               onError={e => { e.target.style.display="none"; e.target.nextElementSibling.style.display="flex"; }} />
        ) : null}
        <div className={`w-full flex items-center justify-center text-[2.5rem] ${posterSrc ? "hidden" : "flex"}`}
             style={{ aspectRatio:"2/3", background:"linear-gradient(135deg,var(--noir-3),var(--gris))" }}>
          {anime.icon || "🎬"}
        </div>

        {/* Overlay hover */}
        <div className="card-overlay">
          <div className="card-overlay-genres">
            {genres.slice(0, 3).map(g => <span key={g} className="card-overlay-genre">{g}</span>)}
          </div>
          <span className="card-overlay-status">{anime.status}</span>
        </div>
      </div>

      {/* Titre sous l'image */}
      <p className="font-heading font-semibold text-[.87rem] tracking-[.02em] text-creme leading-snug px-2.5 pt-2 pb-2.5 text-center">
        {anime.title}
      </p>
    </div>
  );
}
