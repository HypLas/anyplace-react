import { Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";

const Home        = lazy(() => import("./pages/Home"));
const Login       = lazy(() => import("./pages/Login"));
const Catalogue   = lazy(() => import("./pages/Catalogue"));
const Anime       = lazy(() => import("./pages/Anime"));
const AnimeDetail = lazy(() => import("./pages/AnimeDetail"));

function PageTransition({ children }) {
  const location          = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setVisible(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 40);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div style={{
      opacity:   visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(14px)",
      transition:"opacity 0.38s ease, transform 0.38s ease",
      willChange:"opacity, transform",
    }}>
      {children}
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-noir flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="loader-orb" />
        <p className="font-heading text-[.75rem] tracking-[.25em] text-creme-dim uppercase">Chargement…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <PageTransition>
          <Routes>
            <Route path="/"          element={<Home />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/anime"     element={<Anime />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </>
  );
}
