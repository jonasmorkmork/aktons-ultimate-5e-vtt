import React, { useState } from 'react';
import { RefreshIcon, PlayIcon, TrashIcon, UserIcon, EditIcon, CheckCircle, CloseIcon } from './CampaignIcons'; 

const CampaignCard = ({ campaign, isDm, currentUser, myCharacters, onConnect, onDelete, onAssignCharacter, onRename }) => {
    const myAssignedChar = !isDm && campaign.playerCharacters && campaign.playerCharacters[currentUser.uid];
    const [isChangingChar, setIsChangingChar] = useState(false); 
    
    // REDIGER NAVN STATE
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(campaign.name);

    const handleAssign = (charId) => {
        onAssignCharacter(campaign.id, charId, setIsChangingChar);
    };

    const handleSaveName = () => {
        if (editName.trim() && editName !== campaign.name) {
            onRename(campaign.id, editName);
        }
        setIsEditingName(false);
    };

    return (
        <div className={`p-5 rounded-xl border transition-all flex flex-col h-full bg-slate-900 border-slate-800 hover:border-slate-700`}>
            <div className="mb-4">
                {/* TITEL / REDIGER NAVN */}
                {isEditingName ? (
                    <div className="flex items-center gap-2 mb-1">
                        <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-950 border border-amber-500 rounded px-2 py-1 text-white font-bold text-lg w-full outline-none"
                            autoFocus
                        />
                        <button onClick={handleSaveName} className="text-emerald-500 hover:text-emerald-400"><CheckCircle /></button>
                        <button onClick={() => { setIsEditingName(false); setEditName(campaign.name); }} className="text-red-500 hover:text-red-400"><CloseIcon /></button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group/title">
                        <h3 className="text-xl font-bold text-slate-200 truncate" title={campaign.name}>{campaign.name}</h3>
                        {isDm && (
                            <button onClick={() => setIsEditingName(true)} className="text-slate-600 hover:text-amber-500 opacity-0 group-hover/title:opacity-100 transition-opacity">
                                <EditIcon size={14} />
                            </button>
                        )}
                    </div>
                )}
                <div className="text-xs text-slate-500 mt-1">DM: {isDm ? "Dig" : campaign.dmName}</div>
            </div>
            
            {isDm && (
                <div className="bg-slate-950 p-2 rounded border border-slate-800 mb-4 flex justify-between items-center px-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Code:</span>
                    <span className="font-mono text-amber-500 font-bold select-all tracking-widest">{campaign.joinCode}</span>
                </div>
            )}

            {!isDm && (
                <div className="mb-4 flex-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Din Karakter</div>
                    {myAssignedChar && !isChangingChar ? (
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group">
                            <div>
                                <div className="font-bold text-slate-300">{myAssignedChar.name}</div>
                                <div className="text-xs text-slate-500">Level {myAssignedChar.level} {myAssignedChar.class}</div>
                            </div>
                            <button onClick={() => setIsChangingChar(true)} className="text-slate-600 hover:text-white p-1"><RefreshIcon size={14}/></button>
                        </div>
                    ) : (
                        <div className="space-y-2 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Vælg karakter:</span>
                                {myAssignedChar && <button onClick={() => setIsChangingChar(false)} className="text-[10px] text-red-400 hover:text-red-300">Cancel</button>}
                            </div>
                            <select 
                                className="w-full bg-slate-950 border border-red-900/50 rounded text-sm p-2 text-slate-300 outline-none focus:border-red-500" 
                                onChange={(e) => handleAssign(e.target.value)} 
                                defaultValue=""
                            >
                                <option value="" disabled>-- Vælg --</option>
                                {myCharacters.map(char => <option key={char.id} value={char.id}>{char.name} (Lvl {char.level})</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}

            <div className="flex gap-2 text-sm mt-auto pt-4 border-t border-slate-800/50">
                <button onClick={() => onConnect(campaign.id)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded border border-slate-700 flex items-center justify-center gap-2 transition-colors">
                    <PlayIcon /> Play
                </button>
                {isDm && (
                    <button onClick={() => onDelete(campaign.id)} className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded transition-colors" title="Slet Kampagne">
                        <TrashIcon />
                    </button>
                )}
            </div>
        </div>
    );
};

export default CampaignCard;