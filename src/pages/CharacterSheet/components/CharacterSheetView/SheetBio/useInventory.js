import { useState } from 'react';
// HUSK AT IMPORTERE LOCAL_GEAR HERUNDER:
import { LOCAL_WEAPONS, LOCAL_ARMOR, LOCAL_GEAR } from './WeaponsAndArmor'; 

// --- API HELPER (Robust Version) ---
const searchOpen5e = async (query) => {
    if (!query) return [];
    
    // Vi bruger eksplicitte v1 endpoints for stabilitet
    const endpoints = [
        `https://api.open5e.com/v1/weapons/?search=${encodeURIComponent(query)}`,
        `https://api.open5e.com/v1/armor/?search=${encodeURIComponent(query)}`,
        `https://api.open5e.com/v1/magicitems/?search=${encodeURIComponent(query)}`
    ];

    try {
        // Vi wrapper hver fetch i en catch, så én fejl ikke ødelægger hele søgningen
        const promises = endpoints.map(url => 
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    return res.json();
                })
                .catch(err => {
                    console.warn(`API lookup failed for ${url}:`, err);
                    return { results: [] }; // Returner tomt array ved fejl
                })
        );

        const responses = await Promise.all(promises);
        
        let combined = [];
        // Tjekker sikkert om results eksisterer før map
        if (responses[0]?.results) combined = combined.concat(responses[0].results.map(i => ({...i, apiCategory: 'weapons'})));
        if (responses[1]?.results) combined = combined.concat(responses[1].results.map(i => ({...i, apiCategory: 'armor'})));
        if (responses[2]?.results) combined = combined.concat(responses[2].results.map(i => ({...i, apiCategory: 'magicitems'})));
        
        return combined;
    } catch (e) {
        console.error("Open5e search critical error:", e);
        return [];
    }
};

// Hjælpefunktion til at finde i lokale filer
const findLocalItem = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    
    // 1. Exact match
    let match = LOCAL_WEAPONS.find(w => w.name.toLowerCase() === lowerQuery);
    if (match) return { ...match, type: 'weapon', local: true };

    match = LOCAL_ARMOR.find(a => a.name.toLowerCase() === lowerQuery);
    if (match) return { ...match, type: 'armor', local: true };

    // Tjek også gear
    match = LOCAL_GEAR.find(g => g.name.toLowerCase() === lowerQuery);
    if (match) return { ...match, type: 'gear', local: true };

    // 2. Fuzzy match
    match = LOCAL_WEAPONS.find(w => w.name.toLowerCase().includes(lowerQuery));
    if (match) return { ...match, type: 'weapon', local: true };

    match = LOCAL_ARMOR.find(a => a.name.toLowerCase().includes(lowerQuery));
    if (match) return { ...match, type: 'armor', local: true };

    // Tjek også gear fuzzy
    match = LOCAL_GEAR.find(g => g.name.toLowerCase().includes(lowerQuery));
    if (match) return { ...match, type: 'gear', local: true };

    return null;
};

// Mapper et API item til sheet format
const mapApiItemToSheet = (apiItem) => {
    let item = { 
        id: Date.now() + Math.random(), 
        name: apiItem.name, 
        description: apiItem.desc || apiItem.text || "",
        addedFromApi: true 
    };

    // WEAPON
    if (apiItem.apiCategory === 'weapons' || apiItem.damage_dice) {
        item.category = 'weapons';
        item.damage = apiItem.damage_dice || "1d4";
        item.damageType = apiItem.damage_type || "";
        item.properties = Array.isArray(apiItem.properties) ? apiItem.properties.join(", ") : (apiItem.properties || "");
        item.weaponCategory = apiItem.category || "Simple Melee";
        item.stat = (item.properties.toLowerCase().includes('finesse')) ? 'dexterity' : 'strength';
        item.isProficient = true; 
        
        const localMatch = LOCAL_WEAPONS.find(w => w.name === apiItem.name);
        item.mastery = localMatch ? localMatch.mastery : "";
    } 
    // ARMOR / SHIELD
    else if (apiItem.apiCategory === 'armor' || apiItem.ac_string || apiItem.armor_category) {
        item.category = apiItem.armor_category || (apiItem.name.includes('Shield') ? 'Shield' : 'Light');
        const acMatch = (apiItem.ac_string || "").match(/\d+/);
        item.ac = acMatch ? acMatch[0] : (apiItem.armor_class ? apiItem.armor_class.toString() : "10");
        item.stealthDis = apiItem.stealth_disadvantage === true;
    } 
    // MAGIC ITEMS / GEAR
    else {
        item.category = 'items';
        item.type = apiItem.type || "Wondrous Item";
        item.rarity = apiItem.rarity || "";
        item.quantity = 1;
    }

    return item;
};

