import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { db } from '../../firebase';
import { 
    collection, query, where, 
    getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, 
    arrayUnion, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import CharacterSheetView from '../CharacterSheet/components/CharacterSheetView';

// --- HELPERS ---
const getMod = (score) => Math.floor(((score || 10) - 10) / 2);
const formatMod = (mod) => (mod >= 0 ? `+${mod}` : mod);
const getProf = (level) => Math.ceil((level || 1) / 4) + 1;

// --- ICONS ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const MessageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>;
const AlertTriangle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const SwordIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" x2="19" y1="19" y2="13" /><line x1="16" x2="20" y1="16" y2="20" /><line x1="19" x2="21" y1="21" y2="19" /></svg>;
const CheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const CampaignManager = () => {
    const { currentUser } = useAuth();
    const { activeCampaignId, connectToCampaign, disconnectCampaign, campaignData } = useCampaign(); 
    
    const [createdCampaigns, setCreatedCampaigns] = useState([]);
    const [joinedCampaigns, setJoinedCampaigns] = useState([]);
    const [myCharacters, setMyCharacters] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState("");
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [inspectingChar, setInspectingChar] = useState(null);

    // STATES
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageTarget, setMessageTarget] = useState("ALL");
    const [messageQueue, setMessageQueue] = useState([]);
    const [toast, setToast] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, campaignId: null });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 1. FETCH DATA (INITIAL LOAD ONLY)
    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const qCreated = query(collection(db, "campaigns"), where("dmId", "==", currentUser.uid));
                const snapCreated = await getDocs(qCreated);
                setCreatedCampaigns(snapCreated.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const qJoined = query(collection(db, "campaigns"), where("players", "array-contains", currentUser.uid));
                const snapJoined = await getDocs(qJoined);
                setJoinedCampaigns(snapJoined.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                const charDocRef = doc(db, "users", currentUser.uid, "data", "characters");
                const charSnap = await getDoc(charDocRef);
                if (charSnap.exists()) setMyCharacters(charSnap.data().list || []);
            } catch (error) { console.error("Fejl:", error); }
            setIsLoading(false);
        };
        fetchData();
    }, [currentUser, isProcessing]);

    // 2. MESSAGES LISTENER
    useEffect(() => {
        if (!activeCampaignId || !currentUser) return;
        const q = query(collection(db, "campaigns", activeCampaignId, "messages"), where("to", "==", "DM"), where("read", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    const msgId = change.doc.id;
                    if (msg.senderId === currentUser.uid) return;
                    setMessageQueue(prev => [...prev, { ...msg, id: msgId }]);
                    updateDoc(doc(db, "campaigns", activeCampaignId, "messages", msgId), { read: true }).catch(console.error);
                }
            });
        });
        return () => unsubscribe();
    }, [activeCampaignId, currentUser]);

    useEffect(() => {
        if (messageQueue.length > 0) document.title = `(${messageQueue.length}) New Message`;
        else document.title = "Akton's DnD Tools";
    }, [messageQueue.length]);

    const generateJoinCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

    // HANDLERS
    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        if (!newCampaignName.trim()) return;
        setIsProcessing(true);
        try {
            const newCampaign = { name: newCampaignName, dmId: currentUser.uid, dmName: currentUser.displayName || "DM", joinCode: generateJoinCode(), createdAt: Date.now(), players: [], playerCharacters: {} };
            const docRef = await addDoc(collection(db, "campaigns"), newCampaign);
            setCreatedCampaigns(prev => [...prev, { id: docRef.id, ...newCampaign }]);
            setNewCampaignName("");
            connectToCampaign(docRef.id);
            showToast("Campaign Created!");
        } catch (error) { showToast(`Error: ${error.message}`, 'error'); }
        setIsProcessing(false);
    };

    const handleJoinCampaign = async (e) => {
        e.preventDefault();
        if (!joinCodeInput.trim()) return;
        setIsProcessing(true);
        try {
            const q = query(collection(db, "campaigns"), where("joinCode", "==", joinCodeInput.toUpperCase()));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { showToast("Invalid Code", 'error'); setIsProcessing(false); return; }
            const campaignDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, "campaigns", campaignDoc.id), { players: arrayUnion(currentUser.uid) });
            setJoinCodeInput("");
            connectToCampaign(campaignDoc.id);
            showToast("Campaign Joined!");
        } catch (error) { showToast("Join failed.", 'error'); }
        setIsProcessing(false);
    };

    const handleAssignCharacter = async (campaignId, charId, setIsChanging) => {
        if (!campaignId || !charId) return;
        const character = myCharacters.find(c => c.id === charId);
        if (!character) return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, "campaigns", campaignId), { [`playerCharacters.${currentUser.uid}`]: character });
            if (setIsChanging) setIsChanging(false);
            showToast("Character Assigned!");
        } catch (error) { showToast("Assignment failed", 'error'); }
        setIsProcessing(false);
    };

    const handleDeleteClick = (id) => setDeleteConfirmation({ isOpen: true, campaignId: id });
    const confirmDelete = async () => {
        const id = deleteConfirmation.campaignId;
        if (!id) return;
        try {
            await deleteDoc(doc(db, "campaigns", id));
            setCreatedCampaigns(prev => prev.filter(c => c.id !== id));
            if (activeCampaignId === id) disconnectCampaign();
            showToast("Campaign Deleted.");
        } catch (error) { showToast("Delete failed", 'error'); }
        setDeleteConfirmation({ isOpen: false, campaignId: null });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        try {
            await addDoc(collection(db, "campaigns", activeCampaignId, "messages"), { 
                text: messageText, 
                sender: "DM", 
                senderId: currentUser.uid, 
                to: messageTarget, 
                timestamp: serverTimestamp(), 
                read: false 
            });
            setMessageText("");
            setShowMessageModal(false);
            showToast("Message Sent!");
        } catch (error) { showToast("Message failed", 'error'); }
    };

    // --- COMBAT FLOW INTEGRATION (MANUAL PUSH ONLY) ---
    const convertToCombatant = (char, uid) => {
        const data = char.liveData || char;
        const stats = data.stats || { dexterity: 10 };
        const dexMod = Math.floor(((stats.dexterity || 10) - 10) / 2);
        
        let maxHp = 10;
        let currentHp = 10;
        let tempHp = 0;

        if (data.hp) {
            if (typeof data.hp === 'object') {
                maxHp = parseInt(data.hp.max || 10);
                currentHp = parseInt(data.hp.current !== undefined ? data.hp.current : maxHp);
                tempHp = parseInt(data.hp.temp || 0);
            } else {
                maxHp = parseInt(data.hp || 10);
                currentHp = maxHp;
            }
        }

        const ac = parseInt(data.ac || 10);

        return {
            id: uid || Date.now().toString(),
            linkedId: uid, 
            name: data.name || "Unknown Player",
            type: 'player',
            ac: ac,
            maxHp: maxHp,
            hp: currentHp,
            tempHp: tempHp,
            bonus: dexMod, 
            dc: parseInt(data.dc || 10),
            xp: 0
        };
    };

    const addToCombatLibrary = (char, uid) => {
        try {
            const combatant = convertToCombatant(char, uid);
            const existingLib = JSON.parse(localStorage.getItem('combat_library') || '[]');
            const idx = existingLib.findIndex(c => c.linkedId === combatant.linkedId);
            let newLib = [...existingLib];
            if (idx >= 0) newLib[idx] = combatant;
            else newLib.push(combatant);
            
            localStorage.setItem('combat_library', JSON.stringify(newLib));
            
            // Dispatch event
            window.dispatchEvent(new Event('combat-storage-update'));
            
            showToast(`${combatant.name} added to Bestiary`);
        } catch (e) { console.error(e); showToast("Save failed", 'error'); }
    };

    const sendToCombatTracker = (char, uid) => {
        try {
            const combatant = convertToCombatant(char, uid);

            // 1. Opdater også Library
            const existingLib = JSON.parse(localStorage.getItem('combat_library') || '[]');
            const idx = existingLib.findIndex(c => c.linkedId === combatant.linkedId);
            let newLib = [...existingLib];
            if (idx >= 0) newLib[idx] = combatant;
            else newLib.push(combatant);
            localStorage.setItem('combat_library', JSON.stringify(newLib));

            // 2. Opdater Active Combat
            const currentCombatState = JSON.parse(localStorage.getItem('combat_state') || '{"combatants":[]}');
            let currentCombatants = currentCombatState.combatants || [];

            const activeIdx = currentCombatants.findIndex(c => c.linkedId === combatant.linkedId);
            if (activeIdx >= 0) {
                currentCombatants[activeIdx] = { 
                    ...currentCombatants[activeIdx], 
                    ...combatant, 
                    id: currentCombatants[activeIdx].id 
                };
            } else {
                currentCombatants.push(combatant);
            }

            localStorage.setItem('combat_state', JSON.stringify({ 
                ...currentCombatState, 
                combatants: currentCombatants 
            }));

            window.dispatchEvent(new Event('combat-storage-update'));
            
            showToast(`${combatant.name} sent to Combat!`);
        } catch (e) { 
            console.error("Fejl ved afsendelse:", e); 
            showToast("Send failed", 'error'); 
        }
    };

    // --- NY FUNKTION: SYNC PARTY & CREATE PRESET ---
    const addPartyToCombatFlow = () => {
        if (!campaignData?.playerCharacters) return showToast("No players found", 'error');
        try {
            const existingLib = JSON.parse(localStorage.getItem('combat_library') || '[]');
            const existingPresets = JSON.parse(localStorage.getItem('combat_presets') || '[]');
            
            let newLib = [...existingLib];
            const partyForPreset = [];

            // Gå gennem alle spillere
            Object.entries(campaignData.playerCharacters).forEach(([uid, p]) => {
                const c = convertToCombatant(p, uid);
                
                // 1. Opdater Library
                const idx = newLib.findIndex(l => l.linkedId === c.linkedId);
                if (idx >= 0) newLib[idx] = c;
                else newLib.push(c);

                // 2. Tilføj til preset
                // VIGTIGT: Preset-formatet skal matche det useCombatMethods forventer
                partyForPreset.push({ 
                    ...c, 
                    count: 1, 
                    libId: c.id 
                });
            });

            // 3. Gem Library
            localStorage.setItem('combat_library', JSON.stringify(newLib));

            // 4. Lav/Opdater Preset
            const presetName = `Party: ${campaignData.name}`;
            const cleanPresets = existingPresets.filter(p => p.name !== presetName);
            
            const newPreset = { 
                id: Date.now(), 
                name: presetName, 
                monsters: partyForPreset 
            };
            
            const finalPresets = [...cleanPresets, newPreset];
            localStorage.setItem('combat_presets', JSON.stringify(finalPresets));
            
            // 5. Giv besked til CombatFlow
            window.dispatchEvent(new Event('combat-storage-update'));
            showToast(`Party Preset Created: ${presetName}`);
        } catch (e) { console.error(e); showToast("Sync failed", 'error'); }
    };

    // --- CARDS ---
    const PlayerDetailCard = ({ player, uid }) => {
        const char = player.liveData || player;
        const stats = char.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
        const hp = char.hp || { current: 0, max: 0 };
        const level = char.level || 1;
        const pb = getProf(level);
        const getM = (s) => Math.floor(((s||10)-10)/2);
        const wisMod = getM(stats.wisdom);
        const perceptionProf = (char.proficiencies?.["Perception"] || 0); 
        const passivePerception = 10 + wisMod + (perceptionProf * pb);
        const abilityOrder = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

        let spellDc = null;
        if (char.isSpellcaster) {
            const ability = char.spellcastingAbility?.toLowerCase() || 'intelligence';
            const mod = getM(stats[ability] || 10);
            spellDc = 8 + pb + mod;
        }

        return (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-lg hover:border-amber-600 transition-all group relative">
                <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">{char.name}</h3>
                        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lvl {level} {char.species} {char.class}</div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => sendToCombatTracker(player, uid)} className="text-slate-500 hover:text-green-400 p-1 transition-colors" title="Add to Active Combat"><SwordIcon /></button>
                        <button onClick={() => setInspectingChar(char)} className="text-slate-500 hover:text-amber-400 p-1 transition-colors" title="Open Full Sheet"><EyeIcon /></button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                    <div className="bg-slate-950 rounded p-1.5 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase font-bold">AC</div><div className="text-xl font-bold text-blue-400 font-serif-dnd">{char.ac}</div></div>
                    <div className="bg-slate-950 rounded p-1.5 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase font-bold">HP</div><div className={`text-lg font-bold ${hp.current < hp.max/2 ? 'text-red-500' : 'text-green-500'}`}>{hp.current}<span className="text-xs text-slate-600">/{hp.max}</span></div></div>
                    <div className="bg-slate-950 rounded p-1.5 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase font-bold">Pass. Perc</div><div className="text-lg font-bold text-slate-300">{passivePerception}</div></div>
                    <div className="bg-slate-950 rounded p-1.5 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase font-bold">Speed</div><div className="text-lg font-bold text-slate-300">{char.speed}</div></div>
                </div>
                <div className="flex justify-between items-center text-xs bg-slate-950/50 p-2 rounded mb-3">
                    <div className="flex gap-4"><div><span className="text-slate-500 font-bold">Prof:</span> +{pb}</div>{spellDc && <div><span className="text-purple-400 font-bold">DC:</span> {spellDc}</div>}</div>
                    <div className="text-slate-500 italic truncate max-w-[100px]">{char.subclass}</div>
                </div>
                <div className="grid grid-cols-6 gap-1">
                    {abilityOrder.map((key) => (
                        <div key={key} className="flex flex-col items-center"><div className="text-[8px] uppercase font-bold text-slate-600">{key.substring(0,3)}</div><div className="text-[10px] font-bold text-slate-300">{formatMod(getM(stats[key]))}</div></div>
                    ))}
                </div>
            </div>
        );
    };

    const CampaignCard = ({ campaign, isDm }) => {
        const myAssignedChar = !isDm && campaign.playerCharacters && campaign.playerCharacters[currentUser.uid];
        const [isChangingChar, setIsChangingChar] = useState(false); 

        return (
            <div className={`p-5 rounded-xl border transition-all flex flex-col h-full bg-slate-900 border-slate-800 hover:border-slate-700`}>
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-200 truncate">{campaign.name}</h3>
                    <div className="text-xs text-slate-500 mt-1">DM: {isDm ? "Dig" : campaign.dmName}</div>
                </div>
                {isDm && <div className="bg-slate-950 p-2 rounded border border-slate-800 mb-4 flex justify-between items-center px-3"><span className="text-[10px] font-bold text-slate-500 uppercase">Code:</span><span className="text-lg font-mono font-bold text-white select-all">{campaign.joinCode}</span></div>}
                {!isDm && (
                    <div className="mb-4">
                        {myAssignedChar && !isChangingChar ? (
                            <div className="bg-slate-950/50 p-2 rounded border border-slate-700 flex items-center justify-between gap-3 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-slate-800 p-1.5 rounded-full text-slate-400 flex-shrink-0"><UserIcon /></div>
                                    <div className="overflow-hidden">
                                        <div className="text-sm font-bold text-slate-200 truncate">{myAssignedChar.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Lvl {myAssignedChar.level} {myAssignedChar.class}</div>
                                    </div>
                                </div>
                                <button onClick={() => setIsChangingChar(true)} className="text-slate-500 hover:text-amber-500 p-1 transition-colors opacity-0 group-hover:opacity-100" title="Change Character"><RefreshIcon /></button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="flex justify-between items-end"><label className="text-[10px] font-bold text-red-400 uppercase tracking-wide">Vælg Karakter</label>{isChangingChar && (<button onClick={() => setIsChangingChar(false)} className="text-[9px] text-slate-500 hover:text-slate-300 uppercase font-bold">Cancel</button>)}</div>
                                <select className="w-full bg-slate-950 border border-red-900/50 rounded text-sm p-2 text-slate-300 outline-none focus:border-red-500" onChange={(e) => handleAssignCharacter(campaign.id, e.target.value, setIsChangingChar)} defaultValue=""><option value="" disabled>-- Vælg --</option>{myCharacters.map(char => <option key={char.id} value={char.id}>{char.name} (Lvl {char.level})</option>)}</select>
                            </div>
                        )}
                    </div>
                )}
                <div className="flex gap-2 text-sm mt-auto pt-4 border-t border-slate-800/50">
                    <button onClick={() => connectToCampaign(campaign.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded border border-slate-700 flex items-center justify-center gap-2 transition-colors"><PlayIcon /> Play</button>
                    {isDm && <button onClick={() => handleDeleteClick(campaign.id)} className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded transition-colors"><TrashIcon /></button>}
                </div>
            </div>
        );
    };

    const activeCampaignData = createdCampaigns.find(c => c.id === activeCampaignId) || joinedCampaigns.find(c => c.id === activeCampaignId);
    const isDmForActive = campaignData?.dmId === currentUser?.uid;
    const activePlayers = campaignData?.playerCharacters ? Object.entries(campaignData.playerCharacters) : [];
    const activeIncomingMsg = messageQueue.length > 0 ? messageQueue[0] : null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans pb-32 relative">
            <div className="max-w-6xl mx-auto">
                {activeCampaignId && campaignData && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-900 border border-amber-500/50 rounded-xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative">
                            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">Session Active</div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-amber-500 font-serif-dnd">{campaignData.name}</h1>
                                    <div className="text-sm text-slate-400 mt-1">Code: <span className="font-mono text-white bg-slate-800 px-2 rounded select-all">{campaignData.joinCode}</span></div>
                                </div>
                                <div className="flex gap-2">
                                    {isDmForActive && (
                                        <>
                                            <button onClick={addPartyToCombatFlow} className="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 font-bold rounded border border-emerald-700/50 transition-colors text-sm flex items-center gap-2"><SwordIcon /> Sync Party</button>
                                            <button onClick={() => setShowMessageModal(true)} className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-bold rounded border border-blue-700/50 transition-colors text-sm flex items-center gap-2"><MessageIcon /> Message</button>
                                        </>
                                    )}
                                    <button onClick={disconnectCampaign} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded border border-slate-600 transition-colors text-sm">Exit</button>
                                </div>
                            </div>
                            {isDmForActive ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activePlayers.length === 0 ? <div className="col-span-full text-center py-8 text-slate-500 italic">Waiting for players...</div> : activePlayers.map(([uid, p]) => <PlayerDetailCard key={uid} uid={uid} player={p} />)}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-950/50 rounded border border-slate-800 text-center"><p className="text-slate-300">You are connected as a Player.</p></div>
                            )}
                        </div>
                    </div>
                )}

                <div className={activeCampaignId ? "opacity-50 hover:opacity-100 transition-opacity" : ""}>
                    <header className="mb-8 border-b border-slate-800 pb-4"><h2 className="text-2xl font-bold text-slate-300">Campaigns</h2></header>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><PlusIcon /> Create (DM)</h2>
                            <form onSubmit={handleCreateCampaign} className="flex gap-2"><input type="text" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="Name..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm" /><button type="submit" disabled={isProcessing || !newCampaignName} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg text-sm">Create</button></form>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><SearchIcon /> Join (Player)</h2>
                            <form onSubmit={handleJoinCampaign} className="flex gap-2"><input type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())} placeholder="CODE" maxLength={4} className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest outline-none text-sm uppercase" /><button type="submit" disabled={isProcessing || joinCodeInput.length < 4} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm">Join</button></form>
                        </div>
                    </div>
                    {isLoading ? <div className="text-center text-slate-500">Loading...</div> : (
                        <div className="space-y-8">
                            {createdCampaigns.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{createdCampaigns.map(c => <CampaignCard key={c.id} campaign={c} isDm={true} />)}</div>}
                            {joinedCampaigns.length > 0 && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{joinedCampaigns.map(c => <CampaignCard key={c.id} campaign={c} isDm={false} />)}</div>}
                        </div>
                    )}
                </div>
            </div>

            {/* MESSAGE MODAL MED DROPDOWN */}
            {showMessageModal && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
                        <h3 className="text-lg font-bold text-white mb-4">Send Message</h3>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">To</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm outline-none"
                                    value={messageTarget}
                                    onChange={(e) => setMessageTarget(e.target.value)}
                                >
                                    <option value="ALL">Everyone (Broadcast)</option>
                                    {activePlayers.map(([uid, p]) => (
                                        <option key={uid} value={uid}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm min-h-[100px] outline-none focus:border-blue-500" placeholder="Message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} autoFocus />
                            <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowMessageModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button><button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg text-sm">Send</button></div>
                        </form>
                    </div>
                </div>
            )}
            
            {activeIncomingMsg && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-lg animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-900/95 border-2 border-amber-500 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.3)] p-6 relative overflow-hidden backdrop-blur-md">
                        <button onClick={() => setMessageQueue(prev => prev.slice(1))} className="absolute top-2 right-2 text-slate-500 hover:text-white p-2"><CloseIcon /></button>
                        <div className="flex gap-4">
                            <div className="bg-amber-900/30 p-3 rounded-full h-fit border border-amber-700/50"><MessageIcon className="text-amber-500" /></div>
                            <div><h4 className="text-amber-500 font-bold uppercase text-xs tracking-widest mb-1">Message from {activeIncomingMsg.sender}</h4><p className="text-lg font-serif text-white leading-relaxed">{activeIncomingMsg.text}</p></div>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border-2 border-red-900 w-full max-w-md rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.2)] p-6 relative text-center">
                        <div className="flex justify-center mb-4"><div className="bg-red-900/20 p-4 rounded-full border border-red-900/50"><AlertTriangle /></div></div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Campaign?</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">It will be lost forever.</p>
                        <div className="flex gap-3 justify-center"><button onClick={() => setDeleteConfirmation({ isOpen: false, campaignId: null })} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors text-sm">Cancel</button><button onClick={confirmDelete} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-colors text-sm">Delete Forever</button></div>
                    </div>
                </div>
            )}

            {inspectingChar && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl relative flex flex-col">
                        <div className="absolute top-4 right-4 z-50"><button onClick={() => setInspectingChar(null)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg"><CloseIcon /></button></div>
                        <div className="bg-amber-900/80 text-amber-100 text-center text-xs font-bold uppercase py-1 tracking-widest">Spectator Mode (Read Only)</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar"><CharacterSheetView character={inspectingChar} onUpdate={() => {}} onBack={() => setInspectingChar(null)} onExport={() => {}} saveStatus="Viewing" /></div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-emerald-900/90 border-emerald-500 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle /> : <AlertTriangle className="text-white" />}
                        <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignManager;