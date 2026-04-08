import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase";

export default function Navbar({ embedded = false }) {
  const { user, isOwner, canHentai } = useAuth();
  const navigate = useNavigate();

  const linkCls = ({ isActive }) =>
    `font-heading font-semibold text-[.82rem] tracking-[.05em] uppercase relative transition-colors duration-200
     after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0
     after:h-[2px] after:bg-rouge after:transition-transform after:duration-200 after:origin-left
     ${isActive ? "text-creme after:scale-x-100" : "text-creme-dim hover:text-creme after:scale-x-0 hover:after:scale-x-100"}`;

  return (
    <nav
      className={`${embedded ? "relative" : "sticky top-0 z-[100]"} flex items-center justify-between px-[12%] h-[64px] w-full`}
      style={{ background: "var(--noir-2)", borderBottom: "1px solid var(--gris)" }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="w-[5px] h-[26px] bg-rouge" style={{ borderRadius: 1 }} />
        <span className="font-display font-bold text-[1.25rem] text-creme tracking-[.05em] uppercase">
          Any'<span className="text-rouge">place</span>
        </span>
      </Link>

      {/* Navigation */}
      <ul className="flex list-none gap-8 items-center">
        <li><NavLink to="/"          className={linkCls}>Accueil</NavLink></li>
        <li><NavLink to="/catalogue" className={linkCls}>Catalogue</NavLink></li>
        <li><NavLink to="/anime"     className={linkCls}>Ma liste</NavLink></li>
        <li><NavLink to="/manhwa"    className={linkCls}>Manhwa</NavLink></li>
        {canHentai && (
          <li>
            <NavLink to="/hentai"
              className={({ isActive }) =>
                `font-heading font-semibold text-[.82rem] tracking-[.05em] uppercase relative transition-colors duration-200
                 after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:right-0
                 after:h-[2px] after:bg-rouge after:transition-transform after:duration-200 after:origin-left
                 ${isActive ? "text-rouge after:scale-x-100" : "text-rouge/50 hover:text-rouge after:scale-x-0 hover:after:scale-x-100"}`}>
              🔞
            </NavLink>
          </li>
        )}
      </ul>

      {/* User */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="font-body text-[.78rem] text-creme-dim max-w-[150px] truncate flex items-center gap-2">
              {user.email}
              {isOwner && (
                <span className="bg-rouge text-white font-heading font-semibold text-[.58rem] tracking-[.08em] uppercase px-2 py-0.5"
                      style={{ borderRadius: 2 }}>
                  Admin
                </span>
              )}
            </span>
            <button
              onClick={async () => { await logout(); navigate("/"); }}
              className="font-heading font-medium text-[.75rem] tracking-[.05em] uppercase text-creme-dim border border-gris px-3 py-1.5 cursor-pointer transition-all duration-200 hover:border-rouge hover:text-creme bg-transparent"
              style={{ borderRadius: 2 }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <Link to="/login"
                className="font-heading font-semibold text-[.78rem] tracking-[.06em] uppercase text-white bg-rouge px-5 py-2 no-underline transition-all duration-200 hover:bg-rouge-dk"
                style={{ borderRadius: 2 }}>
            Connexion
          </Link>
        )}
      </div>
    </nav>
  );
}
