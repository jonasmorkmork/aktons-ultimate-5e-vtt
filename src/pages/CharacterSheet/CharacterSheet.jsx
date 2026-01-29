import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewCharacter } from './components/CharacterHelpers';
import CharacterList from './components/CharacterList';
import CharacterSheetView from './components/CharacterSheetView';

// FIREBASE IMPORTS
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const CharacterSheet = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { activeCampaignId, campaignData } = useCampaign(); 

    const [characters, setCharacters] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [saveStatus, setSaveStatus] = useState('Idle');
    const [isLoaded, setIsLoaded] = useState(false);

    // Ref til at undgå loops i sync
    const lastSyncedData = useRef("");

    // 1. Initial Load (Cloud + Local)
    useEffect(() => {
        const loadData = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid, "data", "characters");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setCharacters(docSnap.data().list || []);
                    }
                } catch (e) { console.error("Cloud load error:", e); }
            } else {
                const saved = localStorage.getItem('dnd_manager_v8');
                if (saved) {
                    try { setCharacters(JSON.parse(saved)); } catch (e) { console.error("Local load error", e); }
                }
            }
            setIsLoaded(true);
        };
        loadData();
    }, [currentUser]);

    // 2. Auto-save (Cloud + Local)
    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(async () => {
            setSaveStatus('Saving...');
            
            if (currentUser) {
                try {
                    await setDoc(doc(db, "users", currentUser.uid, "data", "characters"), { list: characters });
                    setSaveStatus('Saved (Cloud)');
                } catch (e) {
                    console.error("Cloud save error:", e);
                    setSaveStatus('Error');
                }
            } else {
                localStorage.setItem('dnd_manager_v8', JSON.stringify(characters));
                setSaveStatus('Saved (Local)');
            }

            setTimeout(() => setSaveStatus('Idle'), 2000);
        }, 1000);

        return () => clearTimeout(timer);
    }, [characters, currentUser, isLoaded]);

    const activeCharacter = characters.find(c => c.id === activeId);

    // --- 3. REAL-TIME CAMPAIGN SYNC ---
    useEffect(() => {
        // Kør kun hvis vi har en aktiv karakter, er i en kampagne, og data er loadet
        if (!activeCharacter || !currentUser || !activeCampaignId || !campaignData) return;

        // Tjek om DENNE karakter er den, der er valgt til kampagnen
        const linkedCharInfo = campaignData.playerCharacters?.[currentUser.uid];
        if (!linkedCharInfo || linkedCharInfo.id !== activeCharacter.id) return;

        // Data vi vil sende til DM (Live Stats)
        // RETTELSE: Vi sender nu HELE karakteren, så Inspect Mode virker
        const liveStats = {
            ...activeCharacter, 
            lastUpdate: Date.now()
        };

        // Undgå uendeligt loop (sync kun hvis data faktisk er ændret)
        const jsonStats = JSON.stringify(liveStats);
        if (jsonStats === lastSyncedData.current) return;

        // Debounce sync (2 sekunder)
        const syncTimer = setTimeout(async () => {
            try {
                const campaignRef = doc(db, "campaigns", activeCampaignId);
                const fieldPath = `playerCharacters.${currentUser.uid}`;
                
                // Opdater kun den specifikke spillers data i kampagnen
                await updateDoc(campaignRef, {
                    [`${fieldPath}.liveData`]: liveStats
                });
                
                lastSyncedData.current = jsonStats;
                console.log("Synced to campaign:", activeCampaignId);
            } catch (e) {
                console.error("Campaign sync failed:", e);
            }
        }, 2000);

        return () => clearTimeout(syncTimer);

    }, [activeCharacter, activeCampaignId, campaignData, currentUser]);


    // --- Handlers ---
    const handleAddCharacter = () => {
        const char = createNewCharacter();
        setCharacters(prev => [...prev, char]);
        setActiveId(char.id);
    };

    const handleDeleteCharacter = (id) => {
        setCharacters(prev => prev.filter(c => c.id !== id));
        if (activeId === id) setActiveId(null);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (re) => { 
            try { 
                const importedData = JSON.parse(re.target.result);
                let newChars = [];
                if (Array.isArray(importedData)) {
                    newChars = importedData;
                } else {
                    const template = createNewCharacter();
                    newChars = [{ ...template, ...importedData, id: Date.now().toString() }];
                }
                setCharacters(prev => [...prev, ...newChars]);
                e.target.value = null; 
                alert(`Imported ${newChars.length} character(s)!`);
            } catch (err) { alert("Error importing character."); }
        };
        reader.readAsText(file);
    };

    const handleBackupAll = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characters, null, 2));
        const node = document.createElement('a'); 
        node.href = dataStr; 
        node.download = `dnd_characters_backup_${new Date().toISOString().slice(0, 10)}.json`; 
        node.click();
    };

    const handleUpdateCharacter = (newData) => {
        setCharacters(prev => prev.map(char => char.id === activeId ? { ...char, ...newData } : char));
    };

    const handleExport = () => {
        const char = characters.find(c => c.id === activeId);
        if (!char) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char, null, 2));
        const node = document.createElement('a'); 
        node.href = dataStr; 
        node.download = `${char.name || 'hero'}.json`; 
        node.click();
    };

    if (activeId && activeCharacter) {
        return (
            <CharacterSheetView 
                character={activeCharacter} 
                onUpdate={handleUpdateCharacter} 
                onBack={() => setActiveId(null)}
                onExport={handleExport}
                saveStatus={saveStatus}
            />
        );
    }

    return (
        <div className="relative">
            <div className="fixed top-4 left-4 z-50">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors border border-slate-600 shadow-lg"
                    title="Back to Home"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </button>
            </div>

            <CharacterList 
                characters={characters} 
                onSelect={setActiveId} 
                onAdd={handleAddCharacter} 
                onDelete={handleDeleteCharacter} 
                onImport={handleImport}
                onBackup={handleBackupAll} 
                saveStatus={saveStatus}
            />
        </div>
    );
};

export default CharacterSheet;