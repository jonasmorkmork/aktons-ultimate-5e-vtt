import React, { useState } from 'react';
import { Icons } from '../CharacterIcons'; 
import { getTabTitle, getMod, formatMod, getProfBonus } from '../CharacterHelpers'; 

const SheetBio = ({ c, onUpdate, theme }) => {
    const [activeInvTab, setActiveInvTab] = useState('weapons');
    const [activeProfTab, setActiveProfTab] = useState('armor');
    const [activeNotesTab, setActiveNotesTab] = useState('backstory');
    const [activeFeatureCat, setActiveFeatureCat] = useState('Class');
    
    // NY STATE: Holder styr på hvilken item der er åben
    const [expandedItem, setExpandedItem] = useState(null);

    const handleChange = (field, value) => onUpdate({ [field]: value });
    const handleNestedChange = (parent, field, value) => onUpdate({ [parent]: { ...c[parent], [field]: value } });

    // --- RESOURCES LOGIC ---
    const addResource = () => handleChange('resources', [...(c.resources || []), { id: Date.now(), name: "New Resource", current: 0, max: 1 }]);
    const removeResource = (id) => handleChange('resources', (c.resources || []).filter(r => r.id !== id));
    const updateResource = (id, f, v) => handleChange('resources', (c.resources || []).map(r => r.id === id ? { ...r, [f]: v } : r));

    // --- FEATURES LOGIC ---
    const addFeature = () => handleChange('features', [...(c.features || []), { id: Date.now(), name: "New Feature", description: "", category: activeFeatureCat }]);
    const removeFeature = (id) => handleChange('features', (c.features || []).filter(f => f.id !== id));
    const updateFeature = (id, f, v) => handleChange('features', (c.features || []).map(feat => feat.id === id ? { ...feat, [f]: v } : feat) );

    // --- INVENTORY LOGIC ---
    const inventory = c.inventory || { weapons: [], armor: [], items: [] };

    const addInventoryItem = () => {
        const type = activeInvTab; 
        
        let newItem = { id: Date.now(), name: "New Item", description: "" }; 
        
        if (type === 'weapons') {
            newItem = { ...newItem, damage: "1d6", damageType: "Slashing", properties: "", stat: "strength", isProficient: true };
        } else if (type === 'armor') { 
            newItem = { ...newItem, ac: 10, category: "Light", stealthDis: false };
        } else {
            newItem = { ...newItem, type: "Adventuring Gear", quantity: 1 };
        }

        const currentList = inventory[type] || [];
        onUpdate({ 
            inventory: { 
                ...inventory, 
                [type]: [...currentList, newItem] 
            } 
        });
        
        // Åbn automatisk den nye item
        setExpandedItem(newItem.id);
    };

    const removeInventoryItem = (id) => {
        const type = activeInvTab;
        const currentList = inventory[type] || [];
        onUpdate({ 
            inventory: { 
                ...inventory, 
                [type]: currentList.filter(i => i.id !== id) 
            } 
        });
    };

    const updateInventoryItem = (id, field, value) => {
        const type = activeInvTab;
        const currentList = inventory[type] || [];
        onUpdate({ 
            inventory: { 
                ...inventory, 
                [type]: currentList.map(i => i.id === id ? { ...i, [field]: value } : i) 
            } 
        });
    };

    // --- EQUIP WEAPON LOGIC ---
    const equipWeapon = (item) => {
        // 1. Find stats
        const statKey = (item.stat || 'strength').toLowerCase();
        const statVal = c.stats[statKey] || 10;
        const mod = getMod(statVal);
        
        // 2. Beregn Attack Bonus (Mod + Prof)
        const profBonus = item.isProficient ? getProfBonus(c.level) : 0;
        const totalAttack = mod + profBonus;

        // 3. Beregn Damage (Dice + Mod)
        const damageStr = item.damage || "";
        const damageModStr = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
        const totalDamage = damageStr ? `${damageStr}${damageModStr}` : damageModStr;

        // 4. Lav Action objektet
        const noteParts = [];
        if (item.properties) noteParts.push(item.properties);
        if (item.damageType) noteParts.push(item.damageType);
        if (item.description) noteParts.push(item.description);

        const newAction = {
            id: Date.now(),
            name: item.name || "Weapon Attack",
            bonus: formatMod(totalAttack),
            damage: totalDamage,
            notes: noteParts.join(". ")
        };

        // 5. Gem i Actions listen (SheetCombat)
        onUpdate({ actions: [...(c.actions || []), newAction] });
    };
    
    return (
        <div className="space-y-6">
            
            {/* RESOURCES */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden border-t-2 ${theme.accentBorder} shadow-sm max-h-[300px] flex flex-col`}>
                <div className={`bg-black/10 p-3 border-b ${theme.border} flex justify-between items-center text-[10px] font-bold uppercase ${theme.subText} tracking-widest`}>
                    <div className="flex items-center gap-2"><Icons.Gem /> Resources</div>
                    <button onClick={addResource} className={`p-1.5 ${theme.accentText} hover:bg-white/10 rounded-full transition-all`}><Icons.Plus /></button>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                    {(c.resources || []).map(r => (
                        <div key={r.id} className={`flex items-center gap-2 bg-black/10 p-2 rounded border ${theme.border} group shadow-sm transition-colors hover:border-zinc-500`}>
                            <input spellCheck="false" className={`flex-1 text-xs bg-transparent outline-none font-bold ${theme.text}`} value={r.name} onChange={(e) => updateResource(r.id, 'name', e.target.value)} />
                            <div className="flex items-center gap-1.5"><input type="number" value={r.current} onChange={(e) => updateResource(r.id, 'current', parseInt(e.target.value)||0)} className={`w-10 bg-black/20 border ${theme.border} rounded text-center text-xs p-1 font-bold ${theme.accentText} shadow-inner outline-none`} /><span className={`${theme.subText} font-bold`}>/</span><input type="number" value={r.max} onChange={(e) => updateResource(r.id, 'max', parseInt(e.target.value)||0)} className={`w-10 bg-black/20 border ${theme.border} rounded text-center text-xs p-1 font-bold ${theme.subText} shadow-inner outline-none`} /></div>
                            <button onClick={() => removeResource(r.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all"><Icons.Trash /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURES */}
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
                            <div className="flex justify-between items-start"><input spellCheck="false" className={`font-bold text-xs bg-transparent outline-none focus:${theme.accentText} flex-1 uppercase tracking-wide ${theme.text}`} value={feat.name} onChange={(e) => updateFeature(feat.id, 'name', e.target.value)} placeholder="Name" /><button onClick={() => removeFeature(feat.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 ml-2 transition-all"><Icons.Trash /></button></div>
                            <textarea spellCheck="false" className={`w-full text-[11px] bg-transparent outline-none ${theme.subText} h-16 resize-y custom-scrollbar focus:${theme.text}`} value={feat.description} onChange={(e) => updateFeature(feat.id, 'description', e.target.value)} placeholder="..." />
                        </div>
                    ))}
                </div>
            </div>

            {/* PROFICIENCIES */}
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
                <textarea spellCheck="false" value={c[activeProfTab === 'languages' ? 'profLanguages' : 'prof' + activeProfTab.charAt(0).toUpperCase() + activeProfTab.slice(1)] || ""} onChange={(e) => handleChange(activeProfTab === 'languages' ? 'profLanguages' : 'prof' + activeProfTab.charAt(0).toUpperCase() + activeProfTab.slice(1), e.target.value)} className={`w-full h-32 p-3 text-xs outline-none bg-transparent ${theme.subText} custom-scrollbar resize-y font-medium focus:${theme.text} transition-colors`} placeholder={`List ${activeProfTab} proficiencies...`} />
            </div>

            {/* INVENTORY */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col`}>
                
                {/* Tabs */}
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['weapons', 'armor', 'items'].map(tab => (
                        <button key={tab} onClick={() => setActiveInvTab(tab)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md m-0.5 transition-all ${activeInvTab === tab ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Header & Add Button */}
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                        <div className={theme.accentText}><Icons.Plus /></div>
                        <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{activeInvTab} Inventory</span>
                    </div>
                    <button onClick={addInventoryItem} className={`px-2 py-1 bg-black/20 hover:bg-black/40 border ${theme.border} rounded text-[9px] font-bold uppercase ${theme.text} transition-colors flex items-center gap-1`}>
                        <Icons.Plus /> Add {activeInvTab.slice(0, -1)}
                    </button>
                </div>

                {/* List Content */}
                <div className={`p-3 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar bg-black/5`}>
                    {(inventory[activeInvTab] || []).map((item) => {
                        const isExpanded = expandedItem === item.id;
                        return (
                            <div key={item.id} className={`border rounded-lg bg-black/10 transition-all ${isExpanded ? `${theme.accentBorder} shadow-lg ring-1 ${theme.accentBorder} bg-black/20` : `${theme.border} hover:border-zinc-500`}`}>
                                
                                {/* --- HEADER (Always Visible) --- */}
                                <div className="p-2 flex gap-2 items-center">
                                    {/* Name Input */}
                                    <div className="flex-1 min-w-0">
                                        <input 
                                            spellCheck="false" 
                                            className={`w-full bg-transparent text-sm font-bold ${theme.text} outline-none placeholder-zinc-500 focus:text-white`} 
                                            value={item.name} 
                                            onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)} 
                                            placeholder={`${activeInvTab.slice(0, -1)} Name`} 
                                        />
                                    </div>
                                    
                                    {/* Qty (Only for items) */}
                                    {activeInvTab === 'items' && (
                                        <div className="flex items-center gap-1 bg-black/30 rounded border border-white/10 px-1.5 h-6">
                                            <span className="text-[8px] text-zinc-500 font-bold uppercase">Qty</span>
                                            <input type="number" className={`w-8 bg-transparent text-xs text-center font-bold ${theme.accentText} outline-none`} value={item.quantity || 1} onChange={(e) => updateInventoryItem(item.id, 'quantity', parseInt(e.target.value)||1)} />
                                        </div>
                                    )}

                                    {/* Toggle Button */}
                                    <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} className={`w-6 h-6 flex items-center justify-center ${theme.subText} hover:${theme.text} hover:bg-white/5 rounded transition-colors`}>
                                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                        </div>
                                    </button>
                                </div>

                                {/* --- DETAILS BODY (Collapsible) --- */}
                                {isExpanded && (
                                    <div className={`p-3 border-t ${theme.border}/50 space-y-3 animate-in slide-in-from-top-1`}>
                                        
                                        {/* --- WEAPONS DETAILS --- */}
                                        {activeInvTab === 'weapons' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                        <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Damage</label>
                                                        <input className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.damage || ""} onChange={(e) => updateInventoryItem(item.id, 'damage', e.target.value)} placeholder="1d8" />
                                                    </div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                        <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Type</label>
                                                        <input className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.damageType || ""} onChange={(e) => updateInventoryItem(item.id, 'damageType', e.target.value)} placeholder="Slashing" />
                                                    </div>
                                                </div>
                                                
                                                {/* STAT & PROFICIENCY */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                        <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Ability</label>
                                                        <select 
                                                            className={`w-full bg-zinc-900 text-zinc-200 text-xs outline-none rounded cursor-pointer appearance-none mt-0.5`}
                                                            value={item.stat || "strength"}
                                                            onChange={(e) => updateInventoryItem(item.id, 'stat', e.target.value)}
                                                        >
                                                            <option className="bg-zinc-900" value="strength">STR</option>
                                                            <option className="bg-zinc-900" value="dexterity">DEX</option>
                                                            <option className="bg-zinc-900" value="constitution">CON</option>
                                                            <option className="bg-zinc-900" value="intelligence">INT</option>
                                                            <option className="bg-zinc-900" value="wisdom">WIS</option>
                                                            <option className="bg-zinc-900" value="charisma">CHA</option>
                                                        </select>
                                                    </div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5 flex items-center justify-between px-2 cursor-pointer" onClick={() => updateInventoryItem(item.id, 'isProficient', !item.isProficient)}>
                                                        <label className={`text-[8px] uppercase ${theme.subText} font-bold cursor-pointer`}>Proficient</label>
                                                        <div className={`w-3 h-3 rounded-full border ${item.isProficient ? `${theme.accentBg} border-transparent` : 'border-zinc-500'}`}></div>
                                                    </div>
                                                </div>

                                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                    <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Properties</label>
                                                    <input className={`w-full bg-transparent text-xs ${theme.text} outline-none`} value={item.properties || ""} onChange={(e) => updateInventoryItem(item.id, 'properties', e.target.value)} placeholder="Light, Finesse..." />
                                                </div>
                                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                    <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Notes</label>
                                                    <textarea 
                                                        spellCheck="false" 
                                                        className={`w-full bg-transparent text-xs ${theme.subText} outline-none resize-y min-h-[60px] mt-1 block`} 
                                                        value={item.description || ""} 
                                                        onChange={(e) => updateInventoryItem(item.id, 'description', e.target.value)} 
                                                        placeholder="..." 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={() => equipWeapon(item)}
                                                    className={`w-full py-2 mt-2 border ${theme.accentBorder} ${theme.accentBg}/20 hover:${theme.accentBg} text-[10px] font-bold uppercase rounded text-white transition-all flex justify-center items-center gap-2 shadow-sm`}
                                                >
                                                    <Icons.Sword className="w-3 h-3" /> Equip Weapon
                                                </button>
                                            </>
                                        )}

                                        {/* --- ARMOR DETAILS --- */}
                                        {activeInvTab === 'armor' && (
                                            <>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5 col-span-1">
                                                        <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>AC</label>
                                                        <input type="number" className={`w-full bg-transparent text-xs ${theme.text} font-bold outline-none`} value={item.ac || ""} onChange={(e) => updateInventoryItem(item.id, 'ac', parseInt(e.target.value)||0)} placeholder="12" />
                                                    </div>
                                                    <div className="bg-black/20 p-1.5 rounded border border-white/5 col-span-2">
                                                        <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Category</label>
                                                        <select 
                                                            className={`w-full bg-zinc-900 text-zinc-200 text-xs outline-none rounded cursor-pointer appearance-none`}
                                                            value={item.category || "Light"}
                                                            onChange={(e) => updateInventoryItem(item.id, 'category', e.target.value)}
                                                        >
                                                            <option className="bg-zinc-900" value="Light">Light Armor</option>
                                                            <option className="bg-zinc-900" value="Medium">Medium Armor</option>
                                                            <option className="bg-zinc-900" value="Heavy">Heavy Armor</option>
                                                            <option className="bg-zinc-900" value="Shield">Shield</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => updateInventoryItem(item.id, 'stealthDis', !item.stealthDis)}
                                                        className={`flex-1 py-1 text-[9px] uppercase font-bold border rounded transition-colors ${item.stealthDis ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-black/20 border-white/10 text-zinc-500'}`}
                                                    >
                                                        Stealth Disadvantage: {item.stealthDis ? "YES" : "NO"}
                                                    </button>
                                                </div>
                                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                    <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Notes</label>
                                                    <textarea 
                                                        spellCheck="false" 
                                                        className={`w-full bg-transparent text-xs ${theme.subText} outline-none resize-y min-h-[60px] mt-1 block`} 
                                                        value={item.description || ""} 
                                                        onChange={(e) => updateInventoryItem(item.id, 'description', e.target.value)} 
                                                        placeholder="..." 
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* --- ITEMS DETAILS --- */}
                                        {activeInvTab === 'items' && (
                                            <>
                                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                    <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Type / Rarity</label>
                                                    <select 
                                                        className={`w-full bg-zinc-900 text-zinc-200 text-xs outline-none rounded cursor-pointer appearance-none mt-1`}
                                                        value={item.type || "Adventuring Gear"}
                                                        onChange={(e) => updateInventoryItem(item.id, 'type', e.target.value)}
                                                    >
                                                        <option className="bg-zinc-900" value="Adventuring Gear">Adventuring Gear</option>
                                                        <option className="bg-zinc-900" value="Potion">Potion</option>
                                                        <option className="bg-zinc-900" value="Scroll">Scroll</option>
                                                        <option className="bg-zinc-900" value="Wondrous Item">Wondrous Item</option>
                                                        <option className="bg-zinc-900" value="Weapon (Magic)">Weapon (Magic)</option>
                                                        <option className="bg-zinc-900" value="Armor (Magic)">Armor (Magic)</option>
                                                        <option className="bg-zinc-900" value="Vehicle">Vehicle</option>
                                                        <option className="bg-zinc-900" value="Treasure">Treasure</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="bg-black/20 p-1.5 rounded border border-white/5">
                                                    <label className={`block text-[8px] uppercase ${theme.subText} font-bold`}>Bonuses / Description</label>
                                                    <textarea 
                                                        spellCheck="false" 
                                                        className={`w-full bg-transparent text-xs ${theme.subText} outline-none resize-y min-h-[60px] mt-1 block`} 
                                                        value={item.description || ""} 
                                                        onChange={(e) => updateInventoryItem(item.id, 'description', e.target.value)} 
                                                        placeholder="Effect or description..." 
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {/* --- DELETE BUTTON (Inside details for safety) --- */}
                                        <div className="flex justify-end pt-2 border-t border-white/5">
                                            <button onClick={() => removeInventoryItem(item.id)} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-900/10 transition-colors">
                                                <Icons.Trash /> Remove Item
                                            </button>
                                        </div>

                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {(inventory[activeInvTab] || []).length === 0 && (
                        <div className={`p-4 text-center text-xs ${theme.subText} italic opacity-50`}>
                            No {activeInvTab} added yet.
                        </div>
                    )}
                </div>

                {/* Currency Footer */}
                <div className={`p-3 bg-black/20 border-t ${theme.border} grid grid-cols-4 gap-2`}>
                    {['cp', 'sp', 'gp', 'pp'].map(coin => (
                        <div key={coin} className="flex flex-col items-center">
                            <label className={`text-[8px] font-bold uppercase ${theme.subText} mb-0.5 tracking-tighter`}>{coin}</label>
                            <input type="number" value={c.currency[coin] || 0} onChange={(e) => handleNestedChange('currency', coin, parseInt(e.target.value) || 0)} className={`w-full bg-black/30 border ${theme.border} rounded text-center text-[10px] font-bold ${theme.accentText} p-1 focus:${theme.accentBorder} outline-none shadow-inner`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* NOTES */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm min-h-[300px] flex flex-col pb-4`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['backstory','ideals','bonds','flaws','appearance'].map(tab => (
                        <button key={tab} onClick={() => setActiveNotesTab(tab)} className={`px-4 py-2 text-[9px] font-bold uppercase rounded-md m-0.5 whitespace-nowrap transition-all ${activeNotesTab === tab ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{tab}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex items-center gap-2`}>
                    <div className={theme.accentText}><Icons.Book /></div>
                    <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeNotesTab)}</span>
                </div>
                <textarea spellCheck="false" value={c[activeNotesTab] || ""} onChange={(e) => handleChange(activeNotesTab, e.target.value)} className={`w-full h-64 p-4 text-sm outline-none bg-transparent ${theme.subText} custom-scrollbar focus:${theme.text} transition-colors resize-y`} />
            </div>
        </div>
    );
};
export default SheetBio;