import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Move, Trash2, Folder, FolderPlus, ChevronRight, Home, CornerUpLeft } from './MapIcons';

const FileBrowser = ({ items, folders, type, currentFolderId, setCurrentFolderId, onCreateFolder, onDeleteItems, onDeleteFolder, onMoveItems, onItemClick, onUpload, renderItem, allowUpload = true, gridClassName }) => {
    const [newFolderName, setNewFolderName] = useState("");
    const [showFolderInput, setShowFolderInput] = useState(false);
    
    // Drag & Drop State
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [dragTargetFolderId, setDragTargetFolderId] = useState(null); 
    
    // Selection State
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [lastClickedId, setLastClickedId] = useState(null);

    // Selection Box State
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null); 
    const containerRef = useRef(null);

    useEffect(() => { setSelectedIds(new Set()); setLastClickedId(null); }, [currentFolderId, type]);

    const currentItems = items.filter(i => i.folderId === currentFolderId);
    const currentFolders = folders.filter(f => f.type === type && f.parentId === currentFolderId);

    const getFolderPath = (folderId) => {
        if (!folderId) return [{ id: null, name: 'Root' }];
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return [{ id: null, name: 'Root' }];
        return [...getFolderPath(folder.parentId), folder];
    };
    
    const breadcrumbs = getFolderPath(currentFolderId);

    // --- SELECTION BOX LOGIC ---
    const handleMouseDown = (e) => {
        // Ignorer klik på knapper, inputs eller hvis det ikke er venstreklik
        if (e.target.closest('button') || e.target.closest('input') || e.button !== 0) return;
        // Ignorer hvis vi klikker direkte på et item (dette håndteres nu af itemets egen onMouseDown)
        if (e.target.closest('[data-item-id]')) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + containerRef.current.scrollLeft;
        const y = e.clientY - rect.top + containerRef.current.scrollTop;
        
        setIsSelecting(true);
        setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
        
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            setSelectedIds(new Set());
        }
    };

    const handleMouseMove = (e) => {
        if (!isSelecting) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + containerRef.current.scrollLeft;
        const y = e.clientY - rect.top + containerRef.current.scrollTop;
        setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }));
    };

    const handleMouseUp = () => {
        if (isSelecting && selectionBox) {
            const boxRect = {
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                right: Math.max(selectionBox.startX, selectionBox.currentX),
                bottom: Math.max(selectionBox.startY, selectionBox.currentY)
            };

            const newSelected = new Set(selectedIds);
            
            currentItems.forEach(item => {
                const el = document.getElementById(`item-${item.id}`);
                if (el) {
                    const itemRect = {
                        left: el.offsetLeft,
                        top: el.offsetTop,
                        right: el.offsetLeft + el.offsetWidth,
                        bottom: el.offsetTop + el.offsetHeight
                    };
                    
                    const isIntersecting = !(
                        itemRect.left > boxRect.right ||
                        itemRect.right < boxRect.left ||
                        itemRect.top > boxRect.bottom ||
                        itemRect.bottom < boxRect.top
                    );

                    if (isIntersecting) newSelected.add(item.id);
                }
            });

            setSelectedIds(newSelected);
        }
        setIsSelecting(false);
        setSelectionBox(null);
    };

    // --- CLICK SELECTION HANDLER ---
    const handleItemClick = (e, itemId) => {
        e.stopPropagation();
        
        const isMultiSelect = e.shiftKey;
        const isToggle = e.ctrlKey || e.metaKey;

        if (onItemClick && !isMultiSelect && !isToggle) {
            if (selectedIds.has(itemId) && selectedIds.size === 1) {
                onItemClick(items.find(i => i.id === itemId));
                return;
            }
        }

        let newSelected = new Set(selectedIds);

        if (isToggle) {
            if (newSelected.has(itemId)) newSelected.delete(itemId);
            else newSelected.add(itemId);
            setLastClickedId(itemId);
        } else if (isMultiSelect && lastClickedId) {
            const currentIndex = currentItems.findIndex(i => i.id === itemId);
            const lastIndex = currentItems.findIndex(i => i.id === lastClickedId);
            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);
            const range = currentItems.slice(start, end + 1).map(i => i.id);
            range.forEach(id => newSelected.add(id));
        } else {
            newSelected = new Set([itemId]);
            setLastClickedId(itemId);
        }
        setSelectedIds(newSelected);
    };

    // --- DRAG HANDLERS ---
    const handleDragOver = (e) => { 
        e.preventDefault(); 
        if (e.dataTransfer.types.includes("Files")) setIsDraggingOver(true); 
    };
    
    const handleDragLeave = (e) => { e.preventDefault(); setIsDraggingOver(false); };
    
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.types.includes("Files") && onUpload) {
            onUpload(e.dataTransfer.files, type, currentFolderId);
        }
    };

    const handleItemDragStart = (e, itemId) => {
        e.dataTransfer.setData("itemId", itemId);
        e.dataTransfer.setData("itemType", type);
        
        let dragIds = [itemId];
        if (selectedIds.has(itemId)) {
            dragIds = Array.from(selectedIds);
        } else {
            setSelectedIds(new Set([itemId]));
        }
        
        e.dataTransfer.setData("itemIds", JSON.stringify(dragIds));
        e.dataTransfer.effectAllowed = "copyMove";
    };

    const handleFolderDrop = (e, targetFolderId) => {
        e.preventDefault();
        e.stopPropagation();
        setDragTargetFolderId(null);
        
        const itemIdsStr = e.dataTransfer.getData("itemIds");
        const itemType = e.dataTransfer.getData("itemType");

        if (itemIdsStr && itemType === type && onMoveItems && targetFolderId !== currentFolderId) {
            const itemIds = JSON.parse(itemIdsStr);
            onMoveItems(itemIds, itemType, targetFolderId);
            setSelectedIds(new Set());
        }
    };

    const deleteSelected = (e) => {
        e.stopPropagation(); 
        if (selectedIds.size > 0 && onDeleteItems) {
            if (confirm(`Delete ${selectedIds.size} items?`)) {
                onDeleteItems(type === 'battlefield' ? 'battlefield' : type, Array.from(selectedIds));
                setSelectedIds(new Set());
            }
        }
    };

    const submitFolder = () => {
        if (newFolderName.trim() && onCreateFolder) {
            onCreateFolder(newFolderName, type, currentFolderId);
            setNewFolderName("");
            setShowFolderInput(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 bg-slate-800/50 p-2 rounded shrink-0" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {breadcrumbs.map((crumb, i) => {
                        const isLast = i === breadcrumbs.length - 1;
                        const isRoot = crumb.id === null;
                        return (
                            <React.Fragment key={crumb.id || 'root'}>
                                {i > 0 && <ChevronRight className="w-4 h-4 text-slate-500" />}
                                <button 
                                    onClick={() => setCurrentFolderId(crumb.id)}
                                    onDragOver={(e) => { if (!isLast) e.preventDefault(); }}
                                    onDrop={(e) => { if (!isLast) handleFolderDrop(e, crumb.id); }}
                                    className={`text-sm hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors 
                                        ${isLast ? 'font-bold text-white cursor-default' : 'text-slate-400 hover:bg-slate-700'}
                                    `}
                                >
                                    {isRoot && <Home className="w-4 h-4" />}
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
                {selectedIds.size > 0 ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-purple-300">{selectedIds.size} Selected</span>
                        <button onClick={deleteSelected} onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {allowUpload && (
                            <>
                                <button onClick={() => setShowFolderInput(!showFolderInput)} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded" title="New Folder">
                                    <FolderPlus className="w-5 h-5" />
                                </button>
                                <label className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer" title="Upload">
                                    <Upload className="w-5 h-5" />
                                    <input type="file" multiple accept="image/*" onChange={(e) => onUpload && onUpload(e.target.files, type, currentFolderId)} className="hidden" />
                                </label>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Folder Input */}
            {showFolderInput && (
                <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <input autoFocus type="text" placeholder="Folder Name..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitFolder()} className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"/>
                    <button onClick={submitFolder} className="bg-purple-600 px-3 py-1 rounded text-xs font-bold hover:bg-purple-700">Create</button>
                    <button onClick={() => setShowFolderInput(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Drag Overlay */}
            {isDraggingOver && allowUpload && (
                <div className="absolute inset-0 z-50 bg-purple-900/40 border-4 border-dashed border-purple-500 rounded-xl flex items-center justify-center pointer-events-none">
                    <div className="text-2xl font-bold text-white drop-shadow-md flex flex-col items-center"><Upload className="w-12 h-12 mb-2" /> Drop here to upload</div>
                </div>
            )}

            {/* Grid Container */}
            <div ref={containerRef} className="flex-1 overflow-y-auto pb-20 content-start relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                {isSelecting && selectionBox && (
                    <div className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50" style={{ left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY), width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY) }} />
                )}

                <div className={gridClassName || "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"}>
                    
                    {/* Helper "Up" Folder */}
                    {currentFolderId !== null && (
                        <div 
                            onClick={() => { const current = folders.find(f => f.id === currentFolderId); setCurrentFolderId(current ? current.parentId : null); }} 
                            onMouseDown={(e) => e.stopPropagation()} // STOP SELECT BOX
                            onDragOver={(e) => e.preventDefault()} 
                            onDrop={(e) => { const current = folders.find(f => f.id === currentFolderId); handleFolderDrop(e, current ? current.parentId : null); }} 
                            className="bg-slate-800/50 border border-slate-700/50 border-dashed hover:bg-slate-700/50 rounded-lg p-4 flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors justify-center aspect-square"
                        >
                            <CornerUpLeft className="w-8 h-8 mb-2" />
                            <span className="text-xs">.. (Up)</span>
                        </div>
                    )}

                    {/* Folders */}
                    {currentFolders.map(folder => (
                        <div 
                            key={folder.id} 
                            onClick={() => setCurrentFolderId(folder.id)} 
                            onMouseDown={(e) => e.stopPropagation()} // STOP SELECT BOX
                            onDragOver={(e) => { e.preventDefault(); setDragTargetFolderId(folder.id); }} 
                            onDragLeave={() => setDragTargetFolderId(null)} 
                            onDrop={(e) => handleFolderDrop(e, folder.id)} 
                            className={`group relative bg-slate-800 border rounded-lg p-4 flex flex-col items-center cursor-pointer transition-colors justify-center aspect-square ${dragTargetFolderId === folder.id ? 'border-purple-500 bg-slate-700' : 'border-slate-700 hover:border-purple-500/50 hover:bg-slate-700/50'}`}
                        >
                            <Folder className={`w-12 h-12 mb-2 ${dragTargetFolderId === folder.id ? 'text-purple-400 fill-purple-900/40' : 'text-blue-400 fill-blue-900/20'}`} />
                            <span className="text-sm font-medium text-center w-full truncate">{folder.name}</span>
                            {onDeleteFolder && <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete folder and all contents?")) onDeleteFolder(folder.id); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500 transition-all"><Trash2 className="w-3 h-3" /></button>}
                        </div>
                    ))}

                    {/* Items */}
                    {currentItems.map(item => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                            <div 
                                key={item.id} 
                                id={`item-${item.id}`} 
                                data-item-id={item.id} 
                                draggable 
                                onDragStart={(e) => handleItemDragStart(e, item.id)} 
                                onClick={(e) => handleItemClick(e, item.id)}
                                onMouseDown={(e) => e.stopPropagation()} // STOP SELECT BOX
                                className={`relative group cursor-pointer rounded-lg transition-all select-none ${isSelected ? 'ring-2 ring-purple-500 bg-slate-700 scale-[0.98]' : 'hover:bg-slate-800/50'}`}
                            >
                                {renderItem(item)}
                                {onDeleteItems && !isSelected && (
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteItems(type === 'battlefield' ? 'battlefield' : type, [item.id]); }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-700 z-10" onMouseDown={(e) => e.stopPropagation()}><Trash2 className="w-3 h-3" /></button>
                                )}
                                {isSelected && <div className="absolute top-1 right-1 bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-md pointer-events-none z-10">✓</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FileBrowser;