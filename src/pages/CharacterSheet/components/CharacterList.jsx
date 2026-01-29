import React, { useRef, useState } from 'react';
import { Icons } from './CharacterIcons';

const CharacterList = ({ characters, onSelect, onAdd, onDelete, onImport, onBackup, saveStatus }) => {
    const fileInputRef = useRef(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    return (
        <div className="min-h-screen text-zinc-200 p-6 md:p-8 font-sans pb-32">
            <div className="max-w-6xl mx-auto">
                
                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-zinc-100 flex items-center gap-3">
                            <span className="text-red-600"><Icons.User /></span>
                            Character Manager
                        </h1>
                        <p className="text-zinc-500 text-sm mt-2">Select your hero or create a new legend.</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={onBackup} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700 shadow-sm transition-all text-xs font-bold uppercase tracking-wider">
                            <Icons.Download /> Backup
                        </button>
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-700 shadow-sm transition-all text-xs font-bold uppercase tracking-wider">
                            <Icons.Upload /> Import
                        </button>
                        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
                        <button onClick={onAdd} className="flex items-center gap-2 px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded shadow-lg shadow-red-900/20 transition-all font-bold text-xs uppercase tracking-wider hover:scale-105">
                            <Icons.Plus /> New Character
                        </button>
                    </div>
                </header>

                {/* --- CHARACTER GRID --- */}
                {characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                        <div className="text-zinc-600 mb-4 scale-150"><Icons.User /></div>
                        <p className="text-zinc-500 font-medium">No characters found.</p>
                        <button onClick={onAdd} className="mt-4 text-red-500 font-bold hover:underline">Create your first hero</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {characters.map(char => (
                            <div 
                                key={char.id} 
                                onClick={() => onSelect(char.id)}
                                className="
                                    group relative flex flex-col h-[340px] cursor-pointer
                                    bg-zinc-900 rounded-xl overflow-hidden 
                                    border border-zinc-800
                                    transition-all duration-300 ease-out
                                    shadow-lg 
                                    hover:-translate-y-2
                                    hover:border-red-500
                                    hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]
                                "
                            >
                                {/* IMAGE SECTION (60% height approx) */}
                                <div className="h-48 w-full bg-zinc-950 relative overflow-hidden">
                                    {char.imageUrl ? (
                                        <img 
                                            src={char.imageUrl} 
                                            alt={char.name} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        />
                                    ) : (
                                        // Default Gradient Placeholder hvis intet billede
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-zinc-700 group-hover:text-zinc-600 transition-colors">
                                            <div className="scale-[2.5]"><Icons.User /></div>
                                        </div>
                                    )}
                                    
                                    {/* Overlay Gradient i bunden af billedet for tekst-læsbarhed */}
                                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                                </div>

                                {/* CONTENT SECTION */}
                                <div className="p-4 flex flex-col flex-1 bg-zinc-900 relative">
                                    
                                    {/* DELETE BUTTON (Absolute top right of content) */}
                                    <div className="absolute top-[-1.5rem] right-3">
                                        {confirmDeleteId === char.id ? (
                                            <div className="flex gap-1 bg-black/80 p-1 rounded-lg border border-red-900 shadow-xl backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => onDelete(char.id)} className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-500">CONFIRM</button>
                                                <button onClick={() => setConfirmDeleteId(null)} className="bg-zinc-700 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-zinc-600">CANCEL</button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(char.id); }}
                                                className="bg-zinc-800 hover:bg-red-900/80 text-zinc-400 hover:text-red-400 p-2 rounded-full border border-zinc-700 shadow-md transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Character"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        )}
                                    </div>

                                    {/* NAME */}
                                    <h3 className="text-xl font-bold text-zinc-100 truncate mb-1 group-hover:text-red-500 transition-colors font-serif">
                                        {char.name || "Unnamed Hero"}
                                    </h3>

                                    {/* DETAILS: Level, Class, Species */}
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">LVL {char.level}</span>
                                        <span className="truncate">{char.species} {char.class}</span>
                                    </div>

                                    {/* FOOTER STATS (HP & AC) */}
                                    <div className="mt-auto pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-400 font-mono">
                                        <div className="flex items-center gap-1.5" title="Hit Points">
                                            <span className="text-red-600"><Icons.Heart /></span>
                                            <span className="font-bold">{char.hp?.current}/{char.hp?.max}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title="Armor Class">
                                            <span className="text-blue-500"><Icons.Shield /></span>
                                            <span className="font-bold">{char.ac} AC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharacterList;