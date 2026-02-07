import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
// HUSK at importere disse nye funktioner fra firebase/auth:
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail // Hvis du vil have "glemt kodeord"
} from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Opret bruger med Email/Password
    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    // 2. Log ind med Email/Password
    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    // 3. Log ind med Google (den du har i forvejen)
    function googleSignIn() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    }

    // 4. Log ud
    function logout() {
        return signOut(auth);
    }

    // 5. Nulstil kodeord (valgfri)
    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,        // Ny
        login,         // Ny
        googleSignIn,
        logout,
        resetPassword  // Ny
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}