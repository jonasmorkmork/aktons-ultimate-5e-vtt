import React from 'react';
import { useNavigate } from 'react-router-dom'; // <--- NY IMPORT
import * as Icons from './CombatIcons';

// HUSK at inkludere 'Settings' her i destructuring
const { Sword, Download, Upload, Keyboard, RefreshCw, Settings } = Icons; 

// Inline Home Icon for at være sikker på den virker uden at ændre Icons filen
const HomeIcon = ({ size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const CombatHeader = ({ logic }) => {
    const navigate = useNavigate(); // <--- HOOK
    const { 
        combatants, round, inCombatMode, setInCombatMode, setShowShortcuts, 
        clearCombat, fileInputRef, setShowSettings 
    } = logic;

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ 
            combatants, round, library: logic.library, presets: logic.presets, logs: logic.logs,
            groupInit: logic.groupInit, maxGroupSize: logic.maxGroupSize
        }));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "dnd-encounter.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        logic.showNotification("Data exported");
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                logic.pushHistory();
                logic.setCombatants(parsed.combatants || []);
                logic.setRound(parsed.round || 1);
                logic.setLibrary(parsed.library || []);
                logic.setPresets(parsed.presets || []);
                logic.setLogs(parsed.logs || []);
                if(parsed.groupInit !== undefined) logic.setGroupInit(parsed.groupInit);
                if(parsed.maxGroupSize !== undefined) logic.setMaxGroupSize(parsed.maxGroupSize);
                
                logic.showNotification("Data imported!");
            } catch (err) { logic.showNotification("Error loading file."); }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="sticky top-0 z-[100] bg-[#020617]/90 border-b border-white/10 backdrop-blur-md p-4 shadow-2xl flex justify-between items-center transition-all duration-300">
            <div className="flex items-center gap-4">
                {/* --- HOME BUTTON --- */}
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Back to Home"
                >
                    <HomeIcon size={20} />
                </button>
                <div className="h-8 w-px bg-white/10"></div>
                {/* ------------------- */}

                <div className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"><Sword size={28}/></div>
                <div>
                    <h1 className="font-bold text-2xl leading-none text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-fantasy tracking-wider drop-shadow-sm">CombatFlow</h1>
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Round {round} • {combatants.length} Units</div>
                </div>
            </div>
            <div className="flex gap-2 items-center">
                 <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded hover:text-white border border-white/5 hover:border-white/20 transition-all" title="Settings"><Settings size={18}/></button>
                 
                 <button onClick={handleExport} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded hover:text-white border border-white/5 hover:border-white/20 transition-all" title="Export JSON"><Download size={18}/></button>
                 <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded hover:text-white border border-white/5 hover:border-white/20 transition-all" title="Import JSON"><Upload size={18}/></button>
                 <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                 
                 <div className="w-px h-8 bg-white/10 mx-2"></div>
                 <button onClick={() => setInCombatMode(!inCombatMode)} className={`p-2.5 rounded border transition-all duration-300 ${inCombatMode ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`} title="Toggle Combat Mode (C)"><Sword size={18}/></button>
                 {inCombatMode && <button onClick={() => setShowShortcuts(true)} className="p-2.5 bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-500/30 rounded shadow-[0_0_10px_rgba(245,158,11,0.1)]" title="Combat Shortcuts"><Keyboard size={18}/></button>}
                 {!inCombatMode && (
                    <button onClick={clearCombat} className="p-2.5 bg-red-900/10 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded hover:text-red-200 hover:border-red-500/50 transition-all" title="Reset"><RefreshCw size={18}/></button>
                 )}
            </div>
        </div>
    );
};

export default CombatHeader;