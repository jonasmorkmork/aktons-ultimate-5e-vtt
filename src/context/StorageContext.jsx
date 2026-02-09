import React, { createContext, useContext, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

// --- ICONS ---
const CloudOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
);

const StorageContext = createContext();

export function useStorage() {
    return useContext(StorageContext);
}

export const StorageProvider = ({ children }) => {
    const { currentUser } = useAuth();
    
    // STATE
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // --- FAIL SAFE TRIGGER ---
    const triggerFailSafe = (error) => {
        console.error("Storage Error (Switching to Local):", error);
        
        if (isOfflineMode) return; // Allerede offline

        let msg = "Connection error.";
        if (error?.code === 'resource-exhausted') {
            msg = "Daily Quota Exceeded. Switching to Local Storage.";
        } else if (error?.code === 'unavailable') {
            msg = "Network unavailable. Switching to Local Storage.";
        } else if (error?.message && error.message.includes("Quota")) {
            msg = "Firebase Quota Exceeded.";
        }

        setErrorMessage(msg);
        setIsOfflineMode(true);
        setShowWarning(true);
    };

    // --- HELPERS ---
    const getLocal = (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) { return null; }
    };

    const setLocal = (key, data, markAsDirty = false) => {
        try {
            const dataToSave = markAsDirty ? { ...data, _isDirty: true, _syncedAt: Date.now() } : { ...data, _isDirty: false };
            localStorage.setItem(key, JSON.stringify(dataToSave));
        } catch (e) { console.error("Local Save Error", e); }
    };

    // --- CORE FUNCTIONS ---

    // 1. SAVE / UPDATE
    const saveDocument = async (collectionPath, docId, data) => {
        const localKey = `${collectionPath}_${docId}`;

        // OFFLINE: Gem lokalt med Dirty Flag
        if (isOfflineMode || !currentUser) {
            const existing = getLocal(localKey);
            const merged = existing ? { ...existing, ...data } : data;
            setLocal(localKey, merged, true); 
            return { success: true, source: 'local' };
        }

        // ONLINE: Prøv Firebase
        try {
            await setDoc(doc(db, collectionPath, docId), data, { merge: true });
            
            // Succes: Gem backup lokalt (Clean)
            const existing = getLocal(localKey);
            const merged = existing ? { ...existing, ...data } : data;
            setLocal(localKey, merged, false); 
            return { success: true, source: 'cloud' };
        } catch (error) {
            triggerFailSafe(error);
            // Fejl: Gem lokalt som Dirty
            const existing = getLocal(localKey);
            const merged = existing ? { ...existing, ...data } : data;
            setLocal(localKey, merged, true);
            return { success: true, source: 'local' }; 
        }
    };

    // 2. LOAD
    const loadDocument = async (collectionPath, docId) => {
        const localKey = `${collectionPath}_${docId}`;
        const localData = getLocal(localKey);

        if (isOfflineMode || !currentUser) return localData;

        // TJEK FOR "DIRTY" DATA
        if (localData && localData._isDirty) {
            console.log("Found unsynced local changes! Attempting to push to cloud...");
            try {
                const { _isDirty, _syncedAt, ...cleanData } = localData;
                await setDoc(doc(db, collectionPath, docId), cleanData, { merge: true });
                setLocal(localKey, localData, false);
                console.log("Sync successful!");
                return localData; 
            } catch (e) {
                console.error("Sync failed, staying offline:", e);
                triggerFailSafe(e);
                return localData; 
            }
        }

        try {
            const docSnap = await getDoc(doc(db, collectionPath, docId));
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                setLocal(localKey, cloudData, false); 
                return cloudData;
            }
            return null;
        } catch (error) {
            triggerFailSafe(error);
            return localData; 
        }
    };

    // 3. LISTEN
    const subscribeToDocument = (collectionPath, docId, callback) => {
        const localKey = `${collectionPath}_${docId}`;
        const localData = getLocal(localKey);
        
        if (isOfflineMode || !currentUser || (localData && localData._isDirty)) {
            if (localData) callback(localData);
            return () => {};
        }

        try {
            const unsub = onSnapshot(doc(db, collectionPath, docId), 
                (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setLocal(localKey, data, false);
                        callback(data);
                    }
                }, 
                (error) => {
                    triggerFailSafe(error);
                    const fallback = getLocal(localKey);
                    if (fallback) callback(fallback);
                }
            );
            return unsub;
        } catch (error) {
            triggerFailSafe(error);
            return () => {};
        }
    };

    const value = {
        isOfflineMode,
        saveDocument,
        loadDocument,
        subscribeToDocument,
        resetOnline: () => setIsOfflineMode(false)
    };

    return (
        <StorageContext.Provider value={value}>
            {children}
            
            {/* --- FAIL SAFE MODAL --- */}
            {showWarning && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-red-600 rounded-xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center relative">
                        <div className="flex justify-center mb-4">
                            <div className="bg-red-900/20 p-4 rounded-full border border-red-500/50">
                                <CloudOffIcon />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
                        <p className="text-slate-300 text-sm mb-2">{errorMessage}</p>
                        
                        <p className="text-slate-500 text-xs mb-6">
                            The app now runs in <strong>Offline Mode</strong>. Your changes are saved locally and will be synced automatically when the connection is stable.
                        </p>
                        
                        <button onClick={() => setShowWarning(false)} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-colors">Understood (Local Mode)</button>
                    </div>
                </div>
            )}
        </StorageContext.Provider>
    );
};