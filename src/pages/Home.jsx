import { useRef } from "react";
import { Link } from "react-router-dom";
import Navbar  from "../components/Navbar";
import Footer  from "../components/Footer";
import Reveal  from "../components/Reveal";
import { useCounter } from "../hooks/useCounter";

function AnimCounter({ value, suffix = "" }) {
  const [ref, count] = useCounter(value);
  return <span ref={ref} className="counter-value">{count.toLocaleString("fr")}{suffix}</span>;
}

export default function Home() {
  return (
    <div className="bg-noir min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[64px]">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0"
               style={{ background:"radial-gradient(ellipse 80% 55% at 50% 25%,rgba(232,0,28,.16),transparent 70%),linear-gradient(180deg,rgba(13,13,18,0) 40%,#0D0D12 100%)" }} />
          <div className="absolute inset-0"
               style={{ backgroundImage:"repeating-linear-gradient(0deg,rgba(245,196,46,.025) 0,rgba(245,196,46,.025) 1px,transparent 1px,transparent 80px),repeating-linear-gradient(90deg,rgba(245,196,46,.025) 0,rgba(245,196,46,.025) 1px,transparent 1px,transparent 80px)" }} />
          <div className="absolute rounded-full pointer-events-none"
               style={{ width:700,height:700,top:-150,left:-200,background:"rgba(232,0,28,.09)",filter:"blur(130px)",animation:"orb-drift 14s ease-in-out infinite alternate" }} />
          <div className="absolute rounded-full pointer-events-none"
               style={{ width:400,height:400,bottom:-100,right:-100,background:"rgba(245,196,46,.06)",filter:"blur(100px)",animation:"orb-drift 10s ease-in-out infinite alternate-reverse" }} />
        </div>

        <div className="relative z-10 text-center max-w-4xl px-6" style={{ animation:"fade-up .7s ease forwards" }}>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-rouge" />
            <span className="font-body font-medium text-[.76rem] tracking-[.22em] text-rouge uppercase">Catalogue Anime & Manga</span>
            <div className="h-px w-8 bg-rouge" />
          </div>

          {/* Title */}
          <h1 className="font-display font-black leading-none mb-6"
              style={{ fontSize:"clamp(4.5rem,18vw,13rem)", letterSpacing:".04em", color:"var(--creme)" }}>
            ANY'<span style={{ color:"var(--rouge)" }}>PLACE</span>
          </h1>

          <p className="font-body font-light text-[1.05rem] text-creme-dim leading-relaxed mb-10 max-w-xl mx-auto">
            Découvrez, suivez et organisez votre collection d'animes, manhwas et mangas en un seul endroit.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/catalogue" className="btn-primary">Explorer le Catalogue</Link>
            <a href="#features"   className="btn-ghost">En savoir plus</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-35">
          <div className="w-px h-14"
               style={{ background:"linear-gradient(to bottom,var(--rouge),transparent)", animation:"scroll-pulse 2s ease-in-out infinite" }} />
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="py-14 px-[12%] border-y border-gris" style={{ background:"var(--noir-2)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { val:1200, suffix:"+", label:"Œuvres référencées" },
            { val:40,   suffix:"+", label:"Genres couverts"    },
            { val:10,   suffix:"",  label:"Sites de diffusion" },
            { val:3,    suffix:"",  label:"Formats disponibles" },
          ].map((s, i) => (
            <Reveal key={i} delay={`${i * 0.08}s`} className="text-center">
              <p className="font-display font-black leading-none mb-2"
                 style={{ fontSize:"clamp(2.4rem,6vw,3.8rem)", color:"var(--rouge)" }}>
                <AnimCounter value={s.val} suffix={s.suffix} />
              </p>
              <p className="font-body text-[.82rem] text-creme-dim">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-[12%] bg-noir" id="features">
        <Reveal className="mb-14">
          <span className="font-body font-semibold text-[.75rem] tracking-[.22em] text-rouge uppercase">Pourquoi Any'place ?</span>
          <h2 className="font-display font-bold mt-2"
              style={{ fontSize:"clamp(1.8rem,4.5vw,2.8rem)" }}>
            Tout ce dont vous avez besoin
          </h2>
        </Reveal>

        <div className="grid gap-5 max-w-5xl"
             style={{ gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))" }}>
          {[
            { icon:"⚔️", titre:"Catalogue Complet",       desc:"Animes, manhwas, mangas répertoriés. Des classiques aux dernières sorties." },
            { icon:"🔥", titre:"Tendances en Temps Réel", desc:"Restez informé des séries les plus populaires du moment." },
            { icon:"🏆", titre:"Top & Recommandations",   desc:"Sélection des meilleures œuvres pour ne rien manquer." },
          ].map((f, i) => (
            <Reveal key={i} delay={`${i * 0.12}s`}>
              <div className="feature-card h-full">
                <span className="text-[2.2rem] block mb-5">{f.icon}</span>
                <h3 className="font-display font-bold text-[1.1rem] text-creme mb-3">{f.titre}</h3>
                <p className="font-body text-[.9rem] text-creme-dim leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── SPOTLIGHT ── */}
      <section className="py-24 px-[12%] bg-noir-2 border-y border-gris">
        <div className="max-w-5xl mx-auto grid gap-16 items-center"
             style={{ gridTemplateColumns:"1fr 1fr" }}>
          <Reveal direction="left">
            <span className="font-body font-semibold text-[.75rem] tracking-[.22em] text-rouge uppercase">À la une</span>
            <h2 className="font-display font-bold mt-3 mb-5"
                style={{ fontSize:"clamp(1.8rem,4vw,2.6rem)" }}>
              L'Anime,<br /><span style={{ color:"var(--rouge)" }}>un art sans limite</span>
            </h2>
            <p className="font-body text-[.95rem] text-creme-dim leading-loose mb-9">
              De l'action la plus intense aux histoires les plus touchantes, explorez notre catalogue et laissez-vous emporter.
            </p>
            <Link to="/catalogue" className="btn-primary">Voir le Catalogue →</Link>
          </Reveal>

          <Reveal direction="right">
            <div className="bg-noir border-l-4 border-rouge p-8" style={{ borderRadius:2 }}>
              <span className="inline-block bg-rouge text-white font-heading font-semibold text-[.68rem] tracking-[.1em] uppercase px-3 py-1 mb-7"
                    style={{ borderRadius:2 }}>
                FEATURED
              </span>
              <div className="flex flex-wrap gap-2 mb-8">
                {["Action","Shōnen","Fantasy","Romance","Seinen","Isekai","Mecha","Psychologique","Thriller","Slice of Life"].map(g => (
                  <span key={g}
                        className="font-body font-medium text-[.76rem] bg-noir-3 border border-gris text-creme-dim px-3 py-1 cursor-default transition-all duration-200 hover:border-rouge hover:text-creme"
                        style={{ borderRadius:2 }}>
                    {g}
                  </span>
                ))}
              </div>
              <p className="font-body text-[.88rem] text-creme-dim pt-5 border-t border-gris">
                <AnimCounter value={1200} suffix="+" /> œuvres référencées
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
