import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const ERR_MAP = {
  "auth/invalid-email":        "Adresse e-mail invalide.",
  "auth/user-not-found":       "Aucun compte trouvé.",
  "auth/wrong-password":       "Mot de passe incorrect.",
  "auth/invalid-credential":   "E-mail ou mot de passe incorrect.",
  "auth/email-already-in-use": "Cette adresse e-mail est déjà utilisée.",
  "auth/weak-password":        "Le mot de passe doit contenir au moins 6 caractères.",
  "auth/too-many-requests":    "Trop de tentatives. Réessayez plus tard.",
  "auth/network-request-failed":"Erreur réseau. Vérifiez votre connexion.",
};

export default function Login() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [onglet, setOnglet] = useState("connexion");
  const [err, setErr]       = useState("");
  const [ok,  setOk]        = useState("");
  const [loading, setLoading] = useState(false);

  const [lEmail, setLEmail] = useState("");
  const [lPwd,   setLPwd]   = useState("");
  const [lShow,  setLShow]  = useState(false);

  const [rEmail,  setREmail]  = useState("");
  const [rPwd,    setRPwd]    = useState("");
  const [rConf,   setRConf]   = useState("");
  const [rShow,   setRShow]   = useState(false);
  const [rShow2,  setRShow2]  = useState(false);

  useEffect(() => { if (user) navigate("/catalogue"); }, [user, navigate]);

  function clear() { setErr(""); setOk(""); }

  async function handleLogin() {
    clear();
    if (!lEmail || !lPwd) { setErr("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    try {
      await login(lEmail, lPwd);
      setOk("Connexion réussie ! Redirection…");
      setTimeout(() => navigate("/catalogue"), 800);
    } catch(e) { setErr(ERR_MAP[e.code] || "Une erreur est survenue."); }
    finally { setLoading(false); }
  }

  async function handleRegister() {
    clear();
    if (!rEmail || !rPwd || !rConf) { setErr("Veuillez remplir tous les champs."); return; }
    if (rPwd !== rConf) { setErr("Les mots de passe ne correspondent pas."); return; }
    if (rPwd.length < 6) { setErr("Le mot de passe doit contenir au moins 6 caractères."); return; }
    setLoading(true);
    try {
      await register(rEmail, rPwd);
      setOk("Compte créé ! Redirection…");
      setTimeout(() => navigate("/catalogue"), 800);
    } catch(e) { setErr(ERR_MAP[e.code] || "Une erreur est survenue."); }
    finally { setLoading(false); }
  }

  const inp = "w-full bg-noir-3 border border-gris text-creme font-body text-[.9rem] p-3 outline-none transition-all duration-200 focus:border-rouge placeholder:text-gris-lt";
  const lbl = "font-body font-medium text-[.82rem] text-creme-dim";

  return (
    <div className="min-h-screen bg-noir flex flex-col">
      <Navbar />

      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute rounded-full"
             style={{ width:600,height:600,top:-200,left:-200,background:"rgba(232,0,28,.08)",filter:"blur(120px)",animation:"orb-drift 14s ease-in-out infinite alternate" }} />
        <div className="absolute rounded-full"
             style={{ width:400,height:400,bottom:-100,right:-100,background:"rgba(245,196,46,.05)",filter:"blur(100px)",animation:"orb-drift 10s ease-in-out infinite alternate-reverse" }} />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]" style={{ animation:"fade-up .5s ease forwards" }}>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-[5px] h-[26px] bg-rouge" style={{ borderRadius:1 }} />
            <span className="font-display font-bold text-[1.35rem] text-creme tracking-[.05em] uppercase">
              Any'<span className="text-rouge">place</span>
            </span>
          </div>

          <div className="bg-noir-2 border border-gris p-8" style={{ borderRadius:2 }}>
            {/* Tabs */}
            <div className="flex border-b border-gris mb-7">
              {["connexion","inscription"].map(t => (
                <button key={t} onClick={() => { setOnglet(t); clear(); }}
                        className={`flex-1 py-3 font-heading font-semibold text-[.8rem] tracking-[.05em] uppercase cursor-pointer bg-transparent border-none relative transition-colors duration-200 ${onglet===t ? "text-creme" : "text-creme-dim hover:text-creme"}`}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-200 origin-center"
                        style={{ background:"var(--rouge)", transform:onglet===t?"scaleX(1)":"scaleX(0)" }} />
                </button>
              ))}
            </div>

            {err && (
              <div className="border-l-2 border-rouge bg-rouge/10 px-4 py-3 mb-5 text-[.85rem] text-[#FF4455]"
                   style={{ borderRadius:"0 2px 2px 0" }}>
                {err}
              </div>
            )}
            {ok && (
              <div className="border-l-2 border-or bg-or/10 px-4 py-3 mb-5 text-[.85rem]"
                   style={{ borderRadius:"0 2px 2px 0", color:"var(--or)" }}>
                {ok}
              </div>
            )}

            {onglet === "connexion" ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Adresse e-mail</label>
                  <input className={inp} type="email" value={lEmail} onChange={e=>setLEmail(e.target.value)} placeholder="exemple@email.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Mot de passe</label>
                  <div className="relative">
                    <input className={inp+" pr-11"} type={lShow?"text":"password"} value={lPwd}
                           onChange={e=>setLPwd(e.target.value)} placeholder="••••••••"
                           onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
                    <button type="button" onClick={()=>setLShow(!lShow)}
                            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-gris-lt hover:text-creme bg-transparent border-none cursor-pointer text-[.9rem]">
                      {lShow?"🙈":"👁"}
                    </button>
                  </div>
                </div>
                <button onClick={handleLogin} disabled={loading}
                        className="btn-primary w-full mt-1" style={{ padding:"13px" }}>
                  {loading ? "…" : "Se connecter"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Adresse e-mail</label>
                  <input className={inp} type="email" value={rEmail} onChange={e=>setREmail(e.target.value)} placeholder="exemple@email.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>
                    Mot de passe{" "}
                    <span className="font-body text-[.72rem] text-gris-lt">min. 6 car.</span>
                  </label>
                  <div className="relative">
                    <input className={inp+" pr-11"} type={rShow?"text":"password"} value={rPwd}
                           onChange={e=>setRPwd(e.target.value)} placeholder="••••••••" />
                    <button type="button" onClick={()=>setRShow(!rShow)}
                            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-gris-lt hover:text-creme bg-transparent border-none cursor-pointer text-[.9rem]">
                      {rShow?"🙈":"👁"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Confirmer le mot de passe</label>
                  <div className="relative">
                    <input className={inp+" pr-11"} type={rShow2?"text":"password"} value={rConf}
                           onChange={e=>setRConf(e.target.value)} placeholder="••••••••"
                           onKeyDown={e=>e.key==="Enter"&&handleRegister()} />
                    <button type="button" onClick={()=>setRShow2(!rShow2)}
                            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-gris-lt hover:text-creme bg-transparent border-none cursor-pointer text-[.9rem]">
                      {rShow2?"🙈":"👁"}
                    </button>
                  </div>
                </div>
                <button onClick={handleRegister} disabled={loading}
                        className="btn-primary w-full mt-1" style={{ padding:"13px" }}>
                  {loading ? "…" : "Créer mon compte"}
                </button>
              </div>
            )}

            <p className="text-center mt-6">
              <Link to="/" className="font-body text-[.8rem] text-creme-dim no-underline hover:text-creme transition-colors duration-200">
                ← Retour à l'accueil
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
