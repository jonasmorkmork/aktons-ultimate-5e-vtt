import React from 'react';
import { FileIcon, Folder, FolderOpen, PlusIcon, TrashIcon, UploadIcon, BookIcon } from '../../CampaignManager/components/CampaignIcons'; 

// Import lokale ikoner hvis de ikke findes i CampaignIcons
const UploadFileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>
);
const UploadFolderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6"/><path d="M9 13l3-3 3 3"/></svg>
);

const NoteSidebar = ({ logic }) => {
    const { 
        activeNotebook, backToMenu, setInputModal, setShowSearch, 
        currentFiles, fileTree, expandedFolders, toggleFolder, activeFile, 
        selectedIds, handleSelectNode, handleSelectFile, 
        handleDragStart, handleDragOverItem: handleDragOver, handleDropOnItem, handleDropOnRoot,
        isDraggingOverRoot, setIsDraggingOverRoot, draggedItem,
        setConfirmModal, initiateCreateItem,
        fileInputRef, folderInputRef, handleImportFiles, isImporting
    } = logic;

    // Rekursiv render funktion flyttet herind
    const renderTree = (items, depth = 0) => {
        return items.map(item => {
            const isFolder = item.type === 'folder';
            const isExpanded = expandedFolders[item.id];
            const children = isFolder ? fileTree.getChildren(item.id) : [];
            const isActiveView = activeFile?.id === item.id;
            const isSelected = selectedIds.has(item.id);
            const isDropTarget = draggedItem && item.type === 'folder' && !selectedIds.has(item.id); 

            return (
                <div key={item.id} className="select-none">
                    <div 
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnItem(e, item)}
                        className={`
                            flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm group relative
                            ${isActiveView ? 'bg-amber-900/40 text-amber-200 font-bold' : ''}
                            ${isSelected && !isActiveView ? 'bg-blue-900/30 text-blue-200' : ''}
                            ${!isActiveView && !isSelected ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : ''}
                            ${isDropTarget ? 'bg-blue-900/30 border-blue-500 border-dashed border' : ''}
                        `}
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        onClick={(e) => {
                            const isMulti = e.ctrlKey || e.metaKey;
                            const isRange = e.shiftKey;
                            if (isFolder) {
                                handleSelectNode(e, item, isMulti, isRange);
                                if (!isMulti && !isRange) toggleFolder(item.id);
                            } else {
                                handleSelectNode(e, item, isMulti, isRange);
                            }
                        }}
                    >
                        <span onClick={(e) => { e.stopPropagation(); if(isFolder) toggleFolder(item.id); }} className="shrink-0">
                            {isFolder ? (isExpanded ? <FolderOpen size={14} className="text-amber-500"/> : <Folder size={14} className="text-amber-600"/>) : <FileIcon size={14} />}
                        </span>
                        <span className="truncate flex-1">{item.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                             {isFolder && (
                                <button onClick={(e) => { e.stopPropagation(); setInputModal({ isOpen: true, type: 'file', parentId: item.id }); }} className="text-slate-500 hover:text-white" title="New File"><PlusIcon size={12}/></button>
                             )}
                             <button onClick={(e) => { 
                                 e.stopPropagation(); 
                                 const count = selectedIds.has(item.id) ? selectedIds.size : 1;
                                 setConfirmModal({ 
                                     isOpen: true, noteId: item.id, 
                                     title: `Delete ${count > 1 ? count + ' Items' : item.name}?`, 
                                     message: "This cannot be undone (Ctrl+Z to undo)." 
                                }); 
                            }} className="text-slate-500 hover:text-red-500" title="Delete"><TrashIcon size={12}/></button>
                        </div>
                    </div>
                    {isFolder && isExpanded && (
                        <div 
                            className={`pl-2 border-l border-slate-800 ml-3 transition-colors ${isDropTarget ? 'bg-blue-900/10' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => handleDropOnItem(e, item)}
                        >
                            {children.length > 0 ? renderTree(children, depth + 1) : <div className="text-[10px] text-slate-600 pl-6 py-1 italic">Empty folder</div>}
                            <div className="flex flex-col gap-1 pl-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[9px] uppercase font-bold text-slate-600">Templates:</div>
                                <div className="grid grid-cols-2 gap-1">
                                    <button className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1 bg-slate-900/50 p-1 rounded" onClick={(e) => { e.stopPropagation(); initiateCreateItem('file', item.id, 'blank'); }}><PlusIcon size={10}/> Blank</button>
                                    <button className="text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-1 bg-slate-900/50 p-1 rounded" onClick={(e) => { e.stopPropagation(); initiateCreateItem('file', item.id, 'npc'); }}>NPC</button>
                                    <button className="text-[10px] text-slate-500 hover:text-blue-400 flex items-center gap-1 bg-slate-900/50 p-1 rounded" onClick={(e) => { e.stopPropagation(); initiateCreateItem('file', item.id, 'settlement'); }}>City</button>
                                    <button className="text-[10px] text-slate-500 hover:text-purple-400 flex items-center gap-1 bg-slate-900/50 p-1 rounded" onClick={(e) => { e.stopPropagation(); initiateCreateItem('file', item.id, 'region'); }}>Region</button>
                                </div>
                                <button className="text-[10px] text-blue-500/70 hover:text-blue-400 flex items-center gap-1 mt-1 border-t border-slate-800 pt-1" onClick={(e) => { e.stopPropagation(); initiateCreateItem('folder', item.id); }}><Folder size={10}/> New Folder</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div 
                className={`p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 transition-colors ${isDraggingOverRoot ? 'bg-blue-900/30 border-blue-500 border-dashed' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOverRoot(true); }}
                onDragLeave={() => setIsDraggingOverRoot(false)}
                onDrop={handleDropOnRoot}
            >
                <div className="flex items-center gap-2 font-bold text-amber-500 truncate pointer-events-none">
                    <BookIcon size={18} />
                    <span className="truncate">{activeNotebook.name}</span>
                </div>
                <button onClick={backToMenu} className="text-xs text-slate-500 hover:text-white uppercase font-bold">Close</button>
            </div>

            <div className="p-2 border-b border-slate-800 flex gap-1">
                <button onClick={() => setInputModal({ isOpen: true, type: 'file', parentId: null })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1"><PlusIcon size={12}/> File</button>
                <button onClick={() => setInputModal({ isOpen: true, type: 'folder', parentId: null })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1"><Folder size={12}/> Folder</button>
            </div>
            <div className="p-2">
                 <button onClick={() => setShowSearch(true)} className="w-full bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs py-1.5 rounded flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Quick Find (Ctrl+P)
                 </button>
            </div>

            <div 
                className={`flex-1 overflow-y-auto p-2 custom-scrollbar transition-colors ${isDraggingOverRoot ? 'bg-slate-800/30' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOverRoot(true); }}
                onDragLeave={() => setIsDraggingOverRoot(false)}
                onDrop={handleDropOnRoot}
            >
                {fileTree.root.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs mt-10">
                        <p>No notes yet.</p>
                        <p>Create a file to start.</p>
                        <div className="mt-4 p-4 border border-dashed border-slate-700 rounded-lg text-slate-500">Drop files here</div>
                    </div>
                ) : renderTree(fileTree.root)}
            </div>
            
            <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-xs text-slate-500 flex justify-between items-center">
                 <div className="flex gap-1 items-center">
                    <button onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors" title="Import Files"><UploadFileIcon /></button>
                    <button onClick={() => folderInputRef.current?.click()} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors" title="Import Folder"><UploadFolderIcon /></button>
                    {isImporting && <span className="text-[10px] text-amber-500 animate-pulse ml-1">Importing...</span>}
                    <input type="file" ref={fileInputRef} onChange={handleImportFiles} className="hidden" accept=".md,.txt" multiple />
                    <input type="file" ref={folderInputRef} onChange={handleImportFiles} className="hidden" webkitdirectory="" directory="" />
                 </div>
                 <span>{currentFiles.length} items</span>
            </div>
        </div>
    );
};

export default NoteSidebar;