import React, { useState } from 'react';
import { Icons, MonitorIcon, SmartphoneIcon } from '../CharacterIcons'; 
import { THEMES } from './ThemeConfig';
import ThemeEditorModal from './ThemeEditorModal'; 
import { useCampaign } from '../../../../context/CampaignContext'; 

const SheetToolbar = ({ c, onUpdate, onBack, onExport, saveStatus, onLongRest, onOpenMessage, theme, isMobileView, onToggleView }) => {
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showEditor, setShowEditor] = useState(false); 
    const handleChange = (field, value) => onUpdate({ [field]: value });

    // Hent sync funktion
    const { syncHpToCombat } = useCampaign();

    // LONG REST LOGIK
    const handleLongRestTrigger = () => {
        const maxHp = parseInt(c.hp?.max || 10);
        const newHp = { 
            ...c.hp, 
            current: maxHp, 
            temp: 0 
        };
        
        const newHitDice = { 
            ...c.hitDice, 
            spent: 0 
        };
        
        onUpdate({ hp: newHp, hitDice: newHitDice });
        
        if (syncHpToCombat) {
            syncHpToCombat(maxHp, maxHp, 0);
        }
        
        if (onLongRest) onLongRest(); 
    };

    return (
        <>
            <ThemeEditorModal 
                show={showEditor} 
                onClose={() => setShowEditor(false)} 
                customTheme={c.customTheme} 
                onUpdate={onUpdate} 
            />

            {/* Toolbar Container */}
            <div className={`relative z-[100] flex flex-wrap items-center justify-between gap-3 ${theme.bgPanel} border ${theme.border} p-3 rounded-xl shadow-lg transition-colors duration-300`}>
                
                {/* Venstre side: Back, View Toggle, Export */}
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}>
                        <Icons.ArrowLeft /> Back
                    </button>
                    
                    <div className={`h-6 w-px ${theme.border}`}></div>

                    {/* NY KNAP: Toggle View */}
                    <button 
                        onClick={onToggleView} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}
                        title={isMobileView ? "Switch to Desktop View" : "Switch to Mobile View"}
                    >
                        {isMobileView ? <MonitorIcon /> : <SmartphoneIcon />}
                        <span className="hidden sm:inline">{isMobileView ? "Desktop" : "Mobile"}</span>
                    </button>

                    <div className={`h-6 w-px ${theme.border} hidden md:block`}></div>
                    
                    <button onClick={onExport} className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}>
                        <Icons.Download /> Export
                    </button>
                    {saveStatus !== 'Idle' && <span className={`text-[10px] font-bold ${theme.subText} uppercase tracking-widest ml-2`}>{saveStatus}</span>}
                </div>
                
                {/* Højre side: Theme, Rest, Msg, Toggles */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1 md:pb-0">
                    
                    {/* Theme Dropdown */}
                    <div className="relative flex gap-1 shrink-0">
                        <button 
                            onClick={() => setShowThemeMenu(!showThemeMenu)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text}`}
                        >
                           Theme
                        </button>
                        
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

                    <button onClick={handleLongRestTrigger} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text} shrink-0`}>
                        <Icons.Moon /> Long Rest
                    </button>

                    <button onClick={onOpenMessage} className={`flex items-center gap-1.5 px-3 py-1.5 ${theme.button} hover:bg-opacity-80 rounded-lg text-[10px] font-bold uppercase border ${theme.border} shadow-sm transition-all ${theme.subText} hover:${theme.text} shrink-0`}>
                        <Icons.MessageIcon /> Msg DM
                    </button>
                    
                    <button onClick={() => handleChange('heroicInspiration', !c.heroicInspiration)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all shrink-0 ${c.heroicInspiration ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]' : `${theme.button} ${theme.border} ${theme.subText} hover:border-zinc-500`}`}>
                        <Icons.CheckSquare checked={c.heroicInspiration} /> Heroic Insp.
                    </button>
                    
                    <button onClick={() => handleChange('isSpellcaster', !c.isSpellcaster)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all shrink-0 ${c.isSpellcaster ? `${theme.accentBg} ${theme.accentBorder} text-white shadow-[0_0_10px_rgba(185,28,28,0.4)]` : `${theme.button} ${theme.border} ${theme.subText} hover:border-zinc-500`}`}>
                        <Icons.Flame /> Magic
                    </button>
                </div>
            </div>
        </>
    );
};

export default SheetToolbar;