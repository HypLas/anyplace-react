import { createContext, useContext, useEffect, useState } from "react";
import { onAuth, OWNERS, HENTAI_OWNER } from "../firebase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,       setUser]       = useState(null);
  const [isOwner,    setIsOwner]    = useState(false);
  const [canHentai,  setCanHentai]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const unsub = onAuth(u => {
      setUser(u);
      setIsOwner(!!(u && OWNERS.includes(u.email)));
      setCanHentai(!!(u && u.email === HENTAI_OWNER));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthCtx.Provider value={{ user, isOwner, canHentai, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { return useContext(AuthCtx); }
