import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';
import { db } from '../../firebase';
import { 
    collection, query, where, 
    getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, 
    arrayUnion, arrayRemove, deleteField, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import CharacterSheetView from '../CharacterSheet/components/CharacterSheetView';

// --- COMPONENTS ---
import CampaignCard from './components/CampaignCard';
import PlayerDetailCard from './components/PlayerDetailCard';
import RulesReference from '../../components/QuickTools/RulesReference';
import QuickDice from '../../components/QuickTools/QuickDice';

// --- ICONS ---
import { 
    PlusIcon, SearchIcon, CloseIcon, 
    MessageIcon, AlertTriangle, SwordIcon, CheckCircle,
    BookIcon, DiceIcon
} from './components/CampaignIcons';

const CampaignManager = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { 
        activeCampaignId, 
        connectToCampaign, 
        disconnectCampaign, 
        campaignData,
        sendToCombat,        
        syncPartyToCombat    
    } = useCampaign(); 
    
    const [createdCampaigns, setCreatedCampaigns] = useState([]);
    const [joinedCampaigns, setJoinedCampaigns] = useState([]);
    const [myCharacters, setMyCharacters] = useState([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState("");
    const [joinCodeInput, setJoinCodeInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    
    // --- INSPECT STATE ---
    const [inspectingChar, setInspectingChar] = useState(null); // Read only

    // STATES
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageTarget, setMessageTarget] = useState("ALL");
    const [messageQueue, setMessageQueue] = useState([]);
    const [toast, setToast] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, campaignId: null });

    // QUICK TOOLS STATES
    const [showRules, setShowRules] = useState(false);
    const [showDice, setShowDice] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- SECURITY CHECK: CLEAR SESSION ON USER CHANGE ---
    useEffect(() => {
        if (!currentUser) {
            if (activeCampaignId) disconnectCampaign();
            return;
        }
        if (activeCampaignId && campaignData) {
            const isDm = campaignData.dmId === currentUser.uid;
            const isPlayer = campaignData.players?.includes(currentUser.uid);
            if (!isDm && !isPlayer) disconnectCampaign();
        }
    }, [currentUser, activeCampaignId, campaignData, disconnectCampaign]);

    // FETCH DATA
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

    // MESSAGES LISTENER
    useEffect(() => {
        if (!activeCampaignId || !currentUser) return;
        const q = query(collection(db, "campaigns", activeCampaignId, "messages"), where("to", "==", "DM"), where("read", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    const msgId = change.doc.id;
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

    const generateJoinCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // --- HANDLERS ---

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        if (!newCampaignName.trim()) return;
        setIsProcessing(true);
        try {
            const newCampaign = { 
                name: newCampaignName, 
                dmId: currentUser.uid, 
                dmName: currentUser.displayName || "DM", 
                joinCode: generateJoinCode(), 
                createdAt: Date.now(), 
                players: [], 
                playerCharacters: {} 
            };
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
            const q = query(collection(db, "campaigns"), where("joinCode", "==", joinCodeInput.trim()));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { 
                showToast("Invalid Code (Check casing)", 'error'); 
                setIsProcessing(false); 
                return; 
            }
            const campaignDoc = querySnapshot.docs[0];
            const campaignData = campaignDoc.data();
            if (!campaignData.players.includes(currentUser.uid)) {
                await updateDoc(doc(db, "campaigns", campaignDoc.id), { players: arrayUnion(currentUser.uid) });
            }
            setJoinCodeInput("");
            connectToCampaign(campaignDoc.id);
            showToast("Campaign Joined!");
        } catch (error) { showToast("Join failed.", 'error'); }
        setIsProcessing(false);
    };

    const handleRenameCampaign = async (campaignId, newName) => {
        try {
            await updateDoc(doc(db, "campaigns", campaignId), { name: newName });
            setCreatedCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, name: newName } : c));
            showToast("Campaign Renamed");
        } catch (e) { showToast("Rename failed", "error"); }
    };

    const handleKickPlayer = async (uidToKick, playerName) => {
        if (!window.confirm(`Are you sure you want to remove ${playerName} from the campaign?`)) return;
        try {
            const campaignRef = doc(db, "campaigns", activeCampaignId);
            await updateDoc(campaignRef, {
                players: arrayRemove(uidToKick),
                [`playerCharacters.${uidToKick}`]: deleteField()
            });
            showToast(`${playerName} removed.`);
        } catch (e) { 
            console.error("Kick failed:", e);
            showToast("Kick failed", "error"); 
        }
    };

    const handleAssignCharacter = async (campaignId, charId, setIsChanging) => {
        if (!campaignId || !charId) return;
        const character = myCharacters.find(c => c.id === charId);
        if (!character) return;
        
        setIsProcessing(true);
        try {
            // FIX: Hent kampagnen først for at sikre, at spilleren stadig er med
            const campaignRef = doc(db, "campaigns", campaignId);
            const campaignSnap = await getDoc(campaignRef);
            
            if (campaignSnap.exists()) {
                const data = campaignSnap.data();
                
                // SIKKERHEDSTJEK: Er jeg stadig i 'players' listen?
                if (!data.players || !data.players.includes(currentUser.uid)) {
                    showToast("You have been removed from this campaign.", 'error');
                    // Fjern den fra spillerens lokale liste, så den forsvinder fra UI
                    setJoinedCampaigns(prev => prev.filter(c => c.id !== campaignId));
                    setIsProcessing(false);
                    return;
                }

                // Hvis godkendt, opdater karakteren
                await updateDoc(campaignRef, { [`playerCharacters.${currentUser.uid}`]: character });
                if (setIsChanging) setIsChanging(false);
                showToast("Character Assigned!");
            }
        } catch (error) { 
            console.error("Assignment error:", error);
            showToast("Assignment failed", 'error'); 
        }
        setIsProcessing(false);
    };

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

    const handleSendToCombat = (char, uid) => {
        const success = sendToCombat(char, uid);
        if (success) showToast(`${char.name} sent to Combat!`);
        else showToast("Failed to send", 'error');
    };

    const handleSyncParty = () => {
        const success = syncPartyToCombat(campaignData?.playerCharacters);
        if (success) showToast("Party synced to Combat Preset!");
        else showToast("Sync failed (No players?)", 'error');
    };

    const isDmForActive = campaignData?.dmId === currentUser?.uid;
    const activePlayers = campaignData?.playerCharacters 
        ? Object.entries(campaignData.playerCharacters).sort(([, a], [, b]) => (a.name || "").localeCompare(b.name || ""))
        : [];
    const activeIncomingMsg = messageQueue.length > 0 ? messageQueue[0] : null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans pb-32 relative">
            <div className="max-w-6xl mx-auto">
                
                {/* ACTIVE SESSION BANNER */}
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
                                            <button onClick={handleSyncParty} className="px-4 py-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 font-bold rounded border border-emerald-700/50 transition-colors text-sm flex items-center gap-2"><SwordIcon /> Add Party</button>
                                            <button onClick={() => setShowMessageModal(true)} className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-bold rounded border border-blue-700/50 transition-colors text-sm flex items-center gap-2"><MessageIcon /> Message</button>
                                        </>
                                    )}
                                    <button onClick={disconnectCampaign} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded border border-slate-600 transition-colors text-sm">Exit</button>
                                </div>
                            </div>
                            
                            {isDmForActive ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activePlayers.length === 0 ? <div className="col-span-full text-center py-8 text-slate-500 italic">Waiting for players...</div> : activePlayers.map(([uid, p]) => (
                                        <PlayerDetailCard 
                                            key={uid} 
                                            uid={uid} 
                                            player={p} 
                                            isDm={isDmForActive}
                                            onSendToCombat={handleSendToCombat} 
                                            onInspect={setInspectingChar}
                                            onKick={handleKickPlayer}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-950/50 rounded border border-slate-800 text-center"><p className="text-slate-300">You are connected as a Player.</p></div>
                            )}
                        </div>
                    </div>
                )}

                {/* CAMPAIGN LISTS */}
                <div className={activeCampaignId ? "opacity-50 hover:opacity-100 transition-opacity" : ""}>
                    <header className="mb-8 border-b border-slate-800 pb-4"><h2 className="text-2xl font-bold text-slate-300">Campaigns</h2></header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* CREATE */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><PlusIcon /> Create (DM)</h2>
                            <form onSubmit={handleCreateCampaign} className="flex gap-2"><input type="text" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="Name..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none text-sm" /><button type="submit" disabled={isProcessing || !newCampaignName} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg text-sm">Create</button></form>
                        </div>
                        
                        {/* JOIN */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><SearchIcon /> Join (Player)</h2>
                            <form onSubmit={handleJoinCampaign} className="flex gap-2">
                                <input type="text" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} placeholder="CODE" maxLength={4} className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest outline-none text-sm" />
                                <button type="submit" disabled={isProcessing || joinCodeInput.length < 4} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-sm">Join</button>
                            </form>
                        </div>
                    </div>

                    {isLoading ? <div className="text-center text-slate-500">Loading...</div> : (
                        <div className="space-y-8">
                            {createdCampaigns.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {createdCampaigns.map(c => (
                                        <CampaignCard 
                                            key={c.id} 
                                            campaign={c} 
                                            isDm={true} 
                                            currentUser={currentUser}
                                            myCharacters={myCharacters}
                                            onConnect={connectToCampaign}
                                            onDelete={(id) => setDeleteConfirmation({ isOpen: true, campaignId: id })}
                                            onRename={handleRenameCampaign}
                                            onAssignCharacter={handleAssignCharacter}
                                        />
                                    ))}
                                </div>
                            )}
                            {joinedCampaigns.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {joinedCampaigns.map(c => (
                                        <CampaignCard 
                                            key={c.id} 
                                            campaign={c} 
                                            isDm={false} 
                                            currentUser={currentUser}
                                            myCharacters={myCharacters}
                                            onConnect={connectToCampaign}
                                            onDelete={() => {}}
                                            onRename={() => {}}
                                            onAssignCharacter={handleAssignCharacter}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS & TOASTS --- */}

            {/* Message Modal */}
            {showMessageModal && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
                        <h3 className="text-lg font-bold text-white mb-4">Send Message</h3>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">To</label>
                                <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm outline-none" value={messageTarget} onChange={(e) => setMessageTarget(e.target.value)}>
                                    <option value="ALL">Everyone (Broadcast)</option>
                                    {activePlayers.map(([uid, p]) => <option key={uid} value={uid}>{p.name}</option>)}
                                </select>
                            </div>
                            <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white text-sm min-h-[100px] outline-none focus:border-blue-500" placeholder="Message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} autoFocus />
                            <div className="flex gap-2 justify-end"><button type="button" onClick={() => setShowMessageModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancel</button><button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg text-sm">Send</button></div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Incoming Message */}
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

            {/* Delete Confirmation */}
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

            {/* Character Inspection (Read Only) */}
            {inspectingChar && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl relative flex flex-col">
                        <div className="absolute top-4 right-4 z-50"><button onClick={() => setInspectingChar(null)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg"><CloseIcon /></button></div>
                        <div className="bg-amber-900/80 text-amber-100 text-center text-xs font-bold uppercase py-1 tracking-widest">Spectator Mode (Read Only)</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar"><CharacterSheetView character={inspectingChar} onUpdate={() => {}} onBack={() => setInspectingChar(null)} onExport={() => {}} saveStatus="Viewing" /></div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${toast.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : 'bg-emerald-900/90 border-emerald-500 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle /> : <AlertTriangle className="text-white" />}
                        <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* FLOATING DM TOOLS DOCK */}
            {activeCampaignId && isDmForActive && (
                <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
                    <button onClick={() => setShowDice(!showDice)} className={`p-3 rounded-full shadow-xl transition-all hover:scale-110 ${showDice ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-500 border border-amber-500/30'}`} title="Quick Dice"><DiceIcon /></button>
                    <button onClick={() => setShowRules(true)} className="p-3 rounded-full bg-slate-800 text-blue-400 border border-blue-500/30 shadow-xl transition-all hover:scale-110 hover:bg-blue-900/50" title="Rules Reference"><BookIcon /></button>
                </div>
            )}

            {showRules && <RulesReference onClose={() => setShowRules(false)} />}
            {showDice && <QuickDice onClose={() => setShowDice(false)} />}
        </div>
    );
};

export default CampaignManager;