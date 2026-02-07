import { db } from '../firebase'; 
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore'; 

// --- HELPER: SANITIZE DATA ---
const sanitizeData = (obj) => {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (value === undefined) return null;
        return value;
    }));
};

// --- HELPER: CONVERT CHARACTER TO COMBATANT ---
export const convertToCombatant = (char, uid) => {
    const data = char.liveData || char;
    
    const getStat = (name, shortName) => {
        if (data.stats) {
            if (data.stats[name] !== undefined) return parseInt(data.stats[name]);
            if (data.stats[shortName] !== undefined) {
                const val = data.stats[shortName];
                return typeof val === 'object' ? parseInt(val.val || val.value || 10) : parseInt(val);
            }
        }
        if (data[name] !== undefined) return parseInt(data[name]);
        if (data[shortName] !== undefined) return parseInt(data[shortName]);
        return 10;
    };

    const dex = getStat('dexterity', 'DEX');
    const dexMod = Math.floor((dex - 10) / 2);
    
    let maxHp = 10;
    let currentHp = 10;
    let tempHp = 0;

    if (data.hit_points) {
        maxHp = parseInt(data.hit_points);
        currentHp = maxHp;
    }
    else if (data.hp) {
        if (typeof data.hp === 'object') {
            maxHp = parseInt(data.hp.max || 10);
            currentHp = parseInt(data.hp.current !== undefined ? data.hp.current : maxHp);
            tempHp = parseInt(data.hp.temp || 0);
        } else {
            const parsed = parseInt(data.hp);
            maxHp = isNaN(parsed) ? 10 : parsed;
            currentHp = maxHp;
        }
    } 
    else if (data.maxHp) {
        maxHp = parseInt(data.maxHp);
        currentHp = maxHp;
    }

    const ac = parseInt(data.ac || data.armor_class || 10);

    const combatant = {
        id: uid || (data.id ? String(data.id) : (Date.now().toString() + Math.random().toString().slice(2, 8))), 
        linkedId: uid || null, 
        name: data.name || "Unknown Entity",
        type: uid ? 'player' : 'enemy',
        ac: ac,
        maxHp: maxHp,
        hp: currentHp,
        tempHp: tempHp,
        bonus: dexMod, 
        dc: parseInt(data.dc || 10),
        xp: parseInt(data.xp || 0),
        initiative: 0,
        image: data.image || data.token || data.img || null
    };

    return combatant;
};

// --- HELPER: FORMAT ITEM FOR SHEET ---
const formatItemForSheet = (input) => {
    if (!input) return { id: Date.now(), name: "Empty Item", category: "items", quantity: 1 };

    let data = input;
    if (!data.name && !data.Name) {
        if (input.item) data = input.item;
        else if (input.data) data = input.data;
    }

    const name = data.name || data.Name || data.title || `Item ${Date.now()}`;
    let fullDescription = data.description || data.desc || data.text || "";
    
    if (data.mechanics && Array.isArray(data.mechanics) && data.mechanics.length > 0) {
        const mechanicsText = data.mechanics
            .map(m => `${m.name ? '**' + m.name + '**: ' : ''}${m.desc}`)
            .join('\n\n');
        if (fullDescription) fullDescription += '\n\n';
        fullDescription += mechanicsText;
    }

    let sheetCategory = 'items'; 
    let typeLower = (data.type || data.category || "").toString().toLowerCase();

    if (typeLower.includes('weapon') || data.damage) sheetCategory = 'weapons';
    else if (typeLower.includes('armor') || typeLower.includes('shield') || ['light', 'medium', 'heavy'].includes(typeLower)) sheetCategory = 'armor';

    let item = {
        id: Date.now() + Math.random(),
        name: name,
        description: fullDescription,
        category: sheetCategory,
        quantity: parseInt(data.quantity || 1),
        requiresAttunement: data.attunement || data.requiresAttunement || false,
        attuned: false,
        addedFromApi: true,
        rarity: data.rarity || "",
        originalType: data.type || "Wondrous Item"
    };

    if (sheetCategory === 'weapons') {
        item.damage = data.damage || "1d4";
        item.damageType = data.damageType || "";
        item.weaponCategory = data.weaponCategory || "Simple";
        item.properties = data.properties || "";
        item.mastery = data.mastery || ""; 
        item.stat = (item.properties.toLowerCase().includes('finesse')) ? 'dexterity' : 'strength';
        item.isProficient = true; 
    } 
    else if (sheetCategory === 'armor') {
        if (typeLower.includes('shield')) item.category = 'Shield';
        else if (data.category && ['Light', 'Medium', 'Heavy'].includes(data.category)) item.category = data.category;
        else item.category = "Light";
        item.ac = (data.ac || 10).toString();
        item.stealthDis = data.stealthDis === true;
    }

    return item;
};

