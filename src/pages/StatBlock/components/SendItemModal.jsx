import React, { useState } from 'react';
import { useCampaign } from '../../../context/CampaignContext'; 

// --- LOKALE IKONER ---
const Icons = {
    Gem: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l4 6-10 13L2 9Z" />
            <path d="M11 3 8 9l4 13 4-13-3-6" />
        </svg>
    ),
    X: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    ),
    Bag: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    ),
    PaperPlane: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    )
};

const SendItemModal = ({ show, onClose, item }) => {
    const { campaignData, sendItemToCharacter } = useCampaign();
    // Vi gemmer nu hele spiller-objektet i state for at få adgang til både UID og CharID
    const [selectedPlayer, setSelectedPlayer] = useState(null); 
    const [isSending, setIsSending] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    if (!show || !item) return null;

    // Vi finder listen af spillere fra kampagnen
    const playerMap = campaignData?.playerCharacters || {};
    
    // Vi omdanner objektet til et array vi kan bruge
    const validPlayers = Object.entries(playerMap).map(([uid, charData]) => ({
        uid: uid,
        characterId: charData.id,
        characterName: charData.name,
        level: charData.level
    }));

    const handleSend = async () => {
        if (!selectedPlayer) return;
        
        setIsSending(true);
        setStatusMsg(null);

        // RETTELSE HER: Vi fjerner .characterId, så 'item' bliver det 2. argument
        const result = await sendItemToCharacter(selectedPlayer.uid, item);
        
        setIsSending(false);
        
        if (result.success) {
            setStatusMsg({ type: 'success', text: result.message });
            setTimeout(() => {
                setStatusMsg(null);
                onClose();
                setSelectedPlayer(null); // Reset
            }, 1500);
        } else {
            setStatusMsg({ type: 'error', text: result.message });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Klik udenfor for at lukke */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-xl shadow-2xl flex flex-col relative z-10 overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <span className="text-purple-500">{Icons.Gem}</span> Send Item
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">{Icons.X}</button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    
                    {/* Item Preview */}
                    <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 flex items-start gap-3">
                        <div className="bg-zinc-800 p-2 rounded text-zinc-400">
                            {Icons.Bag}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-zinc-200">{item.name}</div>
                            <div className="text-[10px] text-zinc-500 uppercase font-bold">{item.type || "Item"}</div>
                        </div>
                    </div>

                    {/* Player Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Select Character</label>
                        
                        {validPlayers.length > 0 ? (
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {validPlayers.map(p => (
                                    <button
                                        key={p.characterId}
                                        onClick={() => setSelectedPlayer(p)}
                                        className={`w-full flex items-center justify-between p-2 rounded border transition-all ${selectedPlayer?.characterId === p.characterId 
                                            ? 'bg-purple-900/30 border-purple-500 text-white' 
                                            : 'bg-black/20 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}`}
                                    >
                                        <span className="text-xs font-bold">{p.characterName || "Unknown Character"}</span>
                                        <span className="text-[9px] uppercase tracking-wider opacity-50">Lvl {p.level || "?"}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800 rounded">
                                No players found in campaign. <br/>
                                <span className="text-[10px] opacity-70">(Make sure a player has joined & assigned a character)</span>
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {statusMsg && (
                        <div className={`text-xs font-bold text-center p-2 rounded ${statusMsg.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {statusMsg.text}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-3 border-t border-zinc-800 bg-black/20 flex justify-end gap-2">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white uppercase transition-colors"
                        disabled={isSending}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend} 
                        disabled={!selectedPlayer || isSending}
                        className={`px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg transition-all text-xs uppercase tracking-wide flex items-center gap-2 ${(!selectedPlayer || isSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSending ? 'Sending...' : <>{Icons.PaperPlane} Send Item</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendItemModal;