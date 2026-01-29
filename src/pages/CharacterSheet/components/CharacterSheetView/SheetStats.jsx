import React from 'react';
import { ProficiencyButton } from '../CharacterIcons';
import { getMod, formatMod, getProfBonus, abilitySkills } from '../CharacterHelpers';

const SheetStats = ({ c, onUpdate, theme }) => {
    const prof = getProfBonus(c.level);
    
    const handleNestedChange = (parent, field, value) => onUpdate({ [parent]: { ...c[parent], [field]: value } });
    const handleStatChange = (stat, value) => handleNestedChange('stats', stat, parseInt(value) || 0);
    const handleSkillMiscChange = (skill, value) => handleNestedChange('skillMiscBonuses', skill, parseInt(value) || 0);
    const cycleProficiency = (skill) => handleNestedChange('proficiencies', skill, ((c.proficiencies[skill] || 0) + 1) % 3);

    return (
        <div className="space-y-4">
            {/* Proficiency Bonus */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl p-3 flex items-center justify-between shadow-sm h-16 transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                    <div className={`${theme.accentBg} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner`}>+{prof}</div>
                    <span className={`text-[10px] font-bold uppercase ${theme.subText}`}>Proficiency Bonus</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {Object.entries(c.stats).map(([k, v]) => (
                    <div key={k} className={`relative ${theme.bgPanel} border ${theme.border} rounded-xl p-3 flex flex-col items-center shadow-sm hover:border-zinc-500 transition-all group`}>
                        <label className={`text-[10px] font-bold uppercase ${theme.accentText} mb-1`}>{k}</label>
                        <div className={`text-3xl font-bold mb-4 dnd-font ${theme.text}`}>{formatMod(getMod(v))}</div>
                        
                        {/* Input pill with semi-transparent background instead of fixed zinc-800 */}
                        <div className={`absolute -bottom-3 bg-black/20 border ${theme.border} rounded-full px-3 py-1 text-xs font-bold shadow-sm group-hover:border-zinc-500 transition-colors backdrop-blur-sm`}>
                            <input type="number" value={v} onChange={(e) => handleStatChange(k, e.target.value)} className={`w-8 text-center bg-transparent outline-none focus:${theme.accentText} ${theme.text}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Skills List */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl p-4 shadow-sm h-full`}>
                <h3 className={`text-[10px] font-bold ${theme.accentText} uppercase mb-4 border-b ${theme.border} pb-2 tracking-widest tracking-widest`}>Skills</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(abilitySkills).map(([ability, skills]) => skills.length > 0 && (
                        <div key={ability} className="space-y-1">
                            {/* Ability Header with semi-transparent background */}
                            <div className={`text-[9px] font-bold ${theme.subText} uppercase border-l-2 ${theme.accentBorder} pl-2 bg-black/10 py-0.5`}>{ability}</div>
                            {skills.map(skillName => {
                                const p = c.proficiencies[skillName] || 0;
                                const m = c.skillMiscBonuses[skillName] || 0;
                                const tot = getMod(c.stats[ability]) + (p * prof) + m;
                                return (
                                    <div key={skillName} className={`flex items-center gap-3 text-sm py-1 border-b ${theme.border}/20 last:border-0 ml-2`}>
                                        <ProficiencyButton level={p} onClick={() => cycleProficiency(skillName)} />
                                        <span className={`w-8 font-bold text-center ${p > 0 ? theme.accentText : theme.subText}`}>{formatMod(tot)}</span>
                                        <span className={`flex-1 ${theme.text} text-xs font-medium`}>{skillName}</span>
                                        
                                        {/* Input with semi-transparent background */}
                                        <input type="number" value={c.skillMiscBonuses[skillName] || ""} placeholder="+0" onChange={(e) => handleSkillMiscChange(skillName, e.target.value)} className={`w-8 bg-black/10 border ${theme.border} rounded text-[10px] text-center font-bold ${theme.accentText} outline-none focus:${theme.accentBorder} transition-colors`} />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default SheetStats;