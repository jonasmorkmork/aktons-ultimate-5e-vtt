import { useState, useRef, useEffect, useMemo } from 'react';

const DEFAULT_GRID = { show: false, snap: false, size: 50, offset: {x:0,y:0}, type: 'solid', color: 'white' };

export const useBattlefieldLogic = (session, maps, tokenLibrary, onSave, onAddTokenToLibrary) => {
    // --- LAYERS & GRID ---
    const [layers, setLayers] = useState(session.layers || [{ id: 'main', name: 'Main Layer', mapId: session.mapId, mapData: session.mapData }]);
    const [activeLayerId, setActiveLayerId] = useState(session.activeLayerId || layers[0].id);
    
    const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0];
    const activeGridSettings = activeLayer.gridSettings || session.gridSettings || DEFAULT_GRID;

    const setGridSettings = (updates) => {
        setLayers(prev => prev.map(l => {
            if (l.id === activeLayerId) {
                const currentGrid = l.gridSettings || session.gridSettings || DEFAULT_GRID;
                const newGrid = typeof updates === 'function' ? updates(currentGrid) : { ...currentGrid, ...updates };
                return { ...l, gridSettings: newGrid };
            }
            return l;
        }));
    };

    // --- STATE ---
    const [tokens, setTokens] = useState(session.tokens || []);
    const [spellTemplates, setSpellTemplates] = useState(session.spellTemplates || []);
    const [pan, setPan] = useState(session.pan || { x: 0, y: 0 });
    const [zoom, setZoom] = useState(session.zoom || 1);
    const [history, setHistory] = useState([]);

    // --- FOG ---
    const [fogBoxes, setFogBoxes] = useState(session.fogBoxes || []);
    const [fogEnabled, setFogEnabled] = useState(session.fogEnabled || false);
    const [isCreatingFog, setIsCreatingFog] = useState(false);
    const [fogTool, setFogTool] = useState('rect');
    const [dragFogStart, setDragFogStart] = useState(null);
    const [currentFogRect, setCurrentFogRect] = useState(null);
    const [currentPolyPoints, setCurrentPolyPoints] = useState([]);
    const [polyMousePos, setPolyMousePos] = useState(null); 

    // --- INTERACTION & SELECTION ---
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState(null);
    
    const [selectedTokenIds, setSelectedTokenIds] = useState(new Set());
    const [selectedTemplateIds, setSelectedTemplateIds] = useState(new Set());
    const [selectedFogIds, setSelectedFogIds] = useState(new Set());
    
    const [isMovingGridMode, setIsMovingGridMode] = useState(false);
    const [isDraggingGrid, setIsDraggingGrid] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [spellParams, setSpellParams] = useState({ radius: 20, color: 'rgba(239, 68, 68, 0.4)' });

    // Refs
    const isInteractingRef = useRef(false); 
    const hasUnsavedChangesRef = useRef(false);
    const boardRef = useRef(null);
    const stateRef = useRef({}); 
    const dragInitialPositionsRef = useRef({});
    const historySnapshotRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });

    // --- HELPERS ---
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    const snapToCell = (x, y) => {
        const { size, offset } = activeGridSettings;
        const snappedX = Math.floor((x - offset.x) / size) * size + size / 2 + offset.x;
        const snappedY = Math.floor((y - offset.y) / size) * size + size / 2 + offset.y;
        return { x: snappedX, y: snappedY };
    };

    // --- ACTIONS ---
    const addToHistory = () => {
        setHistory(prev => {
            const newHistory = [...prev, { tokens, spellTemplates, fogBoxes }];
            if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
            return newHistory;
        });
    };

    const undo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        if (lastState.tokens) setTokens(lastState.tokens);
        if (lastState.spellTemplates) setSpellTemplates(lastState.spellTemplates);
        if (lastState.fogBoxes) setFogBoxes(lastState.fogBoxes);
        setHistory(prev => prev.slice(0, -1));
        setSelectedTokenIds(new Set());
        setSelectedTemplateIds(new Set());
        setSelectedFogIds(new Set());
    };

    const deleteSelected = (e) => {
        if(e && e.stopPropagation) e.stopPropagation();
        if (selectedTokenIds.size === 0 && selectedTemplateIds.size === 0 && selectedFogIds.size === 0) return;
        addToHistory();
        setTokens(prev => prev.filter(t => !selectedTokenIds.has(t.id)));
        setSpellTemplates(prev => prev.filter(t => !selectedTemplateIds.has(t.id)));
        setFogBoxes(prev => prev.filter(f => !selectedFogIds.has(f.id)));
        setSelectedTokenIds(new Set());
        setSelectedTemplateIds(new Set());
        setSelectedFogIds(new Set());
    };

    // --- STATE REF UPDATE ---
    useEffect(() => {
        stateRef.current = {
            pan, zoom, gridSettings: activeGridSettings, 
            fogEnabled, isCreatingFog, fogTool, dragFogStart,
            isDraggingGrid, dragStartPos, activeLayerId,
            currentFogRect, currentPolyPoints,
            isSelecting, selectionBox, tokens, spellTemplates, selectedTokenIds, selectedTemplateIds,
            isMovingGridMode, layers
        };
    }, [pan, zoom, activeGridSettings, fogEnabled, isCreatingFog, fogTool, dragFogStart, isDraggingGrid, dragStartPos, activeLayerId, currentFogRect, currentPolyPoints, isSelecting, selectionBox, tokens, spellTemplates, selectedTokenIds, selectedTemplateIds, isMovingGridMode, layers]);

    // --- MOUSE EVENT HANDLERS ---
    const handleMouseDown = (evt, type = 'map', id = null) => {
        isInteractingRef.current = true;

        if (!boardRef.current) return;
        
        const { pan: currPan, zoom: currZoom, fogEnabled, isCreatingFog, fogTool, isMovingGridMode, selectedFogIds, selectedTokenIds, selectedTemplateIds } = stateRef.current;
        
        const rect = boardRef.current.getBoundingClientRect();
        const clientX = evt.clientX;
        const clientY = evt.clientY;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        const worldX = (mouseX - currPan.x) / currZoom;
        const worldY = (mouseY - currPan.y) / currZoom;

        // FOG Logic
        if (fogEnabled) {
            if (isCreatingFog && fogTool === 'rect' && type === 'map') {
                setDragFogStart({ x: worldX, y: worldY });
                return;
            }
            if (isCreatingFog && fogTool === 'poly' && type === 'map') {
                let px = worldX; 
                let py = worldY;
                
                if (currentPolyPoints.length > 2) {
                    const start = currentPolyPoints[0];
                    const dist = Math.sqrt(Math.pow(px - start.x, 2) + Math.pow(py - start.y, 2));
                    if (dist < 20 / currZoom) { 
                        addToHistory();
                        setFogBoxes(prev => [...prev, { id: generateId(), type: 'poly', points: currentPolyPoints, layerId: activeLayerId }]);
                        setCurrentPolyPoints([]);
                        setPolyMousePos(null); 
                        return;
                    }
                }
                setCurrentPolyPoints(prev => [...prev, {x: px, y: py}]);
                return;
            }
            if (!isCreatingFog && type === 'fogBox' && id) {
                const newSelection = new Set(evt.shiftKey || evt.ctrlKey ? selectedFogIds : []);
                if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
                setSelectedFogIds(newSelection);
                if (!evt.shiftKey && !evt.ctrlKey) { setSelectedTokenIds(new Set()); setSelectedTemplateIds(new Set()); }
                return;
            }
        }

        // --- GRID MOVING LOGIC ---
        if (isMovingGridMode && type === 'map') {
            setIsDraggingGrid(true);
            setDragStartPos({ x: clientX, y: clientY });
            stateRef.current.isDraggingGrid = true;
            stateRef.current.dragStartPos = { x: clientX, y: clientY };
            return;
        }

        // --- SINGLE SELECTION LOGIC ---
        if ((type === 'token' || type === 'template') && id) {
            const isToken = type === 'token';
            const currentSet = isToken ? selectedTokenIds : selectedTemplateIds;
            const setFunc = isToken ? setSelectedTokenIds : setSelectedTemplateIds;
            
            if (evt.shiftKey || evt.ctrlKey || evt.metaKey) {
                const newSet = new Set(currentSet);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                setFunc(newSet);
            } else {
                if (!currentSet.has(id)) {
                    setFunc(new Set([id]));
                    if (isToken) setSelectedTemplateIds(new Set());
                    else setSelectedTokenIds(new Set());
                    setSelectedFogIds(new Set());
                }
            }
            return; 
        }
        
        // --- MAP CLICK LOGIC ---
        if (type === 'map' && !isCreatingFog && !isMovingGridMode) {
            if (!evt.shiftKey && !evt.ctrlKey && !evt.metaKey) {
                setSelectedTokenIds(new Set());
                setSelectedTemplateIds(new Set());
                setSelectedFogIds(new Set());
                return; 
            }
            if (evt.shiftKey) {
                setIsSelecting(true);
                setSelectionBox({ startX: worldX, startY: worldY, currentX: worldX, currentY: worldY });
            }
        }
    };

    const handleMouseMove = (e) => {
        if(!boardRef.current) return;
        const { zoom, pan, isCreatingFog, fogTool, dragFogStart, isDraggingGrid, currentPolyPoints, isSelecting, activeLayerId } = stateRef.current;
        const rect = boardRef.current.getBoundingClientRect();
        
        const currentX = (e.clientX - rect.left - pan.x) / zoom;
        const currentY = (e.clientY - rect.top - pan.y) / zoom;

        // Update Fog Rect
        if (stateRef.current.fogEnabled && isCreatingFog && fogTool === 'rect' && dragFogStart) {
            let x1 = dragFogStart.x; 
            let y1 = dragFogStart.y;
            let x2 = currentX; 
            let y2 = currentY;
            
            setCurrentFogRect({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) });
        }

        // Poly line preview
        if (stateRef.current.fogEnabled && isCreatingFog && fogTool === 'poly' && currentPolyPoints.length > 0) {
            let px = currentX;
            let py = currentY;
            setPolyMousePos({ x: px, y: py });
        } else if (polyMousePos) { setPolyMousePos(null); }

        // --- GRID MOVING LOGIC ---
        if (isDraggingGrid) {
            const dragStart = stateRef.current.dragStartPos;
            const deltaX = (e.clientX - dragStart.x) / zoom;
            const deltaY = (e.clientY - dragStart.y) / zoom;
            const currentLayerId = stateRef.current.activeLayerId; 

            setLayers(prevLayers => prevLayers.map(layer => {
                if (layer.id === currentLayerId) {
                    const currentGrid = layer.gridSettings || session.gridSettings || DEFAULT_GRID;
                    return {
                        ...layer,
                        gridSettings: {
                            ...currentGrid,
                            offset: { x: currentGrid.offset.x + deltaX, y: currentGrid.offset.y + deltaY }
                        }
                    };
                }
                return layer;
            }));
            
            setDragStartPos({ x: e.clientX, y: e.clientY });
            stateRef.current.dragStartPos = { x: e.clientX, y: e.clientY };
        }

        // --- UPDATE SELECTION BOX ---
        if (isSelecting) {
            setSelectionBox(prev => ({ ...prev, currentX: currentX, currentY: currentY }));
        }
    };

    const handleMouseUp = () => {
        isInteractingRef.current = false;

        const { 
            dragFogStart, currentFogRect, activeLayerId, 
            isSelecting, selectionBox, tokens, spellTemplates,
            selectedTokenIds, selectedTemplateIds
        } = stateRef.current;

        // Finish Fog Rect
        if (dragFogStart && currentFogRect && currentFogRect.width > 0) {
            addToHistory(); 
            setFogBoxes(prev => [...prev, { id: generateId(), type: 'rect', x: currentFogRect.x, y: currentFogRect.y, width: currentFogRect.width, height: currentFogRect.height, layerId: activeLayerId }]);
        }

        // --- FINISH SELECTION BOX ---
        if (isSelecting && selectionBox) {
            const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
            const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
            const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
            const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

            const newSelectedTokens = new Set(selectedTokenIds); 
            tokens.forEach(t => {
                if (t.x >= x1 && t.x <= x2 && t.y >= y1 && t.y <= y2) {
                    newSelectedTokens.add(t.id);
                }
            });
            setSelectedTokenIds(newSelectedTokens);

            const newSelectedTemplates = new Set(selectedTemplateIds);
            spellTemplates.forEach(t => {
                if (t.x >= x1 && t.x <= x2 && t.y >= y1 && t.y <= y2) {
                    newSelectedTemplates.add(t.id);
                }
            });
            setSelectedTemplateIds(newSelectedTemplates);
        }

        setDragFogStart(null);
        setCurrentFogRect(null);
        setIsDraggingGrid(false);
        setIsSelecting(false);
        setSelectionBox(null);
        
        stateRef.current.isDraggingGrid = false;
        stateRef.current.isSelecting = false;
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []); 

    // Add Spell Template
    const addSpellTemplate = (config) => {
        addToHistory();
        let startX, startY;
        if (config && config.originTokenId) {
            const originToken = tokens.find(t => t.id === config.originTokenId);
            if (originToken) { startX = originToken.x; startY = originToken.y; } 
            else { startX = (-pan.x + window.innerWidth/2)/zoom; startY = (-pan.y + window.innerHeight/2)/zoom; }
        } else { startX = (-pan.x + window.innerWidth/2)/zoom; startY = (-pan.y + window.innerHeight/2)/zoom; }

        setSpellTemplates(prev => [...prev, {
            id: generateId(), x: startX, y: startY, type: config?.type || 'circle', 
            size: config?.size || spellParams.radius, color: config?.color || spellParams.color,
            maxRange: config?.range || null, originTokenId: config?.originTokenId || null, rotation: 0, layerId: activeLayerId 
        }]);
    };

    // --- HEARTBEAT SAVE LOGIC ---
    useEffect(() => {
        if (tokens.length > 0 || spellTemplates.length > 0 || fogBoxes.length > 0) {
            hasUnsavedChangesRef.current = true;
        }
    }, [tokens, spellTemplates, activeGridSettings, fogEnabled, layers, activeLayerId, fogBoxes]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!hasUnsavedChangesRef.current || isInteractingRef.current) return;

            console.log("Auto-saving battlefield (Heartbeat)...");
            
            if (onSave) {
                onSave({ 
                    tokens, 
                    spellTemplates, 
                    gridSettings: activeGridSettings, 
                    fogEnabled, 
                    layers, 
                    activeLayerId, 
                    fogBoxes,
                    pan: stateRef.current?.pan || pan, 
                    zoom: stateRef.current?.zoom || zoom
                });
                hasUnsavedChangesRef.current = false;
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [tokens, spellTemplates, activeGridSettings, fogEnabled, layers, activeLayerId, fogBoxes, onSave]);


    // --- UPDATE TOKEN (MOVED TO GENERIC UPDATE) ---
    const updateToken = (id, changes) => {
        const originToken = tokens.find(t => t.id === id);
        if (!originToken) return;

        const dx = (changes.x !== undefined ? changes.x : originToken.x) - originToken.x;
        const dy = (changes.y !== undefined ? changes.y : originToken.y) - originToken.y;

        const targets = selectedTokenIds.has(id) ? selectedTokenIds : new Set([id]);

        setTokens(prev => prev.map(t => {
            if (targets.has(t.id)) {
                let updatedToken = { ...t };
                
                // Position
                if (changes.x !== undefined || changes.y !== undefined) {
                    updatedToken.x += dx;
                    updatedToken.y += dy;
                }

                // Size (KUN hvis specifikt angivet, dvs. fra slideren)
                if (changes.size !== undefined) {
                    updatedToken.size = changes.size;
                }

                return updatedToken;
            }
            return t;
        }));

        // Move Templates
        if (changes.x !== undefined || changes.y !== undefined) {
            setSpellTemplates(prev => prev.map(t => {
                if (t.originTokenId && targets.has(t.originTokenId)) {
                    return { ...t, x: t.x + dx, y: t.y + dy };
                }
                return t;
            }));
        }
    };

    const updateTemplatePosition = (id, x, y) => {
        let finalX = x; let finalY = y;
        if (activeGridSettings.snap) { const s = snapToCell(x, y); finalX = s.x; finalY = s.y; }
        setSpellTemplates(prev => prev.map(t => t.id === id ? { ...t, x: finalX, y: finalY } : t));
    };
    const updateTemplate = (id, newAttrs) => { setSpellTemplates(prev => prev.map(t => t.id === id ? { ...t, ...newAttrs } : t)); };
    const updateFogBox = (id, newAttrs) => { setFogBoxes(prev => prev.map(b => b.id === id ? { ...b, ...newAttrs } : b)); };
    
    const addTokenFromLibrary = (libToken, dropX = null, dropY = null) => {
        let targetX, targetY;
        const rect = boardRef.current ? boardRef.current.getBoundingClientRect() : { left: 0, top: 0 };
        if (dropX !== null && dropY !== null) { targetX = (dropX - rect.left - pan.x) / zoom; targetY = (dropY - rect.top - pan.y) / zoom; } 
        else { targetX = ((-pan.x + 800 / 2) / zoom); targetY = ((-pan.y + 600 / 2) / zoom); }
        if (activeGridSettings.snap) { const s = snapToCell(targetX, targetY); targetX = s.x; targetY = s.y; }
        return { id: generateId(), x: targetX, y: targetY, size: activeGridSettings.size > 32 ? activeGridSettings.size : 64, image: libToken.dataUrl, thumbnail: libToken.thumbnail, layerId: activeLayerId };
    };
    const handleMapDrop = (e) => {
        e.preventDefault(); const itemIdsStr = e.dataTransfer.getData("itemids");
        if (itemIdsStr) { try { const ids = JSON.parse(itemIdsStr); const newTokens = []; ids.forEach((id, index) => { const token = tokenLibrary.find(t => t.id === id); if (token) { const offsetX = (index % 5) * 20; const offsetY = Math.floor(index / 5) * 20; newTokens.push(addTokenFromLibrary(token, e.clientX + offsetX, e.clientY + offsetY)); } }); if (newTokens.length > 0) { addToHistory(); setTokens(prev => [...prev, ...newTokens]); } } catch (err) { console.error("Drop error", err); } }
    };
    const handleMapDragOver = (e) => e.preventDefault();
    const handleWheel = (e) => {
        const evt = e.evt || e; if (evt.preventDefault) evt.preventDefault();
        if (!e.target || typeof e.target.getStage !== 'function') return;
        const stage = e.target.getStage(); if (!stage) return;
        const oldScale = stage.scaleX(); const pointer = stage.getPointerPosition(); if (!pointer) return;
        const zoomFactor = 1.1; const newScale = evt.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor; const clampedScale = Math.max(0.1, Math.min(newScale, 10));
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        setZoom(clampedScale); setPan({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
    };

    // Helper: Find first selected token for UI control
    // Dette er den vigtige del, du manglede!
    const selectedToken = useMemo(() => {
        if (selectedTokenIds.size === 1) {
            const id = Array.from(selectedTokenIds)[0];
            return tokens.find(t => t.id === id);
        }
        return null;
    }, [selectedTokenIds, tokens]);

    return useMemo(() => ({
        layers, setLayers, activeLayerId, setActiveLayerId, activeLayer,
        tokens, setTokens, spellTemplates, setSpellTemplates,
        pan, setPan, zoom, setZoom, 
        gridSettings: activeGridSettings, setGridSettings, 
        fogBoxes, setFogBoxes, fogEnabled, setFogEnabled, isCreatingFog, setIsCreatingFog, fogTool, setFogTool,
        dragFogStart, setDragFogStart, currentFogRect, setCurrentFogRect, currentPolyPoints, setCurrentPolyPoints,
        polyMousePos, 
        selectedTokenIds, setSelectedTokenIds, selectedTemplateIds, setSelectedTemplateIds, selectedFogIds, setSelectedFogIds,
        isMovingGridMode, setIsMovingGridMode, isDraggingGrid, setIsDraggingGrid,
        
        isSelecting, selectionBox, 
        
        isPanning, setIsPanning, panStart, setPanStart, setDragStartPos,
        history, addToHistory, undo, deleteSelected,
        spellParams, setSpellParams, 
        addSpellTemplate, updateTemplate,   
        boardRef, dragInitialPositionsRef, historySnapshotRef, stateRef, mousePosRef,
        generateId, snapToCell, handleWheel,
        addTokenFromLibrary, handleMapDrop, handleMapDragOver,
        handleMouseDown, handleMouseMove, handleMouseUp,
        updateToken, // OBS: Opdateret funktion
        updateTemplatePosition, updateFogBox, setSelectedTokenIds,
        selectedToken // OBS: Denne eksporteres nu korrekt
    }), [
        layers, activeLayerId, activeLayer, activeGridSettings,
        tokens, spellTemplates, pan, zoom, history,
        fogBoxes, fogEnabled, isCreatingFog, fogTool, dragFogStart, currentFogRect, currentPolyPoints, polyMousePos,
        selectedTokenIds, selectedTemplateIds, selectedFogIds,
        isMovingGridMode, isDraggingGrid, isPanning, panStart, dragStartPos,
        spellParams, isSelecting, selectionBox 
    ]);
};