import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import MainMenu from './components/MainMenu';
import BattlefieldView from './components/BattlefieldView';
import { resizeMapImage, getImageDimensions, readFileAsDataURL } from './components/ImageUtils';

// --- NYE IMPORTS ---
import { dbGet, dbSave, useDataManagement } from './components/DataManager';
import ImportModal from './components/ImportModal'; // <--- NY

const AlertIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </svg>
);

const MapManager = () => {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [view, setView] = useState('menu'); 
    const [maps, setMaps] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [battlefields, setBattlefields] = useState([]);
    const [folders, setFolders] = useState([]);
    const [activeBattlefieldId, setActiveBattlefieldId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('saved'); 
    const [warningModal, setWarningModal] = useState({ isOpen: false, file: null, dimensions: null, resolve: null });

    // --- DATA MANAGER HOOK (Import/Export Logic) ---
    // Vi henter nu også 'importState' ud herfra
    const { handleExport, handleImport, confirmImport, cancelImport, importState } = useDataManagement({
        maps, tokens, battlefields, folders,
        setMaps, setTokens, setBattlefields, setFolders
    });

    // --- LOAD INITIAL DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [lMaps, lTokens, lBattlefields, lFolders] = await Promise.all([
                    dbGet('vtt_maps'), dbGet('vtt_tokens'), dbGet('vtt_battlefields'), dbGet('vtt_folders')
                ]);
                if (lMaps) setMaps(lMaps);
                if (lTokens) setTokens(lTokens);
                if (lBattlefields) setBattlefields(lBattlefields);
                if (lFolders) setFolders(lFolders);
            } catch (err) { console.error("DB Load error:", err); } finally { setIsLoading(false); }
        };
        loadData();
    }, []);

    // --- AUTO SAVE ---
    useEffect(() => {
        if (isLoading) return; 
        setSaveStatus('unsaved');
        const timer = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                await Promise.all([
                    dbSave('vtt_maps', maps), dbSave('vtt_tokens', tokens),
                    dbSave('vtt_battlefields', battlefields), dbSave('vtt_folders', folders)
                ]);
                setSaveStatus('saved');
            } catch (e) { console.error("Save error:", e); setSaveStatus('error'); }
        }, 2000); 
        return () => clearTimeout(timer);
    }, [maps, tokens, battlefields, folders, isLoading]);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    // --- FOLDER & ITEM HANDLERS ---
    const handleCreateFolder = (name, type, parentId = null) => { setFolders(prev => [...prev, { id: generateId(), name, type, parentId }]); };
    
    const handleDeleteFolder = (folderId) => {
        setMaps(prev => prev.map(i => i.folderId === folderId ? { ...i, folderId: null } : i));
        setTokens(prev => prev.map(i => i.folderId === folderId ? { ...i, folderId: null } : i));
        setBattlefields(prev => prev.map(i => i.folderId === folderId ? { ...i, folderId: null } : i));
        setFolders(prev => prev.map(f => f.parentId === folderId ? { ...f, parentId: null } : f).filter(f => f.id !== folderId));
    };

    const handleMoveItems = (itemIds, type, targetFolderId) => {
        const ids = new Set(itemIds);
        const updateFn = (item) => ids.has(item.id) ? { ...item, folderId: targetFolderId } : item;
        if (type === 'map') setMaps(prev => prev.map(updateFn));
        else if (type === 'token') setTokens(prev => prev.map(updateFn));
        else if (type === 'battlefield') setBattlefields(prev => prev.map(updateFn));
    };

    const handleDeleteItems = (type, ids) => {
        const idSet = new Set(ids);
        if (type === 'map') setMaps(prev => prev.filter(m => !idSet.has(m.id)));
        if (type === 'token') setTokens(prev => prev.filter(t => !idSet.has(t.id)));
        if (type === 'battlefield') setBattlefields(prev => prev.filter(b => !idSet.has(b.id)));
    };
    const handleDeleteAsset = (type, id) => handleDeleteItems(type, [id]);

    // --- BATTLEFIELD HANDLERS ---
    const handleCreateBattlefield = (name, mapId, folderId = null) => {
        const mapAsset = maps.find(m => m.id === mapId);
        if (!mapAsset) return;
        const newBattlefield = {
            id: generateId(), name: name || 'Untitled Battle', mapId: mapId, folderId: folderId,
            mapData: mapAsset.dataUrl, mapThumbnail: mapAsset.thumbnail || mapAsset.dataUrl,
            tokens: [], spellTemplates: [],
            layers: [{ id: 'main', name: 'Main Layer', mapId: mapId, mapData: mapAsset.dataUrl }],
            activeLayerId: 'main', fogLayers: {},
            gridSettings: { show: false, size: 50, offset: {x:0, y:0}, type: 'solid', snap: false, color: 'white' },
            pan: { x: 0, y: 0 }, zoom: 1
        };
        setBattlefields(prev => [...prev, newBattlefield]);
        setActiveBattlefieldId(newBattlefield.id);
        setView('battlefield');
    };

    const handleUpdateBattlefield = (id, data) => { setBattlefields(prev => prev.map(b => b.id === id ? { ...b, ...data } : b)); };
    const handleDeleteBattlefield = (id) => { setBattlefields(prev => prev.filter(b => b.id !== id)); };

    // --- IMAGE PROCESSING (KEEPING LOCAL FOR UI MODALS) ---
    const requestUserChoice = (file, width, height) => {
        return new Promise((resolve) => {
            setWarningModal({ isOpen: true, file, dimensions: { width, height }, resolve });
        });
    };
    const handleModalDecision = (shouldDownscale) => {
        if (warningModal.resolve) warningModal.resolve(shouldDownscale);
        setWarningModal(prev => ({ ...prev, isOpen: false }));
    };

    const processMapUpload = async (file) => {
        try {
            const { width, height } = await getImageDimensions(file);
            const isTooLarge = width > 3840 || height > 2160;
            let finalDataUrl;
            if (isTooLarge) {
                const userWantsDownscale = await requestUserChoice(file, width, height);
                finalDataUrl = userWantsDownscale ? await resizeMapImage(file, 3840, 2160) : await readFileAsDataURL(file);
            } else {
                finalDataUrl = await resizeMapImage(file, 3840, 2160);
            }
            return finalDataUrl;
        } catch (err) { console.error(err); return null; }
    };

    const createThumbnail = (dataUrl, maxWidth = 300) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, maxWidth / img.width);
                if (scale >= 1) { resolve(dataUrl); return; }
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
            img.onerror = () => resolve(dataUrl); 
            img.src = dataUrl;
        });
    };

    const handleAddMap = async (file, folderId = null) => {
        try {
            const finalDataUrl = await processMapUpload(file);
            if (!finalDataUrl) { alert("Error processing map."); return; }
            const thumbnail = await createThumbnail(finalDataUrl, 300);
            setMaps(prev => [...prev, { id: generateId(), name: file.name.replace(/\.[^/.]+$/, ""), dataUrl: finalDataUrl, thumbnail, folderId }]);
        } catch (err) { console.error(err); }
    };

    const handleAddToken = (file, folderId = null) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            const thumbnail = await createThumbnail(dataUrl, 100); 
            setTokens(prev => [...prev, { id: generateId(), name: file.name, dataUrl, thumbnail, folderId }]);
        };
        reader.readAsDataURL(file);
    };

    const handleBulkAdd = async (files, type, folderId = null) => {
        const fileArray = Array.from(files);
        if (type === 'map') {
            const newMaps = [];
            for (const file of fileArray) {
                try {
                    const finalDataUrl = await processMapUpload(file);
                    if (finalDataUrl) {
                        const thumbnail = await createThumbnail(finalDataUrl, 300);
                        newMaps.push({ id: generateId(), name: file.name.replace(/\.[^/.]+$/, ""), dataUrl: finalDataUrl, thumbnail, folderId });
                    }
                } catch (e) { console.error(e); }
            }
            if (newMaps.length > 0) setMaps(prev => [...prev, ...newMaps]);
        } else if (type === 'token') {
            const newTokens = [];
            await Promise.all(fileArray.map(async (file) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const dataUrl = e.target.result;
                        const thumbnail = await createThumbnail(dataUrl, 100);
                        newTokens.push({ id: generateId(), name: file.name, dataUrl, thumbnail, folderId });
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
            }));
            if (newTokens.length > 0) setTokens(prev => [...prev, ...newTokens]);
        }
    };

    if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-purple-400 font-bold">Loading Library...</div>;

    return (
        <>
            {/* --- IMPORT MODAL --- */}
            <ImportModal 
                isOpen={importState.isOpen} 
                step={importState.step}
                stats={importState.stats}
                progress={importState.progress} 
                message={importState.message}
                onConfirm={confirmImport} // Kører merge logikken
                onCancel={cancelImport}   // Lukker modalen
            />

            {/* Warning Modal */}
            {warningModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                            <AlertIcon className="w-6 h-6 text-yellow-500" />
                            <h3 className="text-lg font-bold text-slate-100">High Resolution Detected</h3>
                        </div>
                        <p className="text-slate-300 text-sm">File <span className="text-cyan-400 font-mono">{warningModal.file?.name}</span> is larger than 4K.</p>
                        <div className="flex flex-col gap-3 pt-2">
                            <button onClick={() => handleModalDecision(true)} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg">Downscale to 4K</button>
                            <button onClick={() => handleModalDecision(false)} className="w-full py-2 text-slate-400 hover:text-white text-sm">Keep Original Size</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Status Indicator */}
            <div className={`fixed z-50 text-[10px] font-mono font-bold px-2 py-0.5 rounded border pointer-events-none flex items-center gap-2 transition-all ${view === 'menu' ? 'bottom-4 right-4 text-xs px-3 py-1 bg-slate-800 border-slate-600 text-slate-400' : 'top-16 right-4 bg-slate-900/50 border-slate-700/50 text-slate-500'}`}>
                <span>{view === 'menu' ? '💾 Local DB' : '💾'}</span>
                {saveStatus === 'saved' && <span className="text-green-500/50">Saved</span>}
                {saveStatus === 'saving' && <span className="text-yellow-500 animate-pulse">Saving...</span>}
                {saveStatus === 'error' && <span className="text-red-500">Error!</span>}
            </div>

            {view === 'menu' ? (
                <div>
                    <div className="absolute top-4 left-4 z-50">
                        <button onClick={() => navigate('/')} className="p-2 bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full border border-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></button>
                    </div>
                    <MainMenu 
                        maps={maps} tokens={tokens} battlefields={battlefields} folders={folders}
                        onAddMap={handleAddMap} onAddToken={handleAddToken} onBulkAdd={handleBulkAdd}
                        onDeleteAsset={handleDeleteAsset} onCreateBattlefield={handleCreateBattlefield}
                        onOpenBattlefield={(id) => { setActiveBattlefieldId(id); setView('battlefield'); }}
                        onDeleteBattlefield={handleDeleteBattlefield} 
                        // BRUGER NU HOOK FUNKTIONERNE:
                        onExportAllData={() => handleExport('all')} 
                        onImport={handleImport} 
                        onImportBattlefield={handleImport}
                        onExportBattlefield={(id) => handleExport('battlefield', id)}
                        onUpload={handleBulkAdd} onCreateFolder={handleCreateFolder} onDeleteFolder={handleDeleteFolder}
                        onMoveItems={handleMoveItems} onDeleteItems={handleDeleteItems}
                    />
                </div>
            ) : (
                (() => {
                    const session = battlefields.find(b => b.id === activeBattlefieldId);
                    if (!session) return <div>Error: Session not found</div>;
                    return (
                        <BattlefieldView 
                            key={session.id} session={session} maps={maps} tokenLibrary={tokens} folders={folders}
                            onSave={(data) => handleUpdateBattlefield(session.id, data)}
                            onExit={() => setView('menu')}
                            onAddTokenToLibrary={handleAddToken}
                            onMoveItems={handleMoveItems} onDeleteItems={handleDeleteItems} 
                        />
                    );
                })()
            )}
        </>
    );
};

export default MapManager;