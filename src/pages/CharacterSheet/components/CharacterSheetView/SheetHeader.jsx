import React from 'react';
import { Icons } from '../CharacterIcons';

const SheetHeader = ({ c, onUpdate, onImageSelect, theme }) => {
    const handleChange = (field, value) => onUpdate({ [field]: value });

    return (
        <header className={`${theme.bgPanel} border-2 ${theme.accentBorder} rounded-xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-6 items-center relative overflow-hidden transition-colors duration-300`}>
            <div className="flex-1 flex flex-wrap gap-6 items-center z-10">
                <div className="w-full lg:flex-1 lg:min-w-[200px]">
                    <label className={`block text-[10px] font-bold ${theme.accentText} uppercase tracking-widest mb-1`}>Character Name</label>
                    {/* FIX: Mindre font størrelse (text-lg md:text-2xl) */}
                    <input spellCheck="false" type="text" value={c.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full text-lg md:text-2xl dnd-font font-bold border-b ${theme.border} outline-none focus:${theme.accentBorder} bg-transparent py-1 transition-colors ${theme.text}`} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 flex-[4] w-full">
                    {[{l:'Class & Lvl',f:'class',sf:'level'},{l:'Subclass',f:'subclass'},{l:'Species',f:'species'},{l:'Background',f:'background'},{l:'Alignment',f:'alignment'},{l:'XP',f:'xp'}].map(i => (
                        <div key={i.l} className={`bg-black/20 p-2 rounded border ${theme.border}`}>
                            <label className={`block text-[9px] font-bold ${theme.subText} uppercase mb-0.5`}>{i.l}</label>
                            <div className="flex gap-2">
                                <input type={i.f==='xp'?'number':'text'} value={c[i.f]} onChange={(e) => handleChange(i.f, i.f==='xp'?parseInt(e.target.value):e.target.value)} className={`w-full font-semibold border-b ${theme.border} outline-none focus:${theme.accentBorder} bg-transparent py-1 text-xs truncate ${theme.text}`} />
                                {/* FIX: Tillad tomt level felt */}
                                {i.sf && (
                                    <input 
                                        type="number" 
                                        value={c[i.sf] === 0 || c[i.sf] === "" ? "" : c[i.sf]} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleChange(i.sf, val === "" ? "" : parseInt(val));
                                        }} 
                                        className={`w-8 font-bold border-b ${theme.border} outline-none text-center focus:${theme.accentBorder} bg-transparent py-1 text-xs ${theme.text}`} 
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="relative group shrink-0 mx-auto md:mx-0">
                <div className={`w-24 h-24 md:w-24 md:h-24 rounded-xl border-2 ${theme.border} bg-black/20 overflow-hidden shadow-inner relative cursor-pointer hover:${theme.accentBorder} transition-colors`}>
                    {c.imageUrl ? <img src={c.imageUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center ${theme.subText}`}><Icons.User /></div>}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] font-bold uppercase text-white">Change</span></div>
                    <input type="file" accept="image/*" onChange={onImageSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
            </div>
        </header>
    );
};

export default SheetHeader;