// --- LOGIC: ADD SINGLE MONSTER TO LIBRARY ---
export const sendCharacterToCombat = async (currentUser, char, uid) => {
    if (!currentUser) return false;
    try {
        const rawCombatant = convertToCombatant(char, uid);
        const combatant = sanitizeData(rawCombatant);
        const libRef = doc(db, 'users', currentUser.uid, 'combat', 'library'); 
        
        await runTransaction(db, async (transaction) => {
            const libDoc = await transaction.get(libRef);
            let currentItems = libDoc.exists() ? (libDoc.data().items || []) : [];
            
            if (uid) {
                const idx = currentItems.findIndex(c => c.linkedId === uid);
                if (idx >= 0) currentItems[idx] = combatant; 
                else currentItems.push(combatant);
            } else {
                const idx = currentItems.findIndex(c => String(c.id) === String(combatant.id));
                if (idx >= 0) currentItems[idx] = combatant;
                else currentItems.push(combatant);
            }
            transaction.set(libRef, { items: currentItems }, { merge: true });
        });
        return true; 
    } catch (e) {
        console.error("Error sending to library:", e);
        return false; 
    }
};

// --- LOGIC: SEND ENCOUNTER TO PRESETS & LIBRARY ---
export const addEncounterToCombat = async (currentUser, encounter) => {
    if (!currentUser || !encounter) return false;
    try {
        const libRef = doc(db, 'users', currentUser.uid, 'combat', 'library'); 
        const presetsRef = doc(db, 'users', currentUser.uid, 'combat', 'presets');
        
        const monsterList = encounter.enemies || encounter.monsters || [];
        const newLibraryEntries = []; 
        const presetMonstersRef = [];

        monsterList.forEach(enemy => {
            const combatant = convertToCombatant(enemy, null);
            if (enemy.id) combatant.id = String(enemy.id);
            newLibraryEntries.push(sanitizeData(combatant));
            presetMonstersRef.push({
                libId: combatant.id, 
                name: combatant.name,
                count: parseInt(enemy.count || 1),
                type: 'enemy'
            });
        });

        if (presetMonstersRef.length === 0) return false;

        await runTransaction(db, async (transaction) => {
            const libDoc = await transaction.get(libRef);
            const presetsDoc = await transaction.get(presetsRef);
            
            let libraryItems = libDoc.exists() ? (libDoc.data().items || []) : [];
            let presetItems = presetsDoc.exists() ? (presetsDoc.data().items || []) : [];

            newLibraryEntries.forEach(entry => {
                const idx = libraryItems.findIndex(i => String(i.id) === String(entry.id));
                if (idx >= 0) libraryItems[idx] = entry; 
                else libraryItems.push(entry); 
            });

            const newPreset = {
                id: encounter.id ? String(encounter.id) : Date.now().toString(),
                name: encounter.name || "New Encounter",
                monsters: presetMonstersRef
            };

            const pIdx = presetItems.findIndex(p => String(p.id) === String(newPreset.id));
            if (pIdx >= 0) presetItems[pIdx] = newPreset;
            else presetItems.push(newPreset);

            transaction.set(libRef, { items: libraryItems }, { merge: true });
            transaction.set(presetsRef, { items: presetItems }, { merge: true });
        });
        return true;
    } catch (e) {
        console.error("Error saving encounter:", e);
        return false;
    }
};

// --- LOGIC: SYNC PARTY ---
export const syncPartyToCombat = async (currentUser, playerCharacters) => {
    if (!playerCharacters || !currentUser) return false;
    try {
        const libRef = doc(db, 'users', currentUser.uid, 'combat', 'library');
        const presetsRef = doc(db, 'users', currentUser.uid, 'combat', 'presets');
        
        const partyCombatants = Object.entries(playerCharacters).map(([uid, p]) => {
            const c = convertToCombatant(p, uid);
            return sanitizeData(c);
        });

        const partyPresetRefs = partyCombatants.map(c => ({
            libId: c.id,
            name: c.name,
            count: 1,
            type: 'player'
        }));

        await runTransaction(db, async (transaction) => {
            const libDoc = await transaction.get(libRef);
            const presetsDoc = await transaction.get(presetsRef);
            
            let currentLib = libDoc.exists() ? (libDoc.data().items || []) : [];
            let currentPresets = presetsDoc.exists() ? (presetsDoc.data().items || []) : [];
            
            partyCombatants.forEach(pc => {
                const idx = currentLib.findIndex(l => l.linkedId === pc.linkedId);
                if (idx >= 0) currentLib[idx] = pc;
                else currentLib.push(pc);
            });
    
            const presetName = "Party"; 
            const cleanPresets = currentPresets.filter(p => p.name !== presetName);
            const newPreset = { id: 'party_preset', name: presetName, monsters: partyPresetRefs };
            
            transaction.set(libRef, { items: currentLib }, { merge: true });
            transaction.set(presetsRef, { items: [...cleanPresets, newPreset] }, { merge: true });
        });
        return true;
    } catch (e) {
        console.error("Party sync error:", e);
        return false;
    }
};

