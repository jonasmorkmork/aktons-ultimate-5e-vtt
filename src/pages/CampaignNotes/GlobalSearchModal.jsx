import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, FileIcon, PlusIcon, CloseIcon } from '../CampaignManager/components/CampaignIcons';

const GlobalSearchModal = ({ isOpen, onClose, notes, onSelect, onCreate }) => {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Filtrer noter (kun dem der matcher)
    const filteredNotes = query.trim() === "" 
        ? notes.slice(0, 5) // Vis de 5 første hvis tom
        : notes.filter(n => n.name.toLowerCase().includes(query.toLowerCase()));

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredNotes.length + (query ? 1 : 0) - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                // Hvis vi står på "Create new" knappen (som er nederst hvis ingen match eller i bunden af listen)
                const isCreateOption = query && selectedIndex === filteredNotes.length;
                
                if (isCreateOption) {
                    onCreate(query);
                    onClose();
                } else if (filteredNotes[selectedIndex]) {
                    onSelect(filteredNotes[selectedIndex]);
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredNotes, selectedIndex, query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
                
                {/* Input Header */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-800">
                    <SearchIcon className="text-slate-500" size={20} />
                    <input 
                        ref={inputRef}
                        className="flex-1 bg-transparent text-lg text-white outline-none placeholder-slate-600 font-sans"
                        placeholder="Search your notes..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                    />
                    <div className="text-xs text-slate-500 font-mono border border-slate-700 rounded px-1.5 py-0.5">ESC</div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredNotes.length === 0 && !query && (
                        <div className="text-center text-slate-600 py-4 text-sm">Type to search...</div>
                    )}

                    {filteredNotes.map((note, idx) => (
                        <div 
                            key={note.id}
                            onClick={() => { onSelect(note); onClose(); }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                        >
                            <FileIcon size={16} className={idx === selectedIndex ? 'text-white' : 'text-slate-500'} />
                            <div className="flex-1">
                                <div className="font-bold text-sm">{note.name}</div>
                                {note.parentId && <div className={`text-[10px] ${idx === selectedIndex ? 'text-amber-200' : 'text-slate-500'}`}>Inside Folder</div>}
                            </div>
                            {idx === selectedIndex && <span className="text-[10px] font-bold uppercase tracking-wider">Open</span>}
                        </div>
                    ))}

                    {/* Create Option (Hvis man har skrevet noget) */}
                    {query && (
                        <div 
                            onClick={() => { onCreate(query); onClose(); }}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border-t border-slate-800 mt-2 ${selectedIndex === filteredNotes.length ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <PlusIcon size={16} />
                            <span className="text-sm font-bold">Create new page: "{query}"</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;