import React, { useState, useEffect } from 'react';
import { useBattlefieldLogic } from './useBattlefieldLogic';
import BattlefieldTopBar from './BattlefieldTopBar';
import BattlefieldBoard from './BattlefieldBoard';
import BattlefieldLibrary from './BattlefieldLibrary';
import { Trash2, Circle, Square, Minus, Cone, X } from '../MapIcons'; // Hent Cone

const BattlefieldView = ({ session, maps, tokenLibrary, folders, onSave, onExit, onAddTokenToLibrary, onMoveItems, onDeleteItems }) => {
    const logic = useBattlefieldLogic(session, maps, tokenLibrary, onSave, onAddTokenToLibrary);
    
    const [showLibraryDrawer, setShowLibraryDrawer] = useState(false);
    const [libraryFolderId, setLibraryFolderId] = useState(null);
    const [showInfo, setShowInfo] = useState(false);

    const [templateBuilderMode, setTemplateBuilderMode] = useState(null); 

    useEffect(() => {
        const board = logic.boardRef.current;
        if (board) board.addEventListener('wheel', logic.handleWheel, { passive: false });
        
        const handleMouseMoveGlobal = (e) => { logic.mousePosRef.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('mousemove', handleMouseMoveGlobal);
        
        return () => {
            if (board) board.removeEventListener('wheel', logic.handleWheel);
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
        };
    }, []); 

    useEffect(() => {
        const hk = (e) => {
            if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
            if (e.key === 'Escape') {
                if (templateBuilderMode) setTemplateBuilderMode(null);
                else if (logic.isCreatingFog && logic.fogTool === 'poly') logic.setCurrentPolyPoints([]);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); logic.undo(); }
            if (e.key === 'Delete' || e.key === 'Backspace') logic.deleteSelected(e);
        };
        window.addEventListener('keydown', hk);
        return () => window.removeEventListener('keydown', hk);
    }, [logic.selectedTokenIds, logic.selectedTemplateIds, logic.selectedFogIds, logic.isCreatingFog, logic.fogTool, templateBuilderMode]);

    const confirmTemplate = () => {
        const selectedId = Array.from(logic.selectedTokenIds)[0];
        // Sikr at radius er et tal før vi sender det videre
        const radius = parseInt(logic.spellParams.radius) || 0;
        
        logic.addSpellTemplate({
            type: templateBuilderMode,
            size: radius,
            color: logic.spellParams.color,
            originTokenId: selectedId,
            range: 60 
        });
        setTemplateBuilderMode(null); 
    };

    // Helper til input change: Tillader tom streng
    const handleRadiusChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            logic.setSpellParams(p => ({...p, radius: ''})); // Sæt til tom streng i state
        } else {
            const num = parseInt(val);
            if (!isNaN(num)) {
                logic.setSpellParams(p => ({...p, radius: num}));
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
            
            <BattlefieldTopBar 
                sessionName={session.name}
                onExit={onExit} onSave={() => {onSave({tokens: logic.tokens});}} 
                undo={logic.undo} historyLength={logic.history.length}
                layers={logic.layers} activeLayer={logic.activeLayer} setActiveLayerId={logic.setActiveLayerId} setLayers={logic.setLayers}
                gridSettings={logic.gridSettings} setGridSettings={logic.setGridSettings} 
                isMovingGridMode={logic.isMovingGridMode} setIsMovingGridMode={logic.setIsMovingGridMode}
                fogEnabled={logic.fogEnabled} setFogEnabled={logic.setFogEnabled}
                isCreatingFog={logic.isCreatingFog} setIsCreatingFog={logic.setIsCreatingFog}
                fogTool={logic.fogTool} setFogTool={logic.setFogTool}
                setCurrentPolyPoints={logic.setCurrentPolyPoints}
                setShowInfo={setShowInfo} showInfo={showInfo}
                maps={maps} folders={folders}
            />

            <BattlefieldBoard logic={logic} />

            <BattlefieldLibrary 
                showLibraryDrawer={showLibraryDrawer} setShowLibraryDrawer={setShowLibraryDrawer}
                tokenLibrary={tokenLibrary} folders={folders}
                libraryFolderId={libraryFolderId} setLibraryFolderId={setLibraryFolderId}
                onAddTokenToLibrary={onAddTokenToLibrary} onMoveItems={onMoveItems} onDeleteItems={onDeleteItems}
                addTokenFromLibrary={logic.addTokenFromLibrary}
            />

            {(logic.selectedTokenIds.size > 0 || logic.selectedTemplateIds.size > 0 || logic.selectedFogIds.size > 0) && !logic.isMovingGridMode && !showLibraryDrawer && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 p-2 pr-4 rounded-full border border-slate-600 shadow-xl flex items-center gap-3 z-40 animate-in slide-in-from-bottom-5" onMouseDown={(e) => e.stopPropagation()}>
                    
                    {!templateBuilderMode && (
                        <>
                            <div className="bg-slate-900/50 rounded-full px-3 py-1.5 border border-slate-700">
                                <span className="text-slate-300 text-xs font-bold">{logic.selectedTokenIds.size + logic.selectedTemplateIds.size + logic.selectedFogIds.size} Selected</span>
                            </div>
                            
                            <button onClick={logic.deleteSelected} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors" title="Delete Selected">
                                <Trash2 size={18} />
                            </button>

                            {logic.selectedTokenIds.size === 1 && (
                                <>
                                    <div className="h-6 w-px bg-slate-600 mx-1"></div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setTemplateBuilderMode('circle')} className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors" title="Sphere / Circle"><Circle size={18} /></button>
                                        <button onClick={() => setTemplateBuilderMode('cone')} className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors" title="Cone"><Cone size={18} /></button>
                                        <button onClick={() => setTemplateBuilderMode('line')} className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors" title="Line"><Minus size={18} /></button>
                                        <button onClick={() => setTemplateBuilderMode('square')} className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors" title="Cube / Square"><Square size={18} /></button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {templateBuilderMode && (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <button onClick={() => setTemplateBuilderMode(null)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-full"><X size={16} /></button>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{templateBuilderMode}</span>
                            
                            <div className="flex items-center gap-2 bg-slate-900 rounded px-2 py-1 border border-slate-700">
                                <span className="text-[10px] text-slate-500 font-bold">FT.</span>
                                <input 
                                    type="number" 
                                    className="w-12 bg-transparent text-center text-sm font-bold focus:outline-none" 
                                    value={logic.spellParams.radius} 
                                    onChange={handleRadiusChange} 
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-1">
                                {['rgba(239, 68, 68, 0.4)', 'rgba(59, 130, 246, 0.4)', 'rgba(34, 197, 94, 0.4)', 'rgba(234, 179, 8, 0.4)', 'rgba(168, 85, 247, 0.4)'].map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => logic.setSpellParams(p => ({...p, color: c}))} 
                                        className={`w-5 h-5 rounded-full border border-slate-600 transition-transform hover:scale-110 ${logic.spellParams.color === c ? 'ring-2 ring-white scale-110' : ''}`} 
                                        style={{ backgroundColor: c }} 
                                    />
                                ))}
                            </div>

                            <div className="h-6 w-px bg-slate-600 mx-1"></div>
                            
                            <button onClick={confirmTemplate} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                Place
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showInfo && (
                <div className="absolute top-16 right-4 bg-slate-800/95 backdrop-blur text-slate-300 p-4 rounded-lg shadow-xl border border-slate-700 w-64 text-sm z-50">
                    <h3 className="font-bold text-white mb-2">Controls</h3>
                    <ul className="text-xs space-y-2 opacity-90">
                        <li><strong>Drag 'n' Drop:</strong> Tokens from library.</li>
                        <li><strong>Selection:</strong> Click to select. Shift+Click for multiple.</li>
                        <li><strong>Pan:</strong> Drag background.</li>
                        <li><strong>Zoom:</strong> Scroll Wheel.</li>
                        <li><strong>Fog:</strong> 'Square' for boxes, 'Polygon' for custom shapes.</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BattlefieldView;