import React, { useState } from 'react';
import { Icons } from '../CharacterIcons'; 
import { getTabTitle } from '../CharacterHelpers'; 

const SheetBio = ({ c, onUpdate, theme }) => {
    const [activeInvTab, setActiveInvTab] = useState('weapons');
    const [activeProfTab, setActiveProfTab] = useState('armor');
    const [activeNotesTab, setActiveNotesTab] = useState('backstory');
    const [activeFeatureCat, setActiveFeatureCat] = useState('Class');

    const handleChange = (field, value) => onUpdate({ [field]: value });
    const handleNestedChange = (parent, field, value) => onUpdate({ [parent]: { ...c[parent], [field]: value } });

    const addResource = () => handleChange('resources', [...(c.resources || []), { id: Date.now(), name: "New Resource", current: 0, max: 1 }]);
    const removeResource = (id) => handleChange('resources', (c.resources || []).filter(r => r.id !== id));
    const updateResource = (id, f, v) => handleChange('resources', (c.resources || []).map(r => r.id === id ? { ...r, [f]: v } : r));

    const addFeature = () => handleChange('features', [...(c.features || []), { id: Date.now(), name: "New Feature", description: "", category: activeFeatureCat }]);
    const removeFeature = (id) => handleChange('features', (c.features || []).filter(f => f.id !== id));
    const updateFeature = (id, f, v) => handleChange('features', (c.features || []).map(feat => feat.id === id ? { ...feat, [f]: v } : feat) );

    return (
        <div className="space-y-6">
            {/* RESOURCES */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden border-t-2 ${theme.accentBorder} shadow-sm max-h-[300px] flex flex-col`}>
                <div className={`bg-black/10 p-3 border-b ${theme.border} flex justify-between items-center text-[10px] font-bold uppercase ${theme.subText} tracking-widest`}>
                    <div className="flex items-center gap-2"><Icons.Gem /> Resources</div>
                    <button onClick={addResource} className={`p-1.5 ${theme.accentText} hover:bg-white/10 rounded-full transition-all`}><Icons.Plus /></button>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                    {(c.resources || []).map(r => (
                        <div key={r.id} className={`flex items-center gap-2 bg-black/10 p-2 rounded border ${theme.border} group shadow-sm transition-colors hover:border-zinc-500`}>
                            <input spellCheck="false" className={`flex-1 text-xs bg-transparent outline-none font-bold ${theme.text}`} value={r.name} onChange={(e) => updateResource(r.id, 'name', e.target.value)} />
                            <div className="flex items-center gap-1.5"><input type="number" value={r.current} onChange={(e) => updateResource(r.id, 'current', parseInt(e.target.value)||0)} className={`w-10 bg-black/20 border ${theme.border} rounded text-center text-xs p-1 font-bold ${theme.accentText} shadow-inner outline-none`} /><span className={`${theme.subText} font-bold`}>/</span><input type="number" value={r.max} onChange={(e) => updateResource(r.id, 'max', parseInt(e.target.value)||0)} className={`w-10 bg-black/20 border ${theme.border} rounded text-center text-xs p-1 font-bold ${theme.subText} shadow-inner outline-none`} /></div>
                            <button onClick={() => removeResource(r.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all"><Icons.Trash /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* FEATURES */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['Class','Species','Feats'].map(cat => (
                        <button key={cat} onClick={() => setActiveFeatureCat(cat)} className={`px-4 py-2 text-[8px] font-bold uppercase rounded-md m-0.5 transition-all ${activeFeatureCat === cat ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{cat}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex justify-between items-center`}><div className="flex items-center gap-2"><div className={theme.accentText}><Icons.StarIcon /></div><span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{activeFeatureCat} Features</span></div><button onClick={addFeature} className={`p-1 ${theme.accentText} hover:bg-white/10 rounded-full transition-all`}><Icons.Plus /></button></div>
                <div className={`p-3 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar flex-1 bg-black/5`}>
                    {(c.features || []).filter(f => f.category === activeFeatureCat).map(feat => (
                        <div key={feat.id} className={`p-3 border ${theme.border} rounded-lg bg-black/10 group space-y-1 shadow-sm transition-all hover:border-zinc-500`}>
                            <div className="flex justify-between items-start"><input spellCheck="false" className={`font-bold text-xs bg-transparent outline-none focus:${theme.accentText} flex-1 uppercase tracking-wide ${theme.text}`} value={feat.name} onChange={(e) => updateFeature(feat.id, 'name', e.target.value)} placeholder="Name" /><button onClick={() => removeFeature(feat.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 ml-2 transition-all"><Icons.Trash /></button></div>
                            <textarea spellCheck="false" className={`w-full text-[11px] bg-transparent outline-none ${theme.subText} h-16 resize-y custom-scrollbar focus:${theme.text}`} value={feat.description} onChange={(e) => updateFeature(feat.id, 'description', e.target.value)} placeholder="..." />
                        </div>
                    ))}
                </div>
            </div>

            {/* PROFICIENCIES */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col pb-2`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['armor','weapon','tool','languages'].map(t => (
                        <button key={t} onClick={() => setActiveProfTab(t)} className={`px-4 py-2 text-[8px] font-bold uppercase rounded-md m-0.5 transition-all ${activeProfTab === t ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{t}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex items-center gap-2`}>
                    <div className={theme.accentText}><Icons.Shield /></div>
                    <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeProfTab)}</span>
                </div>
                <textarea spellCheck="false" value={c[activeProfTab === 'languages' ? 'profLanguages' : 'prof' + activeProfTab.charAt(0).toUpperCase() + activeProfTab.slice(1)] || ""} onChange={(e) => handleChange(activeProfTab === 'languages' ? 'profLanguages' : 'prof' + activeProfTab.charAt(0).toUpperCase() + activeProfTab.slice(1), e.target.value)} className={`w-full h-32 p-3 text-xs outline-none bg-transparent ${theme.subText} custom-scrollbar resize-y font-medium focus:${theme.text} transition-colors`} placeholder={`List ${activeProfTab} proficiencies...`} />
            </div>

            {/* INVENTORY */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm flex flex-col`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['weapons', 'armorInv', 'items'].map(tab => (
                        <button key={tab} onClick={() => setActiveInvTab(tab)} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md m-0.5 transition-all ${activeInvTab === tab ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{tab.replace('Inv', '')}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex items-center gap-2`}>
                    <div className={theme.accentText}><Icons.Plus /></div>
                    <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeInvTab)}</span>
                </div>
                <textarea spellCheck="false" value={c[activeInvTab === 'weapons' ? 'weaponsInv' : activeInvTab === 'armorInv' ? 'armorInv' : 'itemsInv'] || ""} onChange={(e) => handleChange(activeInvTab === 'weapons' ? 'weaponsInv' : activeInvTab === 'armorInv' ? 'armorInv' : 'itemsInv', e.target.value)} className={`w-full h-40 p-4 text-sm outline-none bg-transparent ${theme.subText} custom-scrollbar focus:${theme.text} transition-colors resize-y`} placeholder="" />
                <div className={`p-3 bg-black/20 border-t ${theme.border} grid grid-cols-4 gap-2`}>
                    {['cp', 'sp', 'gp', 'pp'].map(coin => (
                        <div key={coin} className="flex flex-col items-center">
                            <label className={`text-[8px] font-bold uppercase ${theme.subText} mb-0.5 tracking-tighter`}>{coin}</label>
                            <input type="number" value={c.currency[coin] || 0} onChange={(e) => handleNestedChange('currency', coin, parseInt(e.target.value) || 0)} className={`w-full bg-black/30 border ${theme.border} rounded text-center text-[10px] font-bold ${theme.accentText} p-1 focus:${theme.accentBorder} outline-none shadow-inner`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* NOTES */}
            <div className={`${theme.bgPanel} border ${theme.border} rounded-xl overflow-hidden shadow-sm min-h-[300px] flex flex-col pb-4`}>
                <div className={`bg-black/10 p-1 border-b ${theme.border} flex overflow-x-auto no-scrollbar`}>
                    {['backstory','ideals','bonds','flaws','appearance'].map(tab => (
                        <button key={tab} onClick={() => setActiveNotesTab(tab)} className={`px-4 py-2 text-[9px] font-bold uppercase rounded-md m-0.5 whitespace-nowrap transition-all ${activeNotesTab === tab ? `${theme.accentBg} text-white shadow-sm` : `${theme.subText} hover:${theme.text}`}`}>{tab}</button>
                    ))}
                </div>
                <div className={`px-4 py-2 bg-black/5 border-b ${theme.border} flex items-center gap-2`}>
                    <div className={theme.accentText}><Icons.Book /></div>
                    <span className={`text-[10px] font-bold uppercase ${theme.accentText} tracking-widest`}>{getTabTitle(activeNotesTab)}</span>
                </div>
                <textarea spellCheck="false" value={c[activeNotesTab] || ""} onChange={(e) => handleChange(activeNotesTab, e.target.value)} className={`w-full h-64 p-4 text-sm outline-none bg-transparent ${theme.subText} custom-scrollbar focus:${theme.text} transition-colors resize-y`} />
            </div>
        </div>
    );
};
export default SheetBio;