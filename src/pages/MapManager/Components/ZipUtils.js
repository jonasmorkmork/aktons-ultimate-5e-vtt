import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- HELPERS ---
const dataURLtoBlob = (dataurl) => {
    if (!dataurl || !dataurl.startsWith('data:')) return null;
    try {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        return new Blob([u8arr], { type: mime });
    } catch (e) { console.warn("Blob error", e); return null; }
};

const blobToDataURL = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const sanitizeFilename = (name) => {
    if (!name) return "unnamed";
    return name.replace(/[^a-z0-9.]/gi, '_').replace(/_+/g, '_');
};

// ==========================================
// 1. SMART EXPORT (Universal)
// ==========================================
export const exportDataToZip = async (data, filename = "backup") => {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");
    const dataCopy = JSON.parse(JSON.stringify(data));
    const uniqueContentMap = new Map(); 

    const processImageField = (item, field, prefix) => {
        const base64Data = item[field];
        if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image')) return;

        if (uniqueContentMap.has(base64Data)) {
            item[field] = uniqueContentMap.get(base64Data);
            item.isZipped = true;
        } else {
            const ext = base64Data.includes('image/png') ? 'png' : 'jpg';
            const safeName = sanitizeFilename(item.name || item.id);
            const shortId = item.id ? item.id.substring(0, 5) : Math.random().toString(36).substr(2, 5);
            const imgName = `${prefix}_${safeName}_${shortId}.${ext}`;
            
            const blob = dataURLtoBlob(base64Data);
            if (blob) {
                imagesFolder.file(imgName, blob);
                const imagePath = `images/${imgName}`;
                uniqueContentMap.set(base64Data, imagePath);
                item[field] = imagePath;
                item.isZipped = true;
            }
        }
    };

    // Process alt indhold
    if (dataCopy.maps) dataCopy.maps.forEach(m => { processImageField(m, 'dataUrl', 'Map'); delete m.thumbnail; });
    if (dataCopy.tokens) dataCopy.tokens.forEach(t => { processImageField(t, 'dataUrl', 'Token'); delete t.thumbnail; });
    
    // Håndter enkelt battlefield eller array af battlefields
    const bfs = Array.isArray(dataCopy.battlefields) ? dataCopy.battlefields : (dataCopy.id ? [dataCopy] : []);
    
    bfs.forEach(bf => {
        delete bf.mapThumbnail; 
        if (bf.layers) bf.layers.forEach(l => processImageField(l, 'mapData', 'Layer'));
        if (bf.tokens) bf.tokens.forEach(t => { processImageField(t, 'image', 'BF_Token'); delete t.thumbnail; });
    });

    // Hvis det var et enkelt battlefield, pakker vi det stadig ind i en struktur der ligner full backup for nemheds skyld,
    // eller vi kan gemme det som 'data.json' for at gøre importen ensartet.
    const finalJSON = {
        maps: dataCopy.maps || [],
        tokens: dataCopy.tokens || [],
        battlefields: bfs,
        folders: dataCopy.folders || []
    };

    zip.file("data.json", JSON.stringify(finalJSON, null, 2));
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${filename}.zip`);
};

// ==========================================
// 2. SMART IMPORT (Universal)
// ==========================================
export const importDataFromZip = async (file) => {
    console.group("🚀 SMART IMPORT STARTED");
    const zip = await JSZip.loadAsync(file);
    
    // 1. Find hovedfilen (data.json ELLER battlefield.json)
    let jsonFile = zip.file("data.json");
    if (!jsonFile) jsonFile = zip.file("battlefield.json");
    
    if (!jsonFile) {
        console.error("❌ No JSON file found inside ZIP!");
        console.groupEnd();
        throw new Error("Invalid backup file");
    }

    const jsonStr = await jsonFile.async("text");
    let rawData = JSON.parse(jsonStr);
    
    // 2. Normaliser data struktur (så vi altid arbejder med arrays)
    const normalizedData = {
        maps: rawData.maps || [],
        tokens: rawData.tokens || [],
        folders: rawData.folders || [],
        battlefields: []
    };

    // Håndter hvis importen er et enkelt battlefield objekt (ikke pakket i array)
    if (rawData.id && rawData.layers && !rawData.battlefields) {
        console.log("ℹ️ Detected Single Battlefield format");
        normalizedData.battlefields = [rawData];
    } else if (Array.isArray(rawData.battlefields)) {
        console.log(`ℹ️ Detected Full Backup format (${rawData.battlefields.length} battlefields)`);
        normalizedData.battlefields = rawData.battlefields;
    }

    // 3. Avanceret Billede Genskabelse
    // Denne funktion leder efter filen. Hvis stien ikke matcher præcist, leder den efter filnavnet.
    const findAndRestoreImage = async (item, field) => {
        const path = item[field];
        if (!path || typeof path !== 'string' || path.startsWith('data:')) return; // Allerede data eller tomt

        let imgFile = zip.file(path);

        // FALLBACK: Hvis filen ikke findes på den præcise sti, så led efter filnavnet
        if (!imgFile) {
            const filename = path.split('/').pop(); // F.eks. "Map_Sekor_4.jpg"
            // Led i 'images/' og 'assets/' mapperne
            imgFile = zip.file(`images/${filename}`) || zip.file(`assets/${filename}`);
            
            if (imgFile) console.log(`   🔧 Fixed broken path: "${path}" -> Found at new location.`);
        }

        if (imgFile) {
            try {
                const blob = await imgFile.async("blob");
                const base64 = await blobToDataURL(blob);
                item[field] = base64; // Overskriv stien med billeddata
            } catch (err) {
                console.error(`   ❌ Failed to unzip: ${path}`, err);
            }
        } else {
            console.warn(`   ⚠️ Image NOT FOUND in zip: ${path}`);
        }
    };

    // 4. Kør genskabelse på alt
    console.log("🔄 Restoring Maps...");
    for (const m of normalizedData.maps) {
        await findAndRestoreImage(m, 'dataUrl');
        if (!m.thumbnail) m.thumbnail = m.dataUrl;
    }

    console.log("🔄 Restoring Library Tokens...");
    for (const t of normalizedData.tokens) {
        await findAndRestoreImage(t, 'dataUrl');
        if (!t.thumbnail) t.thumbnail = t.dataUrl;
    }

    console.log("🔄 Restoring Battlefields...");
    for (const bf of normalizedData.battlefields) {
        // Genskab layers (baggrundskort)
        if (bf.layers) {
            for (const l of bf.layers) await findAndRestoreImage(l, 'mapData');
        }
        // Genskab tokens på brættet
        if (bf.tokens) {
            for (const t of bf.tokens) {
                await findAndRestoreImage(t, 'image');
                if (!t.thumbnail && t.image) t.thumbnail = t.image;
            }
        }
        // Fix battlefield thumbnail
        if (!bf.mapThumbnail && bf.layers && bf.layers[0]) {
            bf.mapThumbnail = bf.layers[0].mapData;
        }
    }

    console.log("✅ Import Ready:", normalizedData);
    console.groupEnd();
    return normalizedData;
};