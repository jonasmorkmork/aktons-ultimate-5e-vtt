import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { useNavigate } from 'react-router-dom'; // <--- NY IMPORT
import { Icon, Icons, COLOR_OPTIONS, SOUND_TYPES } from './soundboardData';
import { SettingsModal, FolderModal, DeleteModal, AddTrackModal, EditNameModal } from './SoundboardModals';
import { saveAudioFile, getAudioFile, deleteAudioFile } from './db';

const YOUTUBE_OPTS = {
    height: '0',
    width: '0',
    playerVars: { autoplay: 0, controls: 0 },
};

const FIXED_TABS = [
    { id: 'all', label: 'General', icon: Icons.Folder },
    { id: 'music', label: 'Music', icon: Icons.Music },
    { id: 'ambience', label: 'Ambience', icon: Icons.Cloud },
    { id: 'sfx', label: 'SFX', icon: Icons.Bolt },
];

const Soundboard = () => {
    const navigate = useNavigate(); // <--- HOOK
    const [sounds, setSounds] = useState([]);
    const [categories, setCategories] = useState(['General']); 
    
    // NAVIGATION STATE
    const [activeTab, setActiveTab] = useState('all'); 
    const [currentFolder, setCurrentFolder] = useState(null); 
    
    // SELECTION & INPUT STATE
    const [selectedSoundIds, setSelectedSoundIds] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null); 
    const cardRefs = useRef({}); 
    const isShiftDown = useRef(false);

    // UI State
    const [showSettings, setShowSettings] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [draggedSoundId, setDraggedSoundId] = useState(null);

    // Settings & Master Volume
    const [masterVolume, setMasterVolume] = useState(100);
    const [fadeConfig, setFadeConfig] = useState({
        fadeInDuration: 3000,
        fadeOutDuration: 4000,
        crossfade: true
    });
    
    // Refs
    const playersRef = useRef({}); 
    const fadeIntervals = useRef({});
    const targetVolumesRef = useRef({}); 
    const containerRef = useRef(null); 

    // --- HELPER: CALCULATE EFFECTIVE VOLUME ---
    const calcVolume = (trackVol) => {
        return trackVol * (masterVolume / 100);
    };

    // --- PERSISTENCE LOGIC (LOAD) & GLOBAL KEY LISTENER ---
    useEffect(() => {
        const handleKeyDown = (e) => { if(e.key === 'Shift') isShiftDown.current = true; };
        const handleKeyUp = (e) => { if(e.key === 'Shift') isShiftDown.current = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const load = async () => {
            const savedSounds = localStorage.getItem('dnd_soundboard');
            const savedSettings = localStorage.getItem('dnd_settings');
            const savedCategories = localStorage.getItem('dnd_categories');
            const savedMaster = localStorage.getItem('dnd_masterVolume');
            
            if (savedCategories) { try { setCategories(JSON.parse(savedCategories)); } catch(e) {} }
            if (savedSettings) { try { setFadeConfig(JSON.parse(savedSettings)); } catch (e) {} }
            if (savedMaster) { try { setMasterVolume(parseInt(savedMaster)); } catch(e) {} }

            if (savedSounds) {
                try {
                    let parsed = JSON.parse(savedSounds);
                    parsed = parsed.map(s => {
                        let fixedVol = s.volume;
                        if (fixedVol <= 1) fixedVol = fixedVol * 100;
                        const color = s.color || COLOR_OPTIONS.find(c => c.id === 'zinc');
                        const category = s.category || 'General';
                        const type = s.type || 'youtube'; 
                        const loop = s.loop !== undefined ? s.loop : true;
                        const soundType = s.soundType || 'music'; 
                        return { ...s, type, soundType, playing: false, isPaused: false, isFadingOut: false, isLoading: false, volume: fixedVol, color, category, loop, blobUrl: null };
                    });

                    const loadedSounds = await Promise.all(parsed.map(async (s) => {
                        if (s.type === 'file') {
                            try {
                                const file = await getAudioFile(s.id);
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    return { ...s, blobUrl: url };
                                }
                            } catch (err) { console.error("Failed to load audio file", err); }
                        }
                        return s;
                    }));

                    setSounds(loadedSounds);
                    loadedSounds.forEach(s => targetVolumesRef.current[s.id] = s.volume);
                } catch (e) { console.error(e); }
            }
        };
        load();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // --- PERSISTENCE LOGIC (SAVE) ---
    const saveSounds = (updatedSounds) => {
        setSounds(updatedSounds);
        updatedSounds.forEach(s => targetVolumesRef.current[s.id] = s.volume);
        const toSave = updatedSounds.map(({ playing, isPaused, isFadingOut, isLoading, blobUrl, ...rest }) => rest);
        localStorage.setItem('dnd_soundboard', JSON.stringify(toSave));
    };

    const saveCategories = (newCats) => {
        setCategories(newCats);
        localStorage.setItem('dnd_categories', JSON.stringify(newCats));
    };

    // --- ACTIONS ---
    const handleAddSound = async (tracksInput) => {
        const tracks = Array.isArray(tracksInput) ? tracksInput : [tracksInput];
        const targetCategory = currentFolder || 'General';
        const newSounds = [];
        const currentTimestamp = Date.now();

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const id = currentTimestamp + i;
            
            const newSound = { 
                id, 
                name: track.name || "Unnamed Track", 
                videoId: track.type === 'youtube' ? track.videoId : null,
                type: track.type,
                soundType: track.soundType || 'music', 
                volume: 50, playing: false, isPaused: false, isFadingOut: false, isLoading: false, 
                loop: track.soundType !== 'sfx', 
                color: track.color, 
                category: targetCategory,
                blobUrl: null 
            };

            if (track.type === 'file' && track.file) {
                await saveAudioFile(id, track.file);
                newSound.blobUrl = URL.createObjectURL(track.file);
            }

            targetVolumesRef.current[id] = 50;
            newSounds.push(newSound);
        }

        saveSounds([...sounds, ...newSounds]);
    };

    const handleCreateFolder = (name) => {
        const cleanName = name.trim();
        if (cleanName && !categories.includes(cleanName)) {
            saveCategories([...categories, cleanName]);
            setShowFolderModal(false);
        } else if (categories.includes(cleanName)) {
            alert("Folder already exists!");
        }
    };

    // --- EDIT & RENAME LOGIC ---
    const openEditModal = (e, type, id, currentName) => {
        e.stopPropagation();
        setItemToEdit({ type, id, name: currentName });
        setShowEditModal(true);
    };

    const handleRename = (newName) => {
        if (!newName.trim() || !itemToEdit) return;
        const finalName = newName.trim();

        if (itemToEdit.type === 'folder') {
            const oldName = itemToEdit.name;
            if (categories.includes(finalName) && finalName !== oldName) {
                alert("Folder name already exists!");
                return;
            }
            const updatedCategories = categories.map(c => c === oldName ? finalName : c);
            saveCategories(updatedCategories);
            const updatedSounds = sounds.map(s => s.category === oldName ? { ...s, category: finalName } : s);
            saveSounds(updatedSounds);
            if (currentFolder === oldName) setCurrentFolder(finalName);

        } else if (itemToEdit.type === 'track') {
            const updatedSounds = sounds.map(s => s.id === itemToEdit.id ? { ...s, name: finalName } : s);
            saveSounds(updatedSounds);
        }
        
        setItemToEdit(null);
    };

    const handleDeleteFolder = () => {
        if (!categoryToDelete) return;
        const newCats = categories.filter(c => c !== categoryToDelete);
        saveCategories(newCats);
        const updatedSounds = sounds.map(s => s.category === categoryToDelete ? { ...s, category: 'General' } : s);
        saveSounds(updatedSounds);
        if (currentFolder === categoryToDelete) setCurrentFolder(null);
        setShowDeleteModal(false);
        setCategoryToDelete(null);
    };

    // --- PLAYER ABSTRACTION LAYER ---
    const getPlayer = (id) => {
        const ref = playersRef.current[id];
        if (!ref) return null;
        const sound = sounds.find(s => s.id === id);
        const type = sound ? sound.type : 'youtube';

        return {
            play: () => { try { if (type === 'youtube') ref.playVideo(); else ref.play(); } catch(e) {} },
            pause: () => { try { if (type === 'youtube') ref.pauseVideo(); else ref.pause(); } catch(e) {} },
            setVolume: (vol) => { 
                try {
                    if (type === 'youtube') { if (ref && typeof ref.setVolume === 'function') ref.setVolume(vol); } 
                    else { if (ref) ref.volume = vol / 100; }
                } catch(e) {} 
            },
            getVolume: () => { try { if (type === 'youtube') return ref.getVolume(); else return ref.volume * 100; } catch(e) { return 0; } },
            seekToStart: () => { try { if (type === 'youtube') ref.seekTo(0); else ref.currentTime = 0; } catch(e) {} }
        };
    };

    // --- MASTER VOLUME & FADE LOGIC ---
    const updateMasterVolume = (newVal) => {
        setMasterVolume(newVal);
        localStorage.setItem('dnd_masterVolume', newVal);
        sounds.forEach(s => {
            if (s.playing && !s.isPaused) {
                const player = getPlayer(s.id);
                if (player && !s.isFadingOut) player.setVolume(s.volume * (newVal / 100));
            }
        });
    };

    const fadeTo = (id, targetTrackVol, durationOverride = null, shouldPauseOnly = false) => {
        if (fadeIntervals.current[id]) clearInterval(fadeIntervals.current[id]);
        
        const player = getPlayer(id);
        if (!player) return;

        const effectiveTarget = shouldPauseOnly ? 0 : calcVolume(targetTrackVol);
        const duration = durationOverride !== null ? durationOverride : (effectiveTarget === 0 ? fadeConfig.fadeOutDuration : fadeConfig.fadeInDuration);

        setSounds(prev => prev.map(s => s.id === id ? { ...s, isFadingOut: true, isLoading: false } : s));
        let currentVol = player.getVolume() || 0;
        
        if (duration < 100) {
            player.setVolume(effectiveTarget);
            if (effectiveTarget === 0) {
                player.pause();
                setSounds(prev => prev.map(s => s.id === id ? { ...s, playing: shouldPauseOnly, isPaused: shouldPauseOnly, isFadingOut: false } : s));
            }
            return;
        }

        const intervalTime = 50;
        const steps = duration / intervalTime;
        const volDiff = effectiveTarget - currentVol;
        const stepSize = volDiff / steps;
        let stepsTaken = 0;

        fadeIntervals.current[id] = setInterval(() => {
            stepsTaken++;
            currentVol += stepSize;
            if ((stepSize > 0 && currentVol >= effectiveTarget) || (stepSize < 0 && currentVol <= effectiveTarget)) currentVol = effectiveTarget;
            player.setVolume(currentVol);

            if (Math.abs(currentVol - effectiveTarget) < 1 || stepsTaken >= steps) {
                clearInterval(fadeIntervals.current[id]);
                player.setVolume(effectiveTarget);
                if (effectiveTarget === 0) {
                    player.pause();
                    setSounds(prev => prev.map(s => s.id === id ? { ...s, playing: shouldPauseOnly, isPaused: shouldPauseOnly, isFadingOut: false } : s));
                } else {
                     setSounds(prev => prev.map(s => s.id === id ? { ...s, isFadingOut: false } : s));
                }
            }
        }, intervalTime);
    };

    // --- PLAYBACK HANDLERS ---
    const handleTrackClick = (clickedId) => {
        if (selectedSoundIds.length > 0 && !selectedSoundIds.includes(clickedId)) {
            setSelectedSoundIds([]);
        }

        const clickedSound = sounds.find(s => s.id === clickedId);
        
        if (clickedSound.playing) {
            if (clickedSound.isPaused) togglePlayback(clickedId);
            return; 
        }

        const player = getPlayer(clickedId);
        if (player) { player.setVolume(0); player.seekToStart(); player.play(); }

        setSounds(prev => prev.map(s => {
            if (s.id === clickedId) return { ...s, playing: true, isPaused: false, isFadingOut: false, isLoading: true };
            return s;
        }));

        if (clickedSound.soundType === 'music') {
            sounds.forEach(otherSound => {
                if (otherSound.playing && !otherSound.isPaused && otherSound.id !== clickedId && otherSound.soundType === 'music') {
                    if (fadeConfig.crossfade) fadeTo(otherSound.id, 0, null, true); 
                    else {
                         const p = getPlayer(otherSound.id);
                         if(p) p.pause();
                         setSounds(prev => prev.map(s => s.id === otherSound.id ? { ...s, isPaused: true } : s));
                    }
                }
            });
        }
        const target = targetVolumesRef.current[clickedId] || 50;
        fadeTo(clickedId, target);
    };

    const togglePlayback = (id) => {
        const sound = sounds.find(s => s.id === id);
        const player = getPlayer(id);
        if (!sound || !player) return;

        if (sound.isPaused) {
            if (sound.soundType === 'music') {
                sounds.forEach(otherSound => {
                    if (otherSound.playing && !otherSound.isPaused && otherSound.id !== id && otherSound.soundType === 'music') {
                        if (fadeConfig.crossfade) fadeTo(otherSound.id, 0, null, true);
                        else {
                             const p = getPlayer(otherSound.id);
                             if(p) p.pause();
                             setSounds(prev => prev.map(s => s.id === otherSound.id ? { ...s, isPaused: true } : s));
                        }
                    }
                });
            }
            player.play();
            const target = targetVolumesRef.current[id] || 50;
            fadeTo(id, target, 500); 
            setSounds(prev => prev.map(s => s.id === id ? { ...s, isPaused: false } : s));

        } else {
            fadeTo(id, 0, 500, true);
        }
    };

    const removeFromMixer = (id) => { fadeTo(id, 0); };
    const onPlay = (id) => {
        const sound = sounds.find(s => s.id === id);
        if (sound && !sound.isFadingOut && !sound.isPaused && sound.isLoading) {
            const target = targetVolumesRef.current[id] || 50;
            fadeTo(id, target);
        }
    };
    const onEnd = (id) => {
        const sound = sounds.find(s => s.id === id);
        if (sound && sound.loop) {
            const player = getPlayer(id);
            if (player) { player.seekToStart(); player.play(); }
        } else { setSounds(prev => prev.map(s => s.id === id ? { ...s, isPaused: true } : s)); }
    };
    
    // --- UPDATED VOLUME HANDLER ---
    const changeVolume = (id, val, shiftKeyFromEvent = false) => {
        const vol = parseInt(val);
        const shiftHeld = shiftKeyFromEvent || isShiftDown.current; // Tjekker både event og global ref
        
        const updateSingleTrack = (trackId, newVol) => {
            targetVolumesRef.current[trackId] = newVol;
            if (fadeIntervals.current[trackId]) { clearInterval(fadeIntervals.current[trackId]); fadeIntervals.current[trackId] = null; }
            const player = getPlayer(trackId);
            if (player) player.setVolume(calcVolume(newVol));
        };

        if (shiftHeld && selectedSoundIds.includes(id)) {
            selectedSoundIds.forEach(sId => updateSingleTrack(sId, vol));
            saveSounds(sounds.map(s => selectedSoundIds.includes(s.id) ? { ...s, volume: vol, isFadingOut: false } : s));
        } else {
            updateSingleTrack(id, vol);
            saveSounds(sounds.map(s => s.id === id ? { ...s, volume: vol, isFadingOut: false } : s));
        }
    };

    const toggleLoop = (id) => { saveSounds(sounds.map(s => s.id === id ? { ...s, loop: !s.loop } : s)); };
    const removeSound = (id) => {
        const sound = sounds.find(s => s.id === id);
        if (fadeIntervals.current[id]) clearInterval(fadeIntervals.current[id]);
        if (sound && sound.type === 'file') deleteAudioFile(id);
        saveSounds(sounds.filter(s => s.id !== id));
        delete playersRef.current[id]; delete targetVolumesRef.current[id];
    };
    const stopAll = () => { sounds.forEach(s => { if (s.playing && !s.isFadingOut) fadeTo(s.id, 0); }); };

    // --- SELECTION & DRAG ---
    const handleMouseDown = (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.track-card')) return;
        setIsSelecting(true);
        setSelectionBox({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
        setSelectedSoundIds([]);
    };

    const handleMouseMove = (e) => {
        if (!isSelecting) return;
        setSelectionBox(prev => ({ ...prev, currentX: e.clientX, currentY: e.clientY }));
    };

    const handleMouseUp = (e) => {
        if (!isSelecting) return;
        const left = Math.min(selectionBox.startX, selectionBox.currentX);
        const top = Math.min(selectionBox.startY, selectionBox.currentY);
        const width = Math.abs(selectionBox.currentX - selectionBox.startX);
        const height = Math.abs(selectionBox.currentY - selectionBox.startY);
        const right = left + width;
        const bottom = top + height;

        const visibleIds = getSoundsForTab().map(s => s.id);
        const selected = [];
        visibleIds.forEach(id => {
            const el = cardRefs.current[id];
            if (el) {
                const rect = el.getBoundingClientRect();
                const intersect = !(rect.right < left || rect.left > right || rect.bottom < top || rect.top > bottom);
                if (intersect) selected.push(id);
            }
        });

        setSelectedSoundIds(prev => [...new Set([...prev, ...selected])]);
        setIsSelecting(false);
        setSelectionBox(null);
    };

    const handleDragStart = (e, id) => { 
        if (e.target.closest('.no-drag-zone')) { e.preventDefault(); return; }
        
        let idsToDrag = [id];
        if (selectedSoundIds.includes(id)) idsToDrag = selectedSoundIds;
        else setSelectedSoundIds([id]);

        setDraggedSoundId(id); 
        e.dataTransfer.setData("soundIds", JSON.stringify(idsToDrag)); 
        e.dataTransfer.effectAllowed = "move"; 
        
        if (idsToDrag.length > 1) {
            const dragIcon = document.createElement("div");
            dragIcon.innerText = `${idsToDrag.length} tracks`;
            dragIcon.style.background = "#9333ea";
            dragIcon.style.color = "white";
            dragIcon.style.padding = "5px 10px";
            dragIcon.style.borderRadius = "8px";
            dragIcon.style.position = "absolute";
            dragIcon.style.top = "-1000px";
            document.body.appendChild(dragIcon);
            e.dataTransfer.setDragImage(dragIcon, 0, 0);
            setTimeout(() => document.body.removeChild(dragIcon), 0);
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    const handleDropOnFolder = (e, targetFolder) => {
        e.preventDefault();
        e.stopPropagation(); 
        const jsonIds = e.dataTransfer.getData("soundIds");
        if (jsonIds) {
            try {
                const ids = JSON.parse(jsonIds); 
                const updatedSounds = sounds.map(s => ids.includes(s.id) ? { ...s, category: targetFolder } : s);
                saveSounds(updatedSounds);
                setSelectedSoundIds([]); 
            } catch(e) { console.error("Drop error", e); }
        }
        setDraggedSoundId(null);
    };

    const updateSettings = (key, value) => {
        const newSettings = { ...fadeConfig, [key]: value };
        setFadeConfig(newSettings);
        localStorage.setItem('dnd_settings', JSON.stringify(newSettings));
    };

    // --- VIEW LOGIC ---
    const getSoundsForTab = () => {
        if (activeTab === 'all') return sounds;
        return sounds.filter(s => s.soundType === activeTab);
    };
    
    const visibleSounds = getSoundsForTab();

    let itemsToRender = [];
    let foldersToRender = [];

    if (currentFolder === null) {
        foldersToRender = categories.filter(c => c !== 'General');
        itemsToRender = visibleSounds.filter(s => s.category === 'General');
    } else {
        itemsToRender = visibleSounds.filter(s => s.category === currentFolder);
    }

    const activeMixerSounds = sounds.filter(s => s.playing && s.soundType !== 'sfx'); 
    
    activeMixerSounds.sort((a, b) => {
        const order = { 'music': 0, 'ambience': 1, 'sfx': 2 };
        return (order[a.soundType] || 3) - (order[b.soundType] || 3);
    });

    return (
        <div 
            className="min-h-screen text-zinc-200 font-sans relative pb-40 select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={containerRef}
        >
            {isSelecting && selectionBox && (
                <div style={{ position: 'fixed', left: Math.min(selectionBox.startX, selectionBox.currentX), top: Math.min(selectionBox.startY, selectionBox.currentY), width: Math.abs(selectionBox.currentX - selectionBox.startX), height: Math.abs(selectionBox.currentY - selectionBox.startY), border: '1px solid rgba(147, 51, 234, 0.8)', backgroundColor: 'rgba(147, 51, 234, 0.2)', pointerEvents: 'none', zIndex: 9999 }} />
            )}

            <div style={{ display: 'none' }}>
                {sounds.map(sound => (
                    <React.Fragment key={`player-${sound.id}`}>
                        {sound.type === 'youtube' ? (
                            <YouTube videoId={sound.videoId} onReady={(e) => playersRef.current[sound.id] = e.target} onPlay={() => onPlay(sound.id)} onEnd={() => onEnd(sound.id)} opts={YOUTUBE_OPTS} />
                        ) : (
                            sound.blobUrl && <audio ref={el => playersRef.current[sound.id] = el} src={sound.blobUrl} loop={false} onPlay={() => onPlay(sound.id)} onEnded={() => onEnd(sound.id)} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-8">
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            {/* HOME BUTTON */}
                            <button 
                                onClick={() => navigate('/')} 
                                className="p-2 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors border border-zinc-700 shadow-md"
                                title="Back to Home"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            </button>
                            
                            <h1 className="text-4xl font-serif font-bold text-zinc-100 flex items-center gap-3">
                                <span className="text-purple-500"><Icon path={Icons.Music} className="w-10 h-10"/></span> DJ Bard
                            </h1>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="hidden md:flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg mr-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase">Master</span>
                                <input type="range" min="0" max="100" value={masterVolume} onChange={(e) => updateMasterVolume(parseInt(e.target.value))} className="w-24 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500"/>
                            </div>
                            <button onClick={() => setShowSettings(true)} className="p-2.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"><Icon path={Icons.Settings} className="w-5 h-5" /></button>
                            <button onClick={stopAll} className="flex items-center gap-2 px-5 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg border border-red-900/50 transition-colors text-sm font-bold shadow-lg"><Icon path={Icons.Stop} /> Fade All</button>
                        </div>
                    </div>
                    <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50 backdrop-blur-sm w-full md:w-auto md:inline-flex">
                        {FIXED_TABS.map(tab => (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setCurrentFolder(null); setSelectedSoundIds([]); }} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}>
                                <Icon path={tab.icon} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 animate-in fade-in slide-in-from-left-4">
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <button onClick={() => setCurrentFolder(null)} className={`flex items-center gap-1 transition-colors ${currentFolder ? 'text-zinc-500 hover:text-white' : 'text-white'}`}>
                            <Icon path={Icons.Folder} className="w-4 h-4" /> Root
                        </button>
                        {currentFolder && (
                            <>
                                <span className="text-zinc-700">/</span>
                                <span className="text-purple-400 flex items-center gap-1">
                                    {currentFolder}
                                    <button onClick={(e) => openEditModal(e, 'folder', null, currentFolder)} className="ml-2 p-1 hover:bg-white/10 text-zinc-500 hover:text-white rounded transition-colors"><Icon path={Icons.Edit} className="w-3 h-3" /></button>
                                    <button onClick={() => { setCategoryToDelete(currentFolder); setShowDeleteModal(true); }} className="ml-1 p-1 hover:bg-red-900/30 text-zinc-600 hover:text-red-400 rounded transition-colors"><Icon path={Icons.Trash} className="w-3 h-3" /></button>
                                </span>
                            </>
                        )}
                        {selectedSoundIds.length > 0 && <span className="ml-4 bg-purple-600 text-white px-2 py-0.5 rounded text-xs">{selectedSoundIds.length} selected</span>}
                    </div>
                    <div className="flex gap-2">
                        {currentFolder === null && <button onClick={() => { setShowFolderModal(true); setTimeout(() => document.getElementById('folderInput')?.focus(), 100); }} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-2 font-bold text-sm"><Icon path={Icons.Plus} className="w-4 h-4" /> New Folder</button>}
                        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-bold transition-all flex items-center gap-2 text-sm shadow-lg shadow-white/5"><Icon path={Icons.Plus} /> Add Track</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {currentFolder === null && foldersToRender.map(folderName => (
                        <div key={folderName} onClick={() => setCurrentFolder(folderName)} onDragOver={handleDragOver} onDrop={(e) => handleDropOnFolder(e, folderName)} className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer group transition-all aspect-square border-dashed hover:border-solid relative">
                            <button onClick={(e) => openEditModal(e, 'folder', null, folderName)} className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-white hover:bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Icon path={Icons.Edit} className="w-3 h-3" /></button>
                            <div className="w-16 h-16 rounded-2xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors shadow-inner"><Icon path={Icons.Folder} className="w-8 h-8 text-zinc-500 group-hover:text-purple-400 transition-colors" /></div>
                            <span className="font-bold text-zinc-400 group-hover:text-white transition-colors">{folderName}</span>
                            <span className="text-xs text-zinc-600 font-mono">{sounds.filter(s => s.category === folderName && (activeTab === 'all' || s.soundType === activeTab)).length} tracks</span>
                        </div>
                    ))}

                    {itemsToRender.map(sound => {
                        const theme = sound.color || COLOR_OPTIONS.find(c => c.id === 'zinc');
                        const isSelected = selectedSoundIds.includes(sound.id);
                        let cardStyle = `bg-zinc-900 border-zinc-800 hover:border-zinc-600 ${theme.idle}`;
                        if (isSelected) cardStyle = `bg-zinc-800 border-purple-500 ring-1 ring-purple-500 ${theme.idle}`;
                        if (sound.playing) {
                            if (sound.isPaused) cardStyle = `bg-zinc-900/80 border-zinc-700 ring-2 ring-zinc-700 scale-[0.98] opacity-80`;
                            else cardStyle = `${theme.active} shadow-xl ring-2 ring-offset-2 ring-offset-zinc-950 ring-${theme.id}-500 scale-[1.02]`;
                        }
                        const TypeIcon = SOUND_TYPES.find(t => t.id === sound.soundType)?.icon || Icons.Music;

                        return (
                            <div key={sound.id} ref={el => cardRefs.current[sound.id] = el} className={`track-card relative flex flex-col justify-between aspect-square rounded-2xl border-2 group overflow-hidden shadow-lg transition-all duration-300 ${cardStyle}`}>
                                <div className="p-4 flex-1 flex flex-col cursor-pointer" draggable="true" onDragStart={(e) => handleDragStart(e, sound.id)} onClick={() => handleTrackClick(sound.id)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-sm leading-tight line-clamp-2 transition-colors pointer-events-none ${sound.playing ? 'text-white' : 'text-zinc-300'}`}>{sound.name}</h3>
                                        <div className="flex gap-1 z-20">
                                            <button onClick={(e) => openEditModal(e, 'track', sound.id, sound.name)} className={`p-1 rounded hover:bg-black/20 ${sound.playing ? 'text-white/70 hover:text-white' : 'text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100'} transition-all`}><Icon path={Icons.Edit} className="w-3 h-3" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); removeSound(sound.id); }} className={`p-1 rounded hover:bg-black/20 ${sound.playing ? 'text-white/70 hover:text-white' : 'text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100'} transition-all`} onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}><Icon path={Icons.Trash} className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                                        {isSelected && !sound.playing ? <div className="bg-purple-600 p-2 rounded-full shadow-lg animate-in zoom-in"><Icon path={Icons.Check} className="w-8 h-8 text-white" /></div> : <Icon path={TypeIcon} className="w-20 h-20" />}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center pointer-events-none z-10">
                                        {sound.playing ? (sound.isPaused ? <Icon path={Icons.Pause} className="w-8 h-8 opacity-50 text-white" /> : (sound.isLoading ? <div className="animate-spin text-white"><Icon path={Icons.Loading} className="w-8 h-8" /></div> : <div className="animate-pulse"><Icon path={Icons.Volume} className="w-8 h-8 opacity-100" /></div>)) : <Icon path={Icons.Play} className={`w-8 h-8 opacity-20 group-hover:opacity-50 transition-opacity ${theme.btn}`} />}
                                    </div>
                                </div>
                                <div className="p-4 pt-0 cursor-default no-drag-zone z-10" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleLoop(sound.id)} className={`w-6 h-6 flex items-center justify-center rounded hover:bg-black/20 transition-colors ${sound.loop ? 'text-white' : 'text-white/30'}`} title={sound.loop ? "Looping" : "One Shot"}><Icon path={sound.loop ? Icons.Loop : Icons.OneShot} className="w-3 h-3" /></button>
                                            {/* HER SIKRER VI AT SHIFT KEY SENDES MED */}
                                            <input type="range" min={0} max={100} value={sound.volume} onChange={(e) => changeVolume(sound.id, e.target.value, e.nativeEvent.shiftKey)} className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${sound.playing ? 'bg-black/30 accent-white' : 'bg-zinc-800 accent-zinc-500'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {itemsToRender.length === 0 && foldersToRender.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                        <Icon path={Icons.Folder} className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400 mb-2">Empty Area</h3>
                        <p className="text-zinc-600 mb-6 max-w-sm mx-auto">This folder is empty. Create a new folder or add a track to get started.</p>
                        <div className="flex gap-4 justify-center">
                            {currentFolder === null && <button onClick={() => setShowFolderModal(true)} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-all">New Folder</button>}
                            <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20">Add Track</button>
                        </div>
                    </div>
                )}
            </div>

            <div className={`fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 transition-transform duration-300 z-50 ${activeMixerSounds.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-7xl mx-auto p-2">
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 pt-1 scrollbar-hide px-2">
                        {activeMixerSounds.map(sound => {
                            const TypeIcon = SOUND_TYPES.find(t => t.id === sound.soundType)?.icon || Icons.Music;
                            return (
                                <div key={sound.id} className={`shrink-0 w-64 p-3 rounded-xl border flex flex-col gap-2 transition-all ${sound.isPaused ? 'bg-zinc-900/50 border-zinc-800 opacity-75' : `bg-zinc-900 border-zinc-700 ${sound.color?.idle || ''}`}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sound.color?.bgRaw || 'bg-zinc-800'} ${sound.isPaused ? 'opacity-50' : ''}`}><Icon path={TypeIcon} className="text-white w-4 h-4" /></div>
                                        <div className="flex-1 min-w-0"><h4 className={`text-sm font-bold truncate ${sound.isPaused ? 'text-zinc-500' : 'text-zinc-200'}`}>{sound.name}</h4></div>
                                        <button onClick={() => removeFromMixer(sound.id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-500 hover:bg-red-900 hover:text-red-400 transition-colors"><Icon path={Icons.Close} className="w-3 h-3" /></button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => togglePlayback(sound.id)} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${sound.isPaused ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-white text-black hover:scale-105'}`}><Icon path={sound.isPaused ? Icons.Play : Icons.Pause} className="w-4 h-4 fill-current" /></button>
                                        <input type="range" min="0" max="100" value={sound.volume} onChange={(e) => changeVolume(sound.id, e.target.value, e.nativeEvent.shiftKey)} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <SettingsModal show={showSettings} onClose={() => setShowSettings(false)} config={fadeConfig} onUpdate={updateSettings} />
            <FolderModal show={showFolderModal} onClose={() => setShowFolderModal(false)} onCreate={handleCreateFolder} />
            <EditNameModal show={showEditModal} onClose={() => setShowEditModal(false)} onSave={handleRename} initialValue={itemToEdit?.name} title={itemToEdit?.type === 'folder' ? 'Rename Folder' : 'Rename Track'} />
            <DeleteModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onDelete={handleDeleteFolder} category={categoryToDelete} />
            <AddTrackModal show={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddSound} category={currentFolder || 'General'} />
        </div>
    );
};

export default Soundboard;