import React, { useState, useEffect, useRef } from 'react';

// Fælles stil
const MODAL_OVERLAY = "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200";
const MODAL_BOX = "bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-sm w-full relative transform transition-all scale-100";

// --- INPUT MODAL (Til "Create Page") ---
export const InputModal = ({ isOpen, onClose, onSubmit, title, placeholder, submitLabel = "Create" }) => {
    const [value, setValue] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValue("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value);
        onClose();
    };

    return (
        <div className={MODAL_OVERLAY} onClick={onClose}>
            <div className={MODAL_BOX} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors placeholder-slate-600"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button type="submit" disabled={!value.trim()} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 transition-all text-sm">{submitLabel}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- CONFIRM MODAL (Til "Delete") ---
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Delete", isDanger = false }) => {
    if (!isOpen) return null;

    return (
        <div className={MODAL_OVERLAY} onClick={onClose}>
            <div className={MODAL_BOX} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className={`px-4 py-2 text-white font-bold rounded-lg shadow-lg transition-all text-sm ${isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};