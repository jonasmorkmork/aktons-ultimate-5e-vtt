import React from 'react';
import * as Icons from './CombatIcons';

const { Pencil, Plus, Search, X, Dice5, Trash2 } = Icons;

const CombatPresets = ({ logic }) => {
    const { 
        presets, setPresets,
        presetDraft, setPresetDraft,
        newPresetName, setNewPresetName,
        editingPresetId, setEditingPresetId,
        presetSearch, setPresetSearch,
        library, handleConfirm, showNotification, setInitModal, executeRunPreset
    } = logic;

    const addToPresetDraft = (libEntry) => {
        const existing = presetDraft.find(p => p.libId === libEntry.id);
        if (existing) {
            setPresetDraft(presetDraft.map(p => p.libId === libEntry.id ? {...p, count: p.count + 1} : p));
        } else {
            setPresetDraft([...presetDraft, { libId: libEntry.id, ...libEntry, count: 1 }]);
        }
    };

    const loadPresetForEdit = (preset) => {
        setNewPresetName(preset.name);
        setPresetDraft(preset.monsters);
        setEditingPresetId(preset.id);
    };

    const updatePreset = () => {
        if (!editingPresetId) return;
        const updatedPresets = presets.map(p => {
            if (p.id === editingPresetId) {
                return { ...p, name: newPresetName, monsters: presetDraft };
            }
            return p;
        });
        setPresets(updatedPresets);
        setEditingPresetId(null);
        setNewPresetName('');
        setPresetDraft([]);
        showNotification("Preset Updated");
    };

    const runPreset = (preset) => {
        const players = [];
        const monsters = [];
        preset.monsters.forEach(entry => {
            if (entry.type === 'player') {
                players.push({...entry, id: Date.now() + Math.random()}); 
            } else {
                monsters.push(entry);
            }
        });
        if (players.length > 0) {
            setInitModal({ players, monsters });
        } else {
            executeRunPreset(monsters);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* CREATION PANEL */}
            <div className="glass-panel p-5 rounded-xl border border-amber-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <h3 className="text-sm font-bold text-amber-500 font-fantasy tracking-widest uppercase mb-4 flex items-center gap-2 relative z-10">
                    {editingPresetId ? <><Pencil size={16}/> Edit Encounter</> : <><Plus size={18}/> Create Encounter Preset</>}
                </h3>
                
                <div className="space-y-4 relative z-10">
                    <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="Encounter Name (e.g. The Goblin Ambush)" className="w-full bg-black/40 border border-slate-700/50 rounded p-3 text-sm text-amber-100 focus:border-amber-500 focus:outline-none placeholder-slate-600 font-fantasy tracking-wide" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                        {/* LIBRARY SELECTOR */}
                        <div className="bg-black/40 rounded border border-slate-700/50 flex flex-col overflow-hidden">
                            <div className="p-2 border-b border-slate-700/50 bg-slate-900/50 flex items-center gap-2">
                                    <Search size={12} className="text-slate-500"/>
                                    <input 
                                    type="text" 
                                    placeholder="Search library..." 
                                    value={presetSearch}
                                    onChange={(e) => setPresetSearch(e.target.value)}
                                    className="bg-transparent border-none text-xs text-slate-300 focus:outline-none w-full placeholder-slate-600"
                                    />
                            </div>
                            <div className="overflow-y-auto flex-1 p-2 space-y-3 scrollbar-thin">
                                {/* Spillere */}
                                {library.some(l => l.type === 'player' && l.name.toLowerCase().includes(presetSearch.toLowerCase())) && (
                                    <div>
                                        <div className="text-[9px] text-blue-500 uppercase font-bold mb-1 tracking-wider">Heroes</div>
                                        {library.filter(l => l.type === 'player' && l.name.toLowerCase().includes(presetSearch.toLowerCase())).map(lib => (
                                            <div key={lib.id} onClick={() => addToPresetDraft(lib)} className="flex justify-between items-center p-2 rounded cursor-pointer mb-1 bg-blue-900/10 hover:bg-blue-900/30 border border-transparent hover:border-blue-500/30 text-blue-200 transition-colors group">
                                                <span className="text-xs group-hover:text-white">{lib.name}</span>
                                                <Plus size={12} className="opacity-0 group-hover:opacity-100 text-blue-400"/>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Monstre */}
                                {library.some(l => l.type !== 'player' && l.name.toLowerCase().includes(presetSearch.toLowerCase())) && (
                                    <div>
                                        <div className="text-[9px] text-emerald-600 uppercase font-bold mb-1 tracking-wider">Monsters</div>
                                        {library.filter(l => l.type !== 'player' && l.name.toLowerCase().includes(presetSearch.toLowerCase())).map(lib => (
                                            <div key={lib.id} onClick={() => addToPresetDraft(lib)} className="flex justify-between items-center p-2 rounded cursor-pointer mb-1 hover:bg-slate-800 border border-transparent hover:border-slate-600 text-slate-300 transition-colors group">
                                                <span className="text-xs group-hover:text-white">{lib.name}</span>
                                                {/* RETTELSE HER: */}
                                                <span className="text-[10px] text-slate-600 group-hover:text-emerald-500">
                                                    {parseInt(lib.bonus) >= 0 ? '+' : ''}{lib.bonus}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CONTENTS LIST */}
                        <div className="bg-black/40 rounded border border-slate-700/50 flex flex-col relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>
                                <div className="p-2 border-b border-slate-700/50 bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">Encounter Contents</div>
                                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                    {presetDraft.length === 0 && <div className="text-center text-slate-600 text-xs mt-10 italic">Select entities to add...</div>}
                                    {presetDraft.map(p => (
                                        <div key={p.libId} className="flex justify-between items-center p-2 rounded bg-slate-800/40 border border-slate-700/50 text-sm animate-in slide-in-from-left-2">
                                            <span className="text-slate-200 text-xs">{p.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-amber-500 font-bold font-mono text-xs">x{p.count}</span>
                                                <button onClick={() => setPresetDraft(presetDraft.filter(x=>x.libId!==p.libId))} className="text-slate-600 hover:text-red-400"><X size={12}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                        </div>
                    </div>
                    
                    {editingPresetId ? (
                        <div className="flex gap-3">
                            <button onClick={() => { setEditingPresetId(null); setNewPresetName(''); setPresetDraft([]); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded py-2 font-fantasy tracking-wider uppercase text-xs border border-slate-600">Cancel</button>
                            <button onClick={updatePreset} disabled={!newPresetName || presetDraft.length === 0} className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded py-2 font-fantasy tracking-wider uppercase text-xs shadow-lg border-t border-blue-500/30">Update Preset</button>
                        </div>
                    ) : (
                        <button onClick={() => { if(newPresetName && presetDraft.length>0) { const newP = [...presets, { id: Date.now() + Math.random(), name: newPresetName, monsters: presetDraft }]; setPresets(newP); setNewPresetName(''); setPresetDraft([]); }}} disabled={!newPresetName || presetDraft.length === 0} className="w-full bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 text-white rounded py-2 font-fantasy tracking-wider uppercase text-xs shadow-lg border-t border-amber-400/30">Save Preset</button>
                    )}
                </div>
            </div>

            {/* PRESET LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map(preset => (
                    <div key={preset.id} className="group glass-panel p-4 rounded-lg border border-white/5 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors"></div>
                        
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-fantasy font-bold text-lg text-slate-200 group-hover:text-amber-100 transition-colors">{preset.name}</h4>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => loadPresetForEdit(preset)} className="text-slate-600 hover:text-blue-400"><Pencil size={14}/></button>
                                <button onClick={() => handleConfirm("Delete Preset?", `Delete ${preset.name}?`, () => { const n = presets.filter(p=>p.id!==preset.id); setPresets(n); })} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px]">
                            {preset.monsters.slice(0,4).map(m => (
                                <span key={m.libId} className="text-[10px] px-2 py-0.5 bg-black/40 rounded border border-slate-700 text-slate-400">
                                    <span className={m.type === 'player' ? 'text-blue-400' : 'text-emerald-500'}>{m.count}x</span> {m.name}
                                </span>
                            ))}
                            {preset.monsters.length > 4 && <span className="text-[10px] text-slate-600 px-1 py-0.5">+{preset.monsters.length - 4} more</span>}
                        </div>
                        
                        <button onClick={() => runPreset(preset)} className="w-full bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-400 hover:text-emerald-200 py-2 rounded flex items-center justify-center gap-2 text-xs font-fantasy tracking-widest border border-emerald-900/50 hover:border-emerald-500/50 transition-all uppercase shadow-lg">
                            <Dice5 size={14}/> Roll & Summon
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CombatPresets;