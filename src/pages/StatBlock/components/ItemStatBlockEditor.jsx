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
        mechanics: [] 
    };

    const [mode, setMode] = useState('builder');
    const [data, setData] = useState({ ...defaultData, ...initialData });
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
        let txt = `${d.name}\n${d.type}, ${d.rarity}${d.attunement ? " (requires attunement)" : ""}\n\n`;
        if (d.description) txt += `${d.description}\n\n`;
        if (d.mechanics && d.mechanics.length > 0) {
            d.mechanics.forEach(m => {
                txt += `${m.name}. ${m.desc}\n\n`;
            });
        }
        return txt.trim();
    };

    // --- SMART PARSER LOGIC ---
    const parseInput = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const newData = JSON.parse(JSON.stringify(defaultData));
        
        if (lines.length === 0) return newData;

        // Line 1: Name
        newData.name = lines[0];

        // Line 2: Meta (Type, Rarity, Attunement)
        let startIndex = 1;
        if (lines.length > 1) {
            const meta = lines[1].toLowerCase();
            
            const rarities = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];
            const types = ["armor", "potion", "ring", "rod", "scroll", "staff", "wand", "weapon", "wondrous item"];
            const hasMetaKeyword = [...rarities, ...types, "attunement"].some(k => meta.includes(k));

            if (hasMetaKeyword) {
                startIndex = 2; 
                
                const negativeAttunement = meta.includes("kræver ikke") || meta.includes("requires no") || meta.includes("no attunement");
                if (meta.includes("attunement") && !negativeAttunement) {
                    newData.attunement = true;
                } else {
                    newData.attunement = false;
                }

                const foundRarity = rarities.find(r => meta.includes(r));
                if (foundRarity) newData.rarity = foundRarity.charAt(0).toUpperCase() + foundRarity.slice(1);

                const foundType = types.find(t => meta.includes(t));
                if (foundType) newData.type = foundType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        }

        // Rest: Description & Mechanics loop
        const remainingLines = lines.slice(startIndex);
        const mechanics = [];
        let description = "";
        let currentSection = 'description'; 

        remainingLines.forEach(line => {
            const l = line.trim();
            
            // Ignorer sektions-overskrifter
            if (/^(egenskaber|properties|actions|features):?$/i.test(l)) return;

            // Regex: Finder "1. Navn:" eller "Navn." 
            const mechanicRegex = /^(?:\d+\.\s*)?(.+?)(?::|\.)\s+(.+)/;
            const match = l.match(mechanicRegex);
            
            if (match && match[1].length < 60) {
                mechanics.push({ name: match[1].trim(), desc: match[2].trim() });
                currentSection = 'mechanic';
            } else {
                if (currentSection === 'description') {
                    if (description) description += "\n\n" + l;
                    else description = l;
                } else {
                    if (mechanics.length > 0) {
                        const lastMech = mechanics[mechanics.length - 1];
                        lastMech.desc += "\n\n" + l; 
                    }
                }
            }
        });

        newData.description = description;
        newData.mechanics = mechanics;

        return newData;
    };

    // Mode Switching
    useEffect(() => { 
        if (mode === 'text') { 
            setData(prev => ({ ...parseInput(rawText), id: prev.id, folderId: prev.folderId })); 
        } 
    }, [rawText, mode]);

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
                        {/* RETTET: Ikon fjernet herfra */}
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
                            <div className="flex-1 overflow-y-auto p-6">
                                {mode === 'text' ? (
                                    <textarea 
                                        value={rawText} 
                                        onChange={(e) => setRawText(e.target.value)} 
                                        className="w-full h-full p-4 border border-gray-600 bg-gray-900 text-gray-200 rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none" 
                                        placeholder="Paste item text here..." 
                                        spellCheck="false" 
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                                                <input type="text" value={data.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-200 focus:border-purple-500 outline-none" />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                                    <select value={data.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-200 focus:border-purple-500 outline-none">
                                                        {["Armor", "Potion", "Ring", "Rod", "Scroll", "Staff", "Wand", "Weapon", "Wondrous Item"].map(t => (<option key={t} value={t}>{t}</option>))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rarity</label>
                                                    <select value={data.rarity} onChange={(e) => handleChange('rarity', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-gray-200 focus:border-purple-500 outline-none">
                                                        {["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"].map(r => (<option key={r} value={r}>{r}</option>))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id="attunement" checked={data.attunement} onChange={(e) => handleChange('attunement', e.target.checked)} className="w-4 h-4 accent-purple-500 cursor-pointer" />
                                                <label htmlFor="attunement" className="text-sm text-gray-300 cursor-pointer select-none">Requires Attunement</label>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Flavor Text / Description</label>
                                                <textarea value={data.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full h-24 bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-purple-500 outline-none resize-none" placeholder="General description..." />
                                            </div>
                                        </div>

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
                        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 relative h-fit">
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