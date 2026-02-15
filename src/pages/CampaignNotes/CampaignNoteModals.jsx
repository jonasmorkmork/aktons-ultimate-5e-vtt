import React, { useState, useEffect, useRef } from 'react';
// Hent dine blueprints så vi kan vise dem i listen
import { BLUEPRINTS } from './blueprints';

// Fælles stil
const MODAL_OVERLAY = "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200";
const MODAL_BOX = "bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full relative transform transition-all scale-100";

// --- INPUT MODAL (Opdateret med Template Selector) ---
export const InputModal = ({ isOpen, onClose, onSubmit, title, placeholder, defaultValue = "", type = "file" }) => {
    const [value, setValue] = useState("");
    const [selectedBlueprint, setSelectedBlueprint] = useState("blank");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setSelectedBlueprint("blank"); // Nulstil til blank hver gang den åbnes
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        // Returner et objekt med både navn og valgt template
        onSubmit({ name: value, blueprint: selectedBlueprint });
        onClose();
    };

    return (
        <div className={MODAL_OVERLAY} onClick={onClose}>
            <div className={MODAL_BOX} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Name</label>
                        <input 
                            ref={inputRef}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-amber-500" 
                            placeholder={placeholder} 
                            value={value} 
                            onChange={(e) => setValue(e.target.value)} 
                        />
                    </div>

                    {/* VIS KUN TEMPLATE VÆLGER HVIS DET ER EN FIL (IKKE MAPPE) */}
                    {type === 'file' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Template</label>
                            <select 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white outline-none focus:border-amber-500 text-sm cursor-pointer"
                                value={selectedBlueprint}
                                onChange={(e) => setSelectedBlueprint(e.target.value)}
                            >
                                {Object.entries(BLUEPRINTS).map(([key, bp]) => (
                                    <option key={key} value={key}>
                                        {bp.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button type="submit" disabled={!value.trim()} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all text-sm">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- CONFIRM MODAL (Uændret) ---\
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Delete", isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className={MODAL_OVERLAY} onClick={onClose}>
            <div className={MODAL_BOX} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-white font-bold rounded-lg shadow-lg ${isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};