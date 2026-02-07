import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase'; 
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Sub-components
import CreateNotebookModal from './CreateNotebookModal';
import NotesMenu from './NotesMenu';
import TiptapEditor from './TipTapEditor';
import { InputModal, ConfirmModal } from './CampaignNoteModals';
import GlobalSearchModal from './GlobalSearchModal'; 

// Icons
import { FileIcon, Folder, FolderOpen, PlusIcon, TrashIcon, CheckCircle, ChevronRight, BookIcon } from '../CampaignManager/components/CampaignIcons'; 

// Simpel Menu Ikon (Hamburger) til mobil
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const CampaignNotes = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // Global Data
    const [allNotes, setAllNotes] = useState([]);
    
    // View State
    const [view, setView] = useState('menu'); 
    const [activeNotebook, setActiveNotebook] = useState(null); 
    const [showCreateModal, setShowCreateModal] = useState(false); 
    const [showSearch, setShowSearch] = useState(false); 
    
    // EDIT NOTEBOOK STATE
    const [editingNotebook, setEditingNotebook] = useState(null);
    
    // --- NY STATE: Mobil Sidebar ---
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // MODAL STATES
    const [inputModal, setInputModal] = useState({ isOpen: false, type: 'file', parentId: null, blueprintKey: null });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, noteId: null, title: "", message: "" });

    // Active Selection
    const [activeFile, setActiveFile] = useState(null); 
    const [expandedFolders, setExpandedFolders] = useState({});
    
    // Editor State
    const [editorContent, setEditorContent] = useState(""); 
    const [title, setTitle] = useState("");
    const [saveStatus, setSaveStatus] = useState("saved");
    
    // Drag/Drop State
    const [draggedItem, setDraggedItem] = useState(null);
    const [isDraggingOverRoot, setIsDraggingOverRoot] = useState(false);

    // 1. FETCH NOTES
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "users", currentUser.uid, "notes"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllNotes(notes);
        });
        return () => unsub();
    }, [currentUser]);
    
    // 2. COMPUTED: Active Files & Tree
    const currentFiles = activeNotebook 
        ? allNotes.filter(n => n.notebookId === activeNotebook.id)
        : [];

    const fileTree = (() => {
        const folders = currentFiles.filter(n => n.type === 'folder');
        const files = currentFiles.filter(n => n.type === 'file');
        const allIds = new Set(currentFiles.map(f => f.id));

        const rootFolders = folders.filter(f => !f.parentId || !allIds.has(f.parentId));
        const rootFiles = files.filter(f => !f.parentId || !allIds.has(f.parentId));

        const getChildren = (folderId) => {
            const childFolders = folders.filter(f => f.parentId === folderId);
            const childFiles = files.filter(f => f.parentId === folderId);
            return [...childFolders, ...childFiles]; 
        };

        return { root: [...rootFolders, ...rootFiles], getChildren };
    })();

    // 3. HANDLERS
    const handleOpenNotebook = (notebook) => {
        setActiveNotebook(notebook);
        setView('notebook');
        setActiveFile(null);
    };
    
    const backToMenu = () => {
        setView('menu');
        setActiveNotebook(null);
    };

    // NOTEBOOK HANDLERS (CREATE / UPDATE / DELETE)
    const handleCreateNotebook = async ({ name, image, color }) => {
        try {
            await addDoc(collection(db, "users", currentUser.uid, "notes"), {
                name,
                image,
                color, 
                type: 'notebook',
                createdAt: Date.now()
            });
            setShowCreateModal(false);
        } catch (e) { console.error(e); }
    };

    const handleUpdateNotebook = async ({ name, image, color }) => {
        if (!editingNotebook) return;
        try {
            await updateDoc(doc(db, "users", currentUser.uid, "notes", editingNotebook.id), {
                name,
                image,
                color,
                updatedAt: Date.now()
            });
            setEditingNotebook(null); // Luk modal
        } catch (e) { console.error(e); }
    };

    const handleEditNotebook = (notebook) => {
        setEditingNotebook(notebook);
    };

    const handleDelete = async () => {
        if (!confirmModal.noteId) return;
        try {
            await deleteDoc(doc(db, "users", currentUser.uid, "notes", confirmModal.noteId));
            if (activeFile?.id === confirmModal.noteId) setActiveFile(null);
        } catch (e) { console.error(e); }
    };

    // ITEM HANDLERS
    const initiateCreateItem = (type, parentId, blueprintKey = 'blank', forceName = null) => {
         if (forceName) {
            handleCreateItem(forceName, type, parentId, blueprintKey);
         } else {
            setInputModal({ isOpen: true, type, parentId, blueprintKey });
         }
    };

    const handleCreateItem = async (name, typeArg, parentIdArg, blueprintKeyArg) => {
        if (!activeNotebook) return;

        const type = typeArg !== undefined ? typeArg : inputModal.type;
        const parentId = parentIdArg !== undefined ? parentIdArg : inputModal.parentId;

        try {
            const newItem = {
                name,
                type: type, 
                notebookId: activeNotebook.id,
                parentId: parentId || null, 
                content: type === 'file' ? "" : null,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            const docRef = await addDoc(collection(db, "users", currentUser.uid, "notes"), newItem);
            
            if (type === 'file') {
                setActiveFile({ id: docRef.id, ...newItem });
                setTitle(name);
                setEditorContent("");
                if (parentId) {
                    setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
                }
            } else {
                 if (parentId) {
                    setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleUpdateContent = (html) => {
        setEditorContent(html);
    };

    const handleSelectFile = (file) => {
        setActiveFile(file);
        setTitle(file.name);
        setEditorContent(file.content || "");
        setShowMobileSidebar(false);
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    // Auto-Save Logic
    useEffect(() => {
        if (!activeFile || !currentUser) return;
        
        if (activeFile.content === editorContent && activeFile.name === title) {
             setSaveStatus("saved");
             return;
        }

        setSaveStatus("saving");
        const timer = setTimeout(async () => {
            try {
                await updateDoc(doc(db, "users", currentUser.uid, "notes", activeFile.id), {
                    content: editorContent,
                    name: title,
                    updatedAt: Date.now()
                });
                setSaveStatus("saved");
            } catch(e) { 
                console.error(e); 
                setSaveStatus("error"); 
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [editorContent, title, activeFile, currentUser]);


    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e, item) => {
        e.stopPropagation();
        setDraggedItem(item);
    };

    const handleDragOverItem = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDropOnItem = async (e, targetItem) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem || !targetItem) return;
        if (draggedItem.id === targetItem.id) return;
        if (targetItem.type !== 'folder') return;

        try {
            await updateDoc(doc(db, "users", currentUser.uid, "notes", draggedItem.id), {
                parentId: targetItem.id
            });
            setExpandedFolders(prev => ({ ...prev, [targetItem.id]: true }));
        } catch (e) { console.error(e); }
        setDraggedItem(null);
    };

    const handleDropOnRoot = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverRoot(false);
        if (!draggedItem) return;
        
        if (!draggedItem.parentId) {
            setDraggedItem(null);
            return;
        }

        try {
            await updateDoc(doc(db, "users", currentUser.uid, "notes", draggedItem.id), {
                parentId: null
            });
        } catch (e) { console.error(e); }
        setDraggedItem(null);
    };


    // --- RECURSIVE RENDERER ---
    const renderTree = (items, depth = 0) => {
        return items.map(item => {
            const isFolder = item.type === 'folder';
            const isExpanded = expandedFolders[item.id];
            const children = isFolder ? fileTree.getChildren(item.id) : [];
            const isActive = activeFile?.id === item.id;
            const isDropTarget = draggedItem && item.type === 'folder' && draggedItem.id !== item.id;

            return (
                <div key={item.id} className="select-none">
                    <div 
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOverItem(e)}
                        onDrop={(e) => handleDropOnItem(e, item)}
                        className={`
                            flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm group
                            ${isActive ? 'bg-amber-900/40 text-amber-200 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                            ${isDropTarget ? 'bg-blue-900/30 border-blue-500 border-dashed border' : ''}
                        `}
                        style={{ paddingLeft: `${depth * 12 + 8}px` }}
                        onClick={() => isFolder ? toggleFolder(item.id) : handleSelectFile(item)}
                    >
                        <span onClick={(e) => { e.stopPropagation(); isFolder ? toggleFolder(item.id) : handleSelectFile(item); }} className="shrink-0">
                            {isFolder ? (isExpanded ? <FolderOpen size={14} className="text-amber-500"/> : <Folder size={14} className="text-amber-600"/>) : <FileIcon size={14} />}
                        </span>
                        <span className="truncate flex-1">{item.name}</span>
                        
                        {/* Quick Actions (Hover) */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                             {isFolder && (
                                <button onClick={(e) => { e.stopPropagation(); setInputModal({ isOpen: true, type: 'file', parentId: item.id }); }} className="text-slate-500 hover:text-white" title="New File"><PlusIcon size={12}/></button>
                             )}
                             <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, noteId: item.id, title: `Delete ${item.name}?`, message: "This cannot be undone." }); }} className="text-slate-500 hover:text-red-500" title="Delete"><TrashIcon size={12}/></button>
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
                                <div className="text-[9px] uppercase font-bold text-slate-600">Create:</div>
                                <div className="flex gap-2">
                                    <button className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); initiateCreateItem('file', item.id, 'blank'); }}><PlusIcon size={10}/> Blank</button>
                                </div>
                                <button className="text-[10px] text-blue-500/70 hover:text-blue-400 flex items-center gap-1 mt-1" onClick={(e) => { e.stopPropagation(); initiateCreateItem('folder', item.id); }}><Folder size={10}/> New Folder</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            
            <GlobalSearchModal 
                isOpen={showSearch} 
                onClose={() => setShowSearch(false)} 
                notes={currentFiles.filter(n => n.type === 'file')} 
                onSelect={(note) => { handleSelectFile(note); setShowSearch(false); }}
                onCreate={(name) => { initiateCreateItem('file', null, 'blank', name); setShowSearch(false); }}
            />

            {/* SHARED MODAL FOR CREATE AND EDIT NOTEBOOK */}
            <CreateNotebookModal 
                isOpen={showCreateModal || !!editingNotebook} 
                onClose={() => { setShowCreateModal(false); setEditingNotebook(null); }} 
                onSubmit={editingNotebook ? handleUpdateNotebook : handleCreateNotebook}
                initialData={editingNotebook}
            />

            <InputModal 
                isOpen={inputModal.isOpen} 
                onClose={() => setInputModal({ ...inputModal, isOpen: false })} 
                onSubmit={(val) => handleCreateItem(val)} 
                title={`Create new ${inputModal.type}`} 
                placeholder={`Name of ${inputModal.type}...`} 
                defaultValue={inputModal.blueprintKey || ""}
            />
            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                onConfirm={handleDelete} 
                title={confirmModal.title} 
                message={confirmModal.message} 
                isDanger 
            />

            {view === 'menu' && (
                <NotesMenu 
                    notebooks={allNotes.filter(n => n.type === 'notebook')} 
                    onOpen={handleOpenNotebook}
                    onCreate={() => setShowCreateModal(true)}
                    onEdit={handleEditNotebook} // NY PROP
                    onDelete={(id) => setConfirmModal({ isOpen: true, noteId: id, title: "Delete Notebook?", message: "All notes inside will be lost." })}
                />
            )}

            {view === 'notebook' && activeNotebook && (
                <div className="flex h-screen overflow-hidden relative">
                    
                    {/* --- MOBILE SIDEBAR BACKDROP --- */}
                    {showMobileSidebar && (
                        <div 
                            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
                            onClick={() => setShowMobileSidebar(false)}
                        ></div>
                    )}

                    {/* --- SIDEBAR --- */}
                    <div className={`
                        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
                        md:relative md:translate-x-0 md:w-64
                        ${showMobileSidebar ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                    `}>
                        {/* Header - ROOT DROP ZONE */}
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

                        {/* Toolbar */}
                        <div className="p-2 border-b border-slate-800 flex gap-1">
                            <button onClick={() => setInputModal({ isOpen: true, type: 'file', parentId: null })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1"><PlusIcon size={12}/> File</button>
                            <button onClick={() => setInputModal({ isOpen: true, type: 'folder', parentId: null })} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1"><Folder size={12}/> Folder</button>
                        </div>
                        <div className="p-2">
                             <button onClick={() => setShowSearch(true)} className="w-full bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs py-1.5 rounded flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                Quick Find (Ctrl+K)
                             </button>
                        </div>

                        {/* File Tree (ROOT DROP ZONE) */}
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
                                    <div className="mt-4 p-4 border border-dashed border-slate-700 rounded-lg text-slate-500">
                                        Drop files here
                                    </div>
                                </div>
                            ) : renderTree(fileTree.root)}
                        </div>
                        
                        {/* User Footer */}
                        <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-xs text-slate-500 flex justify-between items-center">
                             <span>{currentFiles.length} items</span>
                        </div>
                    </div>

                    {/* --- MAIN EDITOR AREA --- */}
                    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden w-full">
                        
                        {/* MOBIL TOP BAR (FIXED: Added pl-16 for global menu & moved files button to right) */}
                        <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900 text-white shrink-0 pl-16">
                            
                            <span className="font-bold truncate px-2 text-sm text-slate-200 flex-1">
                                {activeFile ? activeFile.name : activeNotebook.name}
                            </span>
                            
                            <button onClick={() => setShowMobileSidebar(true)} className="text-slate-400 hover:text-white flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700">
                                <span className="text-[10px] font-bold uppercase">Files</span>
                                <MenuIcon />
                            </button>
                        </div>

                        {activeFile ? (
                            <div className="flex-1 overflow-hidden relative flex flex-col">
                                
                                {/* Desktop Title Bar */}
                                <div className="hidden md:flex h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm shrink-0 items-center sticky top-0 z-10">
                                    <div className="max-w-3xl w-full mx-auto px-8 flex justify-between items-center">
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent text-amber-500 font-bold outline-none text-2xl w-full max-w-lg placeholder-slate-600 focus:border-b border-amber-500/30 transition-colors" placeholder="Page Title" />
                                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                                            {saveStatus === 'saving' && <span className="text-yellow-500 animate-pulse">Saving...</span>}
                                            {saveStatus === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={12}/> Saved</span>}
                                            {saveStatus === 'error' && <span className="text-red-500">Error!</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar cursor-text px-4 md:px-8 py-4 md:py-8">
                                    <div className="max-w-3xl mx-auto min-h-full">
                                        {/* Mobil Title Input */}
                                        <div className="md:hidden mb-4 border-b border-slate-800 pb-2">
                                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent text-amber-500 font-bold outline-none text-xl w-full placeholder-slate-600" placeholder="Page Title" />
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                                                {saveStatus === 'saving' && <span className="text-yellow-500 animate-pulse">Saving...</span>}
                                                {saveStatus === 'saved' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10}/> Saved</span>}
                                            </div>
                                        </div>

                                        <TiptapEditor 
                                            key={activeFile.id} 
                                            initialContent={activeFile.content} 
                                            onUpdate={handleUpdateContent}
                                            onWikiLinkClick={(targetName) => {
                                                const target = currentFiles.find(f => f.name.toLowerCase() === targetName.toLowerCase() && f.type === 'file');
                                                if (target) {
                                                    handleSelectFile(target);
                                                } else {
                                                    // FIX: Direkte oprettelse (forceName=targetName), parentId=null (root)
                                                    initiateCreateItem('file', null, 'blank', targetName);
                                                }
                                            }} 
                                        />
                                    </div>
                                    <div className="h-40"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-slate-950/50">
                                <div className="bg-slate-900 p-6 rounded-full mb-4 shadow-inner">
                                    <BookIcon size={48} className="opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-500 mb-2">Welcome to {activeNotebook.name}</h3>
                                <p className="text-sm max-w-md">Select a note from the sidebar to start writing, or create a new file.</p>
                                
                                <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-xs">
                                    <button onClick={() => setInputModal({ isOpen: true, type: 'file' })} className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-amber-500/50 hover:bg-slate-800 transition-all group text-left">
                                        <div className="bg-amber-900/20 p-2 rounded text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors"><PlusIcon /></div>
                                        <div><div className="text-sm font-bold text-slate-300">New Note</div><div className="text-[10px] text-slate-500">Create a blank page</div></div>
                                    </button>
                                </div>

                                {/* SENESTE FILER */}
                                <div className="mt-8 w-full max-w-md">
                                    <div className="text-[10px] font-bold uppercase text-slate-600 mb-2 tracking-wider">Recent Changes</div>
                                    <div className="space-y-1">
                                        {(() => {
                                            const recent = [...currentFiles].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 3);
                                            if(recent.length === 0) return <div className="text-xs italic opacity-50">No notes yet</div>
                                            return recent.map(file => (
                                                <button key={file.id} onClick={() => handleSelectFile(file)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-900 rounded-lg transition-colors group text-left border border-transparent hover:border-slate-800">
                                                    <div className="bg-slate-900 p-1.5 rounded group-hover:bg-slate-700 text-slate-400 group-hover:text-amber-500 transition-colors">
                                                        <FileIcon size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-slate-300 font-medium truncate group-hover:text-white">{file.name}</div>
                                                        <div className="text-[10px] text-slate-500">
                                                            Last edited: {new Date(file.updatedAt || file.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampaignNotes;