import React, { useState } from 'react';
import { LogOut, MapIcon, ChevronRight, Trash2, Undo2, Grid3x3, Settings2, Minus, Plus, Move3d, Eye, EyeOff, Info, ArrowUp, ArrowDown, Folder, FolderOpen, Pencil, Square } from '../MapIcons';

const BattlefieldTopBar = ({ 
    sessionName, onExit, onSave, undo, historyLength,
    layers, activeLayer, setActiveLayerId, setLayers,
    gridSettings, setGridSettings, isMovingGridMode, setIsMovingGridMode,
    fogEnabled, setFogEnabled, isCreatingFog, setIsCreatingFog, fogTool, setFogTool, setCurrentPolyPoints,
    setShowInfo, showInfo,
    maps, folders
}) => {
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [showGridMenu, setShowGridMenu] = useState(false);
    const [expandedLayerFolders, setExpandedLayerFolders] = useState([]);
    const [editingLayerId, setEditingLayerId] = useState(null);
    const [editLayerName, setEditLayerName] = useState("");

    // --- LAYER HANDLERS ---
    const generateId = () => Math.random().toString(36).substr(2, 9);
    const handleAddLayer = (mapItem) => {
        const newId = generateId();
        const newLayer = { id: newId, name: mapItem.name, mapId: mapItem.id, mapData: mapItem.dataUrl };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayerId(newId);
    };
    const handleDeleteLayer = (id) => {
        if (layers.length <= 1) return;
        if (confirm("Delete layer?")) {
            setLayers(prev => prev.filter(l => l.id !== id));
            if (activeLayer.id === id) setActiveLayerId(layers[0].id); 
        }
    };
    const moveLayer = (index, direction) => {
        const newLayers = [...layers];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newLayers.length) return;
        [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
        setLayers(newLayers);
    };
    const handleRenameLayer = () => {
        if (editLayerName.trim()) setLayers(prev => prev.map(l => l.id === editingLayerId ? { ...l, name: editLayerName.trim() } : l));
        setEditingLayerId(null); setEditLayerName("");
    };
    const renderLayerOptions = (parentId, depth = 0) => {
        const currentFolders = folders.filter(f => f.parentId === parentId && f.type === 'map');
        const currentMaps = maps.filter(m => m.folderId === parentId);
        return (
            <div style={{ paddingLeft: depth > 0 ? '8px' : '0' }}>
                {currentFolders.map(folder => {
                    const isOpen = expandedLayerFolders.includes(folder.id);
                    return (
                        <div key={folder.id}>
                            <button onClick={(e) => {e.stopPropagation(); setExpandedLayerFolders(p => p.includes(folder.id)?p.filter(i=>i!==folder.id):[...p, folder.id])}} className="w-full flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-1">
                                {isOpen ? <FolderOpen size={12} className="text-amber-500"/> : <Folder size={12} className="text-amber-500"/>}
                                <span className="truncate">{folder.name}</span>
                            </button>
                            {isOpen && <div className="border-l border-slate-700 ml-1.5 pl-1">{renderLayerOptions(folder.id, depth + 1)}</div>}
                        </div>
                    );
                })}
                {currentMaps.map(m => (
                    <button key={m.id} onClick={() => handleAddLayer(m)} className="w-full flex items-center gap-2 text-xs text-left p-1.5 hover:bg-slate-700 rounded truncate group">
                        <div className="w-4 h-4 rounded overflow-hidden bg-slate-900 shrink-0 border border-slate-600"><img src={m.thumbnail || m.dataUrl} className="w-full h-full object-cover"/></div>
                        <span className="truncate text-slate-300 group-hover:text-white">{m.name}</span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-slate-800 p-3 shadow-md flex items-center justify-between z-20 border-b border-slate-700">
            <div className="flex items-center gap-4">
                <button onClick={() => { onSave(); onExit(); }} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <LogOut /> <span className="text-sm font-bold">Exit</span>
                </button>
                <div className="h-6 w-px bg-slate-700"></div>
                <h1 className="text-lg font-bold text-slate-200 truncate max-w-[200px]">{sessionName}</h1>
                
                {/* --- LAYER MENU --- */}
                <div className="relative">
                    <button onClick={() => setShowLayerMenu(!showLayerMenu)} className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-600 rounded hover:border-slate-400 transition-colors">
                        <MapIcon className="w-4 h-4 text-blue-400"/>
                        <span className="text-xs font-bold text-slate-200">{activeLayer.name}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${showLayerMenu ? 'rotate-90' : ''}`}/>
                    </button>
                    {showLayerMenu && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded shadow-xl z-50 p-2 max-h-[80vh] flex flex-col">
                            <div className="text-[10px] uppercase font-bold text-slate-500 px-2 pb-1 border-b border-slate-700 mb-2">Layers</div>
                            <div className="space-y-1 overflow-y-auto shrink-0 max-h-48">
                                {layers.map((l, index) => (
                                    <div key={l.id} className={`flex items-center justify-between p-2 rounded group ${activeLayer.id === l.id ? 'bg-blue-900/40 border border-blue-500/50' : 'hover:bg-slate-700 border border-transparent'}`}>
                                        <div className="flex-1 cursor-pointer flex items-center gap-2" onClick={() => setActiveLayerId(l.id)}>
                                            {editingLayerId === l.id ? (
                                                <input autoFocus type="text" value={editLayerName} onChange={(e) => setEditLayerName(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleRenameLayer(); }} onBlur={handleRenameLayer} onClick={(e) => e.stopPropagation()} className="w-full bg-slate-900 text-white text-xs px-1 rounded border border-blue-500 outline-none" />
                                            ) : ( <span className="text-xs font-bold truncate">{l.name}</span> )}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {editingLayerId !== l.id && <button onClick={(e) => {e.stopPropagation(); setEditingLayerId(l.id); setEditLayerName(l.name);}} className="text-slate-500 hover:text-white p-1"><Pencil size={10}/></button>}
                                            <div className="flex flex-col">
                                                <button onClick={(e) => { e.stopPropagation(); moveLayer(index, -1); }} disabled={index === 0} className="text-slate-500 hover:text-white disabled:opacity-30"><ArrowUp size={10}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); moveLayer(index, 1); }} disabled={index === layers.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30"><ArrowDown size={10}/></button>
                                            </div>
                                            {layers.length > 1 && activeLayer.id !== l.id && <button onClick={(e) => { e.stopPropagation(); handleDeleteLayer(l.id); }} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-700 flex-1 min-h-0 flex flex-col">
                                <div className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-1">Add New Layer</div>
                                <div className="overflow-y-auto min-h-[150px] pr-1">{renderLayerOptions(null)}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={undo} disabled={historyLength === 0} className={`p-2 rounded ${historyLength > 0 ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600'}`} title="Undo"><Undo2 /></button>
                
                {/* GRID MENU */}
                <div className="relative">
                    <button onClick={() => {setShowGridMenu(!showGridMenu);}} className={`p-2 rounded border ${showGridMenu || gridSettings.show ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200' : 'bg-slate-700 border-slate-600'}`} title="Grid"><Grid3x3 /></button>
                    {showGridMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-slate-800 border border-slate-600 rounded p-4 w-64 z-50 shadow-xl">
                        <h3 className="font-bold text-sm mb-3 text-slate-300 flex items-center gap-2"><Settings2 /> Grid Configuration</h3>
                        <div className="space-y-3">
                            <label className="flex justify-between items-center text-sm"><span>Show Grid</span> <input type="checkbox" checked={gridSettings.show} onChange={e => setGridSettings(p => ({...p, show: e.target.checked}))} /></label>
                            <label className="flex justify-between items-center text-sm"><span>Snap to Grid</span> <input type="checkbox" checked={gridSettings.snap} onChange={e => setGridSettings(p => ({...p, snap: e.target.checked}))} /></label>
                            <div className="pt-2 border-t border-slate-700"><div className="flex justify-between items-center mb-2"><span className="text-xs text-slate-400">Cell Size (px)</span><div className="flex items-center bg-slate-900 rounded border border-slate-700"><button onClick={() => setGridSettings(p => ({...p, size: Math.max(10, p.size - 1)}))} className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded-l"><Minus /></button><input type="number" value={gridSettings.size} onChange={e => setGridSettings(p => ({...p, size: parseInt(e.target.value)||50}))} className="w-10 text-center bg-transparent border-none text-xs font-mono text-slate-200" /><button onClick={() => setGridSettings(p => ({...p, size: Math.min(500, (p.size || 50) + 1)}))} className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded-r"><Plus /></button></div></div><input type="range" min="20" max="500" value={gridSettings.size || 50} onChange={e => setGridSettings(p => ({...p, size: parseInt(e.target.value)}))} className="w-full accent-purple-500 h-2 bg-slate-700 rounded-lg cursor-pointer" /></div>
                            <button onClick={() => setIsMovingGridMode(!isMovingGridMode)} className={`w-full py-1 text-xs rounded ${isMovingGridMode ? 'bg-purple-600 text-white' : 'bg-slate-700'}`}><Move3d /> {isMovingGridMode ? 'Done Moving' : 'Move Grid'}</button>
                        </div>
                    </div>
                    )}
                </div>

                {/* FOG CONTROLS */}
                <div className="relative flex items-center bg-slate-700 rounded border border-slate-600 mr-2">
                    <button onClick={() => setFogEnabled(!fogEnabled)} className={`p-2 ${fogEnabled ? 'text-purple-300' : 'text-slate-400'}`} title="Toggle Fog Visibility">
                        {fogEnabled ? <EyeOff /> : <Eye />}
                    </button>
                    {fogEnabled && (
                        <div className="flex items-center border-l border-slate-600">
                            {isCreatingFog ? (
                                <>
                                    <button onClick={() => setFogTool('rect')} className={`p-2 hover:bg-slate-600 ${fogTool === 'rect' ? 'bg-purple-600 text-white' : 'text-slate-300'}`} title="Box Tool"><Square size={14} /></button>
                                    <button onClick={() => setFogTool('poly')} className={`p-2 hover:bg-slate-600 ${fogTool === 'poly' ? 'bg-purple-600 text-white' : 'text-slate-300'}`} title="Polygon Tool"><Pencil size={14} /></button>
                                    <button onClick={() => { setIsCreatingFog(false); setCurrentPolyPoints([]); }} className="p-2 text-xs font-bold text-red-300 hover:text-white hover:bg-red-900/50 border-l border-slate-600">Done</button>
                                </>
                            ) : (
                                <button onClick={() => { setIsCreatingFog(true); setFogTool('rect'); }} className="p-2 text-xs font-bold flex items-center gap-1 text-slate-300 hover:bg-slate-600"><Plus size={14} /> Add Fog</button>
                            )}
                        </div>
                    )}
                </div>

                <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded ${showInfo ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300'}`}><Info /></button>
            </div>
        </div>
    );
};

export default BattlefieldTopBar;