// Mapper et LOKALT item til sheet format
const mapLocalItemToSheet = (localItem) => {
    const item = {
        id: Date.now() + Math.random(),
        name: localItem.name,
        description: localItem.description || `Cost: ${localItem.cost}, Weight: ${localItem.weight}`,
        addedFromApi: false
    };

    if (localItem.type === 'weapon') {
        item.category = 'weapons';
        item.damage = localItem.damage;
        item.damageType = localItem.damageType;
        
        // FIX: Fjern mastery navnet fra properties listen, så det ikke står to steder
        let cleanProps = localItem.properties;
        if (localItem.mastery) {
            const regex = new RegExp(`(?:^|,\\s*)${localItem.mastery}(?:$|,)`, 'i');
            cleanProps = cleanProps.replace(regex, '').replace(/,\s*$/, '').trim();
            // Fjern leading comma hvis det opstod
            cleanProps = cleanProps.replace(/^,\s*/, '');
        }
        item.properties = cleanProps;

        item.mastery = localItem.mastery || "";
        item.weaponCategory = localItem.category;
        item.stat = (localItem.properties.toLowerCase().includes('finesse')) ? 'dexterity' : 'strength';
        item.isProficient = true;
    } else if (localItem.type === 'armor') {
        item.category = localItem.category; 
        item.ac = localItem.ac.replace(/[^0-9]/g, '') || "10"; 
        item.stealthDis = localItem.stealthDis;
        item.description += localItem.formula ? `. AC Formula: ${localItem.formula}` : "";
    } else if (localItem.type === 'gear') {
        item.category = 'items';
        item.type = "Adventuring Gear";
        // Vi har allerede sat description øverst i funktionen
    }

    return item;
};

