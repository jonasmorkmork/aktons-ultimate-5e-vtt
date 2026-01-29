import React, { useState, useEffect } from 'react';
import { Icons } from '../CharacterIcons';

// D&D Tema Presets
const PRESETS = [
    '#f5e6d3', // Parchment
    '#18181b', // Void Black
    '#7f1d1d', // Blood Red
    '#b45309', // Leather
    '#f59e0b', // Gold
    '#10b981', // Emerald
    '#2563eb', // Magic Blue
    '#7c3aed', // Arcane Purple
    '#e4e4e7', // Steel White
    '#52525b', // Stone Grey
];

const CustomColorControl = ({ label, value, onChange }) => {
    return (
        <div className="bg-black/40 border border-zinc-700 p-3 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">{label}</label>
                <span className="text-[10px] font-mono text-zinc-500">{value}</span>
            </div>
            
            <div className="flex gap-2 items-center h-8">
                {/* Farve Preview / Trigger */}
                <div className="relative w-full h-full rounded border border-zinc-600 overflow-hidden cursor-pointer group">
                    <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: value }}></div>
                    
                    {/* Native Picker - Stabil implementation */}
                    <input 
                        type="color" 
                        value={value} 
                        onInput={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                
                {/* Hex Input */}
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 h-full bg-zinc-900 border border-zinc-700 rounded text-center text-xs font-mono text-zinc-300 outline-none focus:border-zinc-500 uppercase"
                />
            </div>

            {/* Presets Grid */}
            <div className="flex gap-1.5 flex-wrap pt-1">
                {PRESETS.map(color => (
                    <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={`w-5 h-5 rounded-full border border-white/10 shadow-sm transition-transform hover:scale-110 ${value === color ? 'ring-2 ring-white border-transparent' : ''}`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );
};

const ThemeEditorModal = ({ show, onClose, customTheme, onUpdate }) => {
    if (!show) return null;

    const defaults = {
        panel: '#18181b',
        border: '#27272a',
        accent: '#ef4444',
        text: '#e4e4e7',
        subText: '#71717a',
        bgImage: null
    };

    const current = { ...defaults, ...customTheme };

    const handleUpdate = (field, value) => {
        onUpdate({ 
            customTheme: { 
                ...current, 
                [field]: value 
            } 
        });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Image max 5MB"); return; }
        const reader = new FileReader();
        reader.onload = (event) => handleUpdate('bgImage', event.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[90vh] relative z-10 overflow-hidden">
                
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        <span className="text-purple-500"><Icons.Settings /></span> Theme Editor
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><Icons.X /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-zinc-950/50">
                    
                    {/* --- LIVE PREVIEW BOX --- */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Live Preview</label>
                        {/* Container der simulerer baggrunden (hvis billede er valgt) */}
                        <div 
                            className="p-4 rounded-xl border border-dashed border-zinc-800 bg-cover bg-center transition-all"
                            style={{ 
                                backgroundImage: current.bgImage ? `url(${current.bgImage})` : 'none',
                                backgroundColor: '#000' // Fallback
                            }}
                        >
                            {/* Simuleret Character Sheet Component */}
                            <div 
                                className="border rounded-xl p-4 shadow-lg transition-colors duration-200"
                                style={{ 
                                    backgroundColor: current.panel, 
                                    borderColor: current.border 
                                }}
                            >
                                <div className="flex justify-between items-start mb-3 border-b pb-2" style={{ borderColor: current.border }}>
                                    <div>
                                        <label className="text-[9px] font-bold uppercase tracking-widest mb-1 block" style={{ color: current.accent }}>Stats Example</label>
                                        <h2 className="text-xl font-bold font-serif leading-none" style={{ color: current.text }}>Strength</h2>
                                    </div>
                                    <div className="p-2 rounded border" style={{ borderColor: current.border, backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                        <span className="text-lg font-bold" style={{ color: current.accent }}>+3</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span style={{ color: current.subText }}>Saving Throw</span>
                                        <span className="font-bold" style={{ color: current.text }}>+5</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span style={{ color: current.subText }}>Athletics</span>
                                        <span className="font-bold" style={{ color: current.text }}>+5</span>
                                    </div>
                                    {/* Fake Input Line */}
                                    <div className="mt-3 pt-2 border-t" style={{ borderColor: current.border }}>
                                        <div className="text-[9px] font-bold uppercase mb-1" style={{ color: current.subText }}>Notes</div>
                                        <div className="h-2 w-3/4 rounded bg-black/10" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colors Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomColorControl label="Background Panel" value={current.panel} onChange={(v) => handleUpdate('panel', v)} />
                        <CustomColorControl label="Borders & Lines" value={current.border} onChange={(v) => handleUpdate('border', v)} />
                        <CustomColorControl label="Accent Color" value={current.accent} onChange={(v) => handleUpdate('accent', v)} />
                        <CustomColorControl label="Text Color" value={current.text} onChange={(v) => handleUpdate('text', v)} />
                        <div className="md:col-span-2">
                            <CustomColorControl label="Sub-Text / Labels" value={current.subText} onChange={(v) => handleUpdate('subText', v)} />
                        </div>
                    </div>

                    {/* Background Image */}
                    <div className="space-y-2 pt-4 border-t border-zinc-800">
                        <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Background Image</label>
                        <div className={`relative h-24 rounded-lg border-2 border-dashed ${current.bgImage ? 'border-purple-500/50' : 'border-zinc-800'} bg-black/40 overflow-hidden group hover:border-zinc-600 transition-colors`}>
                            {current.bgImage ? (
                                <>
                                    <img src={current.bgImage} alt="Bg" className="w-full h-full object-cover opacity-60" />
                                    <button onClick={() => handleUpdate('bgImage', null)} className="absolute top-2 right-2 bg-red-600/80 text-white p-1.5 rounded shadow hover:bg-red-600"><Icons.Trash /></button>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                                    <Icons.Image className="w-6 h-6 mb-2 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase">Click to upload</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-between items-center">
                    <button onClick={() => onUpdate({ customTheme: defaults })} className="text-[10px] font-bold text-zinc-500 hover:text-red-400 uppercase">Reset</button>
                    <button onClick={onClose} className="px-6 py-2 bg-zinc-100 hover:bg-white text-black font-bold rounded-lg text-xs uppercase tracking-wide">Save</button>
                </div>
            </div>
        </div>
    );
};

export default ThemeEditorModal;