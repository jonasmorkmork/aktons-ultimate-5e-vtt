import React from 'react';
import * as Icons from './CombatIcons';
import CombatTracker from './CombatTracker';
import CombatLibrary from './CombatLibrary';
import CombatPresets from './CombatPresets';

const { Sword, Book, Map: MapIcon } = Icons;

const CombatDashboard = ({ logic }) => {
    const { activeTab, setActiveTab } = logic;

    return (
        <>
            <div className="flex justify-center mb-6">
                <div className="flex p-1 bg-black/40 rounded-full border border-white/10 backdrop-blur-md">
                    {[
                        { id: 'tracker', label: 'Battlefield', icon: <Sword size={14}/> },
                        { id: 'library', label: 'Bestiary', icon: <Book size={14}/> },
                        { id: 'presets', label: 'Encounters', icon: <MapIcon size={14} /> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id)} 
                            className={`
                                px-6 py-2 rounded-full font-fantasy font-bold tracking-widest uppercase text-xs transition-all duration-300 flex items-center gap-2
                                ${activeTab === tab.id 
                                    ? 'bg-amber-700 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                    : 'text-slate-500 hover:text-amber-500 hover:bg-white/5'
                                }
                            `}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {activeTab === 'tracker' && <CombatTracker logic={logic} />}
            {activeTab === 'library' && <CombatLibrary logic={logic} />}
            {activeTab === 'presets' && <CombatPresets logic={logic} />}
        </>
    );
};

export default CombatDashboard;