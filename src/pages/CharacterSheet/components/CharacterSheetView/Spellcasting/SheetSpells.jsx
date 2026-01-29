import React, { useState } from 'react';
import { Icons } from '../../CharacterIcons'; 
import { getMod, formatMod } from '../../CharacterHelpers'; 
import SpellBrowser from './SpellBrowser'; 

const SheetSpells = ({ c, onUpdate, theme }) => {
    const handleChange = (field, value) => onUpdate({ [field]: value });
    const [showBrowser, setShowBrowser] = useState(false);
    const [expandedSpell, setExpandedSpell] = useState(null);

    const abilityKey = (c.spellcastingAbility || 'Intelligence').toLowerCase();
    const castMod = getMod(c.stats[abilityKey] || 10);
    const prof = Math.ceil(c.level / 4) + 1;
    const spellDC = 8 + prof + castMod;
    const spellAttack = prof + castMod;

    // --- ADD SPELL LOGIC ---
    const addSpellFromBrowser = (spellData) => {
        const newSpell = {
            id: Date.now(),
            level: spellData.level,
            name: spellData.name,
            prepared: false,
            time: spellData.time || "1 Action",
            range: spellData.range || "60 ft",
            duration: spellData.duration || "Instant",
            school: spellData.school || "Magic",
            description: spellData.description || "",
            isV: (spellData.comp || "").includes('V'),
            isS: (spellData.comp || "").includes('S'),
            isM: (spellData.comp || "").includes('M'),
            isC: (spellData.duration || "").toLowerCase().includes('conc'),
            isR: (spellData.time || "").includes("Ritual")
        };
        handleChange('spells', [...(c.spells || []), newSpell]);
        setShowBrowser(false);
    };

    const addManualSpell = () => handleChange('spells', [...(c.spells || []), { 
        id: Date.now(), level: 1, name: "New Spell", prepared: false, 
        time: "", range: "", duration: "", school: "", description: "",
        isV: false, isS: false, isM: false, isC: false, isR: false 
    }]);

    const removeSpell = (id) => handleChange('spells', (c.spells || []).filter(s => s.id !== id));
    
    const updateSpell = (id, field, value) => {
        const updatedSpells = (c.spells || []).map(s => s.id === id ? { ...s, [field]: value } : s);
        handleChange('spells', updatedSpells);
    };

    // --- SLOTS LOGIC ---
    const handleSpellSlotMaxChange = (level, val) => {
        const max = Math.max(0, parseInt(val) || 0);
        const currentSlots = { ...c.spellSlots };
        currentSlots[level] = { ...currentSlots[level], max, used: Math.min(currentSlots[level].used, max) };
        handleChange('spellSlots', currentSlots);
    };
    const toggleSpellSlotUsed = (level, index) => {
        const currentSlots = { ...c.spellSlots };
        const newUsed = currentSlots[level].used === index + 1 ? index : index + 1;
        currentSlots[level] = { ...currentSlots[level], used: newUsed };
        handleChange('spellSlots', currentSlots);
    };

    return (
        <div className={`${theme.bgPanel} border-2 ${theme.accentBorder} rounded-xl overflow-hidden animate-in fade-in shadow-2xl relative transition-colors duration-300`}>
            <SpellBrowser isOpen={showBrowser} onClose={() => setShowBrowser(false)} onAddSpell={addSpellFromBrowser} />

            {/* Header / Config */}
            <div className={`p-4 border-b ${theme.border} flex flex-col md:flex-row gap-4 justify-between items-center bg-black/10`}>
                <div className="flex items-center gap-3">
                    <div className={`${theme.accentBg}/20 p-2 rounded-lg border ${theme.accentBorder} ${theme.accentText}`}><Icons.Book /></div>
                    <h2 className={`text-lg font-bold uppercase ${theme.accentText} tracking-widest`}>Spellcasting</h2>
                </div>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-end items-center">
                    
                    {/* ABILITY SELECTOR */}
                    <div className={`bg-black/20 px-2 py-1 rounded border ${theme.border} flex flex-col justify-center shadow-inner min-w-[80px]`}>
                        <span className={`text-[8px] font-bold ${theme.subText} uppercase text-center`}>Ability</span>
                        <select 
                            className={`bg-transparent text-sm font-bold ${theme.text} outline-none cursor-pointer uppercase text-center appearance-none w-full`}
                            value={c.spellcastingAbility || 'Intelligence'}
                            onChange={(e) => onUpdate({ spellcastingAbility: e.target.value })}
                        >
                            <option value="Intelligence">INT</option>
                            <option value="Wisdom">WIS</option>
                            <option value="Charisma">CHA</option>
                            <option value="Constitution">CON</option>
                            <option value="Strength">STR</option>
                            <option value="Dexterity">DEX</option>
                        </select>
                    </div>

                    {/* SPELLCASTING MODIFIER */}
                    <div className={`bg-black/20 px-3 py-1.5 rounded border ${theme.border} flex items-center gap-2 shadow-inner`}>
                        <span className={`text-[10px] font-bold ${theme.subText} uppercase`}>Mod</span>
                        <span className={`text-lg font-bold ${theme.accentText} dnd-font leading-none`}>{formatMod(castMod)}</span>
                    </div>

                    <div className={`bg-black/20 px-3 py-1.5 rounded border ${theme.border} flex items-center gap-2 shadow-inner`}>
                        <span className={`text-[10px] font-bold ${theme.subText} uppercase`}>Save DC</span>
                        <span className={`text-lg font-bold ${theme.accentText} dnd-font leading-none`}>{spellDC}</span>
                    </div>
                    <div className={`bg-black/20 px-3 py-1.5 rounded border ${theme.border} flex items-center gap-2 shadow-inner`}>
                        <span className={`text-[10px] font-bold ${theme.subText} uppercase`}>Attack</span>
                        <span className={`text-lg font-bold ${theme.accentText} dnd-font leading-none`}>{formatMod(spellAttack)}</span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setShowBrowser(true)} className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-l font-bold text-xs uppercase shadow transition-colors flex items-center gap-2 border-r border-amber-800">
                            <Icons.Search /> Browse
                        </button>
                        <button onClick={addManualSpell} className={`${theme.accentBg} hover:bg-opacity-80 text-white px-3 py-1.5 rounded-r font-bold text-xs uppercase shadow transition-colors flex items-center gap-2`}>
                            <Icons.Plus /> Custom
                        </button>
                    </div>
                </div>
            </div>

            {/* Spell Slots Bar */}
            <div className={`p-4 border-b ${theme.border} overflow-x-auto bg-black/5`}>
                <div className="flex gap-4 min-w-max justify-center md:justify-start">
                    {[1,2,3,4,5,6,7,8,9].map(lvl => (
                        <div key={lvl} className="flex flex-col items-center gap-1.5 min-w-[3rem]">
                            <span className={`text-[9px] font-bold ${theme.subText} uppercase`}>Lvl {lvl}</span>
                            <input type="number" value={c.spellSlots[lvl].max || 0} onChange={(e) => handleSpellSlotMaxChange(lvl, e.target.value)} className={`w-8 bg-black/20 border ${theme.border} rounded text-center text-xs font-bold ${theme.accentText} outline-none focus:${theme.accentBorder} mb-1`} />
                            <div className="flex gap-1 flex-wrap justify-center">
                                {Array.from({ length: c.spellSlots[lvl].max || 0 }).map((_, i) => (
                                    <button key={i} onClick={() => toggleSpellSlotUsed(lvl, i)} className={`w-3 h-3 rounded-sm border transition-all ${i < (c.spellSlots[lvl].used || 0) ? `${theme.accentBg} ${theme.accentBorder}` : `bg-black/20 ${theme.border} hover:border-zinc-500`}`}></button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SPELL LIST */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[200px]">
                {(c.spells || []).sort((a,b) => (a.level || 0) - (b.level || 0)).map(s => {
                    const isExpanded = expandedSpell === s.id;
                    return (
                        <div key={s.id} className={`border rounded-lg bg-black/10 transition-all flex flex-col ${isExpanded ? `${theme.accentBorder} shadow-lg ring-1 ${theme.accentBorder}` : `${theme.border} hover:border-zinc-500`}`}>
                            
                            {/* --- HEADER --- */}
                            <div className="p-2 flex gap-2 items-center">
                                {/* Level */}
                                <div className={`flex flex-col items-center justify-center w-8 h-8 bg-black/20 rounded border ${theme.border} shrink-0`}>
                                    <input type="number" value={s.level} onChange={(e) => updateSpell(s.id, 'level', parseInt(e.target.value)||0)} className={`w-full text-center bg-transparent text-sm font-bold ${theme.subText} outline-none focus:${theme.text}`} />
                                </div>
                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <input spellCheck="false" value={s.name} onChange={(e) => updateSpell(s.id, 'name', e.target.value)} className={`w-full bg-transparent text-sm font-bold ${theme.text} outline-none placeholder-zinc-500 truncate focus:text-white`} placeholder="Spell Name" />
                                </div>
                                {/* Prepared Toggle */}
                                <button onClick={() => updateSpell(s.id, 'prepared', !s.prepared)} className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${s.prepared ? 'bg-amber-900/40 border-amber-600 text-amber-500' : `${theme.border} ${theme.subText} hover:border-zinc-500`}`} title="Prepared">
                                    <div className={`w-2 h-2 rounded-full ${s.prepared ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                                </button>
                                {/* Fold Knap */}
                                <button onClick={() => setExpandedSpell(isExpanded ? null : s.id)} className={`w-8 h-8 flex items-center justify-center ${theme.subText} hover:${theme.text} hover:bg-white/5 rounded transition-colors`}>
                                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                </button>
                            </div>

                            {/* --- DESCRIPTION --- */}
                            <div className="w-full flex-1">
                                <textarea 
                                    spellCheck="false" 
                                    value={s.description || s.notes || ""} 
                                    onChange={(e) => updateSpell(s.id, 'description', e.target.value)} 
                                    className={`w-full bg-black/5 border-t ${theme.border}/50 p-3 text-xs ${theme.subText} italic outline-none resize-y placeholder-zinc-600 focus:${theme.text} block ${isExpanded ? '' : 'rounded-b-lg'}`}
                                    style={{ minHeight: '80px' }}
                                    placeholder="Spell description..." 
                                />
                            </div>

                            {/* --- TECHNICAL DETAILS --- */}
                            {isExpanded && (
                                <div className={`p-3 border-t ${theme.border}/50 bg-black/10 space-y-3 animate-in slide-in-from-top-1 rounded-b-lg`}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className={`bg-black/20 p-1.5 rounded border ${theme.border}`}><span className={`text-[8px] font-bold ${theme.subText} uppercase block tracking-wider`}>Casting Time</span><input spellCheck="false" value={s.time || ""} onChange={(e) => updateSpell(s.id, 'time', e.target.value)} className={`w-full bg-transparent text-xs ${theme.text} outline-none`} placeholder="1 Action" /></div>
                                        <div className={`bg-black/20 p-1.5 rounded border ${theme.border}`}><span className={`text-[8px] font-bold ${theme.subText} uppercase block tracking-wider`}>Range</span><input spellCheck="false" value={s.range || ""} onChange={(e) => updateSpell(s.id, 'range', e.target.value)} className={`w-full bg-transparent text-xs ${theme.text} outline-none`} placeholder="60 ft" /></div>
                                        <div className={`bg-black/20 p-1.5 rounded border ${theme.border}`}><span className={`text-[8px] font-bold ${theme.subText} uppercase block tracking-wider`}>Duration</span><input spellCheck="false" value={s.duration || ""} onChange={(e) => updateSpell(s.id, 'duration', e.target.value)} className={`w-full bg-transparent text-xs ${theme.text} outline-none`} placeholder="Instantaneous" /></div>
                                        <div className={`bg-black/20 p-1.5 rounded border ${theme.border}`}><span className={`text-[8px] font-bold ${theme.subText} uppercase block tracking-wider`}>School</span><input spellCheck="false" value={s.school || ""} onChange={(e) => updateSpell(s.id, 'school', e.target.value)} className={`w-full bg-transparent text-xs ${theme.text} outline-none`} placeholder="Evocation" /></div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className={`text-[9px] font-bold ${theme.subText} uppercase mr-1`}>Comp:</span>
                                        <div className={`flex rounded border ${theme.border} overflow-hidden bg-black/20`}>
                                            {['V','S','M'].map(comp => (
                                                <button key={comp} onClick={() => updateSpell(s.id, `is${comp}`, !s[`is${comp}`])} className={`px-2 py-1 text-[10px] font-bold transition-colors border-r ${theme.border} last:border-0 ${s[`is${comp}`] ? 'bg-zinc-800 text-white' : `${theme.subText} hover:${theme.text}`}`}>{comp}</button>
                                            ))}
                                        </div>
                                        <div className={`h-4 w-px bg-zinc-600 mx-1`}></div>
                                        <button onClick={() => updateSpell(s.id, 'isC', !s.isC)} className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${s.isC ? 'bg-amber-900/30 text-amber-500 border-amber-800' : `bg-black/20 ${theme.subText} ${theme.border} hover:border-zinc-500`}`}>Conc.</button>
                                        <button onClick={() => updateSpell(s.id, 'isR', !s.isR)} className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${s.isR ? 'bg-blue-900/30 text-blue-500 border-blue-800' : `bg-black/20 ${theme.subText} ${theme.border} hover:border-zinc-500`}`}>Ritual</button>
                                    </div>

                                    <div className={`flex justify-end pt-2 border-t ${theme.border}/50`}>
                                        <button onClick={() => removeSpell(s.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-900/10 transition-colors">
                                            <Icons.Trash /> Remove Spell
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default SheetSpells;