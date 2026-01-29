import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatBlockEditor from './components/StatBlockEditor';
import ItemStatBlockEditor from './components/ItemStatBlockEditor'; // <--- NY IMPORT
import StatBlockDisplay from './components/StatBlockDisplay';
import EncounterBuilder from './components/EncounterBuilder';
import { Icon, Icons, ResizeHandle } from './components/StatBlockIcons';
import FileBrowser from '../MapManager/components/FileBrowser';

// Context Imports
import { useAuth } from '../../context/AuthContext';
import { useCampaign } from '../../context/CampaignContext';

// Firebase Imports
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const { Minus, Plus } = Icons; 

const StatBlockManager = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { sendEncounterToCombat } = useCampaign();

    // State
    const [view, setView] = useState('list'); 
    const [activeTab, setActiveTab] = useState('monsters'); 
    const [notification, setNotification] = useState(null);

    const [monsters, setMonsters] = useState([]);
    const [items, setItems] = useState([]); // <--- NY ITEM STATE
    const [folders, setFolders] = useState([]);
    const [encounters, setEncounters] = useState([]);
    
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [currentEditItem, setCurrentEditItem] = useState(null);

    // Folder Modal State
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // DM Screen State
    const [screenMonsters, setScreenMonsters] = useState([]);
    const [screenSearch, setScreenSearch] = useState("");

    // --- LOAD DATA ---
    useEffect(() => {
        const loadData = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid, "data", "statblocks");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setMonsters(data.monsters || []);
                        setItems(data.items || []); // <--- LOAD ITEMS
                        setFolders(data.folders || []);
                    }
                    const encRef = doc(db, "users", currentUser.uid, "data", "encounters");
                    const encSnap = await getDoc(encRef);
                    if (encSnap.exists()) {
                        setEncounters(encSnap.data().list || []);
                    }
                } catch (e) { console.error("Error loading from Firebase:", e); }
            } else {
                const savedMonsters = localStorage.getItem('vtt_statblocks');
                const savedItems = localStorage.getItem('vtt_items'); // <--- LOAD ITEMS
                const savedFolders = localStorage.getItem('vtt_statblock_folders');
                const savedEncounters = localStorage.getItem('vtt_encounters');
                
                if (savedMonsters) setMonsters(JSON.parse(savedMonsters));
                if (savedItems) setItems(JSON.parse(savedItems));
                if (savedFolders) setFolders(JSON.parse(savedFolders));
                if (savedEncounters) setEncounters(JSON.parse(savedEncounters));
            }
        };
        loadData();
    }, [currentUser]);

    // GENERIC SAVE FUNCTION
    const saveData = async (newMonsters, newItems, newFolders) => { 
        setMonsters(newMonsters); 
        setItems(newItems);
        setFolders(newFolders); 
        if (currentUser) { 
            try { await setDoc(doc(db, "users", currentUser.uid, "data", "statblocks"), { monsters: newMonsters, items: newItems, folders: newFolders }); } 
            catch (e) { console.error("Error saving stats:", e); } 
        } else { 
            localStorage.setItem('vtt_statblocks', JSON.stringify(newMonsters)); 
            localStorage.setItem('vtt_items', JSON.stringify(newItems));
            localStorage.setItem('vtt_statblock_folders', JSON.stringify(newFolders)); 
        } 
    };

    const saveEncounters = async (newEncounters) => { setEncounters(newEncounters); if (currentUser) { try { await setDoc(doc(db, "users", currentUser.uid, "data", "encounters"), { list: newEncounters }); } catch (e) { console.error("Error saving encounters:", e); } } else { localStorage.setItem('vtt_encounters', JSON.stringify(newEncounters)); } };
    
    // Helper wrappers
    const saveMonsters = (newMonsters) => saveData(newMonsters, items, folders);
    const saveItems = (newItems) => saveData(monsters, newItems, folders);
    const saveFolders = (newFolders) => saveData(monsters, items, newFolders);

    const handleExportAll = () => { const data = { monsters, items, folders, encounters, type: 'statblock_backup', version: 2 }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `library_backup_${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link); };
    
    const handleImport = (e) => { 
        const file = e.target.files[0]; if (!file) return; 
        const reader = new FileReader(); 
        reader.onload = (event) => { 
            try { 
                const data = JSON.parse(event.target.result); 
                let newMonsters = monsters; let newItems = items; let newFolders = folders; let newEncounters = encounters; 
                
                if (data.monsters) { const existingIds = new Set(monsters.map(m => m.id)); const newM = data.monsters.filter(m => !existingIds.has(m.id)); newMonsters = [...monsters, ...newM]; } 
                if (data.items) { const existingIds = new Set(items.map(i => i.id)); const newI = data.items.filter(i => !existingIds.has(i.id)); newItems = [...items, ...newI]; }
                if (data.folders) { const existingFolderIds = new Set(folders.map(f => f.id)); const newF = data.folders.filter(f => !existingFolderIds.has(f.id)); newFolders = [...folders, ...newF]; } 
                if (data.encounters) { const existingIds = new Set(encounters.map(e => e.id)); const newE = data.encounters.filter(e => !existingIds.has(e.id)); newEncounters = [...encounters, ...newE]; } 
                
                saveData(newMonsters, newItems, newFolders); 
                saveEncounters(newEncounters); 
                alert("Library imported successfully!"); 
            } catch (err) { console.error("Import failed:", err); alert("Failed to import file. Invalid JSON format."); } 
        }; 
        reader.readAsText(file); e.target.value = null; 
    };
    
    // --- ACTIONS ---
    const handleCreateNew = () => { 
        if (activeTab === 'monsters') {
            setCurrentEditItem({ folderId: currentFolderId }); 
            setView('editor'); 
        } else if (activeTab === 'items') {
            setCurrentEditItem({ folderId: currentFolderId });
            setView('item_editor'); // <-- NY VIEW MODE
        } else {
            setCurrentEditItem(null); 
            setView('encounter_builder');
        }
    };

    const handleEditItem = (item) => { 
        setCurrentEditItem(item); 
        if (activeTab === 'monsters') setView('editor');
        else if (activeTab === 'items') setView('item_editor');
        else setView('encounter_builder');
    };

    // Save Monster
    const handleSaveFromEditor = (monsterData) => { 
        const idToUse = monsterData.id || currentEditItem?.id || Date.now().toString(); 
        const folderToUse = monsterData.folderId || currentEditItem?.folderId || currentFolderId;
        const finalMonster = { ...monsterData, id: idToUse, folderId: folderToUse }; 
        
        const updatedList = monsters.some(m => String(m.id) === String(idToUse)) 
            ? monsters.map(m => String(m.id) === String(idToUse) ? finalMonster : m) 
            : [...monsters, finalMonster]; 
        saveMonsters(updatedList); 
        setView('list'); 
    };

    // Save Item (NY)
    const handleSaveItemFromEditor = (itemData) => {
        const idToUse = itemData.id || currentEditItem?.id || Date.now().toString();
        const folderToUse = itemData.folderId || currentEditItem?.folderId || currentFolderId;
        const finalItem = { ...itemData, id: idToUse, folderId: folderToUse, type: 'item' }; 

        const updatedList = items.some(i => String(i.id) === String(idToUse))
            ? items.map(i => String(i.id) === String(idToUse) ? finalItem : i)
            : [...items, finalItem];
        saveItems(updatedList);
        setView('list');
    };
    
    const handleSaveEncounter = (encounterData) => { 
        const idToUse = encounterData.id || currentEditItem?.id || Date.now().toString(); 
        const finalEnc = { ...encounterData, id: idToUse }; 
        const updatedList = encounters.some(e => String(e.id) === String(idToUse)) ? encounters.map(e => String(e.id) === String(idToUse) ? finalEnc : e) : [...encounters, finalEnc]; 
        saveEncounters(updatedList); 
        setActiveTab('encounters'); 
        setCurrentEditItem(null);
        setView('list'); 
    };

    const handleDeleteEncounter = (id) => { if(confirm("Delete this encounter?")) { saveEncounters(encounters.filter(e => e.id !== id)); } };
    
    const openCreateFolderModal = () => { setNewFolderName(""); setIsFolderModalOpen(true); };
    const handleConfirmCreateFolder = (e) => { e.preventDefault(); if (!newFolderName.trim()) return; const newFolder = { id: Date.now().toString(), name: newFolderName, type: activeTab === 'monsters' ? 'statblock' : 'item', parentId: currentFolderId }; saveFolders([...folders, newFolder]); setIsFolderModalOpen(false); };
    const handleCreateFolder = (name, type, parentId) => { const newFolder = { id: Date.now().toString(), name, type, parentId }; saveFolders([...folders, newFolder]); };
    
    const handleDeleteItems = (type, ids) => { 
        if (activeTab === 'monsters') { if (confirm(`Delete ${ids.length} monsters?`)) saveMonsters(monsters.filter(m => !ids.includes(m.id))); } 
        else if (activeTab === 'items') { if (confirm(`Delete ${ids.length} items?`)) saveItems(items.filter(m => !ids.includes(m.id))); }
        else { if (confirm(`Delete ${ids.length} encounters?`)) saveEncounters(encounters.filter(e => !ids.includes(e.id))); }
    };
    
    const handleDeleteFolder = (folderId) => { 
        const getSubIds = (id) => [id, ...folders.filter(f => f.parentId === id).flatMap(c => getSubIds(c.id))]; 
        if (confirm("Delete folder and contents?")) { 
            const idsToDelete = getSubIds(folderId); 
            const newFoldersList = folders.filter(f => !idsToDelete.includes(f.id)); 
            const newMonstersList = monsters.filter(m => !idsToDelete.includes(m.folderId)); 
            const newItemsList = items.filter(i => !idsToDelete.includes(i.folderId));
            saveData(newMonstersList, newItemsList, newFoldersList); 
        } 
    };
    
    const handleMoveItems = (itemIds, type, targetFolderId) => { 
        if (type === 'statblock') saveMonsters(monsters.map(m => itemIds.includes(m.id) ? { ...m, folderId: targetFolderId } : m)); 
        if (type === 'item') saveItems(items.map(i => itemIds.includes(i.id) ? { ...i, folderId: targetFolderId } : i));
    };

    // DM Screen Handlers (Kun for monsters indtil videre)
    const addToScreen = (monster) => { if (!screenMonsters.some(m => m.id === monster.id)) setScreenMonsters([...screenMonsters, { ...monster, scale: 0.8 }]); };
    const removeFromScreen = (id) => { setScreenMonsters(screenMonsters.filter(m => m.id !== id)); };
    const handleResizeStart = (e, id, currentScale) => { e.preventDefault(); e.stopPropagation(); const startY = e.clientY; const startScale = currentScale || 0.8; const onMouseMove = (moveEvent) => { const deltaY = moveEvent.clientY - startY; const newScale = Math.max(0.4, Math.min(2.0, startScale + (deltaY * 0.003))); setScreenMonsters(prev => prev.map(m => m.id === id ? { ...m, scale: newScale } : m)); }; const onMouseUp = () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); }; window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp); };

    // --- RENDER ---
    if (view === 'editor') return <StatBlockEditor initialData={currentEditItem} onSave={handleSaveFromEditor} onCancel={() => setView('list')} />;
    if (view === 'item_editor') return <ItemStatBlockEditor initialData={currentEditItem} onSave={handleSaveItemFromEditor} onCancel={() => setView('list')} />;

    if (view === 'encounter_builder') {
        return <EncounterBuilder library={monsters} initialData={currentEditItem} onSave={handleSaveEncounter} onDelete={handleDeleteEncounter} onBack={() => setView('list')} />;
    }

    if (view === 'screen') {
        const filteredLibrary = monsters.filter(m => m.name.toLowerCase().includes(screenSearch.toLowerCase()));
        return (
            <div className="flex h-screen bg-slate-900 overflow-hidden text-slate-200 font-sans">
                <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                        <button onClick={() => setView('list')} className="mb-4 text-xs flex items-center gap-2 text-slate-400 hover:text-white"><Icon path={Icons.ArrowLeft}/> Back to Library</button>
                        <h2 className="font-bold text-amber-500 font-serif-dnd text-xl mb-2">DM Screen</h2>
                        <div className="relative">
                            <Icon path={Icons.Search} className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/>
                            <input type="text" placeholder="Search library..." className="w-full bg-slate-900 border border-slate-600 rounded pl-9 pr-2 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none" value={screenSearch} onChange={e => setScreenSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredLibrary.map(m => (
                            <button key={m.id} onClick={() => addToScreen(m)} className="w-full text-left p-3 rounded hover:bg-slate-700 border border-transparent hover:border-slate-600 flex justify-between items-center group transition-all">
                                <div><div className="font-bold text-slate-200 text-sm">{m.name}</div><div className="text-[10px] text-slate-500 truncate w-40">{m.meta}</div></div>
                                <div className="text-amber-500 opacity-0 group-hover:opacity-100"><Icon path={Icons.Plus} /></div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-[#1a1d23] relative">
                    <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                    {screenMonsters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                            <Icon path={Icons.Builder} className="w-16 h-16 opacity-20"/>
                            <p>Select monsters from the left to pin them here.</p>
                        </div>
                    ) : (
                        <div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
                            {screenMonsters.map(m => (
                                <div key={m.id} className="relative group break-inside-avoid shadow-2xl transition-all">
                                    <button onClick={() => removeFromScreen(m.id)} className="absolute -top-3 -right-3 bg-red-600 text-white p-1.5 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:scale-110"><Icon path={Icons.Trash} className="w-3 h-3"/></button>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 z-20 cursor-se-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeStart(e, m.id, m.scale)}>
                                        <div className="bg-slate-900/80 text-white rounded-tl-lg p-0.5"><ResizeHandle className="w-4 h-4 text-amber-500" /></div>
                                    </div>
                                    <StatBlockDisplay data={m} scale={m.scale || 0.8} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // MAIN LIST VIEW
    return (
        <div className="max-w-7xl mx-auto p-6 font-sans text-slate-200 relative">
            
            {/* NOTIFICATION */}
            {notification && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] z-50 animate-bounce font-bold tracking-wide border border-emerald-400 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {notification}
                </div>
            )}

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 border-b border-slate-700/50 pb-6">
                
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Back to Home"><Icon path={Icons.ArrowLeft} /></button>
                        <div className="h-8 w-px bg-slate-700 hidden md:block"></div>
                        <h1 className="text-3xl font-serif font-bold text-slate-100 flex items-center gap-3">
                            <Icon path={Icons.Builder} className="w-8 h-8 text-blue-500" /> Stat Block Library
                        </h1>
                    </div>

                    {/* --- TABS --- */}
                    <div className="flex gap-4 pl-14">
                        <button onClick={() => { setActiveTab('monsters'); setCurrentFolderId(null); }} className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'monsters' ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Monsters</button>
                        <button onClick={() => { setActiveTab('items'); setCurrentFolderId(null); }} className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'items' ? 'text-purple-400 border-purple-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Items</button>
                        <button onClick={() => { setActiveTab('encounters'); setCurrentFolderId(null); }} className={`pb-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'encounters' ? 'text-red-400 border-red-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>Encounters</button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 items-end w-full md:w-auto">
                    <div className="flex flex-wrap items-center gap-2 justify-end w-full">
                        <button onClick={() => setView('screen')} className="flex items-center gap-2 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded text-sm shadow border border-amber-600 whitespace-nowrap transition-colors"><Icon path={Icons.Text} /> DM Screen</button>
                        <div className="w-px h-6 bg-slate-700 mx-1"></div>
                        {(activeTab === 'monsters' || activeTab === 'items') && (
                            <button onClick={openCreateFolderModal} className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-sm shadow border border-slate-500 whitespace-nowrap transition-colors"><Icon path={Icons.FolderPlus || Icons.Plus} /> New Folder</button>
                        )}
                        
                        <button onClick={handleCreateNew} className={`flex items-center gap-2 px-4 py-1.5 text-white font-bold rounded text-sm shadow-lg whitespace-nowrap transition-all hover:scale-105 ${activeTab === 'monsters' ? 'bg-blue-600 hover:bg-blue-500' : activeTab === 'items' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-red-600 hover:bg-red-500'}`}>
                            <Icon path={Icons.Plus} /> {activeTab === 'monsters' ? 'New Monster' : activeTab === 'items' ? 'New Item' : 'New Encounter'}
                        </button>
                    </div>

                    <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <button onClick={handleExportAll} className="flex items-center gap-2 px-2 py-1 text-slate-400 hover:text-white text-xs transition-colors hover:underline"><Icon path={Icons.Download} size={12}/> Backup</button>
                        <span className="text-slate-600">•</span>
                        <button onClick={() => document.getElementById('import-statblocks').click()} className="flex items-center gap-2 px-2 py-1 text-slate-400 hover:text-white text-xs transition-colors hover:underline"><Icon path={Icons.Upload} size={12}/> Import</button>
                        <input type="file" id="import-statblocks" className="hidden" accept=".json" onChange={handleImport} />
                    </div>
                </div>
            </header>

            {/* FILE BROWSER */}
            <div className="min-h-[400px]">
                
                {/* --- MONSTERS TAB --- */}
                {activeTab === 'monsters' && (
                    <FileBrowser
                        items={monsters}
                        folders={folders}
                        type="statblock"
                        currentFolderId={currentFolderId}
                        setCurrentFolderId={setCurrentFolderId}
                        onCreateFolder={handleCreateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onDeleteItems={handleDeleteItems}
                        onMoveItems={handleMoveItems}
                        allowUpload={false}
                        renderItem={(monster) => (
                            <div onClick={(e) => { e.stopPropagation(); handleEditItem(monster); }} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-all cursor-pointer h-full flex flex-col group relative shadow-sm hover:shadow-md">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                
                                <button 
                                    onClick={(e) => handleAddToCombat(e, monster)}
                                    className="absolute bottom-2 right-2 p-2 bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-full transition-colors shadow-lg z-20 border border-slate-600"
                                    title="Send to CombatFlow"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/>
                                        <path d="M13 19l6 2l3-3l-2-6l-7-1"/>
                                        <path d="M8 16l2-2"/>
                                    </svg>
                                </button>

                                <div className="pl-2">
                                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-slate-100 truncate pr-10 group-hover:text-blue-400 transition-colors">{monster.name || "Unnamed"}</h3></div>
                                    <div className="text-xs text-slate-400 italic mb-4 truncate border-b border-slate-700 pb-2 pr-12">{monster.meta || "No details"}</div>
                                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                        <div><span className="text-[10px] uppercase text-slate-500 font-bold block">AC</span><span className="text-slate-200 font-mono font-bold text-sm">{monster.ac || 10}</span></div>
                                        <div><span className="text-[10px] uppercase text-slate-500 font-bold block">HP</span><span className="text-green-400 font-mono font-bold text-sm">{monster.hp ? monster.hp.split(' ')[0] : 10}</span></div>
                                        <div><span className="text-[10px] uppercase text-slate-500 font-bold block">CR</span><span className="text-yellow-400 font-mono font-bold text-sm">{monster.props?.challenge ? monster.props.challenge.split(' ')[0] : '-'}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}

                {/* --- ITEMS TAB (NY) --- */}
                {activeTab === 'items' && (
                    <FileBrowser
                        items={items}
                        folders={folders}
                        type="item"
                        currentFolderId={currentFolderId}
                        setCurrentFolderId={setCurrentFolderId}
                        onCreateFolder={handleCreateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onDeleteItems={handleDeleteItems}
                        onMoveItems={handleMoveItems}
                        allowUpload={false}
                        renderItem={(item) => (
                            <div onClick={(e) => { e.stopPropagation(); handleEditItem(item); }} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-purple-500 transition-all cursor-pointer h-full flex flex-col group relative shadow-sm hover:shadow-md">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-600 rounded-l-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                <div className="pl-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-slate-100 truncate pr-2 group-hover:text-purple-400 transition-colors">{item.name || "Unnamed"}</h3>
                                    </div>
                                    <div className="text-xs text-slate-400 italic mb-2 truncate border-b border-slate-700 pb-2">
                                        {item.type}, {item.rarity}
                                    </div>
                                    <div className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed">
                                        {item.description || "No description."}
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}

                {/* --- ENCOUNTERS TAB --- */}
                {activeTab === 'encounters' && (
                    <FileBrowser
                        items={encounters.map(e => ({ ...e, type: 'encounter', folderId: e.folderId || null }))}
                        folders={[]} 
                        type="encounter"
                        currentFolderId={null} 
                        setCurrentFolderId={() => {}}
                        onCreateFolder={() => {}}
                        onDeleteFolder={() => {}}
                        onDeleteItems={handleDeleteItems}
                        onMoveItems={() => {}}
                        allowUpload={false}
                        renderItem={(enc) => {
                            const totalEnemies = (enc.enemies || []).reduce((sum, m) => sum + (m.count || 1), 0);
                            const totalAllies = (enc.friendlies || []).reduce((sum, m) => sum + (m.count || 1), 0);
                            return (
                                <div onClick={(e) => { e.stopPropagation(); handleEditItem(enc); }} className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-red-500 transition-all cursor-pointer h-full flex flex-col group relative shadow-sm hover:shadow-md min-h-[180px]">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-red-600 rounded-l-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                                    <button onClick={(e) => handleSendEncounter(e, enc)} className="absolute bottom-2 right-2 p-2 bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-full transition-colors shadow-lg z-20 border border-slate-600" title="Send to CombatFlow">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6 2l3-3l-2-6l-7-1"/><path d="M8 16l2-2"/></svg>
                                    </button>
                                    <div className="pl-2 flex flex-col h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg text-slate-100 truncate pr-2 group-hover:text-red-400 transition-colors">{enc.name}</h3></div>
                                            <div className="text-xs text-slate-400 italic truncate border-b border-slate-700 pb-2">{enc.partySize} Players Party</div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-center mt-auto mb-8 w-full">
                                            <div><span className="text-[10px] uppercase text-slate-500 font-bold block">Enemies</span><span className="text-red-400 font-mono font-bold text-sm">{totalEnemies}</span></div>
                                            <div className="border-l border-slate-700"><span className="text-[10px] uppercase text-slate-500 font-bold block">Allies</span><span className="text-emerald-400 font-mono font-bold text-sm">{totalAllies}</span></div>
                                            <div className="border-l border-slate-700"><span className="text-[10px] uppercase text-slate-500 font-bold block">Level</span><span className="text-amber-400 font-mono font-bold text-sm">{enc.partyLevel}</span></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
                    />
                )}
            </div>

            {/* FOLDER MODAL */}
            {isFolderModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-100 mb-4">Create New Folder</h3>
                        <form onSubmit={handleConfirmCreateFolder}>
                            <input autoFocus type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-slate-200 focus:outline-none focus:border-blue-500 mb-4" placeholder="Folder Name" />
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsFolderModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatBlockManager;