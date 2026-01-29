import React, { useState, useEffect } from 'react';
import { Icon, Icons, COLOR_OPTIONS, SOUND_TYPES, getYouTubeID } from './soundboardData';

// --- SETTINGS MODAL ---
export const SettingsModal = ({ show, onClose, config, onUpdate }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon path={Icons.Settings} /> Mix Settings</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white"><Icon path={Icons.Plus} className="rotate-45 w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-2"><label className="text-sm font-bold text-zinc-400">Fade In Duration</label><span className="text-sm text-purple-400">{(config.fadeInDuration / 1000).toFixed(1)}s</span></div>
                        <input type="range" min="0" max="10000" step="100" value={config.fadeInDuration} onChange={(e) => onUpdate('fadeInDuration', parseInt(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2"><label className="text-sm font-bold text-zinc-400">Fade Out Duration</label><span className="text-sm text-red-400">{(config.fadeOutDuration / 1000).toFixed(1)}s</span></div>
                        <input type="range" min="0" max="10000" step="100" value={config.fadeOutDuration} onChange={(e) => onUpdate('fadeOutDuration', parseInt(e.target.value))} className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                        <div><label className="text-sm font-bold text-zinc-200">Crossfade</label><p className="text-xs text-zinc-500">Overlap tracks when switching.</p></div>
                        <button onClick={() => onUpdate('crossfade', !config.crossfade)} className={`w-12 h-6 rounded-full transition-colors relative ${config.crossfade ? 'bg-purple-600' : 'bg-zinc-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.crossfade ? 'left-7' : 'left-1'}`} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- RENAME MODAL ---
export const EditNameModal = ({ show, onClose, onSave, initialValue, title }) => {
    const [name, setName] = useState('');
    useEffect(() => { if (show) setName(initialValue || ''); }, [show, initialValue]);

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(name);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icon path={Icons.Edit} className="text-purple-400" /> {title}</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">New Name</label>
                        <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-bold transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- NEW FOLDER MODAL ---
export const FolderModal = ({ show, onClose, onCreate }) => {
    const [name, setName] = useState('');
    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate(name);
        setName('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icon path={Icons.Folder} className="text-purple-400" /> New Folder</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Folder Name</label>
                        <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Boss Fights" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-purple-500 outline-none transition-all" autoComplete="off" />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-bold transition-colors">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- DELETE MODAL ---
export const DeleteModal = ({ show, onClose, onDelete, category }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-red-900/50 p-6 rounded-2xl w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-900/20 rounded-full shrink-0"><Icon path={Icons.Alert} className="w-6 h-6 text-red-500" /></div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Delete Folder?</h3>
                        <p className="text-sm text-zinc-400 mt-1">Are you sure you want to delete <span className="text-white font-bold">"{category}"</span>? Any tracks inside will be moved to <span className="text-purple-400">General</span>.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white font-bold transition-colors">Cancel</button>
                    <button onClick={onDelete} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all">Delete</button>
                </div>
            </div>
        </div>
    );
};

// --- ADD TRACK MODAL ---
export const AddTrackModal = ({ show, onClose, onAdd, category }) => {
    const [activeTab, setActiveTab] = useState('youtube'); 
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [files, setFiles] = useState([]); 
    const [color, setColor] = useState(COLOR_OPTIONS[0]);
    const [soundType, setSoundType] = useState('music'); 

    if (!show) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (activeTab === 'youtube') {
            const id = getYouTubeID(url);
            if (!id) { alert("Invalid YouTube ID"); return; }
            onAdd([{ name, videoId: id, type: 'youtube', color, soundType }]);
        } else {
            if (files.length === 0) { alert("Please select files"); return; }
            const tracks = files.map(f => ({
                name: (files.length === 1 && name) ? name : f.name.replace(/\.[^/.]+$/, ""), 
                file: f, 
                type: 'file', 
                color, 
                soundType 
            }));
            onAdd(tracks);
        }
        
        setName(''); setUrl(''); setFiles([]); setSoundType('music'); onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-4">
                    <h3 className="font-bold text-white text-lg">Add Track to <span className="text-purple-400">{category}</span></h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
                </div>

                <div className="flex gap-4 mb-6">
                    <button onClick={() => setActiveTab('youtube')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'youtube' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                        YouTube
                    </button>
                    <button onClick={() => setActiveTab('file')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'file' ? 'bg-purple-900/30 text-purple-400 border border-purple-900/50' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>
                        Upload MP3
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Name</label>
                            <input 
                                autoFocus 
                                type="text" 
                                placeholder={files.length > 1 ? "Using original filenames..." : "e.g. Battle Theme"} 
                                className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-purple-500 outline-none ${files.length > 1 ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                disabled={files.length > 1}
                            />
                        </div>

                        {activeTab === 'youtube' ? (
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">YouTube URL</label>
                                <input type="text" placeholder="https://youtube.com/..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-red-500 outline-none" value={url} onChange={e => setUrl(e.target.value)} />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Audio Files</label>
                                <div className="relative group">
                                    <input 
                                        type="file" 
                                        accept="audio/*" 
                                        multiple 
                                        onChange={e => setFiles(Array.from(e.target.files))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer" 
                                    />
                                </div>
                                {files.length > 0 && (
                                    <p className="text-xs text-purple-400 mt-2 font-bold">{files.length} file(s) selected</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Track Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {SOUND_TYPES.map(type => (
                                    <button 
                                        key={type.id} 
                                        type="button" 
                                        onClick={() => setSoundType(type.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${soundType === type.id ? 'bg-zinc-800 border-white text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                                    >
                                        <div className={`mb-1 ${soundType === type.id ? 'text-purple-400' : ''}`}><Icon path={type.icon} /></div>
                                        <span className="text-xs font-bold">{type.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">Color Theme</label>
                        <div className="flex flex-wrap gap-3">
                            {COLOR_OPTIONS.map(opt => (
                                <button key={opt.id} type="button" onClick={() => setColor(opt)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${color.id === opt.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'} ${opt.active.split(' ')[0]}`} title={opt.name}>
                                    {color.id === opt.id && <Icon path={Icons.Check} className="w-5 h-5 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg transition-all hover:shadow-purple-500/25">
                        {activeTab === 'youtube' ? 'Add Track' : `Upload ${files.length > 0 ? files.length : ''} File${files.length !== 1 ? 's' : ''}`}
                    </button>
                </form>
            </div>
        </div>
    );
};