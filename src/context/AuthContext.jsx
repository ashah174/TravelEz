import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const ADMIN_EMAILS = [
  "akankshdivyananda@gmail.com",
  "ashah174@ucr.edu",
  "sraju007@ucr.edu",
  "saachi.raju@gmail.com",
  "saachiraju@gmail.com"
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email) : false;

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with its provider
export function useAuth() {
  return useContext(AuthContext);
}
