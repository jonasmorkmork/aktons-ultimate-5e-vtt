import { useEffect, useRef } from 'react';
import { DEFAULT_SHORTCUTS } from './useCombatState';

export const useCombatPersistence = (state) => {
    const { 
        isLoaded, setIsLoaded,
        combatants, round, turnCount, activeId, history, logs,
        setCombatants, setRound, setTurnCount, setActiveId, setHistory, setLogs,
        groupInit, setGroupInit,
        maxGroupSize, setMaxGroupSize,
        shortcuts, setShortcuts, // Hent shortcuts
        library, setLibrary,
        presets, setPresets
    } = state;

    const isSyncingRef = useRef(false);

    // --- INITIAL LOAD ---
    useEffect(() => {
        const loadData = () => {
            try {
                isSyncingRef.current = true;

                const savedLib = localStorage.getItem('combat_library');
                if (savedLib) setLibrary(JSON.parse(savedLib));
                
                const savedPresets = localStorage.getItem('combat_presets');
                if (savedPresets) setPresets(JSON.parse(savedPresets));

                const savedState = localStorage.getItem('combat_state');
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    
                    if (parsed.combatants) setCombatants(parsed.combatants);
                    if (parsed.round) setRound(parsed.round);
                    if (parsed.turnCount) setTurnCount(parsed.turnCount);
                    if (parsed.activeId) setActiveId(parsed.activeId);
                    if (parsed.history) setHistory(parsed.history);
                    if (parsed.logs) setLogs(parsed.logs);

                    if (parsed.groupInit !== undefined) setGroupInit(parsed.groupInit);
                    if (parsed.maxGroupSize) setMaxGroupSize(parsed.maxGroupSize);
                    
                    // NYT: Load shortcuts (merge med defaults for at sikre nye features virker)
                    if (parsed.shortcuts) {
                        setShortcuts({ ...DEFAULT_SHORTCUTS, ...parsed.shortcuts });
                    }
                }
            } catch (e) {
                console.error("Load failed", e);
            } finally {
                setTimeout(() => {
                    isSyncingRef.current = false;
                    setIsLoaded(true);
                }, 100);
            }
        };

        loadData();

        const handleStorageUpdate = () => {
            console.log("🔥 [CombatFlow] Receiving external update...");
            loadData();
        };
        window.addEventListener('combat-storage-update', handleStorageUpdate);
        return () => window.removeEventListener('combat-storage-update', handleStorageUpdate);
    }, []); 

    // --- SAVE STATE ---
    useEffect(() => {
        if (!isLoaded || isSyncingRef.current) return;

        const saveData = {
            combatants,
            round,
            turnCount,
            activeId,
            history,
            logs,
            groupInit,
            maxGroupSize,
            shortcuts // Gem shortcuts
        };
        
        localStorage.setItem('combat_state', JSON.stringify(saveData));
    }, [combatants, round, turnCount, activeId, history, logs, groupInit, maxGroupSize, shortcuts, isLoaded]); 

    useEffect(() => {
        if (!isLoaded || isSyncingRef.current) return;
        localStorage.setItem('combat_library', JSON.stringify(library));
    }, [library, isLoaded]);

    useEffect(() => {
        if (!isLoaded || isSyncingRef.current) return;
        localStorage.setItem('combat_presets', JSON.stringify(presets));
    }, [presets, isLoaded]);
};