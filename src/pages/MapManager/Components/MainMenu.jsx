import React, { useState, useEffect } from 'react';
import { Upload, FileJson, Play, MapIcon, Image, Download } from './MapIcons'; 
import FileBrowser from './FileBrowser';

const MainMenu = ({ 
    maps, 
    battlefields, 
    folders, 
    tokens, 
    onOpenBattlefield, 
    onCreateBattlefield, 
    onExportBattlefield, 
    onImportBattlefield, 
    onExportAllData, 
    onUpload, 
    onCreateFolder, 
    onDeleteFolder, 
    onDeleteItems, 
    onMoveItems 
}) => {
    const [activeTab, setActiveTab] = useState('battlefields');
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [selectedMapId, setSelectedMapId] = useState('');

    useEffect(() => {
        setCurrentFolderId(null);
    }, [activeTab]);

    const getMapGroups = () => {
        const groups = {};
        const folderMap = new Map(folders.map(f => [f.id, f]));
        const processedIds = new Set(); 

        maps.forEach(m => {
            if (processedIds.has(m.id)) return;
            processedIds.add(m.id);

            let groupName = 'Root';
            if (m.folderId && folderMap.has(m.folderId)) {
                let path = [];
                let curr = folderMap.get(m.folderId);
                let depth = 0;
                while (curr && depth < 10) {
                    path.unshift(curr.name);
                    curr = folderMap.get(curr.parentId);
                    depth++;
                }
                if (path.length > 0) groupName = path.join(' / ');
            }

            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(m);
        });
        return groups;
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (newSessionName && selectedMapId) {
            onCreateBattlefield(newSessionName, selectedMapId);
            setCreateModalOpen(false);
            setNewSessionName('');
            setSelectedMapId('');
        }
    };

    const mapGroups = getMapGroups();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
                    <MapIcon size={32} className="text-cyan-500" />
                    Map Manager
                </h1>
                
                <div className="flex gap-2">
                    <button 
                        onClick={onExportAllData} 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
                        title="Backup all data"
                    >
                        <Download size={16}/> Backup
                    </button>

                    <button 
                        onClick={() => document.getElementById('import-battlefield').click()} 
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
                    >
                        <Upload size={16}/> Import
                    </button>
                    <input type="file" id="import-battlefield" className="hidden" accept=".json,.zip" onChange={onImportBattlefield} />
                    
                    <button 
                        onClick={() => setCreateModalOpen(true)} 
                        className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-lg transition-all hover:scale-105"
                    >
                        <Play size={16} fill="currentColor"/> New Battlefield
                    </button>
                </div>
            </header>

            <div className="flex gap-6 border-b border-slate-700 mb-6">
                <button onClick={() => setActiveTab('battlefields')} className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'battlefields' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Battlefields</button>
                <button onClick={() => setActiveTab('maps')} className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'maps' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Maps Library</button>
                <button onClick={() => setActiveTab('tokens')} className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'tokens' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Token Library</button>
            </div>

            {createModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-slate-100 mb-4">Start New Battlefield</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Battlefield Name</label>
                                <input autoFocus type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="e.g. Goblin Ambush" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Map</label>
                                <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500" value={selectedMapId} onChange={e => setSelectedMapId(e.target.value)} required>
                                    <option value="">-- Choose a map --</option>
                                    {Object.keys(mapGroups).sort().map(group => (
                                        <optgroup key={group} label={group}>
                                            {mapGroups[group].map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setCreateModalOpen(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow-lg">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="min-h-[400px]">
                {activeTab === 'battlefields' && (
                    <FileBrowser
                        items={battlefields}
                        folders={folders}
                        type="battlefield"
                        currentFolderId={currentFolderId}
                        setCurrentFolderId={setCurrentFolderId}
                        onCreateFolder={onCreateFolder}
                        onDeleteFolder={onDeleteFolder}
                        onDeleteItems={onDeleteItems}
                        onMoveItems={onMoveItems}
                        allowUpload={false} 
                        renderItem={(b) => (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors h-full flex flex-col group relative w-full">
                                <div className="w-full aspect-video bg-slate-950 rounded overflow-hidden mb-2 border border-slate-600 relative">
                                    <img src={b.mapThumbnail || b.mapData} alt="thumb" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <button onClick={(e) => { e.stopPropagation(); onOpenBattlefield(b.id); }} className="bg-green-600 hover:bg-green-500 text-white rounded-full p-3 shadow-xl transform scale-75 group-hover:scale-100 transition-all cursor-pointer">
                                            <Play className="w-6 h-6" fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-sm text-slate-200 mb-1 leading-tight line-clamp-2 h-10 overflow-hidden text-ellipsis" title={b.name}>
                                    {b.name}
                                </h4>
                                <div className="flex justify-between items-center mt-auto">
                                    <p className="text-[10px] text-slate-500">{b.tokens.length} Tokens</p>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); onOpenBattlefield(b.id); }} className="text-green-500 hover:text-green-400 font-bold text-xs uppercase tracking-wider">Open</button>
                                        <button onClick={(e) => { e.stopPropagation(); onExportBattlefield(b.id); }} className="text-slate-500 hover:text-blue-400"><FileJson className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'maps' && (
                    <FileBrowser
                        items={maps}
                        folders={folders}
                        type="map"
                        currentFolderId={currentFolderId}
                        setCurrentFolderId={setCurrentFolderId}
                        allowUpload={true}
                        onUpload={onUpload}
                        onCreateFolder={onCreateFolder}
                        onDeleteFolder={onDeleteFolder}
                        onDeleteItems={onDeleteItems}
                        onMoveItems={onMoveItems}
                        renderItem={(m) => (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 hover:border-slate-500 transition-colors h-full flex flex-col group w-full">
                                {/* FIXED SIZE CONTAINER FOR MAPS */}
                                <div className="w-full aspect-[4/3] bg-slate-950 rounded overflow-hidden mb-2 relative">
                                    <img src={m.thumbnail || m.dataUrl} alt={m.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Image className="text-slate-300 w-8 h-8"/>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-300 truncate w-full text-center px-1">{m.name}</div>
                            </div>
                        )}
                    />
                )}

                {activeTab === 'tokens' && (
                    <FileBrowser
                        items={tokens}
                        folders={folders}
                        type="token"
                        currentFolderId={currentFolderId}
                        setCurrentFolderId={setCurrentFolderId}
                        allowUpload={true}
                        onUpload={onUpload}
                        onCreateFolder={onCreateFolder}
                        onDeleteFolder={onDeleteFolder}
                        onDeleteItems={onDeleteItems}
                        onMoveItems={onMoveItems}
                        renderItem={(t) => (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 hover:border-slate-500 transition-colors h-full flex flex-col group aspect-square">
                                <div className="flex-1 bg-slate-950 rounded overflow-hidden mb-2 relative flex items-center justify-center p-2">
                                    <img src={t.thumbnail || t.dataUrl} alt={t.name} className="w-full h-full object-contain drop-shadow-md" />
                                </div>
                                <div className="text-xs text-slate-300 truncate w-full text-center px-1">{t.name}</div>
                            </div>
                        )}
                    />
                )}
            </div>
        </div>
    );
};

export default MainMenu;