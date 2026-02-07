import React, { useEffect, useRef } from 'react';
import * as Icons from './CombatIcons';

const { Shield, Zap, Hand, Plus, Pencil, Trash2, Sword } = Icons || {};

export const CONDITIONS = [
    "Blinded", "Charmed", "Deafened", "Frightened", "Grappled", 
    "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", 
    "Prone", "Restrained", "Stunned", "Unconscious", "Exhaustion", 
    "Blessed", "Hasted", "Raging", "Concentrating", "Held Action"
];

const CombatantRow = ({ 
    c, isActive, isPrimaryActive, hpEditId, hpEditValue, setHpEditId, setHpEditValue, updateHP, 
    toggleDeathSave, toggleCondition, setConditionMenuId, conditionMenuId,
    menuIndex, deleteCombatant, updateNote, isSelected, isCombatMode, noteEditId, setNoteEditId, lastDamagedId
}) => {
    
    // --- FEJLSIGKRING ---
    const conditions = c.conditions || []; 
    // --------------------

    const isEditing = hpEditId === c.id;
    const isHeld = conditions.includes("Held Action"); 
    const isPlayer = c.type === 'player';
    const isLair = c.type === 'lair';
    const isEditingNote = noteEditId === c.id;
    const isDead = c.hp <= 0 && !isLair;
    const isBloodied = !isDead && c.maxHp && (c.hp <= c.maxHp / 2);
    const isJustDamaged = lastDamagedId === c.id;
    
    const rowRef = useRef(null);
    const hpInputRef = useRef(null);
    const menuRef = useRef(null); 

    useEffect(() => { if (isEditing && hpInputRef.current) hpInputRef.current.focus(); }, [isEditing]);

    useEffect(() => {
        if (isPrimaryActive && rowRef.current && isCombatMode) {
            setTimeout(() => {
                rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [isPrimaryActive, isCombatMode]);

    useEffect(() => {
        if (conditionMenuId === c.id && menuRef.current) {
            const listContainer = menuRef.current.children[1];
            if (listContainer) {
                const selectedElement = listContainer.children[menuIndex];
                if (selectedElement) selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [menuIndex, conditionMenuId, c.id]);

    // --- STYLING LOGIC ---
    let statusClass = 'glass-panel border-slate-700/50'; 

    if (isSelected && isCombatMode) {
        if (isActive) {
            statusClass = 'bg-gradient-to-r from-slate-800/90 to-amber-900/20 scale-[1.02] z-30 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]';
        } else {
            statusClass = 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-400 z-20 scale-[1.01] shadow-[0_0_10px_rgba(34,211,238,0.2)]';
        }
    } 
    else if (isActive) {
        statusClass = 'active-glow scale-[1.01] z-10 border-amber-600';
    }
    else if (isBloodied) {
        statusClass = 'bloodied-active border-red-900/50';
    }

    if (isDead) statusClass += ' opacity-50 grayscale brightness-50';
    if (isHeld && !isActive) statusClass += ' opacity-70 border-dashed border-slate-500';

    const hpPercent = c.maxHp ? Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100)) : 100;
    const tempHpPercent = c.maxHp ? Math.max(0, Math.min(100, ((c.tempHp || 0) / c.maxHp) * 100)) : 0;
    const hpTextColor = isBloodied ? "text-red-500 font-bold drop-shadow-[0_0_5px_rgba(220,38,38,0.8)] animate-pulse" : "text-white/90";

    // Hjælper til at håndtere save
    const handleSave = (type) => {
        const val = parseInt(hpEditValue);
        if (!isNaN(val)) {
            if (type === 'dmg') updateHP(c.id, -val);
            else if (type === 'heal') updateHP(c.id, val);
            else if (type === 'temp') updateHP(c.id, val, 'setTemp');
        }
        setHpEditId(null);
        setHpEditValue('');
    };

    return (
        <div ref={rowRef} className={`relative rounded-lg border p-1 mb-2 transition-all duration-300 ${statusClass} flex flex-col gap-1 group ${isJustDamaged ? 'shake-effect' : ''}`}>
            <div className="flex items-center gap-3 w-full p-2">
                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                    <div className={`absolute inset-0 transform rotate-45 border transition-colors duration-300 ${isActive ? 'bg-amber-900/60 border-amber-500' : 'bg-slate-900 border-slate-700'}`}></div>
                    <span className={`relative z-10 font-fantasy text-lg font-bold ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>{c.initiative}</span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-end px-1">
                        <span className={`font-fantasy text-lg leading-none tracking-wide truncate ${isActive ? 'text-amber-100' : 'text-slate-300'} ${isDead ? 'line-through decoration-red-900' : ''}`}>
                            {c.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs opacity-70">
                            {c.ac && <div className="flex items-center"><Shield size={10}/> <span className="ml-1 font-mono text-slate-300">{c.ac}</span></div>}
                            {c.dc && <div className="flex items-center text-purple-400"><Zap size={10}/> <span className="ml-1 font-mono">{c.dc}</span></div>}
                        </div>
                    </div>
                    
                    {!isLair && c.maxHp && (
                        <div className="mt-1 w-full h-5 hp-bar-bg rounded relative overflow-hidden border border-white/10 shadow-inner group/hp">
                            
                            {/* HP VISUALS (Bar + Temp Overlay) */}
                            {!isEditing && (
                                <>
                                    <div style={{ width: `${hpPercent}%` }} className={`absolute top-0 left-0 h-full ${isPlayer ? 'bg-blue-600' : 'hp-bar-fill'} transition-all duration-500`}></div>
                                    {(c.tempHp || 0) > 0 && (
                                        <div 
                                            // CUSTOM COLOR: #FFDF00 (Golden)
                                            className="absolute top-0 left-0 h-full bg-[#7800FA]/75 transition-all duration-500 border-l border-white/30"
                                            style={{ width: `${tempHpPercent}%` }}
                                        ></div>
                                    )}
                                </>
                            )}

                            <div onClick={(e) => { if (!isEditing) { e.stopPropagation(); setHpEditId(c.id); setHpEditValue(''); } }} className="absolute inset-0 flex items-center justify-center text-[10px] tracking-wider cursor-pointer z-10">
                                {isEditing ? (
                                    /* EDIT MODE: 3 knapper (Dmg, Temp, Heal) og 1 input */
                                    <div className="flex w-full h-full bg-slate-900 animate-in fade-in duration-100">
                                        
                                        {/* DAMAGE (Red) */}
                                        <button onMouseDown={(e)=>e.preventDefault()} onClick={(e)=>{e.stopPropagation(); handleSave('dmg');}} className="px-2 bg-rose-950 hover:bg-rose-800 text-rose-200 border-r border-rose-900 h-full flex items-center justify-center transition-colors" title="Damage"><Sword size={10}/></button>
                                        
                                        {/* INPUT */}
                                        <input 
                                            ref={hpInputRef} 
                                            type="number" 
                                            className="flex-1 bg-transparent text-center text-xs text-amber-500 font-bold focus:outline-none h-full placeholder-slate-600 min-w-0" 
                                            placeholder="Val" 
                                            value={hpEditValue} 
                                            onChange={e=>setHpEditValue(e.target.value)} 
                                            onBlur={() => {
                                                setTimeout(() => setHpEditId(null), 150);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') { handleSave('dmg'); } 
                                                else if (e.key === 'Escape') { setHpEditId(null); setHpEditValue(''); }
                                                else if (e.key === '+') { e.preventDefault(); handleSave('heal'); }
                                                else if (e.key === '-') { e.preventDefault(); handleSave('dmg'); }
                                                else if (e.key === '*') { e.preventDefault(); handleSave('temp'); } 
                                            }} 
                                        />

                                        {/* TEMP HP (Custom Gold: #FFDF00) */}
                                        <button 
                                            onMouseDown={(e)=>e.preventDefault()} 
                                            onClick={(e)=>{e.stopPropagation(); handleSave('temp');}} 
                                            className="px-2 bg-[#FFDF00]/20 hover:bg-[#FFDF00]/40 text-[#FFDF00] border-l border-r border-[#FFDF00]/30 h-full flex items-center justify-center transition-colors font-bold text-[9px]" 
                                            title="Set Temp HP"
                                        >
                                            THP
                                        </button>

                                        {/* HEAL (Green) */}
                                        <button onMouseDown={(e)=>e.preventDefault()} onClick={(e)=>{e.stopPropagation(); handleSave('heal');}} className="px-2 bg-emerald-950 hover:bg-emerald-800 text-emerald-200 border-l border-emerald-900 h-full flex items-center justify-center transition-colors" title="Heal"><Plus size={10}/></button>
                                    </div>
                                ) : (
                                    <div className={hpTextColor}>
                                        {c.hp} 
                                        {/* CUSTOM COLOR TEXT */}
                                        {(c.tempHp || 0) > 0 && <span className="text-[#FFDF00] ml-1">+{c.tempHp}</span>}
                                        <span className="text-slate-400 ml-1">/ {c.maxHp}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className={`flex flex-col gap-1 items-end ${isActive || isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} transition-opacity`}>
                     <button onClick={() => deleteCombatant(c.id)} className="text-slate-600 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                </div>
            </div>
            
            {/* Condition Tags */}
            {!isLair && (
                <div className="flex flex-wrap gap-1 px-2 pb-1 min-h-[5px]">
                    {conditions.map(cond => (
                        <button key={cond} onClick={() => toggleCondition(c.id, cond)} className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider flex items-center gap-1 shadow-sm ${cond === 'Held Action' ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-purple-900/60 border-purple-500/50 text-purple-200'}`}>
                            {cond === 'Held Action' && <Hand size={8}/>} {cond}
                        </button>
                    ))}
                    <div className={`flex gap-1 transition-opacity duration-200 ${isActive || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button onClick={(e) => { e.stopPropagation(); setConditionMenuId(c.id === conditionMenuId ? null : c.id); }} className="text-[9px] px-1.5 bg-slate-800 border border-slate-600 text-slate-400 rounded hover:text-white hover:border-slate-400" title="Add Condition"><Plus size={10}/></button>
                        <button onClick={() => setNoteEditId(isEditingNote ? null : c.id)} className={`text-[9px] px-1.5 border border-slate-600 rounded ${isEditingNote || c.note ? 'bg-blue-900/50 text-blue-300 border-blue-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`} title="Note"><Pencil size={10}/></button>
                    </div>
                </div>
            )}

            {/* Condition Menu Popup */}
            {conditionMenuId === c.id && (
                <div ref={menuRef} className="absolute left-12 top-10 z-[100] w-48 flex flex-col gap-1 p-2 rounded-lg glass-panel border border-amber-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500 px-2 pb-1 border-b border-white/5 mb-1 tracking-wider">Add Condition</div>
                    <div className="max-h-48 overflow-y-auto pr-1 space-y-0.5">
                        {CONDITIONS.map((cond, idx) => (
                            <button 
                                key={cond} 
                                onClick={() => toggleCondition(c.id, cond)} 
                                className={`
                                    w-full text-xs text-left px-3 py-2 rounded border transition-all flex justify-between items-center
                                    ${idx === menuIndex ? 'bg-amber-900/40 border-amber-500/50 text-amber-100' : ''}
                                    ${conditions.includes(cond) 
                                        ? 'bg-purple-900/40 border-purple-500/30 text-purple-200 shadow-[inset_0_0_10px_rgba(147,51,234,0.1)]' 
                                        : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <span>{cond}</span>
                                {conditions.includes(cond) && <span className="text-purple-400 font-bold">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Note Field */}
            {(isEditingNote || (c.note && c.note.trim() !== '')) && (
                <div className="px-2 pb-1 w-full">
                    {isEditingNote ? (
                        <textarea 
                            autoFocus
                            className="w-full bg-black/40 text-slate-300 text-xs p-1 rounded border border-slate-700 focus:border-blue-500/50 focus:outline-none resize-none h-14 font-mono"
                            value={c.note || ''}
                            onChange={(e) => updateNote(c.id, e.target.value)} 
                            onKeyDown={(e) => { 
                                if(e.key === 'Escape') setNoteEditId(null); 
                                if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setNoteEditId(null); }
                            }}
                            onBlur={() => setNoteEditId(null)}
                            placeholder="Add note..."
                        />
                    ) : (
                        <div onClick={() => setNoteEditId(c.id)} className="text-[10px] text-slate-500 italic cursor-pointer hover:text-slate-300 border-t border-white/5 pt-1 truncate">
                            <span className="opacity-50">Note:</span> {c.note}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CombatantRow;