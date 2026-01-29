import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useCampaign } from '../../../context/CampaignContext'; 
import { Icon, Icons } from './StatBlockIcons';

// --- 5E XP LOGIC (Uændret) ---
const XP_THRESHOLDS = {
    1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
    2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
    3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
    4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
    5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
    6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
    7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
    9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
    10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
    11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
    12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
    13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
    14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
    15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
    16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
    17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
    18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
    19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
    20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

const CR_TO_XP = {
    '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100,
    '5': 1800, '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200,
    '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000,
    '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000,
    '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000
};

const getXPFromCR = (crString) => {
    if (!crString) return 0;
    // Håndter både string "1/4" og tal input
    const match = String(crString).match(/^([\d/]+)/); 
    const cr = match ? match[1] : '0';
    return CR_TO_XP[cr] || 0;
};

const getEffectiveLevelFromCR = (crString) => {
    if (!crString) return 1;
    const cleanCR = String(crString).split(' ')[0];
    if (cleanCR === '0' || cleanCR === '1/8') return 1;
    if (cleanCR === '1/4') return 2;
    if (cleanCR === '1/2') return 3;
    const val = parseInt(cleanCR);
    if (isNaN(val)) return 1;
    if (val === 1) return 4;
    if (val === 2) return 5;
    if (val === 3) return 6;
    if (val === 4) return 8; 
    return Math.min(20, Math.floor(val * 1.5));
};

const EncounterBuilder = ({ library, initialData = null, onSave, onDelete, onBack }) => {
    const navigate = useNavigate();
    const { sendEncounterToCombat } = useCampaign(); 

    const [partyLevel, setPartyLevel] = useState(1);
    const [partySize, setPartySize] = useState(4);
    
    // UI State
    const [search, setSearch] = useState("");
    const [activeSource, setActiveSource] = useState('local'); // 'local' | 'srd'
    
    // SRD State
    const [srdResults, setSrdResults] = useState([]);
    const [isSearchingSRD, setIsSearchingSRD] = useState(false);

    // Encounter State
    const [currentEncounterId, setCurrentEncounterId] = useState(null); 
    const [encounterName, setEncounterName] = useState("New Encounter");
    const [enemies, setEnemies] = useState([]); 
    const [friendlies, setFriendlies] = useState([]);
    
    // --- EFFECT: LOAD INITIAL DATA IF EDITING ---
    useEffect(() => {
        if (initialData) {
            setEnemies(initialData.enemies || []);
            setFriendlies(initialData.friendlies || []);
            setPartyLevel(initialData.partyLevel || 1);
            setPartySize(initialData.partySize || 4);
            setEncounterName(initialData.name || "New Encounter");
            setCurrentEncounterId(initialData.id || null);
        } else {
            setEnemies([]);
            setFriendlies([]);
            setEncounterName("New Encounter");
            setCurrentEncounterId(null);
        }
    }, [initialData]);

    // --- SRD SEARCH LOGIC ---
    const handleSrdSearch = async (e) => {
        // Søg når man trykker Enter eller hvis man har skrevet mere end 2 tegn (med debounce i praksis, men her Enter)
        if (e.key === 'Enter' && search.length > 2) {
            performSrdSearch();
        }
    };

    const performSrdSearch = async () => {
        if (!search) return;
        setIsSearchingSRD(true);
        try {
            // Vi bruger Open5e API
            const response = await fetch(`https://api.open5e.com/monsters/?search=${search}&limit=20`);
            const data = await response.json();
            
            // Konverter til dit format
            const mapped = data.results.map(m => ({
                id: `srd_${m.slug}`, // Unikt ID for SRD monstre
                name: m.name,
                hp: `${m.hit_points}`,
                ac: m.armor_class,
                // Vi mapper API stats til dit format, så CombatFlow kan beregne initiativ
                stats: {
                    STR: m.strength,
                    DEX: m.dexterity,
                    CON: m.constitution,
                    INT: m.intelligence,
                    WIS: m.wisdom,
                    CHA: m.charisma
                },
                props: {
                    challenge: m.challenge_rating 
                },
                meta: `${m.size} ${m.type}, ${m.alignment}`
            }));
            setSrdResults(mapped);
        } catch (error) {
            console.error("SRD Search Error:", error);
            alert("Could not fetch from SRD API.");
        }
        setIsSearchingSRD(false);
    };

    const handleRunEncounter = () => {
        if (enemies.length === 0 && friendlies.length === 0) {
            alert("Add some creatures first!");
            return;
        }

        const extractStats = (m) => {
            let bonus = 0;
            if (m.stats && m.stats.DEX) {
                const dex = typeof m.stats.DEX === 'object' ? m.stats.DEX.val : m.stats.DEX;
                bonus = Math.floor((parseInt(dex) - 10) / 2);
            }
            return {
                bonus: bonus || 0,
                maxHp: parseInt(m.hp) || 10,
                ac: parseInt(m.ac) || 10,
                xp: getXPFromCR(m.props?.challenge)
            };
        };

        const allEntities = [...enemies, ...friendlies];
        const libraryItems = [];
        const seenIds = new Set();

        allEntities.forEach(m => {
            if (!seenIds.has(m.id)) {
                seenIds.add(m.id);
                const stats = extractStats(m);
                libraryItems.push({
                    id: m.id, 
                    name: m.name,
                    type: 'monster', 
                    ...stats,
                    dc: null 
                });
            }
        });

        const presetMonsters = allEntities.map(m => {
            const stats = extractStats(m);
            return {
                libId: m.id,
                name: m.name,
                count: m.count || 1,
                type: 'monster',
                ...stats,
                dc: null
            };
        });

        const preset = {
            id: Date.now(),
            name: encounterName || "Imported Encounter",
            monsters: presetMonsters
        };

        sendEncounterToCombat({
            mode: 'import_preset',
            preset: preset,
            library: libraryItems
        });

        navigate('/combat-flow');
    };

    const handleSaveClick = () => {
        let finalName = encounterName;
        
        if (!finalName || finalName.trim() === "New Encounter" || finalName.trim() === "") {
            const promptName = prompt("Encounter Name:", encounterName);
            if (!promptName) return; 
            finalName = promptName;
            setEncounterName(finalName);
        }

        const encData = {
            id: currentEncounterId, 
            name: finalName,
            enemies,
            friendlies,
            partyLevel,
            partySize,
            timestamp: Date.now()
        };
        onSave(encData);
    };

    const handleClear = () => {
        setEnemies([]);
        setFriendlies([]);
        setEncounterName("New Encounter");
        setCurrentEncounterId(null);
    };

    const addToList = (monster, listType) => {
        const setFunc = listType === 'enemy' ? setEnemies : setFriendlies;
        setFunc(prev => {
            const existing = prev.find(m => m.id === monster.id);
            if (existing) {
                return prev.map(m => m.id === monster.id ? { ...m, count: m.count + 1 } : m);
            }
            return [...prev, { ...monster, count: 1 }];
        });
    };

    const removeFromList = (id, listType) => {
        const setFunc = listType === 'enemy' ? setEnemies : setFriendlies;
        setFunc(prev => prev.filter(m => m.id !== id));
    };

    const updateCount = (id, delta, listType) => {
        const setFunc = listType === 'enemy' ? setEnemies : setFriendlies;
        setFunc(prev => prev.map(m => {
            if (m.id === id) {
                const newCount = Math.max(1, m.count + delta);
                return { ...m, count: newCount };
            }
            return m;
        }));
    };

    // --- CALCULATIONS ---
    const stats = useMemo(() => {
        const playerThresholds = XP_THRESHOLDS[partyLevel] || XP_THRESHOLDS[1];
        
        let totalLimit = {
            easy: playerThresholds.easy * partySize,
            medium: playerThresholds.medium * partySize,
            hard: playerThresholds.hard * partySize,
            deadly: playerThresholds.deadly * partySize,
        };

        friendlies.forEach(npc => {
            const level = getEffectiveLevelFromCR(npc.props?.challenge);
            const npcThresholds = XP_THRESHOLDS[level] || XP_THRESHOLDS[1];
            
            totalLimit.easy += npcThresholds.easy * npc.count;
            totalLimit.medium += npcThresholds.medium * npc.count;
            totalLimit.hard += npcThresholds.hard * npc.count;
            totalLimit.deadly += npcThresholds.deadly * npc.count;
        });

        let totalMonsterXP = 0;
        let totalMonsters = 0;
        enemies.forEach(m => {
            const xp = getXPFromCR(m.props?.challenge);
            totalMonsterXP += xp * m.count;
            totalMonsters += m.count;
        });

        let multiplier = 1;
        if (totalMonsters === 2) multiplier = 1.5;
        else if (totalMonsters >= 3 && totalMonsters <= 6) multiplier = 2;
        else if (totalMonsters >= 7 && totalMonsters <= 10) multiplier = 2.5;
        else if (totalMonsters >= 11 && totalMonsters <= 14) multiplier = 3;
        else if (totalMonsters >= 15) multiplier = 4;

        const totalAllies = partySize + friendlies.reduce((acc, f) => acc + f.count, 0);
        if (totalAllies >= 6 && totalMonsters > 0) {
            if (multiplier === 4) multiplier = 3;
            else if (multiplier === 3) multiplier = 2.5;
            else if (multiplier === 2.5) multiplier = 2;
            else if (multiplier === 2) multiplier = 1.5;
            else if (multiplier === 1.5) multiplier = 1;
        }

        const adjustedXP = Math.floor(totalMonsterXP * multiplier);

        let difficulty = "Trivial";
        let diffColor = "text-slate-500";
        if (adjustedXP >= totalLimit.deadly) { difficulty = "Deadly"; diffColor = "text-purple-500"; }
        else if (adjustedXP >= totalLimit.hard) { difficulty = "Hard"; diffColor = "text-red-500"; }
        else if (adjustedXP >= totalLimit.medium) { difficulty = "Medium"; diffColor = "text-yellow-500"; }
        else if (adjustedXP >= totalLimit.easy) { difficulty = "Easy"; diffColor = "text-green-500"; }

        return { totalMonsterXP, adjustedXP, difficulty, diffColor, totalLimit, totalAllies };
    }, [enemies, friendlies, partyLevel, partySize]);

    // Filter local library
    const filteredLibrary = library.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

    // Decide which list to show
    const displayList = activeSource === 'local' ? filteredLibrary : srdResults;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200">
            {/* HEADER */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800 shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
                        <Icon path={Icons.ArrowLeft} /> Back
                    </button>
                    <div className="h-6 w-px bg-slate-700"></div>
                    
                    {/* EDITABLE NAME INPUT */}
                    <div className="flex-1 max-w-md">
                        <input 
                            type="text" 
                            value={encounterName}
                            onChange={(e) => setEncounterName(e.target.value)}
                            className="w-full bg-transparent text-xl font-bold text-slate-100 border-b border-transparent hover:border-slate-500 focus:border-red-500 outline-none placeholder-slate-500 transition-all"
                            placeholder="Enter Encounter Name..."
                        />
                        {currentEncounterId && <span className="text-[10px] text-slate-500 uppercase tracking-wide block mt-0.5">Editing Saved Encounter</span>}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button onClick={handleClear} className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-white border border-slate-600 rounded">
                        New Encounter
                    </button>
                    <button onClick={handleSaveClick} className="flex items-center gap-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white font-bold rounded text-sm shadow border border-green-600">
                        <Icon path={Icons.Save} /> Save Encounter
                    </button>
                    <button onClick={handleRunEncounter} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-sm shadow-lg border border-blue-500 animate-pulse-slow transition-all hover:scale-105">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Send to CombatFlow
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT: LIBRARY / SRD */}
                <div className="w-1/3 border-r border-slate-700 flex flex-col bg-slate-900/50">
                    
                    {/* TABS & SEARCH */}
                    <div className="p-4 border-b border-slate-700 space-y-4 bg-slate-800/30">
                        {/* Source Toggle */}
                        <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                            <button 
                                onClick={() => { setActiveSource('local'); setSearch(""); }}
                                className={`flex-1 text-xs font-bold py-1 rounded transition-colors ${activeSource === 'local' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Local Library
                            </button>
                            <button 
                                onClick={() => { setActiveSource('srd'); setSearch(""); setSrdResults([]); }}
                                className={`flex-1 text-xs font-bold py-1 rounded transition-colors ${activeSource === 'srd' ? 'bg-blue-900/50 text-blue-200 shadow border border-blue-900' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                5e SRD (Online)
                            </button>
                        </div>

                        <div className="relative">
                            <Icon path={Icons.Search} className="absolute left-3 top-2.5 text-slate-500 w-4 h-4"/>
                            <input 
                                type="text" 
                                placeholder={activeSource === 'local' ? "Filter local monsters..." : "Search SRD (Press Enter)..."} 
                                className={`w-full bg-slate-800 border rounded pl-9 pr-2 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 ${activeSource === 'srd' ? 'border-blue-900/50' : 'border-slate-700'}`} 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                                onKeyDown={activeSource === 'srd' ? handleSrdSearch : undefined}
                            />
                            {activeSource === 'srd' && (
                                <span className="absolute right-2 top-2.5 text-[10px] text-slate-500 uppercase font-bold">
                                    {isSearchingSRD ? 'Searching...' : 'Enter'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {/* SRD EMPTY STATE */}
                        {activeSource === 'srd' && srdResults.length === 0 && !isSearchingSRD && (
                            <div className="text-center p-8 text-slate-500 text-sm italic">
                                Search for a monster (e.g. "Goblin", "Dragon") and press Enter to fetch from Open5e API.
                            </div>
                        )}

                        {/* LIST ITEMS */}
                        {displayList.map(m => (
                            <div key={m.id} className="w-full flex justify-between items-center p-3 rounded hover:bg-slate-800 border border-transparent hover:border-slate-600 group transition-all">
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-slate-200 text-sm truncate">{m.name}</div>
                                    <div className="text-[10px] text-slate-500 flex gap-2">
                                        <span>CR {m.props?.challenge || "?"}</span>
                                        {m.meta && <span className="truncate opacity-70">- {m.meta}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); addToList(m, 'enemy'); }} 
                                        className="px-2 py-1 bg-red-900/40 hover:bg-red-600 text-red-200 text-[10px] font-bold uppercase rounded border border-red-900/50 transition-colors"
                                        title="Add as Enemy"
                                    >
                                        + Enemy
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); addToList(m, 'friendly'); }} 
                                        className="px-2 py-1 bg-emerald-900/40 hover:bg-emerald-600 text-emerald-200 text-[10px] font-bold uppercase rounded border border-emerald-900/50 transition-colors"
                                        title="Add as Ally"
                                    >
                                        + Ally
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: DASHBOARD (Uændret) */}
                <div className="flex-1 flex flex-col bg-[#1a1d23] overflow-hidden">
                    <div className="p-6 bg-slate-900 border-b border-slate-700 shadow-md relative overflow-hidden shrink-0">
                        <div className={`absolute inset-0 opacity-10 pointer-events-none ${stats.difficulty === 'Deadly' ? 'bg-red-900' : stats.difficulty === 'Easy' ? 'bg-green-900' : 'bg-transparent'}`}></div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Encounter Difficulty</div>
                                <div className={`text-5xl font-black font-serif ${stats.diffColor} drop-shadow-md leading-none`}>{stats.difficulty}</div>
                                <div className="text-sm text-slate-400 mt-2 font-mono"><span className="text-slate-500">Adj. XP:</span> <span className="text-slate-200 font-bold">{stats.adjustedXP}</span> <span className="text-slate-600 mx-2">/</span> <span className="text-slate-500">Daily Budget:</span> <span className="text-slate-400">{stats.totalLimit.deadly * 3}</span></div>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Thresholds (Party + Allies)</div>
                                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <div className="text-green-500"><div>EASY</div><div>{stats.totalLimit.easy}</div></div>
                                    <div className="text-yellow-500"><div>MED</div><div>{stats.totalLimit.medium}</div></div>
                                    <div className="text-red-500"><div>HARD</div><div>{stats.totalLimit.hard}</div></div>
                                    <div className="text-purple-500"><div>DEADLY</div><div>{stats.totalLimit.deadly}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Avg. Party Level</label>
                                <div className="flex items-center gap-3"><input type="range" min="1" max="20" value={partyLevel} onChange={(e) => setPartyLevel(parseInt(e.target.value))} className="flex-1 accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"/><span className="text-xl font-bold font-mono text-amber-400 w-8 text-center">{partyLevel}</span></div>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-2">Active Players</label>
                                <div className="flex items-center gap-3"><input type="range" min="1" max="10" value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value))} className="flex-1 accent-blue-500 h-2 bg-slate-700 rounded-lg cursor-pointer"/><span className="text-xl font-bold font-mono text-blue-400 w-8 text-center">{partySize}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2 flex justify-between"><span>Enemies</span><span>{stats.totalMonsterXP} XP</span></h3>
                                <div className="space-y-2">
                                    {enemies.length === 0 && <div className="text-xs text-slate-600 italic py-4 text-center border border-dashed border-slate-700 rounded">No enemies added</div>}
                                    {enemies.map(m => (
                                        <div key={m.id} className="bg-slate-800 p-3 rounded border-l-2 border-l-red-500 border-t border-b border-r border-slate-700 flex justify-between items-center shadow-sm">
                                            <div><div className="font-bold text-slate-200 text-sm">{m.name}</div><div className="text-[10px] text-slate-500">CR {m.props?.challenge}</div></div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateCount(m.id, -1, 'enemy')} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 rounded"><Icon path={Icons.Minus} className="w-3 h-3"/></button>
                                                <span className="font-bold text-sm w-4 text-center">{m.count}</span>
                                                <button onClick={() => updateCount(m.id, 1, 'enemy')} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 rounded"><Icon path={Icons.Plus} className="w-3 h-3"/></button>
                                                <button onClick={() => removeFromList(m.id, 'enemy')} className="ml-2 text-red-500 hover:text-red-400"><Icon path={Icons.Trash} className="w-3 h-3"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex justify-between">
                                    <span>Allies & NPCs</span>
                                    <span>+{stats.totalAllies - partySize} Extra</span>
                                </h3>
                                <div className="space-y-2">
                                    {friendlies.length === 0 && <div className="text-xs text-slate-600 italic py-4 text-center border border-dashed border-slate-700 rounded">No allies added</div>}
                                    {friendlies.map(m => (
                                        <div key={m.id} className="bg-slate-800 p-3 rounded border-l-2 border-l-emerald-500 border-t border-b border-r border-slate-700 flex justify-between items-center shadow-sm">
                                            <div>
                                                <div className="font-bold text-slate-200 text-sm">{m.name}</div>
                                                <div className="text-[10px] text-slate-500">
                                                    Counts as Lvl {getEffectiveLevelFromCR(m.props?.challenge)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateCount(m.id, -1, 'friendly')} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 rounded"><Icon path={Icons.Minus} className="w-3 h-3"/></button>
                                                <span className="font-bold text-sm w-4 text-center">{m.count}</span>
                                                <button onClick={() => updateCount(m.id, 1, 'friendly')} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 rounded"><Icon path={Icons.Plus} className="w-3 h-3"/></button>
                                                <button onClick={() => removeFromList(m.id, 'friendly')} className="ml-2 text-red-500 hover:text-red-400"><Icon path={Icons.Trash} className="w-3 h-3"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EncounterBuilder;