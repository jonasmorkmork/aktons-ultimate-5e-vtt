import { useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../../../firebase'; 
import { useAuth } from '../../../../context/AuthContext'; 
import { DEFAULT_SHORTCUTS } from './useCombatState';

export const useCombatPersistence = (state) => {
    const { 
        // Data
        combatants, round, turnCount, activeId, history, logs,
        groupInit, maxGroupSize, shortcuts,
        library, presets,

        // Setters
        setCombatants, setRound, setTurnCount, setActiveId, setHistory, setLogs,
        setGroupInit, setMaxGroupSize, setShortcuts,
        setLibrary, setPresets,

        // Loading state
        isLoaded, setIsLoaded
    } = state;

    const { currentUser } = useAuth();
    // Denne ref bruges til at blokere "save" når vi modtager data "udefra" (fra spillere eller campaign manager)
    const isSyncingRef = useRef(false);

    // --- 1. LOAD DATA & LISTEN FOR UPDATES ---
    useEffect(() => {
        if (!currentUser) return;

        // Referencer til brugerens dokumenter i Firebase
        const activeRef = doc(db, 'users', currentUser.uid, 'combat', 'active');
        const libraryRef = doc(db, 'users', currentUser.uid, 'combat', 'library');
        const presetsRef = doc(db, 'users', currentUser.uid, 'combat', 'presets');

        // Hjælper til at håndtere indgående data uden at trigger save-loop
        const handleCloudUpdate = (callback) => {
            isSyncingRef.current = true; // Bloker save midlertidigt
            callback();
            // Fjern blokering lidt efter render er færdig
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 200); 
        };

        // A. Lyt på Active State (Her kommer HP updates fra spillere ind!)
        const unsubActive = onSnapshot(activeRef, (docSnap) => {
            handleCloudUpdate(() => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.combatants) setCombatants(data.combatants);
                    if (data.round !== undefined) setRound(data.round);
                    if (data.turnCount !== undefined) setTurnCount(data.turnCount);
                    if (data.activeId) setActiveId(data.activeId);
                    if (data.history) setHistory(data.history);
                    if (data.logs) setLogs(data.logs);
                    
                    if (data.groupInit !== undefined) setGroupInit(data.groupInit);
                    if (data.maxGroupSize) setMaxGroupSize(data.maxGroupSize);
                    
                    if (data.shortcuts) {
                        setShortcuts({ ...DEFAULT_SHORTCUTS, ...data.shortcuts });
                    }
                }
                setIsLoaded(true);
            });
        }, (err) => console.error("Cloud Active Error:", err));

        // B. Lyt på Library (Her kommer 'Send to Combat' data ind)
        const unsubLib = onSnapshot(libraryRef, (docSnap) => {
            handleCloudUpdate(() => {
                if (docSnap.exists() && docSnap.data().items) {
                    setLibrary(docSnap.data().items);
                }
            });
        });

        // C. Lyt på Presets (Her kommer 'Sync Party' presets ind)
        const unsubPresets = onSnapshot(presetsRef, (docSnap) => {
            handleCloudUpdate(() => {
                if (docSnap.exists() && docSnap.data().items) {
                    setPresets(docSnap.data().items);
                }
            });
        });

        return () => {
            unsubActive();
            unsubLib();
            unsubPresets();
        };
    }, [currentUser]); 

    // --- 2. SAVE ACTIVE STATE ---
    useEffect(() => {
        // Gem kun hvis vi er logget ind, færdig med at loade, og IKKE er i gang med at modtage data udefra
        if (!currentUser || !isLoaded || isSyncingRef.current) return;

        const timer = setTimeout(async () => {
            const dataToSave = {
                combatants, round, turnCount, activeId, history, logs,
                groupInit, maxGroupSize, shortcuts,
                updatedAt: Date.now()
            };
            try {
                await setDoc(doc(db, 'users', currentUser.uid, 'combat', 'active'), dataToSave);
            } catch (e) { console.error("Save Active Error", e); }
        }, 1000); // 1 sek delay (debounce)

        return () => clearTimeout(timer);
    }, [combatants, round, turnCount, activeId, history, logs, groupInit, maxGroupSize, shortcuts, currentUser, isLoaded]); 

    // --- 3. SAVE LIBRARY ---
    useEffect(() => {
        if (!currentUser || !isLoaded || isSyncingRef.current) return;
        const timer = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'users', currentUser.uid, 'combat', 'library'), { items: library });
            } catch (e) { console.error("Save Library Error", e); }
        }, 1000);
        return () => clearTimeout(timer);
    }, [library, currentUser, isLoaded]);

    // --- 4. SAVE PRESETS ---
    useEffect(() => {
        if (!currentUser || !isLoaded || isSyncingRef.current) return;
        const timer = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'users', currentUser.uid, 'combat', 'presets'), { items: presets });
            } catch (e) { console.error("Save Presets Error", e); }
        }, 1000);
        return () => clearTimeout(timer);
    }, [presets, currentUser, isLoaded]);
};