import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNewCharacter } from './components/CharacterHelpers';
import CharacterList from './components/CharacterList';
import CharacterSheetView from './components/CharacterSheetView';

// FIREBASE IMPORTS
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { useStorage } from '../../context/StorageContext'; // <--- NYT HOOK
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore'; // Behold updateDoc til Campaign Sync

const CharacterSheet = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { activeCampaignId, campaignData } = useCampaign(); 
    
    // Hent storage funktionerne
    const { saveDocument, loadDocument, isOfflineMode } = useStorage();

    const [characters, setCharacters] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [saveStatus, setSaveStatus] = useState('Idle');
    const [isLoaded, setIsLoaded] = useState(false);
    
    // NY STATE: View Mode (auto/mobile/desktop)
    const [viewMode, setViewMode] = useState('auto'); // 'auto', 'mobile', 'desktop'

    // Ref til at undgå loops i sync
    const lastSyncedData = useRef("");

    // 1. Initial Load (Fail-Safe)
    useEffect(() => {
        const loadData = async () => {
            let data = null;
            
            if (currentUser) {
                // Bruger StorageContext's loadDocument som håndterer offline fallback automatisk
                data = await loadDocument(`users/${currentUser.uid}/data`, 'characters');
            } 
            
            if (data && data.list) {
                setCharacters(data.list);
            } else {
                // Fallback for gæster eller hvis ingen data findes i cloud/storage context endnu
                const saved = localStorage.getItem('dnd_manager_v8');
                if (saved) {
                    try { setCharacters(JSON.parse(saved)); } catch (e) { console.error("Local load error", e); }
                }
            }
            setIsLoaded(true);
        };
        loadData();
    }, [currentUser, loadDocument]);

    // 2. Auto-save (Fail-Safe)
    useEffect(() => {
        if (!isLoaded) return;

        const timer = setTimeout(async () => {
            setSaveStatus('Saving...');
            
            if (currentUser) {
                // Brug saveDocument wrapperen. Den trigger offline mode hvis den fejler.
                const success = await saveDocument(
                    `users/${currentUser.uid}/data`, 
                    'characters', 
                    { list: characters }
                );
                
                if (success) {
                    setSaveStatus(isOfflineMode ? 'Saved (Local)' : 'Saved (Cloud)');
                } else {
                    setSaveStatus('Error');
                }
            } else {
                // Gæste-bruger
                localStorage.setItem('dnd_manager_v8', JSON.stringify(characters));
                setSaveStatus('Saved (Local)');
            }

            setTimeout(() => setSaveStatus('Idle'), 2000);
        }, 1000);

        return () => clearTimeout(timer);
    }, [characters, currentUser, isLoaded, saveDocument, isOfflineMode]);

    const activeCharacter = characters.find(c => c.id === activeId);

// --- 3. REAL-TIME CAMPAIGN SYNC (FINAL FIX) ---
    useEffect(() => {
        // Stop hvis vi mangler data, er offline, eller ikke er i en kampagne
        if (!activeCharacter || !currentUser || !activeCampaignId || isOfflineMode) return;

        // 1. Opret kopi og FJERN 'lastUpdate' fra sammenligningen for at garantere stabilitet
        const { lastUpdate, ...charDataWithoutTime } = activeCharacter;
        const jsonToCompare = JSON.stringify(charDataWithoutTime);

        // 2. Hvis data (navn, hp, stats etc.) er identisk med sidst sendte, så STOP her.
        if (jsonToCompare === lastSyncedData.current) return;

        // 3. Start timer for at undgå spam ved hurtige tryk
        const syncTimer = setTimeout(async () => {
            try {
                // Opdater ref før vi sender (låser tilstanden)
                lastSyncedData.current = jsonToCompare;

                const campaignRef = doc(db, "campaigns", activeCampaignId);
                const fieldPath = `playerCharacters.${currentUser.uid}`;
                
                // Tilføj tidsstempel NU, kun til den data vi sender
                const dataToSend = {
                    ...charDataWithoutTime, // Brug data uden gammel tid
                    lastUpdate: Date.now()  // Sæt ny tid
                };

                await updateDoc(campaignRef, {
                    [`${fieldPath}.liveData`]: dataToSend
                });
                
                console.log("Synced to campaign:", activeCampaignId);
            } catch (e) {
                console.error("Campaign sync failed:", e);
            }
        }, 2000); // 2 sekunders debounce

        return () => clearTimeout(syncTimer);

    // VIGTIGT: Ingen 'campaignData' i dependencies!
    }, [activeCharacter, activeCampaignId, currentUser, isOfflineMode]);


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
        // Beregn om vi er i mobil-view (enten tvunget eller auto)
        const isMobile = viewMode === 'mobile' || (viewMode === 'auto' && window.innerWidth < 768);

        return (
            <CharacterSheetView 
                character={activeCharacter} 
                onUpdate={handleUpdateCharacter} 
                onBack={() => setActiveId(null)}
                onExport={handleExport}
                saveStatus={saveStatus}
                // Sender view props videre
                isMobileView={isMobile}
                onToggleView={() => setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile')}
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