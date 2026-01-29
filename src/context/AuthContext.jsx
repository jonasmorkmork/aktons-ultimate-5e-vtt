// src/context/AuthContext.jsx
import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase"; // Henter auth fra din konfiguration
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";

const AuthContext = React.createContext();

// Custom hook så vi nemt kan bruge contexten i andre filer
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Opret bruger med email/password
    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    // Log ind med email/password
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Log ind med Google (Super nemt)
    function googleLogin() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    // Log ud
    function logout() {
        return signOut(auth);
    }

    // Lytter konstant på ændringer i auth-status (Login/Logout)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false); // Vi er færdige med at loade første gang
        });

        return unsubscribe; // Ryd op når komponenten unmountes
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        googleLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}