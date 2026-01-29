import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Icon, Icons } from './StatBlockIcons';
import StatBlockDisplay from './StatBlockDisplay';

// --- API SERVICE ---
const searchMonsters = async (query) => {
    if (!query || query.length < 3) return [];
    try {
        const response = await fetch(`https://api.open5e.com/monsters/?search=${query}&limit=50`);
        const data = await response.json();
        
        const sortedResults = data.results.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            const q = query.toLowerCase();
            if (nameA === q && nameB !== q) return -1;
            if (nameB === q && nameA !== q) return 1;
            const startsA = nameA.startsWith(q);
            const startsB = nameB.startsWith(q);
            if (startsA && !startsB) return -1;
            if (!startsA && startsB) return 1;
            return nameA.localeCompare(nameB);
        });
        return sortedResults.slice(0, 10);
    } catch (error) { console.error("API Error:", error); return []; }
};

const emptyData = {
    name: "New Monster", meta: "Medium Humanoid, Unaligned",
    ac: "", hp: "", speed: "",
    stats: { STR: { val: 10, mod: "+0" }, DEX: { val: 10, mod: "+0" }, CON: { val: 10, mod: "+0" }, INT: { val: 10, mod: "+0" }, WIS: { val: 10, mod: "+0" }, CHA: { val: 10, mod: "+0" } },
    props: { saves: "", skills: "", vulnerabilities: "", resistances: "", immunities: "", conditions: "", senses: "", languages: "", challenge: "" },
    traits: [], actions: [], bonusActions: [], reactions: [], legendary: []
};

