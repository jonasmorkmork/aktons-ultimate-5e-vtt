import React, { useEffect, useRef } from 'react';
import * as Icons from './CombatIcons';
import CombatSettingsModal from './CombatSettingsModal';

const { UserPlus, Sword, Keyboard, Search, Clipboard, Trash2, X, Heart, Shield } = Icons; 

const CombatModals = ({ logic }) => {
    const { 
        confirmDialog, setConfirmDialog, 
        combatDamageModal, setCombatDamageModal, hpEditValue, setHpEditValue,
        showShortcuts, setShowShortcuts, 
        srdModalOpen, setSrdModalOpen, srdQuery, setSrdQuery, srdResults, 
        parserModalOpen, setParserModalOpen, parseText, setParseText,
        initModal, setInitModal, 
        
        executeRunPreset, handleImportSrdMonster, handleParseStatBlock,
        
        // Hent nødvendige metoder fra logic
        updateHP, setHpEditId, hpEditId, 
        setCombatants, combatants, addLog 
    } = logic;

    const damageInputRef = useRef(null);

    // Fokusér når modal åbner
    useEffect(() => {
        if (combatDamageModal && damageInputRef.current) {
            damageInputRef.current.focus();
        }
    }, [combatDamageModal]);

    // --- HANDLERS ---
    const applyCombatDamage = (type) => {
        if (!hpEditValue || !hpEditId) return;
        const val = parseInt(hpEditValue);
        
        const finalVal = type === 'damage' ? -val : val;
        
        if (type === 'temp') {
             updateHP(hpEditId, val, true); 
        } else {
             updateHP(hpEditId, finalVal);
        }

        closeDamageModal();
    };

    const closeDamageModal = () => {
        setCombatDamageModal(false);
        setHpEditId(null); 
        setHpEditValue('');
    };

    const handleModifyCombatInput = (factor) => {
        if(!hpEditValue) return;
        const val = Math.floor(parseInt(hpEditValue) * factor);
        setHpEditValue(val.toString());
    };

    const handleKeyDown = (e) => {
        e.stopPropagation();

        if (e.key === 'Enter') {
            e.preventDefault();
            applyCombatDamage('damage'); 
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeDamageModal();
        } else if (e.key.toLowerCase() === 'r') {
            e.preventDefault();
            handleModifyCombatInput(0.5); 
        } else if (e.key.toLowerCase() === 'v') {
            e.preventDefault();
            handleModifyCombatInput(2); 
        } else if (e.key.toLowerCase() === 'h') {
            e.preventDefault();
            applyCombatDamage('heal');
        } else if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            applyCombatDamage('temp');
        }
    };

    // Robust Data Udpakning
    const initGroup = initModal ? (initModal.players || initModal.group || (Array.isArray(initModal) ? initModal : [])) : [];
    const initMonsters = initModal?.monsters || [];

    return (
        <>
            {/* --- DAMAGE / HEAL MODAL --- */}
            {combatDamageModal && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl p-6 relative">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Sword className="text-red-500" /> Apply Damage / Heal
                        </h3>
                        
                        <div className="mb-6">
                            <input 
                                ref={damageInputRef}
                                type="number" 
                                className="w-full bg-black/50 border border-slate-600 rounded-lg p-4 text-3xl text-center text-white font-mono focus:border-blue-500 focus:outline-none"
                                placeholder="0"
                                value={hpEditValue}
                                onChange={(e) => setHpEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1 font-mono uppercase">
                                <span>[R]esist (½)</span>
                                <span>[V]uln (x2)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => applyCombatDamage('heal')} className="flex flex-col items-center justify-center gap-1 p-3 rounded bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800 text-emerald-400 transition-colors">
                                <Heart size={18} />
                                <span className="text-xs font-bold">HEAL (H)</span>
                            </button>
                            <button onClick={() => applyCombatDamage('temp')} className="flex flex-col items-center justify-center gap-1 p-3 rounded bg-blue-900/30 hover:bg-blue-800/50 border border-blue-800 text-blue-400 transition-colors">
                                <Shield size={18} />
                                <span className="text-xs font-bold">TEMP (T)</span>
                            </button>
                            <button onClick={() => applyCombatDamage('damage')} className="flex flex-col items-center justify-center gap-1 p-3 rounded bg-red-900/30 hover:bg-red-800/50 border border-red-800 text-red-400 transition-colors">
                                <Sword size={18} />
                                <span className="text-xs font-bold">DMG (Ent)</span>
                            </button>
                        </div>

                        <button onClick={closeDamageModal} className="absolute top-2 right-2 p-2 text-slate-600 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* --- CONFIRM DIALOG --- */}
            {confirmDialog && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl p-6 text-center">
                        <h3 className="text-lg font-bold text-white mb-2">{confirmDialog.title}</h3>
                        <p className="text-slate-400 text-sm mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button 
                                onClick={() => { 
                                    if (confirmDialog.onConfirm) confirmDialog.onConfirm(); 
                                    setConfirmDialog(null); 
                                }} 
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- SRD / PARSER MODALS --- */}
            {srdModalOpen && (
                <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-2xl h-[80vh] rounded-xl border border-slate-700 flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="font-bold text-white flex items-center gap-2"><Search /> SRD Lookup</h2>
                            <button onClick={() => setSrdModalOpen(false)}><X className="text-slate-500" /></button>
                        </div>
                        <div className="p-4 border-b border-slate-800">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search monster (e.g. 'Goblin')..." 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-blue-500"
                                value={srdQuery}
                                onChange={(e) => setSrdQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {srdResults.map((m) => (
                                <button key={m.index} onClick={() => { handleImportSrdMonster(m.index); setSrdModalOpen(false); }} className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 hover:border-blue-500 transition-all flex justify-between group">
                                    <span className="font-bold text-slate-200 group-hover:text-white">{m.name}</span>
                                    <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">Import</span>
                                </button>
                            ))}
                            {srdResults.length === 0 && srdQuery && <div className="text-center text-slate-500 py-10">No results found.</div>}
                        </div>
                    </div>
                </div>
            )}

            {parserModalOpen && (
                <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl p-6">
                        <h2 className="font-bold text-white mb-4 flex items-center gap-2"><Clipboard /> Paste Statblock</h2>
                        <textarea 
                            className="w-full h-64 bg-slate-950 border border-slate-700 rounded p-4 text-xs font-mono text-slate-300 outline-none focus:border-blue-500 mb-4"
                            placeholder={"Paste text from PDF or site here...\n\nGoblin\nSmall humanoid...\nAC 15..."}
                            value={parseText}
                            onChange={(e) => setParseText(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setParserModalOpen(false)} className="text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={() => { handleParseStatBlock(parseText); setParserModalOpen(false); setParseText(''); }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Parse & Add</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- GROUP INITIATIVE MODAL --- */}
            {initModal && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            
                            // 1. Klargør spillere (opdater med init/hp fra formen)
                            const readyPlayers = initGroup.map((p, i) => ({
                                ...p,
                                initiative: parseInt(formData.get(`init-${p.id}-${i}`)) || 0,
                                hp: parseInt(formData.get(`hp-${p.id}-${i}`)) || p.hp || 10,
                                maxHp: parseInt(formData.get(`hp-${p.id}-${i}`)) || p.maxHp || 10
                            }));

                            // 2. Klargør monstre
                            const readyMonsters = executeRunPreset ? [] : initMonsters; 
                            
                            // 3. Tilføj ALT til combatants listen
                            setCombatants(prev => {
                                const combined = [...prev, ...readyPlayers, ...readyMonsters];
                                return combined.sort((a, b) => b.initiative - a.initiative);
                            });

                            if (addLog) addLog(`Added ${readyPlayers.length} heroes and ${readyMonsters.length} monsters`, 'info');
                            setInitModal(null);
                        }} 
                        className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-xl shadow-2xl"
                    >
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><UserPlus /> Add Party to Combat</h3>
                            <p className="text-slate-400 text-sm">Set Initiative and HP for incoming players.</p>
                        </div>
                        
                        <div className="overflow-y-auto p-6 space-y-2">
                            {initGroup.length === 0 ? <div className="text-slate-500 italic">No players found...</div> : (
                                initGroup.map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-4 bg-slate-950/50 p-3 rounded border border-slate-800">
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-200">{p.name}</div>
                                            <div className="text-xs text-slate-500">Lvl {p.level} {p.class}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-500 uppercase font-bold">Init</label>
                                            <input 
                                                autoFocus={i === 0}
                                                name={`init-${p.id}-${i}`} 
                                                type="number" 
                                                placeholder="0" 
                                                className="w-16 bg-slate-800 border border-slate-600 rounded p-2 text-center text-lg focus:border-blue-500 focus:outline-none text-white"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-500 uppercase font-bold">HP</label>
                                            <input 
                                                name={`hp-${p.id}-${i}`} 
                                                type="number" 
                                                defaultValue={p.hp?.current || p.hp || 10} 
                                                className="w-20 bg-slate-800 border border-slate-600 rounded p-2 text-center text-lg focus:border-green-500 focus:outline-none text-white"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
                            <button type="button" onClick={() => setInitModal(null)} className="px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg transition-colors">Add to Combat</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default CombatModals;