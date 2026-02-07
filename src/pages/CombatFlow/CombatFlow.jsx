import React from 'react'; // Fjernede { useEffect, useState } da de ikke bruges her mere
import { useCombatLogic } from './Components/useCombatLogic/index';
import CombatHeader from './components/CombatHeader';
import CombatDashboard from './components/CombatDashboard';
import CombatList from './components/CombatList';
import CombatModals from './components/CombatModals';
import * as Icons from './components/CombatIcons';

// Bemærk: Vi har fjernet useAuth, useCampaign og Firebase imports herfra,
// da logikken nu bor inde i useCombatLogic (eller burde gøre det).
// Hvis du vil have Cloud Save (Firebase) tilbage, skal det flyttes ind i useCombatPersistence.js.
// For nu fokuserer vi på at få LocalStorage overførslen til at virke stabilt.

const { ChevronRight } = Icons;

const CombatFlow = () => {
    // Vi henter ALT fra vores hook. Ingen lokal state eller effects her!
    const logic = useCombatLogic();
    
    const { 
        notification, combatants, nextTurn, inCombatMode, 
        setConditionMenuId, setHpEditId, hpEditValue 
    } = logic;

    return (
        <div 
            className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-48" 
            onClick={() => { setConditionMenuId(null); if(!hpEditValue) setHpEditId(null); }}
        >
            <CombatHeader logic={logic} />
            
            <div className="max-w-5xl mx-auto p-4 space-y-6">
                {!inCombatMode && <CombatDashboard logic={logic} />}
                <CombatList logic={logic} />
            </div>

            {/* FOOTER */}
            <div className="fixed bottom-0 left-0 w-full bg-[#020617]/95 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-[100] backdrop-blur-sm">
                {notification && <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white px-6 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce font-bold tracking-wide border border-amber-400">{notification}</div>}
                
                <div className="p-4 max-w-6xl mx-auto flex justify-between items-center gap-6">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{combatants.length} Entities Active</div>
                    
                    <button 
                        onClick={nextTurn} 
                        disabled={combatants.length === 0} 
                        className="
                            group relative px-8 py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 
                            text-white font-fantasy font-bold text-xl tracking-widest rounded shadow-[0_0_20px_rgba(245,158,11,0.2)] 
                            hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] border-t border-amber-400/30 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale
                            flex items-center gap-3 overflow-hidden
                        "
                    >
                        <span className="relative z-10">NEXT TURN</span>
                        <ChevronRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform"/>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </button>
                </div>
            </div>

            <CombatModals logic={logic} />
        </div>
    );
};

export default CombatFlow;