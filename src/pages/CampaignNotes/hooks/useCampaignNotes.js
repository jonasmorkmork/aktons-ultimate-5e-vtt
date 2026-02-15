import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase'; 
import { collection, addDoc, updateDoc, deleteDoc, setDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { parse } from 'marked';
import { BLUEPRINTS } from '../blueprints';

// --- IMPORTS TIL EKSPORT (Husk npm install jszip file-saver turndown) ---
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import TurndownService from 'turndown';

export const useCampaignNotes = () => {
    const { currentUser } = useAuth();
    
    // Global Data
    const [allNotes, setAllNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    
    // View State
    const [view, setView] = useState('menu'); 
    const [activeNotebook, setActiveNotebook] = useState(null); 
    const [showCreateModal, setShowCreateModal] = useState(false); 
    const [showSearch, setShowSearch] = useState(false); 
    
    // Edit States
    const [editingNotebook, setEditingNotebook] = useState(null);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Modal States
    const [inputModal, setInputModal] = useState({ isOpen: false, type: 'file', parentId: null, blueprintKey: null });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, noteId: null, title: "", message: "" });

    // Selection & Editor States
    const [activeFile, setActiveFile] = useState(null); 
    const [selectedIds, setSelectedIds] = useState(new Set()); 
    const [lastSelectedId, setLastSelectedId] = useState(null); 
    const [expandedFolders, setExpandedFolders] = useState({});
    const [deleteHistory, setDeleteHistory] = useState([]);
    
    // Editor Content
    const [editorContent, setEditorContent] = useState(""); 
    const [title, setTitle] = useState("");
    const [saveStatus, setSaveStatus] = useState("saved");
    
    const lastSavedData = useRef({ content: "", name: "" });
    const fileInputRef = useRef(null); 
    const folderInputRef = useRef(null);
    
    // Drag/Drop State
    const [draggedItem, setDraggedItem] = useState(null);
    const [isDraggingOverRoot, setIsDraggingOverRoot] = useState(false);

    // --- FETCH NOTES ---
    useEffect(() => {
        if (!currentUser) return;
        setIsLoading(true);
        const q = query(collection(db, "users", currentUser.uid, "notes"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            const notes = snapshot.docs.map(doc => {
                const data = doc.data();
                let cleanName = data.name;
                if (typeof cleanName === 'object' && cleanName !== null) {
                    cleanName = cleanName.name || "Recovered Note";
                }
                return { id: doc.id, ...data, name: cleanName };
            });
            setAllNotes(notes);
            setIsLoading(false);
        });
        return () => unsub();
    }, [currentUser]);

    // --- COMPUTED: File Tree ---
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

    // --- HANDLERS ---
    const handleOpenNotebook = (notebook) => {
        setActiveNotebook(notebook);
        setView('notebook');
        setActiveFile(null);
        setSelectedIds(new Set()); 
        setLastSelectedId(null);
        setDeleteHistory([]); 
    };
    
    const backToMenu = () => {
        setView('menu');
        setActiveNotebook(null);
    };

    const handleCreateNotebook = async ({ name, image, color }) => {
        try {
            await addDoc(collection(db, "users", currentUser.uid, "notes"), {
                name, image, color, type: 'notebook', createdAt: Date.now()
            });
            setShowCreateModal(false);
        } catch (e) { console.error(e); }
    };

    const handleUpdateNotebook = async ({ name, image, color }) => {
        if (!editingNotebook) return;
        try {
            await updateDoc(doc(db, "users", currentUser.uid, "notes", editingNotebook.id), {
                name, image, color, updatedAt: Date.now()
            });
            setEditingNotebook(null);
        } catch (e) { console.error(e); }
    };

    const handleEditNotebook = (notebook) => setEditingNotebook(notebook);

    const handleDelete = async () => {
        const targetId = confirmModal.noteId;
        if (!targetId) return;

        let idsToDelete = [targetId];
        if (selectedIds.has(targetId)) {
            idsToDelete = Array.from(selectedIds);
        }

        const itemsToSave = idsToDelete.map(id => {
            const note = allNotes.find(n => n.id === id);
            return note ? { ...note } : null; 
        }).filter(Boolean); 

        if (itemsToSave.length > 0) {
            setDeleteHistory(prev => [...prev, itemsToSave]);
        }

        try {
            const promises = idsToDelete.map(id => 
                deleteDoc(doc(db, "users", currentUser.uid, "notes", id))
            );
            await Promise.all(promises);

            if (idsToDelete.includes(activeFile?.id)) setActiveFile(null);
            setSelectedIds(new Set()); 
            setLastSelectedId(null);
        } catch (e) { console.error(e); }
    };

    const handleUndo = async () => {
        if (deleteHistory.length === 0) return;
        const lastDeletionGroup = deleteHistory[deleteHistory.length - 1];
        setDeleteHistory(prev => prev.slice(0, -1));

        const promises = lastDeletionGroup.map(item => {
            const { id, ...data } = item;
            return setDoc(doc(db, "users", currentUser.uid, "notes", id), data);
        });

        try { await Promise.all(promises); } catch (e) { console.error("Undo failed:", e); }
    };

    // --- EXPORT NOTEBOOK ---
    const handleExportNotebook = async (notebookId) => {
        const notebook = allNotes.find(n => n.id === notebookId);
        if (!notebook) return;

        const notesInBook = allNotes.filter(n => n.notebookId === notebookId);
        
        const zip = new JSZip();
        const turndownService = new TurndownService({ 
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        const getPath = (item) => {
            let pathParts = [];
            let current = item;
            while (current.parentId) {
                const parent = notesInBook.find(n => n.id === current.parentId);
                if (parent) {
                    pathParts.unshift(parent.name);
                    current = parent;
                } else {
                    break; 
                }
            }
            return pathParts.join('/');
        };

        notesInBook.filter(n => n.type === 'file').forEach(file => {
            const path = getPath(file);
            const fileName = `${file.name}.md`;
            const fullPath = path ? `${path}/${fileName}` : fileName;

            let markdown = "";
            if (file.content) {
                try {
                    markdown = turndownService.turndown(file.content);
                } catch (e) {
                    markdown = file.content || ""; 
                }
            }
            zip.file(fullPath, markdown);
        });

        try {
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${notebook.name}.zip`);
        } catch (e) {
            console.error("Failed to generate zip", e);
            alert("Could not export notebook.");
        }
    };

    const handleCreateItem = async (name, typeArg, parentIdArg, blueprintKeyArg) => {
        if (!activeNotebook) return;
        const type = typeArg !== undefined ? typeArg : inputModal.type;
        const parentId = parentIdArg !== undefined ? parentIdArg : inputModal.parentId;
        const blueprintKey = blueprintKeyArg || inputModal.blueprintKey || 'blank';

        try {
            let initialContent = "";
            if (type === 'file' && BLUEPRINTS && BLUEPRINTS[blueprintKey]) {
                initialContent = BLUEPRINTS[blueprintKey].content || "";
            }

            const newItem = {
                name: String(name),
                type: type, 
                notebookId: activeNotebook.id,
                parentId: parentId || null, 
                content: type === 'file' ? initialContent : null, 
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            const docRef = await addDoc(collection(db, "users", currentUser.uid, "notes"), newItem);
            
            if (type === 'file') {
                const newFile = { id: docRef.id, ...newItem };
                handleSelectNode(null, newFile, false, false);
                if (parentId) setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
            } else {
                 if (parentId) setExpandedFolders(prev => ({ ...prev, [parentId]: true }));
            }
        } catch (e) { console.error(e); }
    };

    const handleImportFiles = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0 || !activeNotebook) return;
        setIsImporting(true);
        const promises = files.map(file => {
            return new Promise((resolve) => {
                if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.txt')) {
                    resolve(); return;
                }
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const text = event.target.result;
                    const htmlContent = parse(text); 
                    const fileName = file.name.replace(/\.(md|txt)$/i, '');
                    try {
                        const newItem = {
                            name: fileName, type: 'file', notebookId: activeNotebook.id,
                            parentId: null, content: htmlContent, createdAt: Date.now(), updatedAt: Date.now()
                        };
                        await addDoc(collection(db, "users", currentUser.uid, "notes"), newItem);
                        resolve();
                    } catch (err) { console.error("Import error", err); resolve(); }
                };
                reader.readAsText(file);
            });
        });
        await Promise.all(promises);
        setIsImporting(false);
        e.target.value = null; 
    };

    // Selection & Tree Logic
    const getVisibleOrder = () => {
        const visible = [];
        const traverse = (items) => {
            items.forEach(item => {
                visible.push(item.id);
                if (item.type === 'folder' && expandedFolders[item.id]) {
                    traverse(fileTree.getChildren(item.id));
                }
            });
        };
        traverse(fileTree.root);
        return visible;
    };

    const handleSelectNode = (e, item, isMultiSelect, isRangeSelect) => {
        if (e) e.stopPropagation();
        if (isRangeSelect && lastSelectedId) {
            const visibleOrder = getVisibleOrder();
            const startIdx = visibleOrder.indexOf(lastSelectedId);
            const endIdx = visibleOrder.indexOf(item.id);
            if (startIdx !== -1 && endIdx !== -1) {
                const min = Math.min(startIdx, endIdx);
                const max = Math.max(startIdx, endIdx);
                const rangeIds = visibleOrder.slice(min, max + 1);
                const newSet = new Set(selectedIds); 
                rangeIds.forEach(id => newSet.add(id));
                setSelectedIds(newSet);
            }
        } else if (isMultiSelect) {
            const newSet = new Set(selectedIds);
            if (newSet.has(item.id)) newSet.delete(item.id);
            else newSet.add(item.id);
            setSelectedIds(newSet);
            setLastSelectedId(item.id); 
        } else {
            const newSet = new Set();
            newSet.add(item.id);
            setSelectedIds(newSet);
            setLastSelectedId(item.id); 
            if (item.type === 'file') {
                setActiveFile(item);
                setTitle(item.name);
                setEditorContent(item.content || "");
                lastSavedData.current = { content: item.content || "", name: item.name };
                setShowMobileSidebar(false);
            }
        }
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
    };

    const handleSelectFile = (file) => handleSelectNode(null, file, false, false);

    // --- DRAG & DROP HELPERS ---
    
    // NYT: Denne manglede før!
    const handleDragOverItem = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragStart = (e, item) => {
        e.stopPropagation();
        if (!selectedIds.has(item.id)) {
            const newSet = new Set(); newSet.add(item.id);
            setSelectedIds(newSet); setLastSelectedId(item.id);
        }
        setDraggedItem(item);
    };

    const handleDropOnItem = async (e, targetItem) => {
        e.preventDefault(); e.stopPropagation();
        if (!draggedItem || !targetItem) return;
        if (targetItem.type !== 'folder') return; 
        const itemsToMove = selectedIds.has(draggedItem.id) ? Array.from(selectedIds) : [draggedItem.id];
        const validItems = itemsToMove.filter(id => id !== targetItem.id);
        try {
            const promises = validItems.map(id => updateDoc(doc(db, "users", currentUser.uid, "notes", id), { parentId: targetItem.id }));
            await Promise.all(promises);
            setExpandedFolders(prev => ({ ...prev, [targetItem.id]: true }));
            setSelectedIds(new Set()); setLastSelectedId(null);
        } catch (e) { console.error(e); }
        setDraggedItem(null);
    };

    const handleDropOnRoot = async (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOverRoot(false);
        if (!draggedItem) return;
        const itemsToMove = selectedIds.has(draggedItem.id) ? Array.from(selectedIds) : [draggedItem.id];
        try {
            const promises = itemsToMove.map(id => updateDoc(doc(db, "users", currentUser.uid, "notes", id), { parentId: null }));
            await Promise.all(promises);
            setSelectedIds(new Set()); setLastSelectedId(null);
        } catch (e) { console.error(e); }
        setDraggedItem(null);
    };

    // Auto-Save Effect
    useEffect(() => {
        if (!activeFile || !currentUser) return;
        if (editorContent === lastSavedData.current.content && title === lastSavedData.current.name) {
             setSaveStatus("saved"); return;
        }
        setSaveStatus("saving");
        const timer = setTimeout(async () => {
            if (!activeFile) return;
            try {
                lastSavedData.current = { content: editorContent, name: title };
                await updateDoc(doc(db, "users", currentUser.uid, "notes", activeFile.id), {
                    content: editorContent, name: title, updatedAt: Date.now()
                });
                setSaveStatus("saved");
            } catch(e) { console.error(e); setSaveStatus("error"); }
        }, 2000);
        return () => clearTimeout(timer);
    }, [editorContent, title, activeFile, currentUser]);

    // Returner alt logik som et samlet objekt
    return {
        allNotes, isLoading, isImporting,
        view, setView, activeNotebook, setActiveNotebook,
        showCreateModal, setShowCreateModal, showSearch, setShowSearch,
        editingNotebook, setEditingNotebook, showMobileSidebar, setShowMobileSidebar,
        inputModal, setInputModal, confirmModal, setConfirmModal,
        activeFile, setActiveFile, selectedIds, expandedFolders, setExpandedFolders, deleteHistory,
        editorContent, setEditorContent, title, setTitle, saveStatus,
        fileInputRef, folderInputRef, draggedItem, isDraggingOverRoot, setIsDraggingOverRoot,
        
        currentFiles, fileTree,
        
        handleOpenNotebook, backToMenu, handleCreateNotebook, handleUpdateNotebook, 
        handleEditNotebook, handleDelete, handleUndo, handleCreateItem, handleImportFiles, 
        handleSelectNode, handleSelectFile, toggleFolder, 
        handleExportNotebook,
        
        // Drag & Drop
        handleDragStart, 
        handleDropOnItem, 
        handleDropOnRoot,
        handleDragOverItem, // <--- Nu bliver den eksporteret!
        
        initiateCreateItem: (type, parentId, bp, name) => {
            if(name) handleCreateItem(name, type, parentId, bp);
            else setInputModal({ isOpen: true, type, parentId, blueprintKey: bp });
        }
    };
};