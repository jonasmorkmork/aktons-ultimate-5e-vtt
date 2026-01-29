import { useState, useRef } from 'react';

// STANDARD GENVEJE
export const DEFAULT_SHORTCUTS = {
    // Global / List Navigation
    NAV_DOWN: 'ArrowDown',
    NAV_UP: 'ArrowUp',
    SELECT_GROUP: 'Enter',
    DELETE: 'Delete',
    COMBAT_MODE: 'c',
    UNDO: 'z',
    
    // Actions on Selected
    HP_EDIT: 'd',      // Åbner modalen
    NOTE_EDIT: 'n',
    CONDITION_MENU: 't',

    // Inside Damage Modal
    DMG_APPLY: 'Enter',
    HEAL_APPLY: 'h',
    TEMP_APPLY: 't',
    RESIST: 'r',
    VULN: 'v'
};

export const useCombatState = () => {
    // --- DATA ---
    const [isLoaded, setIsLoaded] = useState(false);
    const [combatants, setCombatants] = useState([]);
    const [round, setRound] = useState(1);
    const [turnCount, setTurnCount] = useState(1);
    const [activeId, setActiveId] = useState(null);
    const [history, setHistory] = useState([]); 
    const [logs, setLogs] = useState([]);
    const [library, setLibrary] = useState([]);
    const [presets, setPresets] = useState([]);
    
    const [maxGroupSize, setMaxGroupSize] = useState(10); 
    const [shortcuts, setShortcuts] = useState(DEFAULT_SHORTCUTS);

    // --- UI ---
    const [activeTab, setActiveTab] = useState('tracker');
    const [conditionMenuId, setConditionMenuId] = useState(null);
    const [menuIndex, setMenuIndex] = useState(0); 
    const [hpEditId, setHpEditId] = useState(null);
    const [hpEditValue, setHpEditValue] = useState('');
    const [notification, setNotification] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null); 
    const [expandedGroups, setExpandedGroups] = useState([]); 
    const [initModal, setInitModal] = useState(null);
    
    // --- MODALS ---
    const [combatDamageModal, setCombatDamageModal] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [srdModalOpen, setSrdModalOpen] = useState(false);
    const [srdQuery, setSrdQuery] = useState(""); 
    const [srdResults, setSrdResults] = useState([]);
    const [parserModalOpen, setParserModalOpen] = useState(false);
    const [parseText, setParseText] = useState("");
    const [showSettings, setShowSettings] = useState(false);

    // --- SELECTION ---
    const [inCombatMode, setInCombatMode] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1); 
    const [selectedIds, setSelectedIds] = useState([]); 
    const [anchorId, setAnchorId] = useState(null); 

    // --- FORMS & SETTINGS ---
    const [monsterForm, setMonsterForm] = useState({ name: '', count: '1', bonus: '', hp: '', ac: '', xp: '', dc: '' });
    const [playerForm, setPlayerForm] = useState({ name: '', manualRoll: '', hp: '', ac: '', dc: '' });
    const [groupInit, setGroupInit] = useState(false); 
    
    // --- EDITING ---
    const [editingLibraryId, setEditingLibraryId] = useState(null);
    const [editingPlayerId, setEditingPlayerId] = useState(null);
    const [editingPresetId, setEditingPresetId] = useState(null);
    const [presetDraft, setPresetDraft] = useState([]);
    const [newPresetName, setNewPresetName] = useState("");
    const [presetSearch, setPresetSearch] = useState("");

    // --- REFS ---
    const fileInputRef = useRef(null);
    const logsEndRef = useRef(null);
    const combatDamageInputRef = useRef(null);
    const [noteEditId, setNoteEditId] = useState(null);
    const [lastDamagedId, setLastDamagedId] = useState(null);

    return {
        isLoaded, setIsLoaded,
        combatants, setCombatants,
        round, setRound,
        turnCount, setTurnCount,
        activeId, setActiveId,
        history, setHistory,
        logs, setLogs,
        library, setLibrary,
        presets, setPresets,
        maxGroupSize, setMaxGroupSize,
        shortcuts, setShortcuts, 
        activeTab, setActiveTab,
        conditionMenuId, setConditionMenuId,
        menuIndex, setMenuIndex,
        hpEditId, setHpEditId,
        hpEditValue, setHpEditValue,
        notification, setNotification,
        confirmDialog, setConfirmDialog,
        expandedGroups, setExpandedGroups,
        initModal, setInitModal,
        combatDamageModal, setCombatDamageModal,
        showShortcuts, setShowShortcuts,
        srdModalOpen, setSrdModalOpen,
        srdQuery, setSrdQuery,
        srdResults, setSrdResults,
        parserModalOpen, setParserModalOpen,
        parseText, setParseText,
        showSettings, setShowSettings,
        inCombatMode, setInCombatMode,
        selectedIndex, setSelectedIndex,
        selectedIds, setSelectedIds,
        anchorId, setAnchorId,
        monsterForm, setMonsterForm,
        playerForm, setPlayerForm,
        groupInit, setGroupInit, 
        editingLibraryId, setEditingLibraryId,
        editingPlayerId, setEditingPlayerId,
        editingPresetId, setEditingPresetId,
        presetDraft, setPresetDraft,
        newPresetName, setNewPresetName,
        presetSearch, setPresetSearch,
        fileInputRef, logsEndRef, combatDamageInputRef,
        noteEditId, setNoteEditId,
        lastDamagedId, setLastDamagedId
    };
};