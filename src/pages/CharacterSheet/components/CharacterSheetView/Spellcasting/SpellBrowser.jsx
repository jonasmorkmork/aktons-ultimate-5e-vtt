import React, { useState } from 'react';
import { SPELL_DB } from './SpellList';

const SpellBrowser = ({ isOpen, onClose, onAddSpell }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLevel, setFilterLevel] = useState("ALL");
    const [filterClass, setFilterClass] = useState("ALL");
    
    // NY STATE: Holder styr på hvilken spell der er foldet ud (gemmer navnet)
    const [expandedSpell, setExpandedSpell] = useState(null);

    if (!isOpen) return null;

    const filteredSpells = SPELL_DB.filter(spell => {
        const matchesSearch = spell.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === "ALL" || spell.level === parseInt(filterLevel);
        const matchesClass = filterClass === "ALL" || (spell.classes && spell.classes.includes(filterClass));
        return matchesSearch && matchesLevel && matchesClass;
    });

    const dndClasses = ["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"];

    // Hjælper til at håndtere klik på en række
    const toggleExpand = (spellName) => {
        if (expandedSpell === spellName) {
            setExpandedSpell(null); // Luk hvis den allerede er åben
        } else {
            setExpandedSpell(spellName); // Åbn den valgte
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* HEADER */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        Spell Browser <span className="text-zinc-600 text-xs normal-case">(2024 Rules)</span>
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* FILTERS */}
                <div className="p-4 bg-zinc-900 grid grid-cols-1 md:grid-cols-4 gap-3 border-b border-zinc-800">
                    <div className="md:col-span-2 relative">
                        <input 
                            type="text" 
                            placeholder="Search spell name..." 
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-amber-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <svg className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    
                    <select 
                        className="bg-zinc-950 border border-zinc-700 rounded-lg py-2 px-3 text-sm text-zinc-400 outline-none focus:border-amber-500 cursor-pointer"
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                    >
                        <option value="ALL">All Levels</option>
                        {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>)}
                    </select>

                    <select 
                        className="bg-zinc-950 border border-zinc-700 rounded-lg py-2 px-3 text-sm text-zinc-400 outline-none focus:border-amber-500 cursor-pointer"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="ALL">All Classes</option>
                        {dndClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* LIST HEADERS */}
                <div className="grid grid-cols-12 gap-2 px-6 py-2 bg-zinc-950/80 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 hidden md:grid">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Level</div>
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">School</div>
                    <div className="col-span-1 text-right">Add</div>
                </div>

                {/* SPELL LIST */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-900/50">
                    {filteredSpells.length === 0 ? (
                        <div className="text-center text-zinc-600 py-10 italic">No spells found matching your filters.</div>
                    ) : (
                        filteredSpells.map((spell, idx) => {
                            const isExpanded = expandedSpell === spell.name;
                            // Lav en kort version af beskrivelsen (klip ved 90 tegn)
                            const shortDesc = spell.description.length > 90 
                                ? spell.description.substring(0, 90) + "..." 
                                : spell.description;

                            return (
                                <div 
                                    key={idx} 
                                    className={`px-6 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors group cursor-pointer ${isExpanded ? 'bg-zinc-800/30' : ''}`}
                                    onClick={() => toggleExpand(spell.name)}
                                >
                                    {/* TOP ROW: Basic Info */}
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-8 md:col-span-4 font-bold text-zinc-200 group-hover:text-amber-400 transition-colors truncate flex items-center gap-2">
                                            {spell.name}
                                            {/* Lille pil der roterer */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                                        </div>
                                        <div className="hidden md:block col-span-2 text-xs text-zinc-400">{spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}</div>
                                        <div className="hidden md:block col-span-2 text-xs text-zinc-500 truncate">{spell.time}</div>
                                        <div className="hidden md:block col-span-3 text-xs text-zinc-500 truncate">{spell.school}</div>
                                        
                                        {/* ADD BUTTON */}
                                        <div className="col-span-4 md:col-span-1 flex justify-end">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Stop klikket i at folde kortet ud
                                                    onAddSpell(spell);
                                                }}
                                                className="bg-zinc-800 hover:bg-amber-600 text-zinc-400 hover:text-white rounded-md p-1.5 transition-all shadow-sm border border-zinc-700 hover:border-amber-500"
                                                title="Add to Spellbook"
                                            >
                                                <div className="flex items-center gap-1 px-1">
                                                    <span className="text-[10px] font-bold uppercase md:hidden">Add</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* BOTTOM ROW: Description (Short or Long) */}
                                    <div className="mt-2 text-xs leading-relaxed">
                                        {isExpanded ? (
                                            <div className="animate-in fade-in slide-in-from-top-1">
                                                {/* Mobile Details (kun synlig når åben på mobil) */}
                                                <div className="md:hidden flex flex-wrap gap-2 mb-2 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-700/50 pb-2">
                                                    <span>{spell.level === 0 ? 'Cantrip' : `Lvl ${spell.level}`}</span> • 
                                                    <span>{spell.school}</span> • 
                                                    <span>{spell.time}</span> • 
                                                    <span>{spell.range}</span>
                                                </div>
                                                
                                                {/* Full Description */}
                                                <p className="text-zinc-300 whitespace-pre-wrap font-serif">
                                                    {spell.description}
                                                </p>
                                                
                                                {/* Extra Info Footer */}
                                                <div className="mt-3 pt-2 border-t border-zinc-700/30 flex gap-4 text-[10px] text-zinc-500 font-mono">
                                                    <span>Range: <span className="text-zinc-400">{spell.range}</span></span>
                                                    <span>Duration: <span className="text-zinc-400">{spell.duration}</span></span>
                                                    <span>Comp: <span className="text-zinc-400">{spell.comp}</span></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-zinc-500 italic truncate">
                                                {shortDesc}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpellBrowser;