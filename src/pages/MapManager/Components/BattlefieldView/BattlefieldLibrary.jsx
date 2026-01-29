import React from 'react';
import { Minus, Plus } from '../MapIcons';
import FileBrowser from '../FileBrowser';

const BattlefieldLibrary = ({ 
    showLibraryDrawer, setShowLibraryDrawer, 
    tokenLibrary, folders, libraryFolderId, setLibraryFolderId, 
    onAddTokenToLibrary, onMoveItems, onDeleteItems,
    addTokenFromLibrary 
}) => {
    return (
        <div className="bg-slate-800 border-t border-slate-700 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <button onClick={() => setShowLibraryDrawer(!showLibraryDrawer)} className="w-full flex items-center justify-center gap-2 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 font-bold transition-colors">
                {showLibraryDrawer ? <Minus /> : <Plus />} {showLibraryDrawer ? 'Hide Token Library' : 'Open Token Library'}
            </button>
            {showLibraryDrawer && (
                <div className="h-48 overflow-hidden bg-slate-900 border-t border-slate-700 p-2">
                    <FileBrowser 
                        items={tokenLibrary} 
                        folders={folders} 
                        type="token" 
                        currentFolderId={libraryFolderId} 
                        setCurrentFolderId={setLibraryFolderId} 
                        allowUpload={true} 
                        onUpload={(files, type, folderId) => onAddTokenToLibrary(files[0], folderId)} 
                        onMoveItems={onMoveItems} 
                        onDeleteItems={onDeleteItems} 
                        // ÆNDRING 1: Bruger Flex-wrap i stedet for Grid for bedre kontrol over små elementer
                        gridClassName="flex flex-wrap gap-1 content-start" 
                        renderItem={(t) => (
                            // ÆNDRING 2: Fast bredde og højde (w-12 h-12 = 48px)
                            <div className="w-15 h-15 bg-slate-800 border border-slate-700 rounded p-0.5 hover:border-slate-500 transition-colors flex flex-col group relative overflow-hidden">
                                <img src={t.thumbnail || t.dataUrl} alt={t.name} className="w-full h-full object-contain" />
                                
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-[6px] text-white text-center py-0.5 truncate px-1 pointer-events-none">
                                    {t.name}
                                </div>
                                
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); addTokenFromLibrary(t); }} 
                                        className="bg-green-600 hover:bg-green-500 text-white rounded-full p-1 shadow-lg transform scale-75 group-hover:scale-100 transition-all cursor-pointer" 
                                        title="Add to Battlefield"
                                    >
                                        <Plus className="w-3 h-3"/>
                                    </button>
                                </div>
                            </div>
                        )} 
                    />
                </div>
            )}
        </div>
    );
};

export default BattlefieldLibrary;