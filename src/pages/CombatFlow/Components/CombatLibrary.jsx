import React from 'react';
import * as Icons from './CombatIcons';

const { UserPlus, Pencil, Trash2, Dice5 } = Icons;

const CombatLibrary = ({ logic }) => {
    const { 
        library, setLibrary, 
        addFromLibrary, handleConfirm,
        setMonsterForm, setPlayerForm,
        setEditingLibraryId, setEditingPlayerId, setActiveTab
    } = logic;

    const loadLibraryForEdit = (item) => {
        if (item.type === 'player') {
            setPlayerForm({ name: item.name, manualRoll: '', hp: item.maxHp || '', ac: item.ac || '', dc: item.dc || '' });
            setEditingPlayerId(item.id);
            setEditingLibraryId(null);
        } else {
            setMonsterForm({ name: item.name, bonus: item.bonus, hp: item.maxHp || '', ac: item.ac || '', xp: item.xp || '', dc: item.dc || '', type: item.type });
            setEditingLibraryId(item.id);
            setEditingPlayerId(null);
        }
        setActiveTab('tracker');
    };

    return (
        <div className="glass-panel p-6 rounded-xl border border-white/10 animate-in fade-in zoom-in-95 duration-300 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Sektion: Spillere */}
            {library.some(l => l.type === 'player') && (
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-blue-400 font-fantasy tracking-[0.2em] uppercase mb-4 flex items-center gap-3 border-b border-blue-900/30 pb-2">
                        <UserPlus size={18}/> Heroes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {library.filter(l => l.type === 'player').map(lib => (
                            <div key={lib.id} className="group relative bg-blue-950/20 hover:bg-blue-900/30 border border-blue-900/50 hover:border-blue-500/50 p-4 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => addFromLibrary(lib)}>
                                    <div>
                                        <div className="font-fantasy font-bold text-lg text-blue-100 group-hover:text-blue-300 transition-colors">{lib.name}</div>
                                        <div className="text-[10px] text-blue-400/80 font-mono mt-1 space-x-2">
                                            {lib.maxHp && <span>HP: {lib.maxHp}</span>}
                                            {lib.ac && <span>AC: {lib.ac}</span>}
                                            {lib.dc && <span>DC: {lib.dc}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); loadLibraryForEdit(lib); }} className="text-slate-500 hover:text-blue-400"><Pencil size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleConfirm("Delete Hero?", `Delete ${lib.name}?`, () => { const n = library.filter(l=>l.id!==lib.id); setLibrary(n); }) }} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                <button onClick={() => addFromLibrary(lib)} className="w-full py-1.5 rounded bg-gradient-to-r from-blue-900/50 to-blue-800/50 hover:from-blue-800 hover:to-blue-700 border border-blue-700/30 text-blue-200 text-xs font-fantasy tracking-wider uppercase transition-all shadow-sm">Add to Combat</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sektion: Monstre */}
            {library.some(l => l.type !== 'player') && (
                <div className="relative z-10">
                    <h3 className="text-sm font-bold text-emerald-500 font-fantasy tracking-[0.2em] uppercase mb-4 flex items-center gap-3 border-b border-emerald-900/30 pb-2">
                        <Dice5 size={18}/> Bestiary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {library.filter(l => l.type !== 'player').map(lib => (
                            <div key={lib.id} className="group relative bg-black/40 hover:bg-slate-900/60 border border-slate-700/50 hover:border-emerald-500/50 p-4 rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => addFromLibrary(lib)}>
                                    <div>
                                        <div className="font-fantasy font-bold text-lg text-slate-200 group-hover:text-emerald-300 transition-colors">{lib.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1 space-x-2 group-hover:text-slate-400 transition-colors">
                                            <span className="text-emerald-600 font-bold">
                                                Init: {parseInt(lib.bonus) >= 0 ? '+' : ''}{lib.bonus}
                                            </span>
                                            {lib.maxHp && <span>HP: {lib.maxHp}</span>}
                                            {lib.ac && <span>AC: {lib.ac}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); loadLibraryForEdit(lib); }} className="text-slate-600 hover:text-emerald-400"><Pencil size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleConfirm("Delete Monster?", `Delete ${lib.name}?`, () => { const n = library.filter(l=>l.id!==lib.id); setLibrary(n); }) }} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                                <div className="flex gap-1 pt-2 border-t border-white/5">
                                    <button onClick={() => addFromLibrary(lib, 1)} className="flex-1 py-1 rounded bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800/50 text-[10px] text-emerald-400 hover:text-emerald-200 transition-colors font-bold">+1</button>
                                    <button onClick={() => addFromLibrary(lib, '1d4')} className="flex-1 py-1 rounded bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800/50 text-[10px] text-emerald-400 hover:text-emerald-200 transition-colors font-bold">+1d4</button>
                                    <button onClick={() => addFromLibrary(lib, '1d6')} className="flex-1 py-1 rounded bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-800/50 text-[10px] text-emerald-400 hover:text-emerald-200 transition-colors font-bold">+1d6</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {library.length === 0 && <div className="text-center text-slate-600 py-12 font-fantasy tracking-widest text-lg">The library is empty. Summon entities above.</div>}
        </div>
    );
};

export default CombatLibrary;