import React, { useState } from 'react';
import { Icons, Icon } from './StatBlockIcons';

const StatBlockMobileView = ({ data }) => {
    const [activeTab, setActiveTab] = useState('main'); // 'main', 'combat', 'actions', 'traits'

    // Helper til at vise lister (Actions, Traits osv.)
    const renderList = (items) => {
        if (!items || items.length === 0) return <div className="text-gray-500 italic text-center py-4 text-xs">None</div>;
        return (
            <div className="space-y-4">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm">
                        <div className="font-bold text-red-400 mb-1 border-b border-gray-700 pb-1 text-sm">{item.name}</div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{item.desc}</div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-200">
            
            {/* HEADER (Sticky) */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 shadow-md sticky top-0 z-10 shrink-0">
                <h2 className="text-xl font-bold text-red-500 font-serif-dnd truncate">{data.name || "Unknown Monster"}</h2>
                <div className="text-xs text-gray-400 italic truncate mb-3">{data.meta}</div>
                
                {/* 3-KOLONNE STATS BOKS */}
                <div className="flex rounded border border-gray-700 bg-gray-900/50 overflow-hidden">
                    {/* AC */}
                    <div className="flex-1 p-2 text-center border-r border-gray-700 flex flex-col justify-center">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">AC</span>
                        <span className="text-red-400 text-sm font-bold leading-tight break-words whitespace-normal">{data.ac || 10}</span>
                    </div>
                    
                    {/* HP */}
                    <div className="flex-1 p-2 text-center border-r border-gray-700 flex flex-col justify-center">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">HP</span>
                        <span className="text-green-400 text-sm font-bold leading-tight break-words whitespace-normal">{data.hp || 10}</span>
                    </div>
                    
                    {/* SPEED */}
                    <div className="flex-1 p-2 text-center flex flex-col justify-center">
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">SPD</span>
                        <span className="text-blue-400 text-sm font-bold leading-tight break-words whitespace-normal">
                            {data.speed ? data.speed.split(',')[0] : "30ft"}
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {/* --- MAIN TAB: Stats, Saves, Skills --- */}
                {activeTab === 'main' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Ability Scores */}
                        <div className="grid grid-cols-3 gap-2">
                            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => (
                                <div key={stat} className="bg-gray-800 p-2 rounded border border-gray-700 text-center flex flex-col justify-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{stat}</span>
                                    <span className="text-lg font-bold text-gray-200">{data.stats[stat]?.val || 10}</span>
                                    <span className="text-xs font-mono text-gray-400">{data.stats[stat]?.mod || "+0"}</span>
                                </div>
                            ))}
                        </div>

                        {/* General Props */}
                        <div className="space-y-3 text-sm">
                            {data.props.saves && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <span className="text-xs font-bold text-red-400 block mb-1 uppercase">Saves</span>
                                    <span className="text-gray-300">{data.props.saves}</span>
                                </div>
                            )}
                            {data.props.skills && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                    <span className="text-xs font-bold text-red-400 block mb-1 uppercase">Skills</span>
                                    <span className="text-gray-300">{data.props.skills}</span>
                                </div>
                            )}
                            {data.props.senses && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Senses</span>
                                    <span className="text-gray-300 text-right">{data.props.senses}</span>
                                </div>
                            )}
                            {data.props.languages && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">Languages</span>
                                    <span className="text-gray-300 text-right">{data.props.languages}</span>
                                </div>
                            )}
                            {data.props.challenge && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Challenge</span>
                                    <span className="text-red-400 font-bold">{data.props.challenge}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- COMBAT TAB: Resistances & Immunities --- */}
                {activeTab === 'combat' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-1 mb-2">Defenses</h3>
                        
                        {data.props.vulnerabilities ? (
                            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded">
                                <div className="text-xs font-bold text-red-400 uppercase mb-1">Vulnerabilities</div>
                                <div className="text-sm text-gray-300">{data.props.vulnerabilities}</div>
                            </div>
                        ) : <div className="text-xs text-gray-600 italic text-center p-2 border border-gray-800 rounded">No Vulnerabilities</div>}

                        {data.props.resistances ? (
                            <div className="bg-orange-900/20 border border-orange-900/50 p-3 rounded">
                                <div className="text-xs font-bold text-orange-400 uppercase mb-1">Resistances</div>
                                <div className="text-sm text-gray-300">{data.props.resistances}</div>
                            </div>
                        ) : <div className="text-xs text-gray-600 italic text-center p-2 border border-gray-800 rounded">No Resistances</div>}

                        {data.props.immunities ? (
                            <div className="bg-green-900/20 border border-green-900/50 p-3 rounded">
                                <div className="text-xs font-bold text-green-400 uppercase mb-1">Immunities</div>
                                <div className="text-sm text-gray-300">{data.props.immunities}</div>
                            </div>
                        ) : <div className="text-xs text-gray-600 italic text-center p-2 border border-gray-800 rounded">No Immunities</div>}

                        {data.props.conditions ? (
                            <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded">
                                <div className="text-xs font-bold text-blue-400 uppercase mb-1">Condition Immunities</div>
                                <div className="text-sm text-gray-300">{data.props.conditions}</div>
                            </div>
                        ) : <div className="text-xs text-gray-600 italic text-center p-2 border border-gray-800 rounded">No Condition Immunities</div>}
                    </div>
                )}

                {/* --- ACTIONS TAB --- */}
                {activeTab === 'actions' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Actions */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-1 mb-3">Actions</h3>
                            {renderList(data.actions)}
                        </div>
                        
                        {/* Bonus Actions */}
                        {data.bonusActions && data.bonusActions.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-1 mb-3">Bonus Actions</h3>
                                {renderList(data.bonusActions)}
                            </div>
                        )}

                        {/* Reactions */}
                        {data.reactions && data.reactions.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-1 mb-3">Reactions</h3>
                                {renderList(data.reactions)}
                            </div>
                        )}
                        
                        {/* Legendary Actions */}
                        {data.legendary && data.legendary.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest border-b border-gray-700 pb-1 mb-3">Legendary Actions</h3>
                                <div className="text-[10px] text-gray-400 italic mb-3 bg-purple-900/10 p-2 rounded border border-purple-900/30">
                                    The monster can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn.
                                </div>
                                {renderList(data.legendary)}
                            </div>
                        )}
                    </div>
                )}

                {/* --- TRAITS TAB --- */}
                {activeTab === 'traits' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-1 mb-3">Traits & Abilities</h3>
                        {renderList(data.traits)}
                    </div>
                )}

            </div>

            {/* BOTTOM NAV */}
            <div className="bg-gray-800 border-t border-gray-700 p-2 flex justify-between items-center shrink-0 safe-pb">
                <NavButton active={activeTab === 'main'} onClick={() => setActiveTab('main')} icon={Icons.UserIcon} label="Stats" />
                <NavButton active={activeTab === 'combat'} onClick={() => setActiveTab('combat')} icon={Icons.Shield} label="Defense" />
                <NavButton active={activeTab === 'actions'} onClick={() => setActiveTab('actions')} icon={Icons.Sword} label="Actions" />
                <NavButton active={activeTab === 'traits'} onClick={() => setActiveTab('traits')} icon={Icons.Book} label="Traits" />
            </div>
        </div>
    );
};

// NavButton Component
const NavButton = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded transition-colors mx-1 ${active ? 'text-red-500 bg-gray-700/50' : 'text-gray-500 hover:text-gray-300'}`}
    >
        <Icon path={icon} className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
);

export default StatBlockMobileView;