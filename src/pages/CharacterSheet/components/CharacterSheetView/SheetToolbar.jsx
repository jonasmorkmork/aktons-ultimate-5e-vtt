import React, { useState } from 'react';
import { Icons } from '../CharacterIcons';
import { THEMES } from './ThemeConfig';
import ThemeEditorModal from './ThemeEditorModal'; // Ny import

const SheetToolbar = ({ c, onUpdate, onBack, onExport, saveStatus, onLongRest, onOpenMessage, theme }) => {
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showEditor, setShowEditor] = useState(false); // Ny state
    const handleChange = (field, value) => onUpdate({ [field]: value });

    return (
        <>
            {/* Modal placeres her udenfor hoved-div */}
            <ThemeEditorModal 
                show={showEditor} 
                onClose={() => setShowEditor(false)} 
                customTheme={c.customTheme} 
                onUpdate={onUpdate} 
            />

            <div className={`relative z-[100] flex flex-wrap items-center justify-between gap-3 ${theme.bgPanel} border ${theme.border} p-3 rounded-xl shadow-lg transition-colors duration-300`}>
                
                {/* Venstre side er uændret... */}
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}>
                        <Icons.ArrowLeft /> Back
                    </button>
                    <div className={`h-6 w-px ${theme.border}`}></div>
                    <button onClick={onExport} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}>
                        <Icons.Download /> Export
                    </button>
                    {saveStatus !== 'Idle' && <span className={`text-[10px] font-bold ${theme.subText} uppercase tracking-widest`}>{saveStatus}</span>}
                </div>
                
                <div className="flex items-center gap-2">
                    
                    {/* THEME SELECTOR + EDIT BUTTON */}
                    <div className="relative flex gap-1">
                        <button 
                            onClick={() => setShowThemeMenu(!showThemeMenu)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}
                        >
                           Theme
                        </button>
                        
                        {/* Vis kun Edit knap hvis temaet er 'custom' */}
                        {c.theme === 'custom' && (
                            <button 
                                onClick={() => setShowEditor(true)}
                                className={`px-2 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg border ${theme.border} shadow-sm transition-all ${theme.accentText}`}
                                title="Edit Custom Theme"
                            >
                                <Icons.Settings />
                            </button>
                        )}
                        
                        {showThemeMenu && (
                            <div className={`absolute top-full right-0 mt-2 p-2 ${theme.bgPanel} border ${theme.accentBorder} rounded-xl shadow-2xl z-[101] w-48 animate-in fade-in slide-in-from-top-2`}>
                                <h4 className={`px-2 py-1 text-[9px] font-bold uppercase ${theme.subText} border-b ${theme.border} mb-1`}>Select Theme</h4>
                                <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar">
                                    {Object.entries(THEMES).map(([key, t]) => (
                                        <button 
                                            key={key} 
                                            onClick={() => { onUpdate({ theme: key }); setShowThemeMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs font-bold rounded flex items-center gap-2 transition-colors ${c.theme === key ? `${theme.accentBg} text-white` : `hover:bg-white/5 ${theme.text}`}`}
                                        >
                                            <span className={`w-3 h-3 rounded-full border border-white/20`} style={{ backgroundColor: t.name === 'Old Parchment' ? '#d2b48c' : (t.accentBg.includes('bg-') ? '' : t.accentBg) }}></span>
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`h-6 w-px ${theme.border}`}></div>

                    {/* Resten af knapperne er uændret... */}
                    <button onClick={onLongRest} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}>
                        <Icons.Moon /> Long Rest
                    </button>

                    <button onClick={onOpenMessage} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Message DM
                    </button>
                    <button onClick={() => handleChange('heroicInspiration', !c.heroicInspiration)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${c.heroicInspiration ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]' : `${theme.button} ${theme.border} ${theme.subText} hover:border-zinc-500`}`}>
                        <Icons.CheckSquare checked={c.heroicInspiration} /> Heroic Inspiration
                    </button>
                    <button onClick={() => handleChange('isSpellcaster', !c.isSpellcaster)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${c.isSpellcaster ? `${theme.accentBg} ${theme.accentBorder} text-white shadow-[0_0_10px_rgba(185,28,28,0.4)]` : `${theme.button} ${theme.border} ${theme.subText} hover:border-zinc-500`}`}>
                        <Icons.Flame /> Spellcaster
                    </button>
                </div>
            </div>
        </>
    );
};

export default SheetToolbar;