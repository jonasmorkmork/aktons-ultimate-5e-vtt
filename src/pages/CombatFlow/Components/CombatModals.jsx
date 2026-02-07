import React from 'react';
import * as Icons from './CombatIcons';
import CombatSettingsModal from './CombatSettingsModal';

const { UserPlus, Sword, Keyboard, Search, Clipboard, Trash2, X } = Icons; 

const CombatModals = ({ logic }) => {
    const { 
        confirmDialog, setConfirmDialog, 
        combatDamageModal, setCombatDamageModal, hpEditValue, setHpEditValue, combatDamageInputRef,
        showShortcuts, setShowShortcuts, 
        srdModalOpen, setSrdModalOpen, srdQuery, setSrdQuery, srdResults, 
        parserModalOpen, setParserModalOpen, parseText, setParseText,
        initModal, setInitModal, 
        
        executeRunPreset, handleImportSrdMonster, handleParseStatBlock
    } = logic;

    // --- HANDLERS ---
    const applyCombatDamage = (type) => {
        if (!hpEditValue || !logic.hpEditId) return;
        const val = parseInt(hpEditValue);
        logic.updateHP(logic.hpEditId, type === 'heal' ? val : -val);
        setCombatDamageModal(false);
        logic.setHpEditId(null); 
        setHpEditValue('');
    };

    const handleModifyCombatInput = (factor) => {
        if(!hpEditValue) return;
        const val = Math.floor(parseInt(hpEditValue) * factor);
        setHpEditValue(val.toString());
    };

    const confirmPlayerInit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const playersList = initModal?.players || [];
        if (playersList.length === 0) {
            setInitModal(null);
            return;
        }
        
        const manualPlayers = [];

        playersList.forEach(p => {
            const count = p.count || 1;
            for(let i=0; i < count; i++) {
                const initInputName = `init-${p.id}-${i}`;
                const hpInputName = `hp-${p.id}-${i}`;
                
                const initVal = formData.get(initInputName);
                const hpVal = formData.get(hpInputName);

                if (initVal !== null && initVal !== '') {
                    manualPlayers.push({ 
                        ...p, 
                        init: parseInt(initVal),
                        manualHp: hpVal ? parseInt(hpVal) : null
                    });
                }
            }
        });
        
        executeRunPreset(initModal.monsters || [], manualPlayers);
        setInitModal(null);
    };

    const friendlyNames = {
        NAV_DOWN: 'Move Down',
        NAV_UP: 'Move Up',
        SELECT_GROUP: 'Open Group',
        DELETE: 'Delete Unit',
        HP_EDIT: 'Quick Edit HP',
        NOTE_EDIT: 'Edit Note',
        CONDITION_MENU: 'Conditions Menu',
        COMBAT_MODE: 'Toggle Combat Mode',
        UNDO: 'Undo (Ctrl + ...)',
        NEXT_TURN: 'Next Turn'
    };

    return (
        <>
            {/* EXTERNAL: SETTINGS MODAL */}
            <CombatSettingsModal logic={logic} />

            {/* INLINE: CONFIRM MODAL */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] p-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2"><Trash2 size={20}/> {confirmDialog.title}</h3>
                        <p className="text-slate-300 mb-6">{confirmDialog.message}</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDialog(null)} className="px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white">Cancel</button>
                            <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }} className="px-6 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* INLINE: COMBAT DAMAGE */}
            {combatDamageModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-slate-900 border-2 border-cyan-500 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2"><Sword size={20}/> Damage / Heal</h3>
                        <input ref={combatDamageInputRef} type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-4 text-center text-3xl font-bold focus:border-cyan-500 focus:outline-none mb-4" placeholder="Amount" value={hpEditValue} onChange={e=>setHpEditValue(e.target.value)} />
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => handleModifyCombatInput(0.5)} className="bg-blue-900/40 hover:bg-blue-800 border border-blue-700 text-blue-200 py-2 rounded font-bold">[R]esistance (½)</button>
                            <button onClick={() => handleModifyCombatInput(2)} className="bg-rose-900/40 hover:bg-rose-800 border border-rose-700 text-rose-200 py-2 rounded font-bold">[V]ulnerability (x2)</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => applyCombatDamage('damage')} className="bg-rose-600 hover:bg-rose-500 text-white py-3 rounded font-bold flex justify-center items-center gap-2"><span className="text-2xl">-</span> Damage</button>
                            <button onClick={() => applyCombatDamage('heal')} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold flex justify-center items-center gap-2"><span className="text-2xl">+</span> Heal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* INLINE: SHORTCUTS */}
            {showShortcuts && !logic.showSettings && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[130] p-4 animate-in fade-in" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-2 right-2 text-slate-400 hover:text-white" onClick={() => setShowShortcuts(false)}><X size={16}/></button>
                        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><Keyboard size={20}/> Shortcuts</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                            {logic.shortcuts && Object.entries(logic.shortcuts).map(([key, val]) => (
                                <div key={key}>
                                    <span className="text-cyan-400 font-bold uppercase">{val === ' ' ? 'Space' : val}</span>
                                    <br/>
                                    <span className="text-slate-400">{friendlyNames[key] || key}</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-center text-slate-500 text-xs border-t border-slate-800 pt-3">
                            Click <span className="text-amber-500 font-bold">Settings</span> in header to change these.
                        </div>
                    </div>
                </div>
            )}

            {/* INLINE: SRD */}
            {srdModalOpen && <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[130] p-4 animate-in fade-in"><div className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]"><h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2"><Search size={20}/> Search Open5e SRD</h3><input autoFocus className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 mb-4" placeholder="Name..." value={srdQuery} onChange={(e) => setSrdQuery(e.target.value)} /><div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">{srdResults.map(m => (<div key={m.slug} onClick={() => handleImportSrdMonster(m)} className="bg-slate-900 p-3 rounded border border-slate-700 hover:border-emerald-500 cursor-pointer flex justify-between items-center group"><div><div className="font-bold text-slate-200 group-hover:text-emerald-400">{m.name}</div><div className="text-xs text-slate-500">CR {m.challenge_rating}</div></div><div className="text-xs text-slate-400">HP: {m.hit_points} AC: {m.armor_class}</div></div>))}</div><button onClick={() => setSrdModalOpen(false)} className="mt-4 w-full px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white">Close</button></div></div>}

            {/* INLINE: PARSER */}
            {parserModalOpen && <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[130] p-4 animate-in fade-in"><div className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-lg w-full shadow-2xl"><h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2"><Clipboard size={20}/> Import Stat Block</h3><textarea className="w-full h-40 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 font-mono mb-4" placeholder="Paste text..." value={parseText} onChange={(e) => setParseText(e.target.value)} /><div className="flex gap-3 justify-end"><button onClick={() => setParserModalOpen(false)} className="px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white">Cancel</button><button onClick={handleParseStatBlock} className="px-6 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg">Import</button></div></div></div>}

            {/* INLINE: INIT MODAL */}
            {initModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[120] p-4 animate-in fade-in">
                    <form onSubmit={confirmPlayerInit} className="bg-slate-900 border border-slate-600 rounded-lg p-6 max-w-lg w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2"><UserPlus size={20}/> Enter Initiative</h3>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-4">
                            {initModal.players && initModal.players.map((p, idx) => 
                                Array.from({ length: p.count || 1 }).map((_, i) => (
                                    <div key={`${p.id}-${i}`} className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-700 gap-4">
                                        <div className="flex-1 font-bold text-slate-200 truncate">
                                            {p.name} {p.count > 1 && `#${i+1}`}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                name={`init-${p.id}-${i}`} 
                                                type="number" 
                                                autoFocus={idx===0&&i===0} 
                                                required 
                                                placeholder="Init" 
                                                className="w-20 bg-slate-800 border border-slate-600 rounded p-2 text-center text-lg focus:border-blue-500 focus:outline-none placeholder-slate-600 text-white"
                                            />
                                            {/* RETTET: Pre-fill med nuværende HP */}
                                            <input 
                                                name={`hp-${p.id}-${i}`} 
                                                type="number" 
                                                defaultValue={p.hp} 
                                                placeholder={`HP (${p.maxHp || '?'})`} 
                                                className="w-24 bg-slate-800 border border-slate-600 rounded p-2 text-center text-lg focus:border-green-500 focus:outline-none placeholder-slate-600 text-white"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button type="button" onClick={() => setInitModal(null)} className="px-4 py-2 rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white">Cancel</button>
                            <button type="submit" className="px-6 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg">Add All</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default CombatModals;