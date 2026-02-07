import React, { useState } from 'react';
import { useCampaign } from '../context/CampaignContext'; // Tjek at stien passer til din CampaignContext
import { Icons } from './CharacterIcons'; // Tjek at stien passer til dine ikoner

const SendItemModal = ({ show, onClose, item }) => {
    const { campaignData, sendItemToCharacter } = useCampaign();
    const [selectedCharId, setSelectedCharId] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    if (!show || !item) return null;

    // Vi finder listen af spillere fra kampagnen
    // Forudsætter at campaignData.players er et array af objekter: { uid, displayName, characterId, characterName }
    // Hvis din struktur er anderledes, skal dette måske tilpasses
    const players = campaignData?.players || [];
    const validPlayers = players.filter(p => p.characterId); // Kun dem der har en character connected

    const handleSend = async () => {
        if (!selectedCharId) return;
        
        setIsSending(true);
        setStatusMsg(null);

        const result = await sendItemToCharacter(selectedCharId, item);
        
        setIsSending(false);
        
        if (result.success) {
            // Vis succes besked kortvarigt og luk
            setStatusMsg({ type: 'success', text: result.message });
            setTimeout(() => {
                setStatusMsg(null);
                onClose();
                setSelectedCharId(""); // Reset
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
                        <span className="text-purple-500"><Icons.Gem /></span> Send Item
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><Icons.X /></button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    
                    {/* Item Preview */}
                    <div className="bg-black/40 border border-zinc-800 rounded-lg p-3 flex items-start gap-3">
                        <div className="bg-zinc-800 p-2 rounded text-zinc-400">
                            <Icons.Bag /> {/* Eller et andet generisk item ikon */}
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
                                        onClick={() => setSelectedCharId(p.characterId)}
                                        className={`w-full flex items-center justify-between p-2 rounded border transition-all ${selectedCharId === p.characterId 
                                            ? 'bg-purple-900/30 border-purple-500 text-white' 
                                            : 'bg-black/20 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'}`}
                                    >
                                        <span className="text-xs font-bold">{p.characterName || "Unknown Character"}</span>
                                        <span className="text-[9px] uppercase tracking-wider opacity-50">{p.displayName}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800 rounded">
                                No players found in campaign.
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
                        disabled={!selectedCharId || isSending}
                        className={`px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg transition-all text-xs uppercase tracking-wide flex items-center gap-2 ${(!selectedCharId || isSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSending ? 'Sending...' : <><Icons.PaperPlane /> Send Item</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendItemModal;