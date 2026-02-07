import React, { useState } from 'react';
import { Icons, ProficiencyButton } from '../CharacterIcons'; 
import { getMod, formatMod, getProfBonus, conditionOptions, getTabTitle } from '../CharacterHelpers'; 
import { useCampaign } from '../../../../context/CampaignContext'; 

// Opdateret props til at acceptere flere navne
const SheetCombat = ({ c, character, char, data, onUpdate, theme }) => {
    const [editingHp, setEditingHp] = useState(null);
    const [hpInputValue, setHpInputValue] = useState("");
    const [activeResTab, setActiveResTab] = useState('resistances');
    const [showCondMenu, setShowCondMenu] = useState(false);

    const { syncHpToCombat } = useCampaign();

    // --- ROBUST DATA HANDLING ---
    const activeChar = c || character || char || data;

    if (!activeChar) {
        return (
            <div className="p-6 text-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                <div className="text-red-400 font-bold mb-2">Data Error</div>
                <div className="text-xs text-slate-500">Could not find character data in SheetCombat.</div>
            </div>
        );
    }

    const internalC = activeChar;

    const prof = getProfBonus(internalC.level);
    const dMod = getMod(internalC.stats.dexterity);
    const totalInit = dMod + (parseInt(internalC.initiativeMisc) || 0);

    const handleChange = (field, value) => onUpdate({ [field]: value });
    const handleNestedChange = (parent, field, value) => onUpdate({ [parent]: { ...internalC[parent], [field]: value } });

    // Actions
    const addAction = () => handleChange('actions', [...(internalC.actions || []), { id: Date.now(), name: "New Attack", bonus: "+0", damage: "1d6", notes: "" }]);
    const removeAction = (id) => handleChange('actions', (internalC.actions || []).filter(x => x.id !== id));
    const updateAction = (id, f, v) => handleChange('actions', (internalC.actions || []).map(a => a.id === id ? { ...a, [f]: v } : a));

    // Saves
    const cycleSaveProf = (stat) => handleNestedChange('savingThrowsProf', stat, ((internalC.savingThrowsProf[stat] || 0) + 1) % 2);
    const handleSaveMiscChange = (stat, value) => handleNestedChange('saveMiscBonuses', stat, parseInt(value) || 0);

    // HP Logic
    const applyHpChange = (actionType) => {
        const amount = parseInt(hpInputValue) || 0;
        let newHp = { ...internalC.hp };
        
        if (editingHp === 'current') {
            if (actionType === 'dmg') {
                let rem = amount;
                if (newHp.temp > 0) {
                    const abs = Math.min(newHp.temp, rem);
                    newHp.temp -= abs;
                    rem -= abs;
                }
                newHp.current = Math.max(0, newHp.current - rem);
            } else if (actionType === 'heal') {
                newHp.current = Math.min(newHp.max, newHp.current + amount);
            }
        } else if (editingHp === 'temp') {
            if (actionType === 'dmg') newHp.temp = Math.max(0, newHp.temp - amount);
            else if (actionType === 'set') newHp.temp = amount;
        }
        
        onUpdate({ hp: newHp });
        // FIX: Sender ownerId med, hvis den findes (fra Inspect Mode)
        if (syncHpToCombat) syncHpToCombat(newHp.current, newHp.max, newHp.temp, internalC.ownerId);

        setEditingHp(null);
        setHpInputValue("");
    };

    const handleMaxHpChange = (val) => {
        const newVal = parseInt(val) || 0;
        handleNestedChange('hp', 'max', newVal);
        // FIX: Sender ownerId med
        if (syncHpToCombat) syncHpToCombat(internalC.hp.current, newVal, internalC.hp.temp || 0, internalC.ownerId);
    };

    const toggleCondition = (cond) => {
        const current = internalC.conditions || [];
        if (current.includes(cond)) {
            handleChange('conditions', current.filter(c => c !== cond));
        } else {
            handleChange('conditions', [...current, cond]);
            setShowCondMenu(false); 
        }
    };

    const availableConditions = conditionOptions.filter(cond => !(internalC.conditions || []).includes(cond));

    return (
        <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className={`${theme.bgPanel} border-2 ${theme.accentBorder} rounded-xl p-3 flex flex-col items-center shadow-lg h-24 justify-center`}>
                    <label className={`text-[9px] font-bold uppercase ${theme.accentText} mb-1 tracking-widest`}>Initiative</label>
                    <span className={`text-2xl font-bold dnd-font ${theme.text}`}>{formatMod(totalInit)}</span>
                    <input type="number" value={internalC.initiativeMisc || ""} placeholder="+0" onChange={(e) => handleChange('initiativeMisc', parseInt(e.target.value)||0)} className={`w-10 mt-1 bg-black/20 border ${theme.border} rounded text-[9px] text-center ${theme.subText} font-bold outline-none focus:${theme.accentBorder}`} />
                </div>
                <div className={`${theme.bgPanel} border-2 ${theme.accentBorder} rounded-xl p-3 flex flex-col items-center shadow-lg h-24 justify-center`}>
                    <label className={`text-[9px] font-bold uppercase ${theme.accentText} mb-1 tracking-widest`}>AC</label>
                    <div className="flex items-center"><input type="number" value={internalC.ac} onChange={(e) => handleChange('ac', parseInt(e.target.value)||0)} className={`text-2xl font-bold w-12 text-center outline-none bg-transparent dnd-font ${theme.text}`} /></div>
                    <button onClick={() => handleChange('hasShield', !internalC.hasShield)} className={`mt-1 transition-all ${internalC.hasShield ? `${theme.accentText} scale-110` : `${theme.subText} hover:${theme.text}`}`} title="Shield (+2 AC marker)"><Icons.Shield /></button>
                </div>
                <div className={`${theme.bgPanel} border-2 ${theme.accentBorder} rounded-xl p-3 flex flex-col items-center shadow-lg h-24 justify-center`}>
                    <label className={`text-[9px] font-bold uppercase ${theme.accentText} mb-1 tracking-widest`}>Speed</label>
                    <div className="flex items-center"><input type="number" value={internalC.speed} onChange={(e) => handleChange('speed', parseInt(e.target.value)||0)} className={`text-2xl font-bold w-12 text-center outline-none bg-transparent dnd-font ${theme.text}`} /><span className={`text-[10px] ml-1 ${theme.subText} font-bold uppercase`}>ft.</span></div>
                </div>
            </div>

            {/* HP */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl p-4 shadow-lg space-y-4`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><div className={theme.accentText}><Icons.Heart /></div><span className={`font-bold uppercase text-xs ${theme.subText} tracking-widest`}>Health (HP)</span></div>
                    <div className={`flex items-center gap-2 text-[10px] ${theme.subText} font-bold`}>MAX: <input type="number" value={internalC.hp.max} onChange={(e) => handleMaxHpChange(e.target.value)} className={`w-12 bg-black/20 rounded px-1 text-center font-bold ${theme.accentText} outline-none border ${theme.border} shadow-inner`} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {['current', 'temp'].map(type => {
                        const isActive = editingHp === type;
                        return (
                            <div key={type} className={`relative bg-black/20 p-2 min-h-[110px] rounded-lg border flex flex-col items-center justify-center transition-all ${isActive ? (type === 'current' ? `border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.2)]` : `border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.2)]`) : `${theme.border} cursor-pointer hover:bg-white/5`}`} onClick={() => !isActive && setEditingHp(type)}>
                                <label className={`text-[8px] font-bold ${theme.subText} uppercase mb-1 tracking-widest`}>{type}</label>
                                {isActive ? (
                                    <div className="flex flex-col items-center gap-2 w-full px-1" onClick={e => e.stopPropagation()}>
                                            <input type="number" autoFocus placeholder="Val" value={hpInputValue} onChange={e => setHpInputValue(e.target.value)} className={`w-full bg-black/40 border ${theme.border} rounded text-center text-sm font-bold p-1.5 outline-none focus:${theme.accentBorder} ${theme.text}`} />
                                            <div className="grid grid-cols-2 gap-1 w-full">
                                                {type === 'current' ? (
                                                    <>
                                                        <button onClick={() => applyHpChange('dmg')} className="bg-red-900/40 text-[7px] font-bold p-1 rounded border border-red-800 uppercase hover:bg-red-800 transition-colors text-white">Dmg</button>
                                                        <button onClick={() => applyHpChange('heal')} className="bg-green-900/40 text-[7px] font-bold p-1 rounded border border-green-800 uppercase hover:bg-green-800 transition-colors text-white">Heal</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => applyHpChange('dmg')} className="bg-red-900/40 text-[7px] font-bold p-1 rounded border border-red-800 uppercase hover:bg-red-800 transition-colors text-white">Dmg</button>
                                                        <button onClick={() => applyHpChange('set')} className={`bg-zinc-800 text-[7px] font-bold p-1 rounded border ${theme.border} uppercase hover:bg-zinc-700 transition-colors text-white`}>Set</button>
                                                    </>
                                                )}
                                            </div>
                                            <button onClick={() => setEditingHp(null)} className={`w-full mt-1 bg-zinc-950 text-[7px] font-bold p-1 rounded border ${theme.border} uppercase hover:bg-zinc-800 transition-colors text-white`}>Cancel</button>
                                    </div>
                                ) : (
                                    <div className={`text-3xl font-bold dnd-font ${type === 'current' ? theme.text : 'text-blue-400'}`}>{internalC.hp[type]}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hit Dice & Conditions */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl p-4 shadow-lg space-y-4`}>
                <div className="grid grid-cols-3 gap-4">
                    
                    {/* HIT DICE: Combined Box (Col Span 2) */}
                    <div className="col-span-2 space-y-2">
                        <label className={`block text-[8px] font-bold uppercase ${theme.subText} text-center tracking-tighter`}>Hit Dice</label>
                        <div className={`flex items-center bg-black/20 border ${theme.border} rounded-lg p-2 shadow-inner min-h-[60px]`}>
                            
                            {/* Left Side: Count & Squares */}
                            <div className="flex-1 flex flex-col items-center border-r border-white/5 pr-2">
                                <input 
                                    type="number" 
                                    value={internalC.hitDice.total || ""} 
                                    onChange={(e) => handleNestedChange('hitDice', 'total', parseInt(e.target.value)||0)}
                                    className={`w-12 bg-transparent text-center text-sm font-bold ${theme.text} outline-none border-b ${theme.border} mb-2 focus:${theme.accentBorder}`} 
                                    placeholder="Max"
                                />
                                <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                                    {Array.from({ length: internalC.hitDice.total || 0 }).map((_, i) => {
                                        const isSpent = i < (internalC.hitDice.spent || 0);
                                        return (
                                            <button 
                                                key={i}
                                                onClick={() => {
                                                    if (isSpent) {
                                                        handleNestedChange('hitDice', 'spent', Math.max(0, (internalC.hitDice.spent || 0) - 1));
                                                    } else {
                                                        handleNestedChange('hitDice', 'spent', Math.min(internalC.hitDice.total, (internalC.hitDice.spent || 0) + 1));
                                                    }
                                                }}
                                                className={`w-3.5 h-3.5 rounded-[2px] border transition-all shadow-sm ${
                                                    isSpent
                                                        ? `${theme.accentBg} border-white/50 hover:brightness-110` 
                                                        : `bg-slate-900 border-slate-700 hover:border-slate-500`
                                                }`}
                                                title={isSpent ? "Recover Hit Die" : "Spend Hit Die"}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Side: Type */}
                            <div className="w-1/3 flex flex-col items-center justify-center pl-2">
                                <label className={`text-[7px] font-bold uppercase ${theme.subText} mb-1`}>Type</label>
                                <input 
                                    spellCheck="false" 
                                    type="text" 
                                    value={internalC.hitDice.type} 
                                    onChange={(e) => handleNestedChange('hitDice', 'type', e.target.value)} 
                                    className={`w-full bg-transparent text-center text-xl font-bold ${theme.accentText} outline-none placeholder-white/10`} 
                                    placeholder="d?" 
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* EXHAUSTION (Col 3) */}
                    <div className="space-y-2">
                        <label className={`block text-[8px] font-bold uppercase ${theme.subText} text-center tracking-tighter`}>Exhaustion</label>
                        <div className="flex gap-0.5 flex-wrap justify-center">
                            {[0,1,2,3,4,5,6].map(lvl => (
                                <button 
                                    key={lvl} 
                                    onClick={() => handleChange('exhaustion', lvl)} 
                                    className={`w-5 py-1 text-[9px] font-bold rounded border transition-colors ${internalC.exhaustion === lvl ? `${theme.accentBg} ${theme.accentBorder} text-white shadow-sm` : `bg-black/20 ${theme.border} ${theme.subText} hover:border-zinc-500`}`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    {/* CONDITION SECTION */}
                    <div className="space-y-2">
                        <label className={`block text-[9px] font-bold uppercase ${theme.subText} tracking-widest`}>Conditions</label>
                        <div className="flex flex-wrap gap-2 min-h-[24px]">
                            {(internalC.conditions || []).map(cond => (
                                <button key={cond} onClick={() => toggleCondition(cond)} className={`px-2 py-1 ${theme.accentBg}/20 border ${theme.accentBorder} rounded text-[9px] font-bold uppercase ${theme.accentText} hover:bg-white/10 flex items-center gap-1 group`}>
                                    {cond}
                                    <span className={`${theme.accentText} group-hover:text-white`}><Icons.Trash /></span>
                                </button>
                            ))}
                            {(internalC.conditions || []).length === 0 && <span className={`text-[10px] ${theme.subText} italic`}>No active conditions</span>}
                        </div>
                        <div className="relative mt-2">
                            <button onClick={() => setShowCondMenu(!showCondMenu)} className={`w-full py-1.5 text-[10px] font-bold uppercase bg-black/20 border ${theme.border} ${theme.subText} hover:${theme.text} hover:border-zinc-500 rounded transition-colors flex items-center justify-center gap-2`}>
                                <Icons.Plus /> Add Condition
                            </button>
                            {showCondMenu && (
                                <div className={`absolute top-full left-0 w-full z-50 mt-1 ${theme.bgPanel} border ${theme.border} rounded-lg shadow-2xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2`}>
                                    {availableConditions.length > 0 ? (availableConditions.map(cond => (<button key={cond} onClick={() => toggleCondition(cond)} className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase ${theme.subText} hover:bg-white/10 hover:${theme.text} border-b ${theme.border}/50 last:border-0`}>{cond}</button>))) : (<div className={`p-2 text-[10px] ${theme.subText} text-center italic`}>No more conditions</div>)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DEATH SAVES */}
                    <div className="space-y-2">
                        <label className={`block text-[9px] font-bold uppercase ${theme.subText} tracking-widest text-center`}>Death Saves</label>
                        <div className="flex flex-col gap-2 pt-2">
                            <div className={`flex gap-1 items-center justify-between text-[8px] uppercase ${theme.subText} font-bold tracking-widest`}>SUCCESS <div className="flex gap-1.5">{[1,2,3].map(i => <button key={i} onClick={() => handleNestedChange('deathSaves', 'success', internalC.deathSaves.success === i ? i - 1 : i)} className={`w-4 h-4 rounded-full border transition-all ${internalC.deathSaves.success >= i ? 'bg-green-600 border-green-400 shadow-sm' : `border-zinc-600 hover:border-zinc-400`}`}></button>)}</div></div>
                            <div className={`flex gap-1 items-center justify-between text-[8px] uppercase ${theme.subText} font-bold tracking-widest`}>FAILURE <div className="flex gap-1.5">{[1,2,3].map(i => <button key={i} onClick={() => handleNestedChange('deathSaves', 'failure', internalC.deathSaves.failure === i ? i - 1 : i)} className={`w-4 h-4 rounded-full border transition-all ${internalC.deathSaves.failure >= i ? 'bg-red-600 border-red-400 shadow-sm' : `border-zinc-600 hover:border-zinc-400`}`}></button>)}</div></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions & Resistances */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-lg flex flex-col`}>
                <div className={`bg-black/20 p-3 border-b ${theme.border} flex justify-between items-center text-[10px] font-bold uppercase ${theme.subText} tracking-widest`}>
                    <div className="flex items-center gap-2"><Icons.Sword /> Attacks & Actions</div>
                    <button onClick={addAction} className={`p-1.5 ${theme.accentText} hover:bg-white/10 rounded-full transition-all`}><Icons.Plus /></button>
                </div>
                <div className="p-3 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar flex-1">
                    {(internalC.actions || []).map(a => (
                        <div key={a.id} className={`p-3 border ${theme.border} rounded-lg bg-black/20 group space-y-2 shadow-sm hover:border-zinc-500 transition-colors`}>
                            <div className="flex justify-between items-center"><input spellCheck="false" className={`font-bold text-sm bg-transparent outline-none flex-1 ${theme.text} focus:${theme.accentText}`} value={a.name} onChange={(e) => updateAction(a.id, 'name', e.target.value)} /><button onClick={() => removeAction(a.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"><Icons.Trash /></button></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className={`bg-black/20 p-1.5 rounded border ${theme.border} shadow-inner`}><span className={`text-[8px] font-bold ${theme.subText} uppercase`}>Bonus</span><input spellCheck="false" className={`w-full text-xs bg-transparent outline-none font-bold ${theme.text}`} value={a.bonus} onChange={(e) => updateAction(a.id, 'bonus', e.target.value)} /></div>
                                <div className={`bg-black/20 p-1.5 rounded border ${theme.border} shadow-inner`}><span className={`text-[8px] font-bold ${theme.subText} uppercase`}>Damage</span><input spellCheck="false" className={`w-full text-xs bg-transparent outline-none font-bold ${theme.text}`} value={a.damage} onChange={(e) => updateAction(a.id, 'damage', e.target.value)} /></div>
                                <div className={`bg-black/20 p-1.5 rounded border ${theme.border} shadow-inner col-span-2`}><span className={`text-[8px] font-bold ${theme.subText} uppercase tracking-widest`}>Notes</span><input spellCheck="false" className={`w-full text-xs bg-transparent outline-none font-medium ${theme.subText}`} value={a.notes || ""} onChange={(e) => updateAction(a.id, 'notes', e.target.value)} placeholder="..." /></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-lg flex flex-col`}>
                <div className={`bg-black/20 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['resistances','vulnerabilities','immunities'].map(t => (<button key={t} onClick={() => setActiveResTab(t)} className={`px-3 py-2 text-[8px] font-bold uppercase rounded-md m-0.5 transition-all ${activeResTab === t ? `${theme.accentBg} text-white shadow-inner` : `${theme.subText} hover:${theme.text}`}`}>{t}</button>))}
                </div>
                <div className={`px-4 py-2 bg-black/10 border-b ${theme.border} flex items-center gap-2`}><div className={theme.accentText}><Icons.ShieldAlert /></div><span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeResTab)}</span></div>
                <textarea spellCheck="false" value={internalC[activeResTab] || ""} onChange={(e) => handleChange(activeResTab, e.target.value)} className={`w-full h-24 p-3 text-xs outline-none bg-transparent ${theme.text} custom-scrollbar resize-none font-medium focus:text-white transition-colors`} placeholder={`List ${activeResTab}...`} />
            </div>

            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl p-4 shadow-lg h-full`}>
                <h3 className={`text-[10px] font-bold ${theme.accentText} uppercase mb-3 border-b ${theme.border} pb-2 tracking-widest tracking-widest`}>Saving Throws</h3>
                <div className="space-y-2">
                    {Object.keys(internalC.stats).map(stat => (
                        <div key={stat} className="flex items-center gap-3 text-xs group py-1">
                            <ProficiencyButton level={internalC.savingThrowsProf[stat] || 0} onClick={() => cycleSaveProf(stat)} />
                            <span className={`w-8 font-bold ${internalC.savingThrowsProf[stat] > 0 ? theme.accentText : theme.subText}`}>{formatMod(getMod(internalC.stats[stat]) + (internalC.savingThrowsProf[stat] || 0) * prof + (internalC.saveMiscBonuses[stat] || 0))}</span>
                            <span className={`capitalize ${theme.text} font-medium flex-1`}>{stat}</span>
                            <input type="number" value={internalC.saveMiscBonuses[stat] || ""} placeholder="+0" onChange={(e) => handleSaveMiscChange(stat, e.target.value)} className={`w-8 bg-black/20 border ${theme.border} rounded text-[10px] text-center ${theme.subText} outline-none focus:${theme.accentBorder} transition-colors`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default SheetCombat;