// --- LOGIC: SYNC HP (FIXED & IMPROVED) ---
export const syncHpToCombat = async (currentUser, campaignData, role, currentHp, maxHp, tempHp, targetUid) => {
    // 1. Basic checks
    if (!campaignData || !campaignData.dmId || !currentUser) return;

    const combatRef = doc(db, 'users', campaignData.dmId, 'combat', 'active');
    
    // 2. Determine who we are syncing FOR.
    // Hvis targetUid er sat (fra Inspect Mode), brug den. Ellers brug currentUser (Spiller).
    const syncTargetId = targetUid || currentUser.uid;

    try {
        await runTransaction(db, async (transaction) => {
            const combatDoc = await transaction.get(combatRef);
            if (!combatDoc.exists()) return;

            const data = combatDoc.data();
            const combatants = data.combatants || [];
            let hasChanges = false;

            const updatedCombatants = combatants.map(c => {
                // 3. Match Logic: Find combatant der tilhører syncTargetId
                if (c.linkedId === syncTargetId) {
                    
                    // 4. Permission Check: Må JEG opdatere denne?
                    const isOwner = currentUser.uid === syncTargetId;
                    const isDM = currentUser.uid === campaignData.dmId;

                    if (isOwner || isDM) {
                        if (c.hp !== currentHp || c.maxHp !== maxHp || c.tempHp !== tempHp) {
                            hasChanges = true;
                            return { ...c, hp: currentHp, maxHp: maxHp, tempHp: tempHp };
                        }
                    } else {
                        console.warn("Permission denied for HP sync.");
                    }
                }
                return c;
            });

            if (hasChanges) {
                transaction.update(combatRef, { combatants: updatedCombatants });
                console.log(`HP Synced for ${syncTargetId} by ${currentUser.uid}`);
            }
        });
    } catch (e) {
        if (e.code !== 'permission-denied') console.error("HP Sync Failed:", e);
    }
};

// --- LOGIC: SEND ITEM ---
export const sendItemToCharacter = async (campaignData, arg1, arg2) => {
    if (!campaignData) return { success: false, message: "No active campaign" };
    
    let targetUid, rawItem;
    if (typeof arg1 === 'string') { targetUid = arg1; rawItem = arg2; } 
    else if (typeof arg2 === 'string') { targetUid = arg2; rawItem = arg1; } 
    else return { success: false, message: "Invalid arguments" };

    if (!rawItem) return { success: false, message: "Missing item data" };
    
    try {
        const targetChar = campaignData.playerCharacters?.[targetUid];
        if (!targetChar) return { success: false, message: "Character not found" };

        const charRef = doc(db, "users", targetUid, "data", "characters");
        const charDoc = await getDoc(charRef);
        
        if (!charDoc.exists()) return { success: false, message: "Player data not found" };

        const userChars = charDoc.data().list || [];
        const charIndex = userChars.findIndex(c => c.id === targetChar.id);

        if (charIndex === -1) return { success: false, message: "Character deleted by player" };

        const rawItemToSend = formatItemForSheet(rawItem);
        const itemToSend = sanitizeData(rawItemToSend);

        const updatedChar = { ...userChars[charIndex] };
        const inv = updatedChar.inventory || { items: [] };
        
        let listKey = 'items';
        if (itemToSend.category === 'weapons') listKey = 'weapons';
        else if (['armor', 'Shield', 'Light', 'Medium', 'Heavy'].includes(itemToSend.category)) listKey = 'armor';

        if (!inv[listKey]) inv[listKey] = [];
        inv[listKey].push(itemToSend);
        
        updatedChar.inventory = inv;
        userChars[charIndex] = updatedChar;

        await updateDoc(charRef, { list: userChars });
        return { success: true, message: `Sent ${itemToSend.name} to ${targetChar.name}!` };

    } catch (e) {
        console.error("Error sending item:", e);
        return { success: false, message: `Error: ${e.message}` };
    }
};