// --- HOOK ---
export const useInventory = (character, onUpdate) => {
    const [isImporting, setIsImporting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [apiResults, setApiResults] = useState([]);

    const parseImportText = async (text) => {
        if (!text.trim()) return;
        setIsImporting(true);

        const lines = text.split(/,|\n/).map(s => s.trim()).filter(s => s);
        
        const newWeapons = [];
        const newArmor = [];
        const newItems = [];
        const newCurrency = { ...character.currency };

        for (const line of lines) {
            let itemString = line.trim();

            // 1. Check Currency
            const gpMatch = itemString.match(/(\d+)\s*(?:gp|gold)\b/i);
            const spMatch = itemString.match(/(\d+)\s*(?:sp|silver)\b/i);
            const cpMatch = itemString.match(/(\d+)\s*(?:cp|copper)\b/i);
            const ppMatch = itemString.match(/(\d+)\s*(?:pp|platinum)\b/i);

            if (gpMatch) { newCurrency.gp = (newCurrency.gp || 0) + parseInt(gpMatch[1]); continue; }
            if (spMatch) { newCurrency.sp = (newCurrency.sp || 0) + parseInt(spMatch[1]); continue; }
            if (cpMatch) { newCurrency.cp = (newCurrency.cp || 0) + parseInt(cpMatch[1]); continue; }
            if (ppMatch) { newCurrency.pp = (newCurrency.pp || 0) + parseInt(ppMatch[1]); continue; }

            // 2. Parse Quantity (FIX: Bedre håndtering af "x5" eller "5x")
            let quantity = 1;
            let searchName = itemString;

            // Tjek for "x5" eller "5x" i slutningen
            const suffixMatch = itemString.match(/(.*?)[\s,]+[xX]?(\d+)[xX]?$/);
            // Tjek for "5 daggers" i starten
            const prefixMatch = itemString.match(/^(\d+)[\sxX]+(.*)/);

            if (suffixMatch) {
                searchName = suffixMatch[1].trim();
                quantity = parseInt(suffixMatch[2]);
            } else if (prefixMatch) {
                quantity = parseInt(prefixMatch[1]);
                searchName = prefixMatch[2].trim();
            }

            // --- FLERTALSHÅNDTERING & STAVEFEJL (Armour -> Armor) ---
            let searchCandidates = [searchName.trim()];
            const lowerName = searchName.toLowerCase().trim();
            
            if (lowerName.endsWith('s')) {
                searchCandidates.push(searchName.trim().slice(0, -1));
            }
            if (lowerName.endsWith('es')) {
                searchCandidates.push(searchName.trim().slice(0, -2));
            }
            // Ny: Håndter 'armour' -> 'armor'
            if (lowerName.includes('armour')) {
                searchCandidates.push(searchName.replace(/armour/gi, 'armor').trim());
                // Også håndter flertal af armour hvis relevant (sjældent, men konsistent)
                if (lowerName.endsWith('s')) {
                     searchCandidates.push(searchName.replace(/armour/gi, 'armor').trim().slice(0, -1));
                }
            }

            let processedItem = null;

            // 3a. SØG LOKALT FØRST
            for (const candidate of searchCandidates) {
                const localHit = findLocalItem(candidate);
                if (localHit) {
                    processedItem = mapLocalItemToSheet(localHit);
                    break;
                }
            }

            // 3b. SØG API
            if (!processedItem) {
                for (const term of searchCandidates) {
                    try {
                        const searchRes = await searchOpen5e(term);
                        const match = searchRes.find(r => r.name.toLowerCase() === term.toLowerCase()) || searchRes[0];
                        
                        if (match) {
                            processedItem = mapApiItemToSheet(match);
                            break; 
                        }
                    } catch (err) { }
                }
            }

            // 4. FALLBACK
            if (!processedItem) {
                const lower = itemString.toLowerCase();
                const isWeapon = lower.includes('weapon') || lower.includes('sword') || lower.includes('axe') || lower.includes('bow') || lower.includes('dagger');
                const isArmor = lower.includes('armor') || lower.includes('armour') || lower.includes('shield') || lower.includes('plate') || lower.includes('mail');
                
                processedItem = { 
                    id: Date.now() + Math.random(), 
                    name: searchName, // VIGTIGT: Bruger det rensede navn uden tal
                    description: "", 
                    quantity: quantity 
                };
                
                // Capitalize
                processedItem.name = processedItem.name.charAt(0).toUpperCase() + processedItem.name.slice(1);
                
                if (isWeapon) {
                    processedItem.category = 'weapons';
                    processedItem.damage = "1d6";
                    processedItem.weaponCategory = "Simple";
                    processedItem.mastery = ""; 
                } else if (isArmor) {
                    processedItem.category = 'Light'; 
                    processedItem.ac = "10";
                } else {
                    processedItem.category = 'items';
                    processedItem.type = "Adventuring Gear";
                }
            }

            // Sæt quantity (overskriv API/Local default)
            processedItem.quantity = quantity;

            // BEMÆRK: Vi overskriver IKKE længere processedItem.name med itemString her.
            // Navnet forbliver det "rene" navn (f.eks. "Dagger" eller "Potion"), mens quantity håndterer antallet.

            if (processedItem.category === 'weapons') newWeapons.push(processedItem);
            else if (['Light', 'Medium', 'Heavy', 'Shield'].includes(processedItem.category)) newArmor.push(processedItem);
            else newItems.push(processedItem);
        }

        const currentInv = character.inventory || { weapons: [], armor: [], items: [] };

        onUpdate({
            inventory: {
                weapons: [...(currentInv.weapons || []), ...newWeapons],
                armor: [...(currentInv.armor || []), ...newArmor],
                items: [...(currentInv.items || []), ...newItems]
            },
            currency: newCurrency
        });

        setIsImporting(false);
    };

    const performSearch = async (query) => {
        if (!query.trim()) return;
        setIsSearching(true);
        
        // Håndter britisk stavning i søgning
        let effectiveQuery = query;
        if (effectiveQuery.toLowerCase().includes('armour')) {
            effectiveQuery = effectiveQuery.replace(/armour/gi, 'armor');
        }
        
        const lowerQ = effectiveQuery.toLowerCase();
        const localResults = [];
        
        // Lokal søgning først
        LOCAL_WEAPONS.forEach(w => {
            if (w.name.toLowerCase().includes(lowerQ)) {
                localResults.push({ ...w, apiCategory: 'local-weapon' }); 
            }
        });
        
        LOCAL_ARMOR.forEach(a => {
            if (a.name.toLowerCase().includes(lowerQ)) {
                localResults.push({ ...a, apiCategory: 'local-armor' });
            }
        });

        // NYT: Søg i gear også
        LOCAL_GEAR.forEach(g => {
            if (g.name.toLowerCase().includes(lowerQ)) {
                localResults.push({ ...g, apiCategory: 'local-gear' });
            }
        });

        // API søgning (med fejlhåndtering, så den ikke crasher)
        try {
            // Brug effectiveQuery til API kaldet
            const apiRes = await searchOpen5e(effectiveQuery);
            // Kombiner resultater (Lokale først)
            setApiResults([...localResults, ...apiRes]);
        } catch (error) {
            console.error("Search failed, showing local only", error);
            setApiResults(localResults); 
        } finally {
            // VIGTIGT: Stop loading uanset hvad
            setIsSearching(false);
        }
    };

    const closeSearch = () => {
        setApiResults([]);
        setIsSearching(false);
    };

    const addItemFromApiResult = (result) => {
        let mappedItem;
        let targetListKey = 'items';

        if (result.apiCategory === 'local-weapon') {
            mappedItem = mapLocalItemToSheet({...result, type: 'weapon'});
            targetListKey = 'weapons';
        } else if (result.apiCategory === 'local-armor') {
            mappedItem = mapLocalItemToSheet({...result, type: 'armor'});
            targetListKey = 'armor';
        } else if (result.apiCategory === 'local-gear') {
            mappedItem = mapLocalItemToSheet({...result, type: 'gear'});
            targetListKey = 'items';
        } else {
            mappedItem = mapApiItemToSheet(result);
            if (mappedItem.category === 'weapons') targetListKey = 'weapons';
            else if (['Light', 'Medium', 'Heavy', 'Shield'].includes(mappedItem.category)) targetListKey = 'armor';
            else targetListKey = 'items';
        }

        const currentInv = character.inventory || { weapons: [], armor: [], items: [] };
        const currentList = currentInv[targetListKey] || [];
        
        onUpdate({ 
            inventory: { 
                ...currentInv, 
                [targetListKey]: [...currentList, mappedItem] 
            } 
        });

        return { category: targetListKey, id: mappedItem.id };
    };

    return {
        isImporting,
        isSearching,
        apiResults,
        parseImportText,
        performSearch,
        closeSearch,
        addItemFromApiResult,
        setApiResults 
    };
};