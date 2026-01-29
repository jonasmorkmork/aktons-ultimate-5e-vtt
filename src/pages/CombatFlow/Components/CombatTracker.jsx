import React from 'react';
import * as Icons from './CombatIcons';

const { Pencil, Dice5, Mountain, LinkIcon, Search, Clipboard, X, Save, UserPlus, Plus } = Icons;

const CombatTracker = ({ logic }) => {
    const { 
        monsterForm, setMonsterForm, addCombatant, resetMonsterForm, 
        playerForm, setPlayerForm, resetPlayerForm,
        groupInit, setGroupInit, setSrdModalOpen, setParserModalOpen,
        editingLibraryId, editingPlayerId,
        library, setLibrary, showNotification
    } = logic;

    const updateLibraryItem = () => {
        if (!editingLibraryId) return;
        const updatedLibrary = library.map(item => {
            if (item.id === editingLibraryId) {
                return { ...item, name: monsterForm.name, bonus: parseInt(monsterForm.bonus) || 0, maxHp: monsterForm.hp, ac: monsterForm.ac, xp: monsterForm.xp, dc: monsterForm.dc };
            }
            return item;
        });
        setLibrary(updatedLibrary);
        resetMonsterForm();
        showNotification("Item Updated");
        logic.setActiveTab('library');
    };

    const updatePlayerLibraryItem = () => {
        if (!editingPlayerId) return;
        const updatedLibrary = library.map(item => {
            if (item.id === editingPlayerId) {
                return { ...item, name: playerForm.name, maxHp: playerForm.hp, ac: playerForm.ac, dc: playerForm.dc };
            }
            return item;
        });
        setLibrary(updatedLibrary);
        resetPlayerForm();
        showNotification("Player Updated");
        logic.setActiveTab('library');
    };

    return (
        <div className="grid md:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                            
            {/* MONSTER PANEL */}
            <div className="md:col-span-7 glass-panel p-5 rounded-xl border border-white/10 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-sm font-bold text-amber-500 font-fantasy tracking-widest uppercase flex items-center gap-2 drop-shadow-sm">
                        {editingLibraryId ? <><Pencil size={16}/> Edit Entity</> : <><Dice5 size={18}/> Summon Entity</>}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => addCombatant('lair')} className="text-xs px-3 py-1.5 rounded bg-purple-900/40 border border-purple-500/30 text-purple-200 hover:bg-purple-800/60 hover:border-purple-400 transition-all flex items-center gap-1 font-fantasy tracking-wide" title="Lair Action"><Mountain size={12}/> Add As Lair Action</button>
                        <button onClick={() => { const newVal = !groupInit; setGroupInit(newVal); }} className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 transition-all border font-fantasy tracking-wide ${groupInit ? 'bg-amber-700/80 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'}`} title="Group Initiative"><LinkIcon size={12}/> Group Init</button>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); addCombatant('auto'); }} className="flex flex-col gap-4 relative z-10">
                    <div className="relative group/input flex gap-2">
                        {/* COUNT INPUT */}
                        <div className="w-20 relative">
                            <input className="w-full bg-black/40 border border-slate-700/50 rounded p-3 text-sm text-center text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600 transition-colors font-mono" placeholder="#" value={monsterForm.count || ''} onChange={e => setMonsterForm({...monsterForm, count: e.target.value})} />
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-slate-900 px-1 text-slate-500 uppercase font-bold tracking-wider pointer-events-none">#</span>
                        </div>
                        
                        {/* NAME INPUT */}
                        <div className="flex-1 relative">
                            <input className="w-full bg-black/40 border border-slate-700/50 rounded p-3 text-sm text-slate-200 focus:border-amber-500 focus:outline-none placeholder-slate-600 transition-colors font-ui" placeholder="Name (e.g. Goblin)" value={monsterForm.name} onChange={e => setMonsterForm({...monsterForm, name: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3">
                        {['Bonus', 'HP', 'AC', 'DC'].map((label) => {
                            const key = label.toLowerCase() === 'bonus' ? 'bonus' : label.toLowerCase();
                            return (
                                <div key={label} className="relative">
                                    <input type="number" className="w-full bg-black/40 border border-slate-700/50 rounded p-2 text-sm text-center text-slate-200 focus:border-amber-500 focus:outline-none font-mono" placeholder="-" value={monsterForm[key]} onChange={e => setMonsterForm({...monsterForm, [key]: e.target.value})} />
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-slate-900 px-1 text-slate-500 uppercase font-bold tracking-wider pointer-events-none">{label}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setSrdModalOpen(true)} className="p-2.5 bg-slate-800/50 rounded text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors" title="Search SRD"><Search size={18}/></button>
                        <button type="button" onClick={() => setParserModalOpen(true)} className="p-2.5 bg-slate-800/50 rounded text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors" title="Import Text"><Clipboard size={18}/></button>
                        <button type="button" onClick={resetMonsterForm} className="p-2.5 bg-slate-800/50 rounded text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors" title="Clear"><X size={18}/></button>
                        
                        {editingLibraryId ? (
                            <button type="button" onClick={updateLibraryItem} className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-4 py-2 rounded font-fantasy tracking-wider shadow-lg border-t border-blue-400/20">UPDATE ENTITY</button>
                        ) : (
                            <>
                                <button type="button" onClick={() => { if(monsterForm.name) { const newItem = { id: Date.now() + Math.random(), name: monsterForm.name, bonus: parseInt(monsterForm.bonus) || 0, maxHp: monsterForm.hp, ac: monsterForm.ac, xp: monsterForm.xp, dc: monsterForm.dc, type: 'monster' }; const newLib = [...library, newItem]; setLibrary(newLib); showNotification("Saved to Library"); } }} className="p-2.5 bg-slate-800/50 rounded text-amber-500 hover:text-amber-300 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 transition-colors" title="Save to Library"><Save size={18}/></button>
                                <button type="submit" disabled={!monsterForm.name} className="flex-1 bg-gradient-to-r from-emerald-800 to-emerald-600 hover:from-emerald-700 hover:to-emerald-500 disabled:opacity-50 disabled:grayscale text-white px-4 py-2 rounded font-fantasy tracking-wider shadow-lg border-t border-emerald-400/20 text-sm">ROLL INITIATIVE</button>
                            </>
                        )}
                    </div>
                </form>
                
                {/* Quick Library Chips */}
                {library.filter(l => l.type !== 'player').length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 border-t border-white/5 pt-3 scrollbar-hide">
                        {library.filter(l => l.type !== 'player').slice(0, 10).map(l => (
                            <button key={l.id} onClick={() => logic.addCombatant('library', l)} className="shrink-0 text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5 bg-black/40 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 transition-all group">
                                <span className="font-bold text-emerald-600 group-hover:text-emerald-400">
                                    {(() => {
                                        const val = parseInt(l.bonus) || 0;
                                        return (val >= 0 ? '+' : '') + val;
                                    })()}
                                </span> 
                                {l.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* PLAYER PANEL */}
            <div className="md:col-span-5 glass-panel p-5 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <h2 className="text-sm font-bold text-blue-400 font-fantasy tracking-widest uppercase mb-4 flex items-center gap-2 relative z-10 drop-shadow-sm">
                    {editingPlayerId ? <><Pencil size={16}/> Edit Hero</> : <><UserPlus size={18}/> Add Hero (Manual)</>}
                </h2>
                
                <form onSubmit={(e) => { e.preventDefault(); addCombatant('manual'); }} className="flex flex-col gap-4 relative z-10">
                    <input className="w-full bg-black/40 border border-slate-700/50 rounded p-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none placeholder-slate-600 font-ui" placeholder="Hero Name" value={playerForm.name} onChange={e => setPlayerForm({...playerForm, name: e.target.value})} />
                    
                    <div className="grid grid-cols-4 gap-3">
                        {['Roll', 'AC', 'HP', 'DC'].map((label) => {
                            const key = label === 'Roll' ? 'manualRoll' : label.toLowerCase();
                            return (
                                <div key={label} className="relative">
                                    <input type="number" className="w-full bg-black/40 border border-slate-700/50 rounded p-2 text-sm text-center text-slate-200 focus:border-blue-500 focus:outline-none font-mono" placeholder="-" value={playerForm[key]} onChange={e => setPlayerForm({...playerForm, [key]: e.target.value})} />
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] bg-slate-900 px-1 text-slate-500 uppercase font-bold tracking-wider pointer-events-none">{label}</span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={resetPlayerForm} className="p-2.5 bg-slate-800/50 rounded text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-colors" title="Clear"><X size={18}/></button>
                        
                        {editingPlayerId ? (
                            <button type="button" onClick={updatePlayerLibraryItem} className="flex-1 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white px-4 py-2 rounded font-fantasy tracking-wider shadow-lg border-t border-blue-400/20">UPDATE HERO</button>
                        ) : (
                            <>
                                <button type="button" onClick={() => { if(playerForm.name) { const newItem = { id: Date.now() + Math.random(), name: playerForm.name, bonus: 0, maxHp: playerForm.hp, ac: playerForm.ac, dc: playerForm.dc, type: 'player' }; const newLib = [...library, newItem]; setLibrary(newLib); showNotification("Hero Saved"); } }} className="p-2.5 bg-slate-800/50 rounded text-blue-500 hover:text-blue-300 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-colors" title="Save Hero"><Save size={18}/></button>
                                <button type="submit" disabled={!playerForm.name || !playerForm.manualRoll} className="flex-1 bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-700 hover:to-blue-500 disabled:opacity-50 disabled:grayscale text-white px-4 py-2 rounded font-fantasy tracking-wider shadow-lg border-t border-blue-400/20 flex items-center justify-center gap-2 text-sm"><Plus size={16}/> ADD HERO</button>
                            </>
                        )}
                    </div>
                </form>
                
                {/* Quick Player Chips */}
                {library.filter(l => l.type === 'player').length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 border-t border-white/5 pt-3 scrollbar-hide">
                        {library.filter(l => l.type === 'player').map(p => (
                            <button key={p.id} onClick={() => logic.addFromLibrary(p)} className="shrink-0 text-[10px] px-2.5 py-1.5 rounded flex items-center gap-1.5 bg-blue-900/10 hover:bg-blue-900/30 border border-blue-900/30 hover:border-blue-500/50 text-blue-300 hover:text-blue-100 transition-all">
                                <UserPlus size={10}/> {p.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CombatTracker;