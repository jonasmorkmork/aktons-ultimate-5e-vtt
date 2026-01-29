import { useState } from 'react';
import { exportDataToZip, importDataFromZip } from './ZipUtils';

// --- DB HELPERS (Disse SKAL have 'export' foran sig) ---
const dbName = "VTT_Database";
const storeName = "vtt_store";

const openDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

// VIGTIGT: export her
export const dbSave = async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

// VIGTIGT: export her
export const dbGet = async (key) => {
    const db = await openDB();
    return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
};

const mergeItems = (currentList, newList) => {
    const mergedMap = new Map(currentList.map(item => [item.id, item]));
    newList.forEach(item => mergedMap.set(item.id, item));
    return Array.from(mergedMap.values());
};

// --- HOOK ---
export const useDataManagement = ({ maps, tokens, battlefields, folders, setMaps, setTokens, setBattlefields, setFolders }) => {
    
    const [importState, setImportState] = useState({ 
        isOpen: false, 
        step: 'idle', 
        progress: 0, 
        message: '',
        stats: { battlefields: 0, maps: 0, tokens: 0, folders: 0 },
        pendingData: null
    });

    const handleExport = async (type, id = null) => {
        try {
            if (type === 'all') {
                const data = { maps, battlefields, folders, tokens };
                await exportDataToZip(data, "AktonVTT_FullBackup_" + new Date().toISOString().slice(0, 10));
            } else if (type === 'battlefield' && id) {
                const bf = battlefields.find(b => b.id === id);
                if (bf) await exportDataToZip(bf, bf.name);
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data.");
        }
    };

    const handleImport = async (e) => {
        const file = e.target && e.target.files ? e.target.files[0] : e;
        if (!file) return;
        if (e.target) e.target.value = null;

        try {
            let importedData;

            if (file.name.endsWith('.zip')) {
                importedData = await importDataFromZip(file);
            } else if (file.name.endsWith('.json')) {
                const text = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsText(file);
                });
                const parsed = JSON.parse(text);
                importedData = (parsed.id && parsed.layers && !parsed.battlefields) 
                    ? { battlefields: [parsed] } 
                    : parsed;
            } else {
                alert("Please upload a .zip or .json file");
                return;
            }

            if (!importedData) return;

            const stats = {
                battlefields: importedData.battlefields?.length || 0,
                maps: importedData.maps?.length || 0,
                tokens: importedData.tokens?.length || 0,
                folders: importedData.folders?.length || 0
            };

            setImportState({
                isOpen: true,
                step: 'confirm',
                progress: 0,
                message: 'Waiting for confirmation...',
                stats,
                pendingData: importedData
            });

        } catch (err) {
            console.error("Import read error:", err);
            alert("Failed to read file.");
        }
    };

    const confirmImport = async () => {
        const importedData = importState.pendingData;
        if (!importedData) return;

        try {
            setImportState(prev => ({ ...prev, step: 'processing', progress: 10, message: 'Preparing data...' }));
            await new Promise(r => setTimeout(r, 100));

            const finalMaps = importedData.maps ? mergeItems(maps, importedData.maps) : maps;
            setImportState(prev => ({ ...prev, progress: 30, message: `Merging ${finalMaps.length} maps...` }));
            
            const finalTokens = importedData.tokens ? mergeItems(tokens, importedData.tokens) : tokens;
            setImportState(prev => ({ ...prev, progress: 50, message: `Merging ${finalTokens.length} tokens...` }));
            
            const finalFolders = importedData.folders ? mergeItems(folders, importedData.folders) : folders;
            const finalBattlefields = importedData.battlefields ? mergeItems(battlefields, importedData.battlefields) : battlefields;

            setMaps(finalMaps);
            setTokens(finalTokens);
            setBattlefields(finalBattlefields);
            setFolders(finalFolders);
            
            setImportState(prev => ({ ...prev, progress: 60, message: 'Saving Maps to Database...' }));
            await dbSave('vtt_maps', finalMaps);
            
            setImportState(prev => ({ ...prev, progress: 80, message: 'Saving Tokens to Database...' }));
            await dbSave('vtt_tokens', finalTokens);
            
            setImportState(prev => ({ ...prev, progress: 90, message: 'Saving Battlefields...' }));
            await Promise.all([
                dbSave('vtt_battlefields', finalBattlefields),
                dbSave('vtt_folders', finalFolders)
            ]);

            setImportState(prev => ({ ...prev, progress: 100, message: 'Import Complete!' }));
            
            setTimeout(() => {
                cancelImport();
            }, 800);

        } catch (err) {
            console.error("Import processing error:", err);
            cancelImport();
            alert("Failed to process import.");
        }
    };

    const cancelImport = () => {
        setImportState({
            isOpen: false,
            step: 'idle',
            progress: 0,
            message: '',
            stats: { battlefields: 0, maps: 0, tokens: 0, folders: 0 },
            pendingData: null
        });
    };

    return { handleExport, handleImport, confirmImport, cancelImport, importState };
};