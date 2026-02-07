import React, { useState, useEffect } from 'react';

// Standard "Clean" farver
export const NOTEBOOK_COLORS = [
    { name: 'Amber', hex: '#f59e0b', border: 'border-amber-500' },
    { name: 'Red', hex: '#ef4444', border: 'border-red-500' },
    { name: 'Blue', hex: '#3b82f6', border: 'border-blue-500' },
    { name: 'Emerald', hex: '#10b981', border: 'border-emerald-500' },
    { name: 'Purple', hex: '#a855f7', border: 'border-purple-500' },
    { name: 'Pink', hex: '#ec4899', border: 'border-pink-500' },
    { name: 'Slate', hex: '#64748b', border: 'border-slate-500' },
];

const CreateNotebookModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [selectedColor, setSelectedColor] = useState(NOTEBOOK_COLORS[0]);

    // Effekt: Når modalen åbner, tjek om vi redigerer eller opretter ny
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // EDIT MODE: Udfyld felter med eksisterende data
                setName(initialData.name || "");
                setImage(initialData.image || "");
                
                // Find den rigtige farve i listen baseret på hex, eller brug den gemte farve
                const colorMatch = NOTEBOOK_COLORS.find(c => c.hex === initialData.color?.hex) || initialData.color || NOTEBOOK_COLORS[0];
                setSelectedColor(colorMatch);
            } else {
                // CREATE MODE: Nulstil felter
                setName("");
                setImage("");
                setSelectedColor(NOTEBOOK_COLORS[0]);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        // Kald onSubmit med de nye værdier
        onSubmit({ name, image, color: selectedColor });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-2xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-6">
                    {initialData ? "Edit Notebook" : "Create New Notebook"}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Notebook Name</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors"
                            placeholder="e.g. Curse of Strahd"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cover Image (Optional URL)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500 transition-colors text-sm"
                                placeholder="https://..."
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                            />
                            {image && (
                                <div className="w-10 h-10 rounded border border-slate-600 overflow-hidden shrink-0">
                                    <img src={image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Theme Color</label>
                        <div className="flex flex-wrap gap-3">
                            {NOTEBOOK_COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor.name === color.name ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={!name.trim()}
                            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {initialData ? "Save Changes" : "Create Notebook"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateNotebookModal;