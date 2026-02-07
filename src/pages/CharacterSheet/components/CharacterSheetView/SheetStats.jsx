import React from 'react';
import { ProficiencyButton } from '../CharacterIcons';
import { getMod, formatMod, getProfBonus, abilitySkills } from '../CharacterHelpers';

const SheetStats = ({ c, onUpdate, theme }) => {
    const prof = getProfBonus(c.level);
    
    const handleNestedChange = (parent, field, value) => onUpdate({ [parent]: { ...c[parent], [field]: value } });
    const handleStatChange = (stat, value) => handleNestedChange('stats', stat, parseInt(value) || 0);
    const handleSkillMiscChange = (skill, value) => handleNestedChange('skillMiscBonuses', skill, parseInt(value) || 0);
    const cycleProficiency = (skill) => handleNestedChange('proficiencies', skill, ((c.proficiencies[skill] || 0) + 1) % 3);

    // Vi definerer rækkefølgen eksplicit for at matche standard D&D layout
    const statOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    return (
        <div className="space-y-4">
            
            {/* Proficiency Bonus Header */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl p-3 flex items-center justify-between shadow-sm h-14 transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                    <div className={`${theme.accentBg} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-inner`}>+{prof}</div>
                    <span className={`text-[10px] font-bold uppercase ${theme.subText} tracking-widest`}>Proficiency Bonus</span>
                </div>
            </div>

            {/* The 2024 Style: Stat Cards containing their Skills */}
            <div className="flex flex-col gap-4">
                {statOrder.map((stat) => {
                    const value = c.stats[stat] || 10;
                    const mod = getMod(value);
                    const skills = abilitySkills[stat] || [];
                    
                    return (
                        <div key={stat} className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm transition-all hover:border-zinc-500`}>
                            
                            {/* --- STAT HEADER (Score & Mod) --- */}
                            <div className={`flex justify-between items-center p-3 bg-black/5 border-b ${theme.border}/50`}>
                                <div className="flex items-center gap-3">
                                    {/* Score Input (Small) */}
                                    <div className={`flex flex-col items-center bg-black/10 border ${theme.border} rounded-lg p-1`}>
                                        <label className={`text-[7px] font-bold uppercase ${theme.subText} mb-0.5`}>Score</label>
                                        <input 
                                            type="number" 
                                            value={value} 
                                            onChange={(e) => handleStatChange(stat, e.target.value)} 
                                            className={`w-8 text-center bg-transparent outline-none font-bold text-sm ${theme.text}`} 
                                        />
                                    </div>
                                    {/* Stat Name */}
                                    <label className={`text-xs font-bold uppercase ${theme.accentText} tracking-widest`}>{stat}</label>
                                </div>

                                {/* Modifier (Big) */}
                                <div className={`text-2xl font-bold dnd-font ${theme.text}`}>
                                    {formatMod(mod)}
                                </div>
                            </div>

                            {/* --- SKILLS LIST --- */}
                            {skills.length > 0 ? (
                                <div className="p-2 space-y-1">
                                    {skills.map(skillName => {
                                        const p = c.proficiencies[skillName] || 0;
                                        const m = c.skillMiscBonuses[skillName] || 0;
                                        const tot = mod + (p * prof) + m;
                                        
                                        return (
                                            <div key={skillName} className={`flex items-center gap-3 p-1.5 rounded hover:bg-black/5 transition-colors`}>
                                                {/* Prof Dot */}
                                                <ProficiencyButton level={p} onClick={() => cycleProficiency(skillName)} />
                                                
                                                {/* Total Mod */}
                                                <span className={`w-6 text-right font-bold text-xs ${p > 0 ? theme.accentText : theme.subText}`}>
                                                    {formatMod(tot)}
                                                </span>
                                                
                                                {/* Skill Name */}
                                                <span className={`flex-1 ${theme.text} text-xs font-medium truncate`}>
                                                    {skillName}
                                                </span>
                                                
                                                {/* Misc Bonus Input */}
                                                <input 
                                                    type="number" 
                                                    value={c.skillMiscBonuses[skillName] || ""} 
                                                    placeholder="0" 
                                                    onChange={(e) => handleSkillMiscChange(skillName, e.target.value)} 
                                                    className={`w-6 bg-transparent border-b ${theme.border} text-[10px] text-center font-bold ${theme.subText} outline-none focus:${theme.accentBorder} focus:text-white transition-colors placeholder-zinc-700`} 
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // For Constitution (no skills usually) - just a spacer or empty
                                <div className={`p-2 text-[9px] ${theme.subText} italic text-center opacity-50`}>
                                    No associated skills
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default SheetStats;