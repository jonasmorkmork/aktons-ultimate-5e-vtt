import React from 'react';
import { PlusIcon, TrashIcon, BookIcon, ChevronRight, EditIcon, UploadIcon } from '../CampaignManager/components/CampaignIcons';
import { useNavigate } from 'react-router-dom';
import { NOTEBOOK_COLORS } from './CreateNotebookModal'; 

// Fallback hvis importen fejler eller listen er tom
const DEFAULT_COLOR = { name: 'Amber', hex: '#f59e0b', border: 'border-amber-500' };

const NotebookCard = ({ notebook, onClick, onDelete, onEdit, onExport }) => {
    // SIKKERHEDSNET: Hvis NOTEBOOK_COLORS er undefined, brug DEFAULT_COLOR
    const colors = (typeof NOTEBOOK_COLORS !== 'undefined' && NOTEBOOK_COLORS.length > 0) ? NOTEBOOK_COLORS : [DEFAULT_COLOR];
    const themeColor = notebook.color || colors[0];
    
    // Sikr at themeColor altid har en hex værdi
    const borderColor = themeColor?.hex || DEFAULT_COLOR.hex;
    
    return (
        <div 
            onClick={onClick}
            className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-48"
            style={{ borderColor: notebook.image ? 'rgba(30, 41, 59, 1)' : borderColor }}
        >
            {/* Background Image (hvis det findes) */}
            {notebook.image && (
                <div className="absolute inset-0 z-0">
                    <img src={notebook.image} alt="cover" className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full p-6">
                <div className="flex items-start justify-between">
                    <div 
                        className="p-3 rounded-lg transition-colors shadow-lg"
                        style={{ backgroundColor: notebook.image ? 'rgba(15, 23, 42, 0.8)' : `${borderColor}20`, color: borderColor }}
                    >
                        <BookIcon size={24} />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {/* EXPORT KNAP */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onExport(notebook.id); }}
                            className="text-slate-400 hover:text-blue-400 p-2 rounded-full bg-black/20 hover:bg-black/50 transition-colors"
                            title="Export Notebook as ZIP"
                        >
                            <UploadIcon size={16} className="rotate-180" /> {/* Roteret for at ligne download */}
                        </button>

                        {/* REDIGER KNAP */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(notebook); }}
                            className="text-slate-400 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/50 transition-colors"
                            title="Edit Notebook"
                        >
                            <EditIcon size={16} />
                        </button>
                        
                        {/* SLET KNAP */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(notebook.id); }}
                            className="text-slate-400 hover:text-red-500 p-2 rounded-full bg-black/20 hover:bg-black/50 transition-colors"
                            title="Delete Notebook"
                        >
                            <TrashIcon size={16} />
                        </button>
                    </div>
                </div>
                
                <div className="mt-auto">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors truncate drop-shadow-md">{notebook.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        Notebook <span className="w-1 h-1 bg-slate-500 rounded-full"></span> {new Date(notebook.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

const NotesMenu = ({ notebooks, onCreate, onOpen, onDelete, onEdit, onExport }) => {
    const navigate = useNavigate();

    return (
        <div className="w-full h-full flex flex-col p-8 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950">
            <header className="max-w-6xl mx-auto w-full mb-12 flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <button onClick={() => navigate('/')} className="text-slate-500 hover:text-white flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider">
                        <ChevronRight className="rotate-180"/> Exit Tool
                    </button>
                    <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">
                        Campaign Notebooks
                    </h1>
                    <p className="text-slate-400 mt-2">Manage your personal notes, lore, and session logs.</p>
                </div>
                <button onClick={onCreate} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105">
                    <PlusIcon /> Create Notebook
                </button>
            </header>

            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Create New Card */}
                <button onClick={onCreate} className="group bg-slate-900/50 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-6 flex flex-col items-center justify-center gap-4 transition-all hover:bg-slate-900 min-h-[200px]">
                    <div className="bg-slate-800 p-4 rounded-full text-slate-600 group-hover:text-amber-500 transition-colors">
                        <PlusIcon size={32} />
                    </div>
                    <span className="font-bold text-slate-500 group-hover:text-amber-500">Create New Notebook</span>
                </button>

                {/* Notebook List */}
                {notebooks.map(notebook => (
                    <NotebookCard 
                        key={notebook.id} 
                        notebook={notebook} 
                        onClick={() => onOpen(notebook)} 
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onExport={onExport} // Send export funktion videre
                    />
                ))}
            </div>
        </div>
    );
};

export default NotesMenu;