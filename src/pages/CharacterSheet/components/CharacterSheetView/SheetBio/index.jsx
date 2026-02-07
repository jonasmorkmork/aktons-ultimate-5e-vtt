import React, { useState, useEffect } from 'react';
import { Icons } from '../../CharacterIcons'; 
import { getTabTitle, getMod, formatMod, getProfBonus } from '../../CharacterHelpers'; 
import { useInventory } from './useInventory'; 

// --- BUFFERED INPUTS ---
const BufferedInput = ({ value, onCommit, className, placeholder, type = "text", ...props }) => {
    const [localValue, setLocalValue] = useState(value || "");
    useEffect(() => { setLocalValue(value || ""); }, [value]);
    const handleBlur = () => { if (localValue !== value) onCommit(localValue); };
    return <input {...props} type={type} className={className} placeholder={placeholder} value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} />;
};

const BufferedTextarea = ({ value, onCommit, className, placeholder, ...props }) => {
    const [localValue, setLocalValue] = useState(value || "");
    useEffect(() => { setLocalValue(value || ""); }, [value]);
    const handleBlur = () => { if (localValue !== value) onCommit(localValue); };
    return <textarea {...props} className={className} placeholder={placeholder} value={localValue} onChange={(e) => setLocalValue(e.target.value)} onBlur={handleBlur} />;
};

