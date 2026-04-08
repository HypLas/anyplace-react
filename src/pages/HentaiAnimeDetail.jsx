import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHentaiAnimeById } from "../firebase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AddHentaiModal from "./Catalogue/AddHentaiModal";
import { getStatusClass } from "../constants";
import useExternalMedia from "../hooks/useExternalMedia";

export default function HentaiAnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner, canHentai } = useAuth();

  const [item,     setItem]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!canHentai) { setLoading(false); return; }
    getHentaiAnimeById(id)
      .then(a => { setItem(a); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, canHentai]);

  const { banner: extBanner } = useExternalMedia(
    item?.title,
    item?.img2 || item?.img1 || null
  );

  if (!canHentai) return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center gap-4">
      <span className="text-[3rem] opacity-40">🔒</span>
      <p className="font-heading text-[.82rem] tracking-[.2em] uppercase text-creme-dim">Accès restreint.</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-noir flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="loader-orb" />
        <p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p>
      </div>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center gap-4">
      <p className="font-heading text-[1rem] tracking-[.2em] text-creme-dim uppercase">Anime introuvable.</p>
      <button onClick={() => navigate("/catalogue")}
              className="btn-ghost" style={{ padding: "10px 24px" }}>
        ← Retour au catalogue
      </button>
    </div>
  );

  const genres = Array.isArray(item.genres) ? item.genres : [];
  const status = getStatusClass(item.status);
  const sites  = (item.sites || []).filter(s => s.url);

  const bannerSrc = item.img2 || item.img1 || extBanner || null;
  const posterSrc = item.img1 || item.img2 || null;

  function handleSaved(updated) {
    setItem(updated);
    setEditOpen(false);
  }

  return (
    <div className="min-h-screen bg-noir flex flex-col">
      <Navbar embedded />

      {/* ── Hero banner ── */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 420 }}>
        {bannerSrc ? (
          <div className="absolute inset-0 bg-cover bg-center scale-110"
               style={{ backgroundImage: `url("${bannerSrc}")`, filter: "blur(18px) brightness(.28)" }} />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1a0508,#2a0a10)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(13,13,18,0) 40%, rgba(13,13,18,1) 100%)" }} />

        {/* Back button */}
        <button onClick={() => navigate("/catalogue")}
                className="absolute top-4 left-4 z-10 flex items-center gap-2 font-heading text-[.72rem] tracking-[.12em] uppercase text-creme-dim hover:text-creme transition-colors duration-200 bg-transparent border-none cursor-pointer">
          ← Catalogue
        </button>

        {/* Content */}
        <div className="relative z-10 flex gap-8 px-[12%] pt-16 pb-10 items-end flex-wrap">
          {/* Poster */}
          <div className="flex-shrink-0 shadow-2xl" style={{ width: 180, borderRadius: 2, overflow: "hidden" }}>
            {posterSrc ? (
              <img src={posterSrc} alt={item.title} className="w-full object-cover block"
                   style={{ aspectRatio: "2/3", filter: "brightness(.85)" }} />
            ) : (
              <div className="w-full flex items-center justify-center text-[3rem]"
                   style={{ aspectRatio: "2/3", background: "linear-gradient(135deg,#1a0508,#2a0a10)" }}>
                {item.icon || "🔞"}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0 pb-2">
            {/* Hentai badge */}
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="font-heading text-[.6rem] tracking-[.15em] uppercase px-2.5 py-1"
                    style={{ background: "rgba(232,0,28,.15)", border: "1px solid var(--rouge)", color: "var(--rouge)" }}>
                🔞 Anime Hentai
              </span>
              {item.censured && (
                <span className="font-heading text-[.6rem] tracking-[.1em] uppercase px-2.5 py-1"
                      style={{ background: "rgba(74,74,96,.2)", border: "1px solid var(--gris-lt)", color: "var(--gris-lt)" }}>
                  🔒 Censuré
                </span>
              )}
            </div>

            <p className="font-heading text-[.65rem] tracking-[.4em] uppercase mb-2"
               style={{ color: "#FF8090" }}>
              {genres.join(" · ")}
            </p>
            <h1 className="font-display font-black text-creme leading-tight break-words mb-4"
                style={{ fontSize: "clamp(1.6rem, 5vw, 3rem)", textShadow: "0 2px 20px rgba(0,0,0,.8)" }}>
              {item.title}
            </h1>

            <div className="flex gap-2 flex-wrap mb-5">
              <span className={`font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 ${status}`}>{item.status}</span>
              {item.annee && (
                <span className="font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 border border-gris text-creme-dim">{item.annee}</span>
              )}
              {item.lang && (
                <span className="font-heading text-[.68rem] tracking-[.1em] px-2.5 py-0.5 border border-gris text-creme-dim">{item.lang}</span>
              )}
            </div>

            {/* Stats */}
            {item.episodes && (
              <div className="flex gap-8 flex-wrap mb-5">
                <div className="flex flex-col gap-1">
                  <span className="font-heading text-[.6rem] tracking-[.2em] uppercase text-creme-dim">Épisodes</span>
                  <span className="font-display text-[1.6rem] leading-none" style={{ color: "var(--or-lt)" }}>{item.episodes}</span>
                </div>
              </div>
            )}

            {/* Watch buttons */}
            {sites.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap">
                {sites.length === 1 ? (
                  <a href={sites[0].url} target="_blank" rel="noopener noreferrer"
                     className="btn-primary" style={{ padding: "13px 28px" }}>
                    ▶ Regarder maintenant
                  </a>
                ) : (
                  sites.map(s => (
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                       className="font-heading text-[.72rem] tracking-[.12em] uppercase px-5 py-3 no-underline transition-all duration-300 hover:-translate-y-0.5"
                       style={{ border: "1px solid rgba(232,0,28,.4)", color: "#FF8090", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      ▶ {s.name}
                    </a>
                  ))
                )}
                {isOwner && (
                  <button onClick={() => setEditOpen(true)}
                          className="btn-ghost inline-flex items-center gap-2" style={{ padding: "13px 28px" }}>
                    ✏ Modifier
                  </button>
                )}
              </div>
            )}
            {sites.length === 0 && isOwner && (
              <button onClick={() => setEditOpen(true)}
                      className="btn-ghost inline-flex items-center gap-2" style={{ padding: "13px 28px" }}>
                ✏ Modifier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 bg-noir px-[12%] py-8">
        {/* Author */}
        {(item.auteur || item.artiste) && (
          <div className="flex gap-6 mb-6">
            {item.auteur && (
              <div className="flex flex-col gap-1">
                <span className="font-heading text-[.6rem] tracking-[.2em] uppercase text-creme-dim">Auteur</span>
                <span className="font-body text-[.9rem] text-creme">{item.auteur}</span>
              </div>
            )}
            {item.artiste && item.artiste !== item.auteur && (
              <div className="flex flex-col gap-1">
                <span className="font-heading text-[.6rem] tracking-[.2em] uppercase text-creme-dim">Artiste</span>
                <span className="font-body text-[.9rem] text-creme">{item.artiste}</span>
              </div>
            )}
          </div>
        )}

        {/* Synopsis */}
        {item.synopsis && (
          <div className="max-w-3xl">
            <p className="font-heading text-[.68rem] tracking-[.25em] uppercase text-creme-dim mb-3">Synopsis</p>
            <p className="font-body text-[.92rem] leading-relaxed text-creme-dim"
               style={{ borderLeft: "3px solid var(--rouge)", paddingLeft: 16 }}>
              {item.synopsis}
            </p>
          </div>
        )}
      </div>

      <Footer />

      {editOpen && (
        <AddHentaiModal editItem={item} defaultSection="anime"
                        onClose={() => setEditOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
