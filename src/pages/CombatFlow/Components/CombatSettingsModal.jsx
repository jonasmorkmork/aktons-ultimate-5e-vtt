import React, { useState, useEffect } from 'react';
import * as Icons from './CombatIcons';

const { X, Keyboard, Trash2, Settings } = Icons; 

const CombatSettingsModal = ({ logic }) => {
    const { showSettings, setShowSettings, shortcuts, updateShortcut, resetShortcuts, maxGroupSize, setMaxGroupSize } = logic;
    const [listeningFor, setListeningFor] = useState(null);

    useEffect(() => {
        if (!listeningFor) return;
        const handleKeyDown = (e) => {
            e.preventDefault();
            if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
            updateShortcut(listeningFor, e.key);
            setListeningFor(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [listeningFor, updateShortcut]);

    if (!showSettings) return null;

    const friendlyNames = {
        NAV_DOWN: 'Move Down',
        NAV_UP: 'Move Up',
        SELECT_GROUP: 'Open Group',
        DELETE: 'Delete Unit',
        HP_EDIT: 'Open HP/Dmg Menu',
        NOTE_EDIT: 'Edit Note',
        CONDITION_MENU: 'Conditions Menu',
        COMBAT_MODE: 'Toggle Combat Mode',
        UNDO: 'Undo (Ctrl + ...)',
        
        // Modal Actions
        DMG_APPLY: 'Apply Damage (Modal)',
        HEAL_APPLY: 'Apply Heal (Modal)',
        TEMP_APPLY: 'Set Temp HP (Modal)',
        RESIST: 'Resistance (Half)',
        VULN: 'Vulnerability (Double)'
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowSettings(false)}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="text-amber-500" size={24}/> Settings
                </h2>

                <div className="mb-6 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1 font-bold">Max Group Size</label>
                        <input type="number" min="1" max="50" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500" value={maxGroupSize} onChange={(e) => setMaxGroupSize(Math.max(1, parseInt(e.target.value) || 10))} />
                    </div>
                </div>

                <h3 className="text-md font-bold text-slate-300 mb-4 flex items-center gap-2 border-t border-slate-800 pt-4"><Keyboard size={16}/> Keyboard Shortcuts</h3>

                <div className="grid gap-2 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(shortcuts).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center bg-slate-950/50 p-2 rounded border border-slate-800">
                            <span className="text-slate-400 font-medium text-xs">{friendlyNames[key] || key}</span>
                            <button onClick={() => setListeningFor(key)} className={`min-w-[80px] px-3 py-1 rounded text-xs font-mono font-bold border transition-all text-center ${listeningFor === key ? 'bg-amber-600 border-amber-400 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}>
                                {listeningFor === key ? 'Press Key...' : val.toUpperCase()}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-800">
                    <button onClick={resetShortcuts} className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14}/> Reset Shortcuts</button>
                    <button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg text-sm border-t border-blue-400">Done</button>
                </div>
            </div>
        </div>
    );
};

export default CombatSettingsModal;