const SheetBio = ({ c, onUpdate, theme }) => {
    const [activeInvTab, setActiveInvTab] = useState('weapons');
    const [activeProfTab, setActiveProfTab] = useState('armor');
    const [activeNotesTab, setActiveNotesTab] = useState('backstory');
    const [activeFeatureCat, setActiveFeatureCat] = useState('Class');
    const [expandedItem, setExpandedItem] = useState(null);
    
    // UI STATES
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState("");
    const [showApiSearch, setShowApiSearch] = useState(false);
    const [apiSearchQuery, setApiSearchQuery] = useState("");

    // USE INVENTORY HOOK
    const { 
        isImporting, 
        isSearching, 
        apiResults, 
        parseImportText, 
        performSearch, 
        addItemFromApiResult,
        setApiResults,
        closeSearch 
    } = useInventory(c, onUpdate);

    const handleChange = (field, value) => onUpdate({ [field]: value });
    const handleNestedChange = (parent, field, value) => onUpdate({ [parent]: { ...c[parent], [field]: value } });

    // --- RESOURCES & FEATURES LOGIC ---
    const addResource = () => handleChange('resources', [...(c.resources || []), { id: Date.now(), name: "New Resource", current: 0, max: 1 }]);
    const removeResource = (id) => handleChange('resources', (c.resources || []).filter(r => r.id !== id));
    const updateResource = (id, f, v) => handleChange('resources', (c.resources || []).map(r => r.id === id ? { ...r, [f]: v } : r));

    const addFeature = () => handleChange('features', [...(c.features || []), { id: Date.now(), name: "New Feature", description: "", category: activeFeatureCat }]);
    const removeFeature = (id) => handleChange('features', (c.features || []).filter(f => f.id !== id));
    const updateFeature = (id, f, v) => handleChange('features', (c.features || []).map(feat => feat.id === id ? { ...feat, [f]: v } : feat) );

    // --- INVENTORY UI ACTIONS ---
    const handleImportSubmit = async () => {
        await parseImportText(importText);
        setImportText("");
        setShowImport(false);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        performSearch(apiSearchQuery);
    };

    const handleAddFromSearch = (result) => {
        const added = addItemFromApiResult(result);
        setShowApiSearch(false);
        setApiResults([]); 
        setApiSearchQuery(""); 
        setActiveInvTab(added.category);
        setExpandedItem(added.id);
    };

    const handleCloseSearch = () => {
        setShowApiSearch(false);
        closeSearch(); 
        setApiSearchQuery(""); 
    };

    // Standard Inventory CRUD
    const inventory = c.inventory || { weapons: [], armor: [], items: [] };

    // Attunement calc (kun items der er 'attuned' tæller med)
    const attunedCount = [
        ...(inventory.weapons || []),
        ...(inventory.armor || []),
        ...(inventory.items || [])
    ].filter(i => i.attuned).length;

    const addInventoryItem = () => {
        const type = activeInvTab;
        // Default: requiresAttunement=false, attuned=false
        let newItem = { id: Date.now(), name: "New Item", description: "", requiresAttunement: false, attuned: false }; 
        if (type === 'weapons') {
            newItem = { ...newItem, damage: "1d6", damageType: "Slashing", weaponCategory: "Simple Melee", mastery: "", properties: "", stat: "strength", isProficient: true };
        } else if (type === 'armor') { 
            newItem = { ...newItem, ac: "10", category: "Light", stealthDis: false };
        } else {
            newItem = { ...newItem, type: "Adventuring Gear", quantity: 1 };
        }
        onUpdate({ inventory: { ...inventory, [type]: [...(inventory[type]||[]), newItem] } });
        setExpandedItem(newItem.id);
    };

    const removeInventoryItem = (id) => {
        onUpdate({ inventory: { ...inventory, [activeInvTab]: (inventory[activeInvTab]||[]).filter(i => i.id !== id) } });
    };

    const updateInventoryItem = (id, field, value) => {
        onUpdate({ inventory: { ...inventory, [activeInvTab]: (inventory[activeInvTab]||[]).map(i => i.id === id ? { ...i, [field]: value } : i) } });
    };

    const equipWeapon = (item) => {
        const statKey = (item.stat || 'strength').toLowerCase();
        const statVal = c.stats[statKey] || 10;
        const mod = getMod(statVal);
        const profBonus = item.isProficient ? getProfBonus(c.level) : 0;
        
        const totalAttack = mod + profBonus; // + item.magicBonus her hvis relevant
        
        const damageStr = item.damage || "";
        const damageModStr = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
        const totalDamage = damageStr ? `${damageStr}${damageModStr}` : damageModStr;

        const noteParts = [];
        if (item.mastery) noteParts.push(`Mastery: ${item.mastery}`);
        if (item.properties) noteParts.push(item.properties);

        const newAction = {
            id: Date.now(),
            name: item.name || "Weapon Attack",
            bonus: formatMod(totalAttack),
            damage: totalDamage,
            notes: noteParts.join(". ")
        };
        onUpdate({ actions: [...(c.actions || []), newAction] });
    };
    
    return (
        <div className="space-y-6 relative">
            
            {/* BULK IMPORT MODAL */}
            {showImport && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`${theme.bgPanel} border ${theme.border} w-full max-w-lg rounded-xl shadow-2xl p-6 relative`}>
                        <h3 className={`text-lg font-bold ${theme.text} mb-2`}>Bulk Import (with Auto-Lookup)</h3>
                        <p className={`text-xs ${theme.subText} mb-4`}>Paste a list (e.g. "4 Handaxes, Plate Armor").</p>
                        <textarea autoFocus className={`w-full h-40 bg-black/30 border ${theme.border} rounded p-3 text-sm ${theme.text} focus:border-purple-500 outline-none resize-none mb-4`} placeholder="Paste list here..." value={importText} onChange={(e) => setImportText(e.target.value)} />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowImport(false)} className={`px-4 py-2 text-xs font-bold ${theme.subText} hover:${theme.text}`} disabled={isImporting}>Cancel</button>
                            <button onClick={handleImportSubmit} className={`px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-lg text-xs flex items-center gap-2`} disabled={isImporting}>{isImporting ? "Processing..." : "Import Items"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* API SEARCH MODAL */}
            {showApiSearch && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className={`${theme.bgPanel} border ${theme.border} w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]`}>
                        <div className={`p-4 border-b ${theme.border} flex justify-between items-center`}>
                            <h3 className={`text-sm font-bold ${theme.text} uppercase tracking-widest`}>Add from Library</h3>
                            <button onClick={handleCloseSearch} className="text-zinc-500 hover:text-white" title="Close">
                                <Icons.Trash className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleSearchSubmit} className="flex gap-2">
                                <input autoFocus className={`flex-1 bg-black/30 border ${theme.border} rounded px-3 py-2 text-sm ${theme.text} focus:border-purple-500 outline-none`} placeholder="Search SRD items..." value={apiSearchQuery} onChange={(e) => setApiSearchQuery(e.target.value)} />
                                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded font-bold text-xs" disabled={isSearching}>{isSearching ? "..." : "Search"}</button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2 custom-scrollbar">
                            {apiResults.length > 0 ? (
                                apiResults.map((res, i) => (
                                    <button key={i} onClick={() => handleAddFromSearch(res)} className={`w-full text-left p-3 rounded border ${theme.border} bg-black/20 hover:bg-white/5 hover:border-purple-500 transition-all group`}>
                                        <div className={`text-sm font-bold ${theme.text} group-hover:text-purple-400`}>{res.name}</div>
                                        <div className={`text-[10px] ${theme.subText} uppercase`}>{res.apiCategory}</div>
                                    </button>
                                ))
                            ) : (
                                <div className={`text-center text-xs ${theme.subText} italic py-4`}>{isSearching ? "Searching..." : "No results."}</div>
                            )}
                        </div>
                        <div className={`p-3 border-t ${theme.border} flex justify-end`}>
                            <button onClick={handleCloseSearch} className={`px-4 py-2 text-xs font-bold ${theme.subText} hover:${theme.text}`}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- RESOURCES --- */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden border-t-2 ${theme.accentBorder} shadow-sm max-h-[300px] flex flex-col`}>
                <div className={`bg-black/10 p-3 border-b ${theme.border} flex justify-between items-center text-[10px] font-bold uppercase ${theme.subText} tracking-widest`}>
                    <div className="flex items-center gap-2"><Icons.Gem /> Resources</div>
                    <button onClick={addResource} className={`p-1.5 ${theme.accentText} hover:bg-white/10 rounded-full transition-all`}><Icons.Plus /></button>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                    {(c.resources || []).map(r => (
                        <div key={r.id} className={`flex flex-col gap-2 bg-black/10 p-2 rounded border ${theme.border} group shadow-sm transition-colors hover:border-zinc-500`}>
                            <div className="flex items-center justify-between gap-2">
                                <BufferedInput className={`flex-1 min-w-0 text-xs bg-transparent outline-none font-bold ${theme.text}`} value={r.name} onCommit={(val) => updateResource(r.id, 'name', val)} placeholder="Resource Name" />
                                <div className="flex items-center gap-1 shrink-0">
                                    <span className={`text-[9px] uppercase font-bold ${theme.subText}`}>Max</span>
                                    <BufferedInput type="number" value={r.max} onCommit={(val) => updateResource(r.id, 'max', parseInt(val)||0)} className={`w-8 bg-black/20 border ${theme.border} rounded text-center text-xs p-0.5 font-bold ${theme.subText} shadow-inner outline-none`} />
                                    <button onClick={() => removeResource(r.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all ml-1"><Icons.Trash /></button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Array.from({ length: parseInt(r.max) || 0 }).map((_, i) => {
                                    const isAvailable = i < (r.current || 0);
                                    return (
                                        <button 
                                            key={i}
                                            onClick={() => {
                                                if (isAvailable) updateResource(r.id, 'current', Math.max(0, (r.current || 0) - 1));
                                                else updateResource(r.id, 'current', Math.min(r.max, (r.current || 0) + 1));
                                            }}
                                            className={`w-4 h-4 rounded-[2px] border transition-all shadow-sm ${isAvailable ? `${theme.accentBg} border-white/50 hover:brightness-110` : `bg-slate-900 border-slate-700 hover:border-slate-500`}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- FEATURES --- */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['Class','Species','Feats'].map(cat => (
                        <button key={cat} onClick={() => setActiveFeatureCat(cat)} className={`px-4 py-2 text-[8px] font-bold uppercase rounded-md m-0.5 transition-all ${activeFeatureCat === cat ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{cat}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex justify-between items-center`}><div className="flex items-center gap-2"><div className={theme.accentText}><Icons.StarIcon /></div><span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{activeFeatureCat} Features</span></div><button onClick={addFeature} className={`p-1 ${theme.accentText} hover:bg-white/10 rounded-full transition-all`}><Icons.Plus /></button></div>
                <div className={`p-3 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar flex-1 bg-black/5`}>
                    {(c.features || []).filter(f => f.category === activeFeatureCat).map(feat => (
                        <div key={feat.id} className={`p-3 border ${theme.border} rounded-lg bg-black/10 group space-y-1 shadow-sm transition-all hover:border-zinc-500`}>
                            <div className="flex justify-between items-start">
                                <BufferedInput className={`font-bold text-xs bg-transparent outline-none focus:${theme.accentText} flex-1 uppercase tracking-wide ${theme.text}`} value={feat.name} onCommit={(val) => updateFeature(feat.id, 'name', val)} placeholder="Name" />
                                <button onClick={() => removeFeature(feat.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 ml-2 transition-all"><Icons.Trash /></button>
                            </div>
                            <BufferedTextarea className={`w-full text-[11px] bg-transparent outline-none ${theme.subText} h-16 resize-y custom-scrollbar focus:${theme.text}`} value={feat.description} onCommit={(val) => updateFeature(feat.id, 'description', val)} placeholder="..." />
                        </div>
                    ))}
                </div>
            </div>

            {/* --- PROFICIENCIES --- */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col pb-2`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['armor','weapon','tool','languages'].map(t => (
                        <button key={t} onClick={() => setActiveProfTab(t)} className={`px-4 py-2 text-[8px] font-bold uppercase rounded-md m-0.5 transition-all ${activeProfTab === t ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{t}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex items-center gap-2`}>
                    <div className={theme.accentText}><Icons.Shield /></div>
                    <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeProfTab)}</span>
                </div>
                <BufferedTextarea value={c[activeProfTab === 'languages' ? 'profLanguages' : 'prof' + activeProfTab.charAt(0).toUpperCase() + activeProfTab.slice(1)] || ""} onCommit={(val) => handleChange(activeProfTab === 'languages' ? 'profLanguages' : 'prof' + activeProfTab.charAt(0).toUpperCase() + activeProfTab.slice(1), val)} className={`w-full h-32 p-3 text-xs outline-none bg-transparent ${theme.subText} custom-scrollbar resize-y font-medium focus:${theme.text} transition-colors`} placeholder={`List ${activeProfTab} proficiencies...`} />
            </div>

            {/* --- INVENTORY LIST UI --- */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col`}>
                
                {/* Tabs */}
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['weapons', 'armor', 'items'].map(tab => (
                        <button key={tab} onClick={() => setActiveInvTab(tab)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md m-0.5 transition-all ${activeInvTab === tab ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{tab}</button>
                    ))}
                </div>

                {/* Header & Buttons */}
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex flex-wrap justify-between items-center gap-2`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{activeInvTab} Inventory</span>
                        {/* ATTUNEMENT COUNTER */}
                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded border border-white/10 ${attunedCount > 3 ? 'bg-red-900/50 text-red-300' : 'bg-black/30 text-zinc-400'}`}>
                            Attuned: {attunedCount}/3
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={() => setShowApiSearch(true)} className={`px-2 py-1 bg-black/20 hover:bg-black/40 border ${theme.border} rounded text-[9px] font-bold uppercase ${theme.subText} hover:${theme.text} transition-colors flex items-center gap-1`} title="Search Open5e"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Search</button>
                        <button onClick={() => setShowImport(true)} className={`px-2 py-1 bg-black/20 hover:bg-black/40 border ${theme.border} rounded text-[9px] font-bold uppercase ${theme.subText} hover:${theme.text} transition-colors flex items-center gap-1`} title="Paste list of items"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/></svg> Import</button>
                        <button onClick={addInventoryItem} className={`px-2 py-1 bg-black/20 hover:bg-black/40 border ${theme.border} rounded text-[9px] font-bold uppercase ${theme.text} transition-colors flex items-center gap-1`}><Icons.Plus /> Add</button>
                    </div>
                </div>

                {/* List Content */}
                <div className={`p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar bg-black/5`}>
                    {(inventory[activeInvTab] || []).map((item) => {
                        const isExpanded = expandedItem === item.id;
                        return (
                            <div key={item.id} className={`border rounded-lg bg-black/10 transition-all ${isExpanded ? `${theme.accentBorder} shadow-lg ring-1 ${theme.accentBorder} bg-black/20` : `${theme.border} hover:border-zinc-500`}`}>
                                <div className="p-2 flex gap-2 items-center">
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                        <BufferedInput spellCheck="false" className={`w-full bg-transparent text-sm font-bold ${theme.text} outline-none placeholder-zinc-500 focus:text-white truncate`} value={item.name} onCommit={(val) => updateInventoryItem(item.id, 'name', val)} placeholder={`${activeInvTab.slice(0, -1)} Name`} />
                                        {/* DOT VISES KUN HVIS ATTUNED */}
                                        {item.attuned && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]" title="Attuned"></div>}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 bg-black/30 rounded border border-white/10 px-1.5 h-6">
                                        <span className="text-[8px] text-zinc-500 font-bold uppercase">Qty</span>
                                        <BufferedInput type="number" className={`w-8 bg-transparent text-xs text-center font-bold ${theme.accentText} outline-none`} value={item.quantity || 1} onCommit={(val) => updateInventoryItem(item.id, 'quantity', parseInt(val)||1)} />
                                    </div>

                                    <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} className={`w-6 h-6 flex items-center justify-center ${theme.subText} hover:${theme.text} hover:bg-white/5 rounded transition-colors`}><div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div></button>
                                </div>
                                {isExpanded && (
                                    <div className={`p-3 border-t ${theme.border}/50 space-y-3 animate-in slide-in-from-top-1`}>
                                            
                                            {/* ATTUNEMENT SECTION */}
                                            <div className="flex justify-end gap-2 items-center">
                                                {/* Toggle: Kræver attunement? */}
                                                <button 
                                                    onClick={() => {
                                                        const newVal = !item.requiresAttunement;
                                                        // Hvis vi slår kravet fra, skal vi også slå attunement fra
                                                        const updates = { requiresAttunement: newVal };
                                                        if (!newVal) updates.attuned = false;
                                                        
                                                        // Vi opdaterer felterne en ad gangen via vores helper, men her må vi kalde onUpdate direkte for at opdatere to felter
                                                        // For simplicitet bruger vi updateInventoryItem to gange hurtigt eller laver en custom update
                                                        onUpdate({ inventory: { ...inventory, [activeInvTab]: (inventory[activeInvTab]||[]).map(i => i.id === item.id ? { ...i, ...updates } : i) } });
                                                    }} 
                                                    className={`text-[9px] font-bold uppercase px-2 py-1 rounded border transition-colors ${item.requiresAttunement ? 'bg-blue-900/30 text-blue-300 border-blue-500' : 'bg-black/20 text-zinc-600 border-white/5 hover:border-zinc-500'}`}
                                                >
                                                    {item.requiresAttunement ? "Requires Attunement" : "No Attunement"}
                                                </button>

                                                {/* ATTUNE BUTTON - KUN HVIS REQUIRED */}
                                                {item.requiresAttunement && (
                                                    <button 
                                                        onClick={() => updateInventoryItem(item.id, 'attuned', !item.attuned)} 
                                                        className={`text-[9px] font-bold uppercase px-2 py-1 rounded border transition-colors flex items-center gap-1 ${item.attuned ? 'bg-purple-900/30 text-purple-300 border-purple-500 shadow-inner' : 'bg-black/20 text-zinc-400 border-white/10 hover:border-zinc-400'}`}
                                                    >
                                                        {item.attuned ? (
                                                            <><span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span> Attuned</>
                                                        ) : (
                                                            <>Attune</>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* WEAPONS */}
                                            {activeInvTab === 'weapons' && (
                                                <>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Damage</label><BufferedInput className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.damage || ""} onCommit={(val) => updateInventoryItem(item.id, 'damage', val)} placeholder="1d8" /></div>
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Damage Type</label><BufferedInput className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.damageType || ""} onCommit={(val) => updateInventoryItem(item.id, 'damageType', val)} placeholder="Slashing" /></div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Category</label><BufferedInput className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.weaponCategory || ""} onCommit={(val) => updateInventoryItem(item.id, 'weaponCategory', val)} placeholder="Simple Melee" /></div>
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold text-purple-400`}>Mastery</label><BufferedInput className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.mastery || ""} onCommit={(val) => updateInventoryItem(item.id, 'mastery', val)} placeholder="Vex, Nick..." /></div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Ability</label><select className={`w-full bg-zinc-900 text-zinc-200 text-xs outline-none rounded cursor-pointer appearance-none mt-0.5`} value={item.stat || "strength"} onChange={(e) => updateInventoryItem(item.id, 'stat', e.target.value)}><option className="bg-zinc-900" value="strength">STR</option><option className="bg-zinc-900" value="dexterity">DEX</option><option className="bg-zinc-900" value="constitution">CON</option><option className="bg-zinc-900" value="intelligence">INT</option><option className="bg-zinc-900" value="wisdom">WIS</option><option className="bg-zinc-900" value="charisma">CHA</option></select></div>
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5 flex items-center justify-between px-2 cursor-pointer" onClick={() => updateInventoryItem(item.id, 'isProficient', !item.isProficient)}><label className={`text-[8px] uppercase ${theme.subText} font-bold cursor-pointer`}>Proficient</label><div className={`w-3 h-3 rounded-full border ${item.isProficient ? `${theme.accentBg} border-transparent` : 'border-zinc-500'}`}></div></div>
                                                    </div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Properties</label><BufferedInput className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.properties || ""} onCommit={(val) => updateInventoryItem(item.id, 'properties', val)} placeholder="Light, Finesse..." /></div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Notes</label><BufferedTextarea spellCheck="false" className={`w-full bg-transparent text-xs ${theme.subText} outline-none resize-y min-h-[60px] mt-1 block`} value={item.description || ""} onCommit={(val) => updateInventoryItem(item.id, 'description', val)} placeholder="..." /></div>
                                                    <button onClick={() => equipWeapon(item)} className={`w-full py-2 mt-2 border ${theme.accentBorder} ${theme.accentBg}/20 hover:${theme.accentBg} text-[10px] font-bold uppercase rounded text-white transition-all flex justify-center items-center gap-2 shadow-sm`}><Icons.Sword className="w-3 h-3" /> Equip Weapon</button>
                                                </>
                                            )}

                                            {/* ARMOR */}
                                            {activeInvTab === 'armor' && (
                                                <>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5 col-span-1"><label className={`block text-[8px] uppercase ${theme.subText} font-bold mb-0.5`}>AC</label><BufferedInput className={`w-full bg-transparent text-xs ${theme.text} font-bold outline-none`} value={item.ac || ""} onCommit={(val) => updateInventoryItem(item.id, 'ac', val)} placeholder="12" /></div>
                                                        <div className="bg-black/20 p-1.5 rounded border border-white/5 col-span-2"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Category</label><select className={`w-full bg-zinc-900 text-zinc-200 text-xs outline-none rounded cursor-pointer appearance-none`} value={item.category || "Light"} onChange={(e) => updateInventoryItem(item.id, 'category', e.target.value)}><option className="bg-zinc-900" value="Light">Light Armor</option><option className="bg-zinc-900" value="Medium">Medium Armor</option><option className="bg-zinc-900" value="Heavy">Heavy Armor</option><option className="bg-zinc-900" value="Shield">Shield</option></select></div>
                                                    </div>
                                                    <div className="flex items-center gap-2"><button onClick={() => updateInventoryItem(item.id, 'stealthDis', !item.stealthDis)} className={`flex-1 py-1 text-[9px] uppercase font-bold border rounded transition-colors ${item.stealthDis ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-black/20 border-white/10 text-zinc-500'}`}>Stealth Disadvantage: {item.stealthDis ? "YES" : "NO"}</button></div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Notes</label><BufferedTextarea spellCheck="false" className={`w-full bg-transparent text-xs ${theme.subText} outline-none resize-y min-h-[60px] mt-1 block`} value={item.description || ""} onCommit={(val) => updateInventoryItem(item.id, 'description', val)} placeholder="..." /></div>
                                                </>
                                            )}

                                            {/* ITEMS */}
                                            {activeInvTab === 'items' && (
                                                <>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Type / Rarity</label><select className={`w-full bg-zinc-900 text-zinc-200 text-xs outline-none rounded cursor-pointer appearance-none mt-1`} value={item.type || "Adventuring Gear"} onChange={(e) => updateInventoryItem(item.id, 'type', e.target.value)}><option className="bg-zinc-900" value="Adventuring Gear">Adventuring Gear</option><option className="bg-zinc-900" value="Potion">Potion</option><option className="bg-zinc-900" value="Scroll">Scroll</option><option className="bg-zinc-900" value="Wondrous Item">Wondrous Item</option><option className="bg-zinc-900" value="Weapon (Magic)">Weapon (Magic)</option><option className="bg-zinc-900" value="Armor (Magic)">Armor (Magic)</option><option className="bg-zinc-900" value="Vehicle">Vehicle</option><option className="bg-zinc-900" value="Treasure">Treasure</option></select></div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5"><label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Bonuses / Description</label><BufferedTextarea spellCheck="false" className={`w-full bg-transparent text-xs ${theme.subText} outline-none resize-y min-h-[60px] mt-1 block`} value={item.description || ""} onCommit={(val) => updateInventoryItem(item.id, 'description', val)} placeholder="Effect or description..." /></div>
                                                </>
                                            )}

                                            <div className="flex justify-end pt-2 border-t border-white/5">
                                                <button onClick={() => removeInventoryItem(item.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-900/10 transition-colors"><Icons.Trash /> Remove Item</button>
                                            </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {(inventory[activeInvTab] || []).length === 0 && <div className={`p-4 text-center text-xs ${theme.subText} italic opacity-50`}>No {activeInvTab} added yet. Use search or import.</div>}
                </div>
                <div className={`p-3 bg-black/20 border-t ${theme.border} grid grid-cols-4 gap-2`}>
                    {['cp', 'sp', 'gp', 'pp'].map(coin => (<div key={coin} className="flex flex-col items-center"><label className={`text-[8px] font-bold uppercase ${theme.subText} mb-0.5 tracking-tighter`}>{coin}</label><BufferedInput type="number" value={c.currency[coin] || 0} onCommit={(val) => handleNestedChange('currency', coin, parseInt(val) || 0)} className={`w-full bg-black/30 border ${theme.border} rounded text-center text-[10px] font-bold ${theme.accentText} p-1 focus:${theme.accentBorder} outline-none shadow-inner`} /></div>))}
                </div>
            </div>

            {/* --- NOTES --- */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm min-h-[300px] flex flex-col pb-4`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>{['backstory','ideals','bonds','flaws','appearance'].map(tab => (<button key={tab} onClick={() => setActiveNotesTab(tab)} className={`px-4 py-2 text-[9px] font-bold uppercase rounded-md m-0.5 whitespace-nowrap transition-all ${activeNotesTab === tab ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{tab}</button>))}</div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex items-center gap-2`}><div className={theme.accentText}><Icons.Book /></div><span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeNotesTab)}</span></div>
                <BufferedTextarea spellCheck="false" value={c[activeNotesTab] || ""} onCommit={(val) => handleChange(activeNotesTab, val)} className={`w-full h-64 p-4 text-sm outline-none bg-transparent ${theme.subText} custom-scrollbar focus:${theme.text} transition-colors resize-y`} />
            </div>
        </div>
    );
};
export default SheetBio;