import { useMemo } from 'react';

export const useCombatMethods = (state) => {
    const {
        combatants, setCombatants,
        round, setRound,
        turnCount, setTurnCount,
        activeId, setActiveId,
        history, setHistory,
        logs, setLogs,
        setNotification,
        logsEndRef,
        setLastDamagedId,
        setConfirmDialog,
        playerForm, setPlayerForm,
        monsterForm, setMonsterForm,
        setInitModal,
        selectedIds, setSelectedIds,
        setSelectedIndex,
        setConditionMenuId,
        setHpEditId, setHpEditValue, hpEditValue,
        setEditingLibraryId, setEditingPlayerId,
        groupInit,
        shortcuts, setShortcuts
    } = state;

    // --- LOGGING ---
    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { id: Date.now(), msg, type }]);
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2000);
    };

    // --- HELPERS ---
    const pushHistory = () => {
        setHistory(prev => [...prev.slice(-9), { combatants, round, turnCount, activeId }]);
    };

    const undo = () => {
        if (history.length === 0) return;
        const last = history[history.length - 1];
        setCombatants(last.combatants);
        setRound(last.round);
        setTurnCount(last.turnCount);
        setActiveId(last.activeId);
        setHistory(prev => prev.slice(0, -1));
        addLog("Undo last action", 'info');
    };

    const handleConfirm = (title, message, onConfirm) => {
        setConfirmDialog({ title, message, onConfirm });
    };

    // --- SHORTCUTS ---
    const updateShortcut = (actionKey, newKey) => {
        setShortcuts(prev => ({ ...prev, [actionKey]: newKey }));
        showNotification(`Shortcut updated: ${newKey}`);
    };

    const resetShortcuts = () => {
        setShortcuts({
            NAV_DOWN: 'ArrowDown', NAV_UP: 'ArrowUp', SELECT_GROUP: 'Enter', DELETE: 'Delete',
            HP_EDIT: 'd', NOTE_EDIT: 'n', CONDITION_MENU: 't', COMBAT_MODE: 'c', UNDO: 'z'
        });
        showNotification("Shortcuts reset to default");
    };

    // --- DICE ROLLER ---
    const rollDice = (diceStr) => {
        if (!diceStr) return 0;
        const cleanStr = String(diceStr).replace('+', '').trim().toLowerCase();
        
        if (!cleanStr.includes('d')) {
            return parseInt(cleanStr) || 0;
        }

        const parts = cleanStr.split('d');
        let count = parseInt(parts[0]);
        if (isNaN(count) && parts[0] === '') count = 1;
        else if (isNaN(count)) count = 1;

        const sides = parseInt(parts[1]) || 20;

        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    };

    const getSmartInitiative = (bonus) => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        return d20 + (parseInt(bonus) || 0);
    };

    // --- NAVNGIVNING ---
    const getUniqueName = (baseName, existingList) => {
        const cleanBase = baseName.replace(/\s+\d+$/, '');
        const regex = new RegExp(`^${cleanBase}(?:\\s+(\\d+))?$`);
        
        let maxNum = 0;
        let foundAny = false;

        existingList.forEach(c => {
            const match = c.name.match(regex);
            if (match) {
                foundAny = true;
                const num = match[1] ? parseInt(match[1]) : 1;
                if (num > maxNum) maxNum = num;
            }
        });

        if (foundAny) {
            return `${cleanBase} ${maxNum + 1}`;
        }
        return cleanBase;
    };

    // --- INITIATIV GRUPPERING ---
    const findExistingGroupInitiative = (baseName, existingList) => {
        if (!groupInit) return null; 
        const cleanBase = baseName.replace(/\s+\d+$/, '');
        const regex = new RegExp(`^${cleanBase}(?:\\s+\\d+)?$`);
        const match = existingList.find(c => c.type !== 'player' && c.name.match(regex));
        return match ? match.initiative : null;
    };

    const createCombatant = (base, isPlayer = false, customInit = null) => {
        const init = customInit !== null ? parseInt(customInit) : getSmartInitiative(base.bonus || 0);
        
        let startHp = 10;
        let maxHp = 10;
        
        if (base.hp && typeof base.hp === 'object') {
            maxHp = parseInt(base.hp.max || 10);
            startHp = parseInt(base.hp.current !== undefined ? base.hp.current : maxHp);
        } else {
            startHp = parseInt(base.hp || base.maxHp || 10);
            maxHp = startHp;
        }

        return {
            id: Date.now() + Math.random(),
            linkedId: base.linkedId || null, 
            name: base.name || "Unknown Entity",
            hp: startHp,
            maxHp: maxHp,
            tempHp: parseInt(base.tempHp) || 0,
            ac: parseInt(base.ac) || 10,
            initiative: init,
            bonus: parseInt(base.bonus) || 0,
            type: isPlayer ? 'player' : (base.type || 'monster'),
            conditions: [],
            deathSaves: { successes: [false, false, false], failures: [false, false, false] },
            note: '',
            xp: base.xp || 0
        };
    };

    // --- ACTIONS ---
    const updateHP = (id, value, type = 'delta') => {
        setCombatants(prev => prev.map(c => {
            if (c.id !== id) return c;
            let currentTemp = c.tempHp || 0;
            let currentHp = c.hp;
            let newC = { ...c };

            if (type === 'setTemp') {
                newC.tempHp = Math.max(0, parseInt(value) || 0);
            } else {
                const change = parseInt(value) || 0;
                if (change < 0) {
                    const damage = Math.abs(change);
                    const tempAbsorb = Math.min(currentTemp, damage);
                    currentTemp -= tempAbsorb; 
                    const remainingDamage = damage - tempAbsorb;
                    currentHp = Math.max(0, currentHp - remainingDamage); 
                    if (remainingDamage > 0 || tempAbsorb > 0) {
                        setLastDamagedId(id);
                        setTimeout(() => setLastDamagedId(null), 600);
                    }
                } else {
                    currentHp = Math.min(c.maxHp, currentHp + change);
                }
                newC.hp = currentHp;
                newC.tempHp = currentTemp;
            }
            return newC;
        }));
    };

    const updateNote = (id, note) => setCombatants(prev => prev.map(c => c.id === id ? { ...c, note } : c));
    const toggleCondition = (id, condition) => {
        setCombatants(prev => prev.map(c => {
            if (c.id !== id) return c;
            const conditions = c.conditions || [];
            const exists = conditions.includes(condition);
            const newConditions = exists ? conditions.filter(x => x !== condition) : [...conditions, condition];
            return { ...c, conditions: newConditions };
        }));
        setConditionMenuId(null);
    };
    const toggleDeathSave = (id, type, index) => {
        setCombatants(prev => prev.map(c => {
            if (c.id !== id) return c;
            const current = c.deathSaves?.[type] || [false, false, false];
            const newSaves = [...current];
            newSaves[index] = !newSaves[index];
            return { ...c, deathSaves: { ...c.deathSaves, [type]: newSaves } };
        }));
    };
    const deleteCombatant = (id) => {
        setCombatants(prev => {
            const next = prev.filter(c => c.id !== id);
            if (activeId === id) setActiveId(next.length > 0 ? next[0].id : null);
            return next;
        });
        addLog("Combatant removed", 'info');
    };
    const clearCombat = () => {
        if (window.confirm("Clear all combatants?")) {
            setCombatants([]); setRound(1); setTurnCount(1); setActiveId(null); setLogs([]); setHistory([]);
            addLog("Combat cleared", 'warn');
        }
    };
    
    const triggerShake = () => {};
    const nextTurn = () => {
        if (combatants.length === 0) return;
        pushHistory();
        const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
        let idx = sorted.findIndex(c => c.id === activeId);
        if (idx === -1) {
            setActiveId(sorted[0].id);
        } else {
            const nextIdx = (idx + 1) % sorted.length;
            if (nextIdx === 0) {
                setRound(r => r + 1);
                addLog(`Round ${round + 1} started`, 'info');
            }
            setActiveId(sorted[nextIdx].id);
        }
        setTurnCount(t => t + 1);
    };

    // --- ADD COMBATANT (RETTET: Support for countOverride) ---
    // Tilføjet 'countOverride' som tredje argument
    const addCombatant = (source, data = null, countOverride = null) => {
        pushHistory();
        let baseData = null;
        let isPlayer = false;
        let customInit = null;
        
        // 1. Bestem antal: Brug override hvis den findes (fra knap), ellers formen, ellers 1
        let countInput = countOverride || ((source === 'auto') ? (monsterForm.count || '1') : '1');

        if (source === 'manual') {
            if (!playerForm.name || !playerForm.manualRoll) return;
            baseData = { name: playerForm.name, maxHp: playerForm.hp, ac: playerForm.ac, dc: playerForm.dc, type: 'player' };
            isPlayer = true;
            customInit = parseInt(playerForm.manualRoll);
            setPlayerForm({ name: '', manualRoll: '', hp: '', ac: '', dc: '' });
        } 
        else if (source === 'auto') {
            if (!monsterForm.name) return;
            baseData = { name: monsterForm.name, bonus: parseInt(monsterForm.bonus) || 0, maxHp: monsterForm.hp, ac: monsterForm.ac, dc: monsterForm.dc, type: 'monster' };
        }
        else if (source === 'library' && data) {
            baseData = data;
            isPlayer = data.type === 'player';
        }
        else if (source === 'lair') {
            baseData = { name: "Lair Action", initiative: 20, type: 'lair', conditions: [] };
            customInit = 20;
        }

        if (baseData) {
            // Beregn antal (parse '1d4', '2d6' eller fast tal)
            const count = rollDice(String(countInput));
            
            let newEntities = [];
            let currentList = [...combatants]; // Kopi af listen vi bygger videre på

            for(let i=0; i < count; i++) {
                // Bestem initiativ
                let thisInit = customInit;
                if (thisInit === null) {
                    if (!isPlayer && source !== 'lair') {
                        // Prøv at finde gruppe-initiativ fra den liste vi er ved at bygge
                        const groupInitVal = findExistingGroupInitiative(baseData.name, currentList);
                        if (groupInitVal !== null) thisInit = groupInitVal;
                    }
                }
                
                const uniqueName = getUniqueName(baseData.name, currentList);
                
                // Opret kopi for ikke at overskrive library
                const combatantData = { ...baseData, name: uniqueName };
                const newCombatant = createCombatant(combatantData, isPlayer, thisInit);
                
                newEntities.push(newCombatant);
                currentList.push(newCombatant);
            }
            
            // Sorter og gem
            const sorted = currentList.sort((a, b) => b.initiative - a.initiative);
            setCombatants(sorted);
            
            if (!activeId && sorted.length > 0) setActiveId(sorted[0].id);
            
            if (count > 1) showNotification(`Added ${count} x ${baseData.name}!`);
            else showNotification(`${newEntities[0].name} added!`);
        }
    };

    const addFromLibrary = (item, qty = null) => {
        if (item.type === 'player') {
            // Spillere går stadig gennem modalen for initiativ
            setInitModal({ players: [{ ...item, count: 1 }], monsters: [] });
        } else {
            // Monstre sendes direkte videre med det ønskede antal (qty)
            addCombatant('library', item, qty);
        }
    };

    const deleteList = (ids) => {
        if (ids && ids.length > 0) {
            setCombatants(prev => prev.filter(c => !ids.includes(c.id)));
            setSelectedIds([]);
            setSelectedIndex(-1);
        }
    };

    const activeUnit = useMemo(() => combatants.find(c => c.id === activeId), [combatants, activeId]);
    const handleNameCollision = (name) => name;
    
    const handleImportSrdMonster = () => {};
    const handleParseStatBlock = () => {};

    // --- MODIFY COMBAT INPUT ---
    const modifyCombatInput = (val) => {
        if (!hpEditValue && hpEditValue !== 0 && hpEditValue !== '') return;
        const current = parseInt(hpEditValue) || 0;
        
        if (typeof val === 'number') {
            setHpEditValue(Math.floor(current * val));
        } else if (typeof val === 'string' && val.includes('d')) {
            const roll = rollDice(val);
            setHpEditValue(current + roll);
            showNotification(`Rolled ${val}: +${roll}`);
        }
    };
    
    const executeRunPreset = (presetOrMonsters, manualPlayers = []) => {
        pushHistory();
        let currentList = [...combatants]; 
        let newAdditions = [];
        const monsters = Array.isArray(presetOrMonsters) ? presetOrMonsters : (presetOrMonsters?.monsters || []);
        
        monsters.forEach(m => {
            let groupRoll = findExistingGroupInitiative(m.name, currentList);
            if (groupRoll === null && groupInit) groupRoll = getSmartInitiative(m.bonus || 0);

            for(let i=0; i < (m.count || 1); i++) {
                const init = groupRoll !== null ? groupRoll : getSmartInitiative(m.bonus || 0);
                const tempFullList = [...currentList, ...newAdditions];
                const uniqueName = getUniqueName(m.name, tempFullList);
                const c = createCombatant({ ...m, name: uniqueName }, m.type === 'player', init);
                newAdditions.push(c);
            }
        });

        if (manualPlayers && manualPlayers.length > 0) {
            manualPlayers.forEach(p => {
                const c = createCombatant(p, true, p.init);
                if (p.manualHp) c.hp = p.manualHp;
                newAdditions.push(c);
            });
        }
        
        const finalCombatants = [...currentList, ...newAdditions].sort((a,b) => b.initiative - a.initiative);
        setCombatants(finalCombatants);
        if(!activeId && finalCombatants.length > 0) setActiveId(finalCombatants[0].id);
        
        addLog(`Added encounter`, 'info');
    };
    
    const handleLongRest = () => {
        if(window.confirm("Perform Long Rest? This will heal everyone fully.")) {
            pushHistory();
            setCombatants(prev => prev.map(c => ({
                ...c,
                hp: c.maxHp,
                tempHp: 0,
                deathSaves: { successes: [false, false, false], failures: [false, false, false] }
            })));
            setRound(1);
            addLog("Long Rest performed", 'heal');
        }
    };

    const resetMonsterForm = () => { setMonsterForm({ name: '', count: '1', bonus: '', hp: '', ac: '', xp: '', dc: '' }); setEditingLibraryId(null); };
    const resetPlayerForm = () => { setPlayerForm({ name: '', manualRoll: '', hp: '', ac: '', dc: '' }); setEditingPlayerId(null); };

    return {
        addLog, showNotification, pushHistory, undo, handleConfirm,
        getSmartInitiative, createCombatant, deleteList, deleteCombatant, clearCombat,
        addCombatant, addFromLibrary, nextTurn, handleNameCollision,
        handleLongRest,
        handleImportSrdMonster, handleParseStatBlock, modifyCombatInput, executeRunPreset,
        resetMonsterForm, resetPlayerForm, updateHP, updateNote, toggleCondition, toggleDeathSave,
        activeUnit, rollDice, triggerShake,
        updateShortcut, resetShortcuts // Eksporter shortcuts metoder
    };
};