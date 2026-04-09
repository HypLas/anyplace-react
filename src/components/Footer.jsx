import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-noir-2 border-t border-gris px-[12%] py-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-[4px] h-[22px] bg-rouge" style={{ borderRadius: 1 }} />
          <span className="font-display font-bold text-[1.1rem] text-creme tracking-[.05em] uppercase">
            Any'<span className="text-rouge">place</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link to="/"          className="font-body text-[.82rem] text-creme-dim no-underline hover:text-creme transition-colors duration-200">Accueil</Link>
          <Link to="/catalogue" className="font-body text-[.82rem] text-creme-dim no-underline hover:text-creme transition-colors duration-200">Catalogue</Link>
          <Link to="/anime"     className="font-body text-[.82rem] text-creme-dim no-underline hover:text-creme transition-colors duration-200">Ma liste</Link>
        </div>

        <p className="font-body text-[.75rem] text-gris-lt">© 2025 Any'place</p>
      </div>
    </footer>
  );
}
