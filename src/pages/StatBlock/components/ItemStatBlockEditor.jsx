import React, { useState, useEffect, useRef } from 'react';
import { Icon, Icons } from './StatBlockIcons';
import html2canvas from 'html2canvas';

// --- ITEM DISPLAY COMPONENT (Preview) ---
const ItemDisplay = ({ data }) => {
    return (
        <div className="bg-[#fdf1dc] text-black font-sans shadow-xl relative box-border selection:bg-[#f3c06d] w-full min-h-[300px]">
            {/* Dekorativ kant */}
            <div className="border-[6px] border-double border-[#6b21a8] h-full bg-[#fdf1dc] p-4 relative">
                
                {/* Header */}
                <div className="border-b border-[#6b21a8] pb-2 mb-3">
                    <h1 className="text-2xl font-serif-dnd font-bold text-[#4c1d95] leading-none mb-1">{data.name || "New Item"}</h1>
                    <div className="text-sm italic font-serif text-black opacity-80">
                        {data.type || "Wondrous Item"}, {data.rarity || "Common"} 
                        {data.attunement ? " (requires attunement)" : ""}
                    </div>
                </div>

                {/* WEAPON / ARMOR STATS ROW */}
                {(data.type === 'Weapon' || data.type === 'Armor' || data.type === 'Shield') && (
                    <div className="mb-4 text-sm font-serif text-[#4c1d95] font-bold border-b border-[#6b21a8]/30 pb-2">
                        
                        {/* WEAPON DISPLAY */}
                        {data.type === 'Weapon' && (
                            <div className="flex justify-between items-start w-full">
                                {/* VENSTRE SIDE: Skade og Type */}
                                <div className="flex flex-col">
                                    {/* Linje 1: Damage + Damage Type */}
                                    <span className="whitespace-nowrap text-sm font-bold leading-none">
                                        {data.damage || "1d4"} {data.damageType}
                                    </span>
                                    
                                    {/* Linje 2: Weapon Category + Mastery */}
                                    <span className="text-black font-normal italic text-xs mt-1 opacity-80">
                                        {data.weaponCategory || "Simple Melee Weapon"}
                                        {data.mastery && <span className="ml-1">({data.mastery})</span>}
                                    </span>
                                </div>
                                
                                {/* HØJRE SIDE: Properties liste */}
                                {data.properties && (
                                    <div className="text-black font-normal italic flex flex-col text-right text-xs">
                                        {data.properties.split(',').map((prop, index) => (
                                            <span key={index}>{prop.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ARMOR DISPLAY */}
                        {(data.type === 'Armor' || data.type === 'Shield') && (
                            <div className="flex gap-4">
                                <span>AC {data.ac || 10}</span>
                                <span className="text-black font-normal">({data.category || "Light"})</span>
                                {data.stealthDis && <span className="text-red-800 italic">Stealth Disadv.</span>}
                            </div>
                        )}
                    </div>
                )}

                {/* Description Text (Flavor) */}
                {data.description && (
                    <div className="text-sm leading-relaxed text-black font-serif whitespace-pre-wrap mb-4">
                        {data.description}
                    </div>
                )}

                {/* Mechanics (Bold Headers) */}
                {data.mechanics && data.mechanics.length > 0 && (
                    <div className="space-y-3">
                        {data.mechanics.map((mech, i) => (
                            <div key={i} className="text-sm text-black leading-snug font-serif">
                                {mech.name && <span className="font-bold italic">{mech.name}.</span>} 
                                <span className="whitespace-pre-wrap"> {mech.desc}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Bar */}
                <div className="h-1.5 w-full bg-[#6b21a8] mt-6 mb-[-24px] mx-[-24px] w-[calc(100%+48px)] opacity-80"></div>
            </div>
        </div>
    );
};

// --- MAIN EDITOR ---
const ItemStatBlockEditor = ({ initialData, onSave, onCancel }) => {
    const defaultData = {
        name: "New Magic Item",
        type: "Wondrous Item",
        rarity: "Uncommon",
        attunement: false,
        description: "",
        mechanics: [],
        // Weapon specific
        damage: "",
        damageType: "",     
        weaponCategory: "", 
        mastery: "", // NYT FELT
        properties: "",
        // Armor specific
        ac: "",
        category: "Light",
        stealthDis: false
    };

    const [mode, setMode] = useState('builder');
    
    const [data, setData] = useState(() => {
        const start = { ...defaultData, ...initialData };
        if (start.type === 'item') start.type = 'Wondrous Item';
        return start;
    });
    
    const [rawText, setRawText] = useState("");
    const previewRef = useRef(null);

    // Initial ID Sync
    useEffect(() => {
        if (initialData && initialData.id && data.id !== initialData.id) {
            setData(prev => ({ ...prev, id: initialData.id }));
        }
    }, [initialData]);

    // --- TEXT GENERATOR ---
    const generateText = (d) => {
        let txt = `${d.name}\n${d.type}, ${d.rarity}${d.attunement ? " (requires attunement)" : ""}\n`;
        
        if (d.type === 'Weapon') {
            txt += `Damage: ${d.damage} ${d.damageType}\n`;
            txt += `Category: ${d.weaponCategory}\n`;
            if (d.mastery) txt += `Mastery: ${d.mastery}\n`;
            txt += `Properties: ${d.properties}\n`;
        }
        if (d.type === 'Armor' || d.type === 'Shield') {
            txt += `AC: ${d.ac} (${d.category})${d.stealthDis ? ", Stealth Disadvantage" : ""}\n`;
        }

        txt += `\n`;
        if (d.description) txt += `${d.description}\n\n`;
        if (d.mechanics && d.mechanics.length > 0) {
            d.mechanics.forEach(m => {
                txt += `${m.name}. ${m.desc}\n\n`;
            });
        }
        return txt.trim();
    };

    const handleSwitchMode = (newMode) => { 
        if (newMode === 'text') setRawText(generateText(data)); 
        setMode(newMode); 
    };

    // Handlers
    const handleChange = (field, value) => { setData(prev => ({ ...prev, [field]: value })); };
    const handleListChange = (idx, field, val) => { const newList = [...data.mechanics]; newList[idx][field] = val; setData(prev => ({ ...prev, mechanics: newList })); };
    const addListItem = () => { setData(prev => ({ ...prev, mechanics: [...prev.mechanics, { name: "", desc: "" }] })); };
    const removeListItem = (idx) => { setData(prev => ({ ...prev, mechanics: prev.mechanics.filter((_, i) => i !== idx) })); };

    const handleDownload = () => {
        if (!previewRef.current) return;
        html2canvas(previewRef.current, { scale: 2, backgroundColor: null }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${(data.name || 'item').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
    };

    const itemTypes = ["Wondrous Item", "Weapon", "Armor", "Shield", "Potion", "Ring", "Rod", "Scroll", "Staff", "Wand"];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8 font-sans-dnd">
            <div className="max-w-6xl mx-auto">
                
                {/* TOOLBAR */}
                <div className="mb-6 flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                    <div className="flex items-center gap-4">
                        <button onClick={onCancel} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                            <Icon path={Icons.ArrowLeft} /> Back
                        </button>
                        <div className="h-6 w-px bg-gray-700"></div>
                        <h1 className="text-xl font-bold text-gray-100">
                            {data.name || 'New Item'}
                        </h1>
                    </div>
                    <button onClick={() => onSave(data)} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                        <Icon path={Icons.Save} /> Save Item
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-150px)] min-h-[600px]">
                    
                    {/* LEFT: EDITOR */}
                    <div className="flex flex-col gap-4 overflow-hidden h-full">
                        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                            {/* TABS */}
                            <div className="flex border-b border-gray-700 shrink-0">
                                <button onClick={() => handleSwitchMode('builder')} className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'builder' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:bg-gray-700/50'}`}><Icon path={Icons.Builder} /> Visual Builder</button>
                                <button onClick={() => handleSwitchMode('text')} className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'text' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-400 hover:bg-gray-700/50'}`}><Icon path={Icons.Text} /> Text Editor</button>
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {mode === 'text' ? (
                                    <textarea 
                                        value={rawText} 
                                        onChange={(e) => setRawText(e.target.value)} 
                                        className="w-full h-full p-4 border border-gray-600 bg-gray-900 text-gray-200 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" 
                                        placeholder="Generate text from builder..." 
                                        spellCheck="false" 
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            {/* NAME */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                                <input type="text" value={data.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-200 focus:border-purple-500 outline-none" />
                                            </div>

                                            {/* TYPE & RARITY */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                                    <select value={data.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-200 focus:border-purple-500 outline-none">
                                                        {itemTypes.map(t => (<option key={t} value={t}>{t}</option>))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rarity</label>
                                                    <select value={data.rarity} onChange={(e) => handleChange('rarity', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-200 focus:border-purple-500 outline-none">
                                                        {["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"].map(r => (<option key={r} value={r}>{r}</option>))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* ATTUNEMENT */}
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="attunement" checked={data.attunement} onChange={(e) => handleChange('attunement', e.target.checked)} className="w-4 h-4 accent-purple-500 cursor-pointer" />
                                                <label htmlFor="attunement" className="text-sm text-gray-300 cursor-pointer select-none">Requires Attunement</label>
                                            </div>

                                            {/* --- WEAPON SPECIFIC FIELDS --- */}
                                            {data.type === 'Weapon' && (
                                                <div className="bg-gray-900/50 p-3 rounded border border-purple-500/30 space-y-3">
                                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-1">Weapon Stats</h4>
                                                    
                                                    {/* Row 1: Damage + Damage Type */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Damage</label>
                                                            <input type="text" value={data.damage} onChange={(e) => handleChange('damage', e.target.value)} placeholder="e.g. 1d8" className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Damage Type</label>
                                                            <input type="text" value={data.damageType} onChange={(e) => handleChange('damageType', e.target.value)} placeholder="e.g. Slashing" className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none" />
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Weapon Category + Mastery (NYT) */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Weapon Category</label>
                                                            <input type="text" value={data.weaponCategory} onChange={(e) => handleChange('weaponCategory', e.target.value)} placeholder="e.g. Martial Melee" className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-purple-400 uppercase mb-1">Mastery Property</label>
                                                            <input type="text" value={data.mastery} onChange={(e) => handleChange('mastery', e.target.value)} placeholder="e.g. Vex, Nick" className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none" />
                                                        </div>
                                                    </div>

                                                    {/* Row 3: Properties */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Properties</label>
                                                        <input type="text" value={data.properties} onChange={(e) => handleChange('properties', e.target.value)} placeholder="e.g. Versatile (1d10), Finesse" className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- ARMOR / SHIELD SPECIFIC FIELDS --- */}
                                            {(data.type === 'Armor' || data.type === 'Shield') && (
                                                <div className="bg-gray-900/50 p-3 rounded border border-purple-500/30 space-y-3">
                                                    <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-1">Armor Stats</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">AC</label>
                                                            <input type="text" value={data.ac} onChange={(e) => handleChange('ac', e.target.value)} placeholder="14" className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
                                                            <select value={data.category} onChange={(e) => handleChange('category', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-sm text-white focus:border-purple-500 outline-none">
                                                                <option value="Light">Light Armor</option>
                                                                <option value="Medium">Medium Armor</option>
                                                                <option value="Heavy">Heavy Armor</option>
                                                                <option value="Shield">Shield</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <input type="checkbox" id="stealthDis" checked={data.stealthDis} onChange={(e) => handleChange('stealthDis', e.target.checked)} className="w-4 h-4 accent-red-500 cursor-pointer" />
                                                        <label htmlFor="stealthDis" className="text-sm text-gray-300 cursor-pointer select-none">Stealth Disadvantage</label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* FLAVOR TEXT */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Flavor Text / Description</label>
                                                <textarea value={data.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-purple-500 outline-none resize-none" placeholder="General description..." />
                                            </div>
                                        </div>

                                        {/* MECHANICS LIST */}
                                        <div className="space-y-2 pt-4 border-t border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mechanics & Properties</h3>
                                                <button onClick={addListItem} className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"><Icon path={Icons.Plus} /> Add Property</button>
                                            </div>
                                            {data.mechanics.map((item, idx) => (
                                                <div key={idx} className="bg-gray-900 border border-gray-700 rounded p-2 relative group">
                                                    <div className="flex justify-between mb-1">
                                                        <input type="text" value={item.name} onChange={e=>handleListChange(idx,'name',e.target.value)} className="bg-transparent font-bold text-gray-200 w-3/4 text-sm outline-none" placeholder="Name (e.g. Sentience)"/>
                                                        <button onClick={()=>removeListItem(idx)} className="text-gray-600 hover:text-red-500"><Icon path={Icons.Trash} className="w-3 h-3"/></button>
                                                    </div>
                                                    <textarea value={item.desc} onChange={e=>handleListChange(idx,'desc',e.target.value)} className="bg-transparent text-gray-400 w-full text-xs h-16 outline-none resize-none" placeholder="Description of the effect..."/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: PREVIEW */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 relative h-fit sticky top-4">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                <h2 className="font-semibold text-gray-200 flex items-center gap-2"><Icon path={Icons.Text} /> Preview</h2>
                                <button onClick={handleDownload} className="text-xs flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors border border-gray-600">
                                    <Icon path={Icons.Download} /> PNG
                                </button>
                            </div>
                            <div ref={previewRef} className="mx-auto w-full max-w-md shadow-2xl">
                                <ItemDisplay data={data} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ItemStatBlockEditor;