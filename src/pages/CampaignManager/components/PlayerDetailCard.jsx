import React from 'react';
import { SwordIcon, EyeIcon, UserMinusIcon } from './CampaignIcons';

// --- HELPERS ---
const getMod = (score) => Math.floor(((score || 10) - 10) / 2);
const formatMod = (mod) => (mod >= 0 ? `+${mod}` : mod);
const getProf = (level) => Math.ceil((level || 1) / 4) + 1;

const PlayerDetailCard = ({ player, uid, onSendToCombat, onInspect, onKick, isDm }) => {
    const char = player.liveData || player;
    const stats = char.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
    const hp = char.hp || { current: 0, max: 0 };
    const level = char.level || 1;
    const pb = getProf(level);
    
    const wisMod = getMod(stats.wisdom);
    const perceptionProf = (char.proficiencies?.["Perception"] || 0); 
    const passivePerception = 10 + wisMod + (perceptionProf * pb);
    const abilityOrder = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

    let spellDc = null;
    if (char.isSpellcaster) {
        const ability = char.spellcastingAbility?.toLowerCase() || 'intelligence';
        const mod = getMod(stats[ability]);
        spellDc = 8 + pb + mod;
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-lg hover:border-slate-700 transition-colors relative group">
            
            {/* Header / Navn */}
            <div className="flex justify-between items-start mb-3">
                <div className="overflow-hidden">
                    <h3 className="text-lg font-bold text-white truncate">{char.name}</h3>
                    {/* Subclass er flyttet herop for at gøre plads i bunden */}
                    <div className="text-xs text-slate-500 truncate">
                        Lvl {level} {char.class} 
                        {char.subclass && <span className="text-slate-600 italic"> - {char.subclass}</span>}
                    </div>
                </div>
                
                {/* DM ACTION BUTTONS */}
                <div className="flex gap-1">
                    <button 
                        onClick={() => onSendToCombat(char, uid)} 
                        className="bg-red-900/30 hover:bg-red-900/50 text-red-400 p-2 rounded transition-colors" 
                        title="Add to Combat"
                    >
                        <SwordIcon />
                    </button>
                    <button 
                        onClick={() => onInspect(char)} 
                        className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 p-2 rounded transition-colors" 
                        title="Inspect (View Only)"
                    >
                        <EyeIcon />
                    </button>
                    {isDm && (
                        <button 
                            onClick={() => onKick(uid, char.name)}
                            className="bg-slate-800 hover:bg-red-900 text-slate-500 hover:text-white p-2 rounded transition-colors border border-slate-700 hover:border-red-500"
                            title="Kick Player"
                        >
                            <UserMinusIcon />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats Grid - AC i midten */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-950 rounded p-1.5 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">HP</div>
                    <div className="text-lg font-bold text-green-500">{hp.current} <span className="text-xs text-slate-600">/{hp.max}</span></div>
                </div>
                <div className="bg-slate-950 rounded p-1.5 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">AC</div>
                    <div className="text-lg font-bold text-blue-400">{char.ac}</div>
                </div>
                <div className="bg-slate-950 rounded p-1.5 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Speed</div>
                    <div className="text-lg font-bold text-slate-300">{char.speed}</div>
                </div>
            </div>
            
            {/* Secondary Stats Row (FIXED LAYOUT) */}
            <div className="flex justify-between items-center text-xs bg-slate-950/50 p-2 rounded mb-3">
                {/* Venstre: Proficiency Bonus */}
                <div><span className="text-slate-500 font-bold">Prof:</span> +{pb}</div>
                
                {/* Midten eller Højre: Passive Perception */}
                {/* Hvis DC findes, står PP i midten. Hvis ikke, står den til højre (pga. justify-between) */}
                <div><span className="text-slate-500 font-bold">PP:</span> {passivePerception}</div>
                
                {/* Højre: Spell Save DC (hvis den findes) */}
                {spellDc && (
                    <div><span className="text-purple-400 font-bold">DC:</span> {spellDc}</div>
                )}
            </div>
            
            <div className="grid grid-cols-6 gap-1">
                {abilityOrder.map((key) => (
                    <div key={key} className="flex flex-col items-center">
                        <div className="text-[8px] uppercase text-slate-600 font-bold">{key.substring(0,3)}</div>
                        <div className="text-xs font-bold text-slate-400">{formatMod(getMod(stats[key]))}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerDetailCard;