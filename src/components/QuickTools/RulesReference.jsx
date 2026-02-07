import React, { useState } from 'react';

const CONDITIONS = {
    "Blinded": "Can't see (auto-fail sight checks). Attacks against you have Adv. Your attacks have Disadv.",
    "Charmed": "Can't attack/target charmer. Charmer has Adv on social checks against you.",
    "Dazed": "Can only do ONE of: Move, Action, or Bonus Action. Turn ends immediately if applied during turn.",
    "Deafened": "Can't hear (auto-fail hearing checks).",
    "Exhaustion": "Levels 1-6 (6 = Dead). -2 to d20 Tests & -5ft Speed per level. Long Rest removes 1 level.",
    "Frightened": "Disadv on checks/attacks while source is visible. Can't willingly move closer to source.",
    "Grappled": "Speed 0. Disadv on attacks vs targets other than grappler. Grappler can drag you.",
    "Incapacitated": "Inactive (No Action/Bonus Action/Reaction). Concentration broken. Can't speak. Disadv on Initiative.",
    "Invisible": "Adv on Initiative. Concealed. Attacks against you have Disadv. Your attacks have Adv.",
    "Paralyzed": "Incapacitated. Speed 0. Auto-fail Str/Dex saves. Attacks against you have Adv (Auto-crit if within 5ft).",
    "Petrified": "Turned to stone (x10 weight). Incapacitated. Speed 0. Resist all dmg. Immune to Poisoned. Attacks against you have Adv. Auto-fail Str/Dex saves.",
    "Poisoned": "Disadv on all attack rolls and ability checks.",
    "Prone": "Crawl or stand (cost 1/2 speed). Your attacks have Disadv. Attacks against you: Adv if within 5ft, otherwise Disadv.",
    "Restrained": "Speed 0. Disadv on Dex saves. Attacks against you have Adv. Your attacks have Disadv.",
    "Stunned": "Incapacitated. Auto-fail Str/Dex saves. Attacks against you have Adv.",
    "Unconscious": "Incapacitated & Prone. Drop held items. Speed 0. Unaware. Auto-fail Str/Dex saves. Attacks against you have Adv (Auto-crit if within 5ft)."
};

const RulesReference = ({ onClose }) => {
    const [filter, setFilter] = useState("");

    return (
        <div className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950 rounded-t-xl">
                    <h3 className="font-bold text-amber-500 uppercase tracking-widest text-sm">Rules Reference (2024)</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
                </div>
                
                <div className="p-3 bg-slate-900 border-b border-slate-800">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Search condition..." 
                        className="w-full bg-black/30 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {Object.entries(CONDITIONS)
                        .filter(([name]) => name.toLowerCase().includes(filter.toLowerCase()))
                        .map(([name, desc]) => (
                            <div key={name} className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                                <div className="text-amber-400 font-bold text-sm mb-1">{name}</div>
                                <div className="text-slate-300 text-xs leading-relaxed">{desc}</div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default RulesReference;