import React, { useEffect } from 'react';
import CombatantRow from './CombatantRow';
import * as Icons from './CombatIcons';

const { Folder, FolderOpen, Trash2 } = Icons;

const CONDITIONS_LIST = [
    "Blinded", "Charmed", "Deafened", "Frightened", "Grappled", 
    "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", 
    "Prone", "Restrained", "Stunned", "Unconscious", "Exhaustion"
];

const CombatList = ({ logic }) => {
    const { 
        combatants, activeId, expandedGroups, setExpandedGroups, 
        selectedIds, setSelectedIds, anchorId, setAnchorId,
        inCombatMode, selectedIndex, setSelectedIndex,
        handleConfirm, deleteList, maxGroupSize,
        shortcuts, 
        combatDamageModal,
        conditionMenuId, setConditionMenuId, 
        menuIndex, setMenuIndex, toggleCondition 
    } = logic;

    // --- GROUPING LOGIC ---
    const getGroupedCombatants = () => {
        const grouped = [];
        if (combatants.length === 0) return grouped;
        
        let currentGroup = null;
        for (let i = 0; i < combatants.length; i++) {
            const c = combatants[i];
            const safeName = c.name || "Unknown";
            const baseName = safeName.replace(/ \d+$/, '');
            
            if (currentGroup) {
                const isSameGroup = currentGroup.baseName === baseName && currentGroup.initiative === c.initiative && c.type !== 'player' && c.type !== 'lair';
                if (isSameGroup && currentGroup.members.length < maxGroupSize) {
                    currentGroup.members.push(c);
                } else {
                    grouped.push(currentGroup);
                    if (isSameGroup) {
                        currentGroup = { type: 'group', baseName, initiative: c.initiative, members: [c] };
                    } else if (c.type === 'player' || c.type === 'lair') {
                        currentGroup = null;
                        grouped.push({ type: 'single', data: c });
                    } else {
                        currentGroup = { type: 'group', baseName, initiative: c.initiative, members: [c] };
                    }
                }
            } else {
                if (c.type === 'player' || c.type === 'lair') {
                    grouped.push({ type: 'single', data: c });
                } else {
                    currentGroup = { type: 'group', baseName, initiative: c.initiative, members: [c] };
                }
            }
        }
        if (currentGroup) grouped.push(currentGroup);

        const groupsByName = {};
        grouped.forEach(g => {
            if (g.type === 'group') {
                if (!groupsByName[g.baseName]) groupsByName[g.baseName] = [];
                groupsByName[g.baseName].push(g);
            }
        });

        const groupNameMap = new Map();
        Object.keys(groupsByName).forEach(baseName => {
            const clusters = groupsByName[baseName];
            if (clusters.length > 1) {
                clusters.forEach((g, index) => {
                    groupNameMap.set(g, `${baseName} Group ${index + 1}`);
                });
            }
        });

        return grouped.map(g => {
            if (g.type === 'single') return g;
            if (g.members.length === 1) return { type: 'single', data: g.members[0] };
            let displayName = groupNameMap.has(g) ? groupNameMap.get(g) : g.baseName;
            let uniqueKey = `${displayName}-${g.initiative}-${g.members[0].id}`;
            return { ...g, baseName: displayName, key: uniqueKey };
        });
    };

    const viewList = getGroupedCombatants();

    let navigableItems = [];
    viewList.forEach(item => {
        if (item.type === 'group') {
            navigableItems.push({type:'group', key: item.key});
            if (expandedGroups.includes(item.key)) item.members.forEach(m => navigableItems.push({type:'unit', id: m.id}));
        } else {
            navigableItems.push({type:'unit', id: item.data.id});
        }
    });

    const cursorItem = navigableItems[selectedIndex];
    const cursorId = cursorItem && cursorItem.type === 'unit' ? cursorItem.id : null;
    const cursorGroupKey = cursorItem && cursorItem.type === 'group' ? cursorItem.key : null;

    // --- AUTO SCROLL EFFECT ---
    useEffect(() => {
        if (!cursorItem) return;
        
        const domId = cursorItem.type === 'group' 
            ? `nav-group-${cursorItem.key}` 
            : `nav-unit-${cursorItem.id}`;
        
        const el = document.getElementById(domId);
        if (el) {
            const rect = el.getBoundingClientRect();
            
            // Definer "No-Scroll Zonen". 
            // Header er ca. 80-100px høj, Footer er ca. 80-100px høj.
            const headerHeight = 120; // Hvor meget plads toppen tager
            const footerHeight = 140; // Hvor meget plads bunden tager
            
            const isObscuredTop = rect.top < headerHeight;
            const isObscuredBottom = rect.bottom > (window.innerHeight - footerHeight);

            if (isObscuredTop) {
                // Hvis den er gemt i toppen, scroll så den kommer ned i midten
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (isObscuredBottom) {
                // Hvis den er gemt i bunden, scroll så den kommer op i midten
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedIndex, cursorItem]);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
            if (combatDamageModal) return; 

            // Condition Menu Navigation
            if (conditionMenuId) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMenuIndex(prev => (prev + 1) % CONDITIONS_LIST.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMenuIndex(prev => (prev - 1 + CONDITIONS_LIST.length) % CONDITIONS_LIST.length);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    toggleCondition(conditionMenuId, CONDITIONS_LIST[menuIndex]);
                } else if (e.key === 'Escape' || e.key.toLowerCase() === shortcuts.CONDITION_MENU.toLowerCase()) {
                    e.preventDefault();
                    setConditionMenuId(null);
                }
                return;
            }

            // Global Shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === logic.shortcuts.UNDO.toLowerCase()) {
                e.preventDefault();
                if (logic.undo) logic.undo();
                return;
            }

            if (e.key.toLowerCase() === logic.shortcuts.COMBAT_MODE.toLowerCase()) {
                logic.setInCombatMode(prev => !prev);
                return;
            }

            // NEXT TURN SHORTCUT (Space)
            const nextTurnKey = logic.shortcuts.NEXT_TURN || ' ';
            if (e.key === nextTurnKey || (nextTurnKey === ' ' && e.code === 'Space')) {
                e.preventDefault(); // Forhindre scroll page down
                logic.nextTurn();
                return;
            }

            if (!inCombatMode) return;

            // Navigation
            if (e.key === logic.shortcuts.NAV_DOWN || e.key === logic.shortcuts.NAV_UP) {
                e.preventDefault();
                const direction = e.key === logic.shortcuts.NAV_DOWN ? 1 : -1;
                const nextIndex = (selectedIndex + direction + navigableItems.length) % navigableItems.length;
                setSelectedIndex(nextIndex);

                if (e.shiftKey) {
                    const anchorIdx = anchorId ? navigableItems.findIndex(i => i.type === 'unit' && i.id === anchorId) : selectedIndex;
                    const validAnchor = anchorIdx === -1 ? selectedIndex : anchorIdx;
                    const start = Math.min(validAnchor, nextIndex);
                    const end = Math.max(validAnchor, nextIndex);
                    
                    if (!anchorId && navigableItems[selectedIndex]?.type === 'unit') {
                        setAnchorId(navigableItems[selectedIndex].id);
                    }

                    const newSelection = [];
                    for (let i = start; i <= end; i++) {
                        if (navigableItems[i].type === 'unit') newSelection.push(navigableItems[i].id);
                    }
                    setSelectedIds(newSelection);
                } else {
                    const nextItem = navigableItems[nextIndex];
                    setAnchorId(nextItem && nextItem.type === 'unit' ? nextItem.id : null); 
                    setSelectedIds([]); 
                }
            } 
            else if (e.key === logic.shortcuts.SELECT_GROUP) {
                e.preventDefault();
                const item = navigableItems[selectedIndex];
                if (item && item.type === 'group') {
                    setExpandedGroups(prev => prev.includes(item.key) ? prev.filter(k=>k!==item.key) : [...prev, item.key]);
                }
            } 
            else if (e.key === logic.shortcuts.DELETE || e.key === 'Backspace') {
                const currentItem = navigableItems[selectedIndex];
                let targets = [];
                if (selectedIds.length > 0) targets = selectedIds;
                else if (currentItem) {
                    if (currentItem.type === 'unit') targets = [currentItem.id];
                    else if (currentItem.type === 'group') {
                        const group = viewList.find(g => g.key === currentItem.key);
                        if (group) targets = group.members.map(m => m.id);
                    }
                }
                if (targets.length > 0) deleteList(targets);
            }
            else if (e.key.toLowerCase() === logic.shortcuts.HP_EDIT.toLowerCase() || e.key === '*') {
                e.preventDefault();
                if (cursorId) {
                    logic.setHpEditId(cursorId);
                    logic.setHpEditValue('');
                }
            }
            else if (e.key.toLowerCase() === logic.shortcuts.NOTE_EDIT.toLowerCase()) {
                e.preventDefault();
                if (cursorId) logic.setNoteEditId(cursorId);
            }
            else if (e.key.toLowerCase() === logic.shortcuts.CONDITION_MENU.toLowerCase()) {
                e.preventDefault();
                if (cursorId) {
                    logic.setConditionMenuId(cursorId);
                    logic.setMenuIndex(0); 
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inCombatMode, selectedIndex, selectedIds, anchorId, expandedGroups, viewList, navigableItems, logic, combatDamageModal, conditionMenuId, menuIndex]);

    const activeUnit = logic.combatants.find(c => c.id === activeId);

    return (
        <div className="space-y-3 pb-24">
            {inCombatMode && <div className="text-center text-cyan-400 font-bold uppercase tracking-widest text-sm mb-4 border-b border-cyan-900/50 pb-2">--- IN COMBAT MODE ---</div>}

            {viewList.map((item) => {
                if (item.type === 'group') {
                    const isExpanded = expandedGroups.includes(item.key);
                    const hasActive = item.members.some(m => m.id === activeId);
                    const isGroupSelected = inCombatMode && cursorGroupKey === item.key;
                    
                    let groupClass = "cursor-pointer flex items-center gap-4 p-3 mb-2 rounded-lg border transition-all duration-300 relative overflow-hidden group ";
                    if (isGroupSelected) {
                        if (hasActive) {
                            groupClass += "bg-gradient-to-r from-slate-800/90 to-amber-900/20 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)] z-20 scale-[1.01]";
                        } else {
                            groupClass += "bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)] z-20 scale-[1.01]";
                        }
                    } else if (hasActive) {
                        groupClass += "active-glow bg-amber-950/30 z-10";
                    } else {
                        groupClass += "glass-panel hover:bg-slate-800/60 hover:border-slate-500";
                    }

                    return (
                        <div key={item.key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* RETTET: ID er flyttet herned, så scroll kun ser på selve bjælken */}
                            <div id={`nav-group-${item.key}`} onClick={() => setExpandedGroups(p => p.includes(item.key) ? p.filter(k=>k!==item.key) : [...p, item.key])} className={groupClass}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                    <div className={`absolute inset-0 transform rotate-45 border transition-colors ${hasActive ? 'bg-amber-900/60 border-amber-500' : 'bg-slate-900 border-slate-600'}`}></div>
                                    <span className={`relative z-10 font-fantasy text-lg font-bold ${hasActive ? 'text-amber-400' : 'text-slate-400'}`}>{item.initiative}</span>
                                </div>
                                <div className="flex-1 flex items-center gap-3 z-10">
                                    {isExpanded ? <FolderOpen size={20} className="text-amber-500/80"/> : <Folder size={20} className="text-slate-500"/>}
                                    <span className={`font-fantasy text-xl tracking-wide ${hasActive ? 'text-amber-100' : 'text-slate-200'}`}>{item.baseName}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded text-slate-400 border border-slate-700/50">{item.members.length} Units</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleConfirm("Delete Group?", `Delete all ${item.members.length}?`, () => deleteList(item.members.map(m => m.id))) }} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={16}/></button>
                            </div>
                            
                            {isExpanded && (
                                <div className="pl-6 border-l-2 border-white/5 ml-5 space-y-2 mb-4 mt-2">
                                    {item.members.map(c => {
                                        const isSharedActive = activeUnit && activeUnit.type === 'player' && c.type === 'player' && c.initiative === activeUnit.initiative;
                                        const isActive = c.id === activeId || isSharedActive;
                                        const isPrimaryActive = c.id === activeId;
                                        const isUnitSelected = inCombatMode && (cursorId === c.id || selectedIds.includes(c.id));

                                        return (
                                            <div key={c.id} id={`nav-unit-${c.id}`}>
                                                <CombatantRow c={c} isActive={isActive} isPrimaryActive={isPrimaryActive} hpEditId={logic.hpEditId} hpEditValue={logic.hpEditValue} setHpEditId={logic.setHpEditId} setHpEditValue={logic.setHpEditValue} updateHP={logic.updateHP} toggleDeathSave={logic.toggleDeathSave} toggleCondition={logic.toggleCondition} setConditionMenuId={logic.setConditionMenuId} conditionMenuId={logic.conditionMenuId} menuIndex={logic.menuIndex} deleteCombatant={logic.deleteCombatant} updateNote={logic.updateNote} isSelected={isUnitSelected} isCombatMode={inCombatMode} noteEditId={logic.noteEditId} setNoteEditId={logic.setNoteEditId} lastDamagedId={logic.lastDamagedId} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                }
                
                const isSharedActive = activeUnit && activeUnit.type === 'player' && item.data.type === 'player' && item.data.initiative === activeUnit.initiative;
                const isActive = item.data.id === activeId || isSharedActive;
                const isPrimaryActive = item.data.id === activeId;
                const isUnitSelected = inCombatMode && (cursorId === item.data.id || selectedIds.includes(item.data.id));

                return (
                    <div key={item.data.id} id={`nav-unit-${item.data.id}`}>
                        <CombatantRow c={item.data} isActive={isActive} isPrimaryActive={isPrimaryActive} hpEditId={logic.hpEditId} hpEditValue={logic.hpEditValue} setHpEditId={logic.setHpEditId} setHpEditValue={logic.setHpEditValue} updateHP={logic.updateHP} toggleDeathSave={logic.toggleDeathSave} toggleCondition={logic.toggleCondition} setConditionMenuId={logic.setConditionMenuId} conditionMenuId={logic.conditionMenuId} menuIndex={logic.menuIndex} deleteCombatant={logic.deleteCombatant} updateNote={logic.updateNote} isSelected={isUnitSelected} isCombatMode={inCombatMode} noteEditId={logic.noteEditId} setNoteEditId={logic.setNoteEditId} lastDamagedId={logic.lastDamagedId} />
                    </div>
                );
            })}
        </div>
    );
};

export default CombatList;