// --- MAIN EDITOR COMPONENT ---
const StatBlockEditor = ({ initialData, onSave, onCancel }) => {
    const [mode, setMode] = useState('builder');
    const [rawText, setRawText] = useState("");
    
    const [data, setData] = useState({ ...emptyData, ...initialData });

    useEffect(() => {
        if (initialData && initialData.id && data.id !== initialData.id) {
            setData(prev => ({ ...prev, id: initialData.id }));
        }
    }, [initialData]);

    const [copyFeedback, setCopyFeedback] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const statBlockRef = useRef(null);

    // SEARCH STATE
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsSearching(true);
                const res = await searchMonsters(searchQuery);
                setSearchResults(res);
                setIsSearching(false);
            } else { setSearchResults([]); }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const getMod = (score) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const handleImportMonster = (apiData) => {
        const mapped = {
            ...data, 
            name: apiData.name,
            meta: `${apiData.size} ${apiData.type}, ${apiData.alignment}`,
            ac: apiData.armor_class?.toString(),
            hp: `${apiData.hit_points} (${apiData.hit_dice})`,
            speed: Object.entries(apiData.speed || {}).map(([k, v]) => `${k} ${v}ft.`).join(', '),
            stats: {
                STR: { val: apiData.strength, mod: getMod(apiData.strength) },
                DEX: { val: apiData.dexterity, mod: getMod(apiData.dexterity) },
                CON: { val: apiData.constitution, mod: getMod(apiData.constitution) },
                INT: { val: apiData.intelligence, mod: getMod(apiData.intelligence) },
                WIS: { val: apiData.wisdom, mod: getMod(apiData.wisdom) },
                CHA: { val: apiData.charisma, mod: getMod(apiData.charisma) }
            },
            props: {
                saves: Object.entries(apiData).filter(([k]) => k.includes('_save') && apiData[k] !== null).map(([k, v]) => `${k.replace('_save', '').toUpperCase()} +${v}`).join(', '),
                skills: Object.entries(apiData.skills || {}).map(([k, v]) => `${k} +${v}`).join(', '),
                vulnerabilities: apiData.damage_vulnerabilities,
                resistances: apiData.damage_resistances,
                immunities: apiData.damage_immunities,
                conditions: apiData.condition_immunities,
                senses: apiData.senses,
                languages: apiData.languages,
                challenge: `${apiData.challenge_rating} (${apiData.xp} XP)`
            },
            traits: apiData.special_abilities ? apiData.special_abilities.map(a => ({ name: a.name, desc: a.desc })) : [],
            actions: apiData.actions ? apiData.actions.map(a => ({ name: a.name, desc: a.desc })) : [],
            bonusActions: apiData.bonus_actions ? apiData.bonus_actions.map(a => ({ name: a.name, desc: a.desc })) : [],
            reactions: apiData.reactions ? apiData.reactions.map(a => ({ name: a.name, desc: a.desc })) : [],
            legendary: apiData.legendary_actions ? apiData.legendary_actions.map(a => ({ name: a.name, desc: a.desc })) : []
        };
        setData(mapped);
        setRawText(generateText(mapped));
        setSearchResults([]);
        setSearchQuery('');
    };

    const generateText = (d) => {
        let txt = `${d.name}\n${d.meta}\n`;
        if (d.ac) txt += `Armor Class ${d.ac}\n`;
        if (d.hp) txt += `Hit Points ${d.hp}\n`;
        if (d.speed) txt += `Speed ${d.speed}\n\n`;
        ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].forEach(k => { txt += `${k} ${d.stats[k].val} (${d.stats[k].mod}) `; });
        txt += '\n\n';
        if (d.props.saves) txt += `Saving Throws ${d.props.saves}\n`;
        if (d.props.skills) txt += `Skills ${d.props.skills}\n`;
        if (d.props.vulnerabilities) txt += `Damage Vulnerabilities ${d.props.vulnerabilities}\n`;
        if (d.props.resistances) txt += `Damage Resistances ${d.props.resistances}\n`;
        if (d.props.immunities) txt += `Damage Immunities ${d.props.immunities}\n`;
        if (d.props.conditions) txt += `Condition Immunities ${d.props.conditions}\n`;
        if (d.props.senses) txt += `Senses ${d.props.senses}\n`;
        if (d.props.languages) txt += `Languages ${d.props.languages}\n`;
        if (d.props.challenge) txt += `Challenge ${d.props.challenge}\n`;
        txt += '\n';
        const printSec = (t, items) => { if (!items?.length) return ''; let s = `${t}\n`; items.forEach(i => s += `${i.name ? i.name + '. ' : ''}${i.desc}\n`); return s + '\n'; };
        txt += printSec('Traits', d.traits); txt += printSec('Actions', d.actions); txt += printSec('Bonus Actions', d.bonusActions); txt += printSec('Reactions', d.reactions); txt += printSec('Legendary Actions', d.legendary);
        return txt.trim();
    };

    // --- AGGRESSIVE PARSER ---
    const parseInput = (text) => {
        const keywords = ['Armor Class', 'Hit Points', 'Speed', 'Saving Throws', 'Skills', 'Damage Vulnerabilities', 'Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge', 'Traits', 'Passive Evner'];
        
        // 1. Definer headers
        const sectionHeaders = ['Actions', 'Handlinger', 'Bonus Actions', 'Bonus Handlinger', 'Reactions', 'Reaktioner', 'Legendary Actions', 'Legendariske Handlinger'];

        let normalized = text;
        
        // 2. Normalisering: Keywords til ny linje
        keywords.forEach(kw => {
            // (?<!...) = Lookbehind: Match hvis ikke allerede ny linje
            // Men vi gør det simpelt: Replace alle forekomster med \n + keyword
            const regex = new RegExp(`(?<!^|\\n)(\\b${kw}\\b)`, 'gi');
            normalized = normalized.replace(regex, '\n$1');
        });

        // 3. Normalisering: Sektions-headers til HELT EGEN linje
        // ^ = Start af linje (multiline)
        // \s* = Evt mellemrum
        // (header...) = Capture headeren og alt efter den på linjen
        // $ = Slut på linje
        sectionHeaders.forEach(kw => {
            const regex = new RegExp(`^\\s*(${kw}\\b.*)$`, 'gim'); // 'm' flag er vigtigt her!
            normalized = normalized.replace(regex, '\n$1\n');
        });

        const lines = normalized.split('\n').filter(l => l.trim().length > 0);
        const newData = JSON.parse(JSON.stringify(emptyData));

        if (lines.length === 0) return newData;

        newData.name = lines[0]?.trim() || "Unknown";
        newData.meta = lines[1]?.trim() || "";

        const extract = (regex) => { const m = normalized.match(regex); return m ? m[1].trim() : ""; };
        newData.ac = extract(/\b(?:Armor Class|AC)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.hp = extract(/\b(?:Hit Points|HP)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.speed = extract(/\b(?:Speed)\b[\s:]*(.*?)(?=\n|$)/i);

        // Stats parsing
        const keys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
        keys.forEach(key => {
            const r = new RegExp(`\\b${key}[^\\d\\n]*(\\d+)\\s*(?:\\(([-+]?\\d+)\\))?`, 'i');
            const m = normalized.match(r);
            if (m) {
                const val = parseInt(m[1]);
                const mod = m[2] ? m[2] : getMod(val);
                newData.stats[key] = { val, mod };
            }
        });

        newData.props.saves = extract(/\b(?:Saving Throws|Saves)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.skills = extract(/\b(?:Skills)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.vulnerabilities = extract(/\b(?:Damage Vulnerabilities)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.resistances = extract(/\b(?:Damage Resistances|Resistances)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.immunities = extract(/\b(?:Damage Immunities|Immunities)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.conditions = extract(/\b(?:Condition Immunities)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.senses = extract(/\b(?:Senses)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.languages = extract(/\b(?:Sprog|Languages)\b[\s:]*(.*?)(?=\n|$)/i);
        newData.props.challenge = extract(/\b(?:Challenge|CR)\b[\s:]*(.*?)(?=\n|$)/i);

        // --- SECTION PARSING ---
        const headersRegex = {
            actions: /^Actions.*/i,
            bonus: /^(?:Bonus Actions|Bonus Handlinger).*/i,
            reactions: /^(?:Reactions|Reaktioner).*/i,
            legendary: /^(?:Legendary Actions|Legendariske Handlinger).*/i,
            traitsStart: /^(?:Traits|Passive Evner|Egenskaber|Features).*/i,
            statsEnd: /(?:Challenge|CR)[\s:]/i
        };

        const findIdx = (regex) => { 
            // Vi leder efter en linje der matcher regexen helt (pga normaliseringen)
            return normalized.split('\n').findIndex(l => regex.test(l.trim())); 
        };
        
        // Find linje-numre i stedet for tegn-indeks for bedre kontrol
        const rawLines = normalized.split('\n');
        
        const lineIndices = [
            { k: 'traits', i: findIdx(headersRegex.traitsStart) },
            { k: 'actions', i: findIdx(headersRegex.actions) },
            { k: 'bonusActions', i: findIdx(headersRegex.bonus) },
            { k: 'reactions', i: findIdx(headersRegex.reactions) },
            { k: 'legendary', i: findIdx(headersRegex.legendary) }
        ].filter(x => x.i !== -1).sort((a, b) => a.i - b.i);

        // Traits fallback logic (Hvis Traits ikke har header, men kommer efter CR)
        if (!lineIndices.some(x => x.k === 'traits')) {
            const crIdx = rawLines.findIndex(l => headersRegex.statsEnd.test(l));
            if (crIdx !== -1) {
                // Traits starter linjen efter CR, HVIS den linje er før første sektion
                const traitsStartIdx = crIdx + 1;
                const firstSectionIdx = lineIndices.length > 0 ? lineIndices[0].i : rawLines.length;
                
                if (traitsStartIdx < firstSectionIdx) {
                    lineIndices.unshift({ k: 'traits', i: traitsStartIdx });
                }
            }
        }

        const parseChunkLines = (lines) => {
            const res = [];
            lines.forEach(l => {
                const cleanL = l.trim();
                if (!cleanL) return;
                
                // Skip header linjen selv (hvis den sneg sig med)
                if (Object.values(headersRegex).some(h => h.test(cleanL))) return;

                const isSubProperty = /^(?:Hit|Miss|Fejlet|Success|Succes|Flavor|Note)[:.]/i.test(cleanL);
                
                // Regex: "1. Navn." eller "Navn:"
                const nmMatch = cleanL.match(/^(?:\d+\.?\s*)?(.+?)(?::|\.)(?:\s|$)/);
                
                if (nmMatch && nmMatch[1].length < 60 && !isSubProperty) {
                    const n = nmMatch[1].trim();
                    const d = cleanL.substring(nmMatch[0].length).trim();
                    res.push({ name: n, desc: d });
                } else {
                    if (res.length > 0) {
                        res[res.length - 1].desc += "\n" + cleanL;
                    } else {
                        // Intro text
                        res.push({ name: "", desc: cleanL });
                    }
                }
            });
            return res;
        };

        lineIndices.forEach((sec, i) => {
            const startLine = sec.i; // Start linje (inklusiv header)
            const endLine = lineIndices[i + 1] ? lineIndices[i + 1].i : rawLines.length;
            
            // Slice linjerne ud. 
            // Hvis det er en eksplicit header (Actions etc), så skip den første linje.
            // Hvis det er Traits fallback (ingen header), så tag alt.
            const hasExplicitHeader = Object.values(headersRegex).some(r => r.test(rawLines[startLine]));
            const chunkLines = rawLines.slice(hasExplicitHeader ? startLine + 1 : startLine, endLine);
            
            newData[sec.k] = parseChunkLines(chunkLines);
        });

        return newData;
    };

    useEffect(() => { 
        if (mode === 'text') { 
            setData(prev => ({ 
                ...parseInput(rawText), 
                id: prev.id, 
                folderId: prev.folderId 
            })); 
        } 
    }, [rawText, mode]);

    const handleSwitchMode = (newMode) => { if (newMode === 'text') { setRawText(generateText(data)); } setMode(newMode); };

    const handleDataChange = (path, value) => {
        const newData = { ...data };
        if (path.includes('.')) { const [p1, p2] = path.split('.'); newData[p1][p2] = value; } else { newData[path] = value; }
        setData(newData);
    };
    const handleStatChange = (key, val) => {
        const v = parseInt(val) || 10; const modStr = getMod(v);
        setData(prev => ({ ...prev, stats: { ...prev.stats, [key]: { val: v, mod: modStr } } }));
    };
    const handleListChange = (listKey, idx, field, val) => { const newList = [...data[listKey]]; newList[idx][field] = val; setData(prev => ({ ...prev, [listKey]: newList })); };
    const addListItem = (listKey) => { setData(prev => ({ ...prev, [listKey]: [...prev[listKey], { name: "", desc: "" }] })); };
    const removeListItem = (listKey, idx) => { setData(prev => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== idx) })); };

    const handleDownload = () => {
        if (!statBlockRef.current) return;
        setIsDownloading(true);
        html2canvas(statBlockRef.current, { scale: 2, backgroundColor: null, useCORS: true }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${(data.name || 'monster').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            setIsDownloading(false);
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateText(data));
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 md:p-8 font-sans-dnd">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md">
                    <div className="flex items-center gap-4">
                        <button onClick={onCancel} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                            <Icon path={Icons.ArrowLeft} /> Back to Library
                        </button>
                        <div className="h-6 w-px bg-gray-700"></div>
                        <h1 className="text-xl font-bold text-gray-100">{data.name || 'New Monster'}</h1>
                    </div>
                    <button onClick={() => onSave(data)} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                        <Icon path={Icons.Save} /> Save to Library
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-150px)] min-h-[600px]">
                    <div className="flex flex-col gap-4 overflow-hidden h-full">
                        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                            {/* SEARCH */}
                            <div className="p-4 border-b border-gray-700 bg-gray-800/50 shrink-0">
                                <div className="relative">
                                    <input type="text" placeholder="Search SRD Monster..." className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 pl-10 pr-4 text-sm text-gray-200 focus:ring-2 focus:ring-red-500 outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    <div className="absolute left-3 top-2.5 text-gray-500"><Icon path={Icons.Search} /></div>
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
                                            {searchResults.map(m => (<button key={m.slug} onClick={() => handleImportMonster(m)} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-sm text-gray-300 border-b border-gray-700 last:border-0 flex justify-between"><span className="font-bold text-gray-200">{m.name}</span><span className="text-xs text-gray-500">{m.type} • CR {m.challenge_rating}</span></button>))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex border-b border-gray-700 shrink-0">
                                <button onClick={() => handleSwitchMode('builder')} className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'builder' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-700/50'}`}><Icon path={Icons.Builder} /> Visual Builder</button>
                                <button onClick={() => handleSwitchMode('text')} className={`flex-1 py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mode === 'text' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-700/50'}`}><Icon path={Icons.Text} /> Text Editor</button>
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {mode === 'text' ? (
                                    <textarea value={rawText} onChange={(e) => setRawText(e.target.value)} className="w-full h-full p-4 border border-gray-600 bg-gray-900 text-gray-200 rounded-md font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="Paste stat block..." spellCheck="false" />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1">Basic Info</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div><label className="text-xs text-gray-400 block mb-1">Name</label><input type="text" value={data.name} onChange={e => handleDataChange('name', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-red-500 outline-none" /></div>
                                                <div><label className="text-xs text-gray-400 block mb-1">Meta</label><input type="text" value={data.meta} onChange={e => handleDataChange('meta', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-red-500 outline-none" /></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1">Combat Stats</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div><label className="text-xs text-gray-400 block mb-1">AC</label><input type="text" value={data.ac} onChange={e => handleDataChange('ac', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-red-500 outline-none" /></div>
                                                <div><label className="text-xs text-gray-400 block mb-1">HP</label><input type="text" value={data.hp} onChange={e => handleDataChange('hp', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-red-500 outline-none" /></div>
                                                <div><label className="text-xs text-gray-400 block mb-1">Speed</label><input type="text" value={data.speed} onChange={e => handleDataChange('speed', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-red-500 outline-none" /></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1">Stats</h3>
                                            <div className="grid grid-cols-6 gap-1">
                                                {Object.keys(data.stats).map(key => (<div key={key} className="text-center"><label className="text-[10px] text-gray-400 block mb-1">{key}</label><input type="number" value={data.stats[key].val} onChange={e => handleStatChange(key, e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-center text-sm" /></div>))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1">Properties</h3>
                                            {Object.keys(data.props).map(key => (<div key={key}><label className="text-xs text-gray-400 block mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label><input type="text" value={data.props[key]} onChange={e => handleDataChange(`props.${key}`, e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-gray-200 focus:border-red-500 outline-none" /></div>))}
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-700 pb-1">Traits & Actions</h3>
                                            {[{k:'traits',t:'Traits'}, {k:'actions',t:'Actions'}, {k:'bonusActions',t:'Bonus'}, {k:'reactions',t:'Reactions'}, {k:'legendary',t:'Legendary'}].map(sec => (
                                                <div key={sec.k} className="space-y-2">
                                                    <div className="flex justify-between items-center"><h4 className="text-xs text-gray-400">{sec.t}</h4><button onClick={() => addListItem(sec.k)} className="text-xs text-red-500"><Icon path={Icons.Plus} className="w-3 h-3"/> Add</button></div>
                                                    {data[sec.k].map((item, idx) => (
                                                        <div key={idx} className="bg-gray-900 border border-gray-700 rounded p-2 relative group">
                                                            <div className="flex justify-between mb-1">
                                                                <input type="text" value={item.name} onChange={e=>handleListChange(sec.k,idx,'name',e.target.value)} className="bg-transparent font-bold text-gray-200 w-3/4 text-sm outline-none" placeholder="Name"/>
                                                                <button onClick={()=>removeListItem(sec.k,idx)} className="text-gray-600 hover:text-red-500"><Icon path={Icons.Trash} className="w-3 h-3"/></button>
                                                            </div>
                                                            <textarea value={item.desc} onChange={e=>handleListChange(sec.k,idx,'desc',e.target.value)} className="bg-transparent text-gray-400 w-full text-xs h-12 outline-none resize-none" placeholder="Description"/>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="flex flex-col gap-4 overflow-hidden h-full">
                        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 h-full overflow-y-auto relative">
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxwYXRoIGQ9Ik0xIDFoMnYySDF6IiBmaWxsPSIjZmZmIiAvPgo8L3N2Zz4=')]"></div>
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sticky top-0 bg-gray-800/95 backdrop-blur-sm py-2 z-10 border-b border-gray-700 gap-2 sm:gap-0">
                                <h2 className="font-semibold text-gray-200 flex items-center gap-2"><Icon path={Icons.Copy} /> Stat Block Preview</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleDownload} className="text-xs flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors border border-gray-600"><Icon path={Icons.Download} /> PNG</button>
                                    <button onClick={handleCopy} className="text-xs flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition-colors border border-gray-600">{copyFeedback ? <span className="text-green-400 font-bold">Copied!</span> : <><Icon path={Icons.Copy} /> Copy Text</>}</button>
                                </div>
                            </div>
                            <div ref={statBlockRef} className="mx-auto w-full max-w-md shadow-xl relative">
                                <StatBlockDisplay data={data} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatBlockEditor;