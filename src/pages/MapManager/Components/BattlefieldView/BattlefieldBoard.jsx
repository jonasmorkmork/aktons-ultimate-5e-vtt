import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Line, Wedge, Text, Group, Label, Tag, Transformer } from 'react-konva';
import useImage from 'use-image';

// --- 1. URLImage ---
const URLImage = React.memo(({ src, x, y, width, height, fit, ...props }) => {
    const [image] = useImage(src, 'anonymous');
    const cropConfig = useMemo(() => {
        if (!image || fit !== 'cover' || !width || !height) return undefined;
        const imageRatio = image.width / image.height;
        const containerRatio = width / height;
        let crop = { x: 0, y: 0, width: image.width, height: image.height };
        if (imageRatio > containerRatio) {
            const scale = image.height / height;
            const scaledWidth = width * scale;
            const startX = (image.width - scaledWidth) / 2;
            crop = { x: startX, y: 0, width: scaledWidth, height: image.height };
        } else {
            const scale = image.width / width;
            const scaledHeight = height * scale;
            const startY = (image.height - scaledHeight) / 2;
            crop = { x: 0, y: startY, width: image.width, height: scaledHeight };
        }
        return crop;
    }, [image, width, height, fit]);
    if (!image) return null;
    return <KonvaImage image={image} x={x} y={y} width={width || image.width} height={height || image.height} crop={cropConfig} {...props} />;
});

// --- 2. GRID LAYER ---
const GridLayer = React.memo(({ gridSettings, width, height }) => {
    if (!gridSettings.show) return null;
    const lines = useMemo(() => {
        const linesArr = [];
        const size = gridSettings.size;
        const offsetX = gridSettings.offset.x;
        const offsetY = gridSettings.offset.y;
        const gridW = Math.max(width, 5000);
        const gridH = Math.max(height, 5000);
        for (let i = 0; i < gridW / size + 1; i++) {
            linesArr.push(<Line key={`v${i}`} points={[i * size + offsetX, -1000, i * size + offsetX, gridH + 1000]} stroke={gridSettings.color} strokeWidth={1} opacity={0.3} dash={gridSettings.type === 'dashed' ? [5, 5] : undefined} listening={false} />);
        }
        for (let i = 0; i < gridH / size + 1; i++) {
            linesArr.push(<Line key={`h${i}`} points={[-1000, i * size + offsetY, gridW + 1000, i * size + offsetY]} stroke={gridSettings.color} strokeWidth={1} opacity={0.3} dash={gridSettings.type === 'dashed' ? [5, 5] : undefined} listening={false} />);
        }
        return linesArr;
    }, [gridSettings, width, height]);
    return <Group>{lines}</Group>;
});

// --- HELPER: RangeLine ---
const RangeLine = React.memo(({ originId, targetX, targetY, tokens, gridSize }) => {
    const origin = tokens.find(t => t.id === originId);
    if (!origin) return null;
    const dxPx = Math.abs(targetX - origin.x);
    const dyPx = Math.abs(targetY - origin.y);
    const cellsX = Math.round(dxPx / gridSize);
    const cellsY = Math.round(dyPx / gridSize);
    const distFeet = Math.max(cellsX, cellsY) * 5;
    const scale = gridSize / 50;
    const fontSize = Math.max(10, 11 * scale); 
    const padding = 3 * scale;
    const cornerRadius = 4 * scale;
    return (
        <Group>
            <Line points={[origin.x, origin.y, targetX, targetY]} stroke="white" strokeWidth={Math.max(1, gridSize * 0.04)} dash={[gridSize*0.1, gridSize*0.1]} opacity={0.7} listening={false} />
            <Label x={(origin.x + targetX) / 2} y={(origin.y + targetY) / 2}>
                <Tag fill="rgba(0,0,0,0.8)" cornerRadius={cornerRadius} />
                <Text text={`${distFeet} ft.`} padding={padding} fill="white" fontSize={fontSize} fontFamily="monospace" />
            </Label>
        </Group>
    );
});

// --- VISUAL COMPONENTS ---
const StaticGhostToken = React.memo(({ token, x, y, gridSize }) => {
    const radius = (token.size || gridSize) / 2;
    const scale = gridSize / 50;
    return (
        <Group x={x} y={y} listening={false} opacity={0.5}>
             <Circle radius={radius} stroke="white" strokeWidth={1} dash={[5 * scale, 5 * scale]} />
             <Circle radius={radius} fill="black" opacity={0.3} />
        </Group>
    );
});

const MovingFollowerToken = React.memo(({ token, x, y, gridSize }) => {
    const radius = (token.size || gridSize) / 2;
    return (
        <Group x={x} y={y} listening={false}>
            {token.image ? (
                <Group clipFunc={(ctx) => ctx.arc(0, 0, radius, 0, Math.PI * 2, false)}>
                    <URLImage src={token.image} x={-radius} y={-radius} width={radius*2} height={radius*2} fit="cover" />
                </Group>
            ) : (<Circle radius={radius} fill="red" stroke="black" strokeWidth={1} />)}
            <Circle radius={radius} stroke="#facc15" strokeWidth={2} />
        </Group>
    );
});

const CachedShape = React.memo(React.forwardRef(({ data, gridSize, ...props }, ref) => {
    const internalRef = useRef();
    const shapeRef = ref || internalRef;
    useEffect(() => {
        if (shapeRef.current) {
            shapeRef.current.clearCache();
            shapeRef.current.cache({ pixelRatio: 1.5 });
        }
    }, [data.type, data.size, gridSize, props.fill, props.stroke, props.opacity]);
    const sizePx = (data.size / 5) * gridSize;
    const commonProps = { ref: shapeRef, perfectDrawEnabled: false, shadowForStrokeEnabled: false, ...props };
    if (data.type === 'cone') return <Wedge radius={sizePx} angle={60} offset={{x:0, y:0}} {...commonProps} />;
    if (data.type === 'circle') return <Circle radius={sizePx} {...commonProps} />;
    if (data.type === 'line') return <Rect width={sizePx} height={gridSize} offsetY={gridSize/2} offsetX={0} {...commonProps} />;
    return <Rect width={sizePx} height={sizePx} offsetY={sizePx/2} offsetX={sizePx/2} {...commonProps} />;
}));

const StaticGhostTemplate = React.memo(({ data, x, y, rotation, gridSize }) => {
    const visualRotation = (rotation || 0) - (data.type === 'cone' ? 30 : 0);
    return <CachedShape data={data} gridSize={gridSize} x={x} y={y} rotation={visualRotation} stroke="white" strokeWidth={1} dash={[5, 5]} fill="transparent" listening={false} />;
});

const MovingTemplate = React.memo(({ data, x, y, rotation, gridSize }) => {
    const color = data.color || 'rgba(239, 68, 68, 0.4)';
    const visualRotation = (rotation || 0) - (data.type === 'cone' ? 30 : 0);
    return <CachedShape data={data} gridSize={gridSize} x={x} y={y} rotation={visualRotation} fill={color} stroke="white" strokeWidth={2} opacity={0.6} listening={false} />;
});

// --- 3. SPELL TEMPLATE ---
const SpellTemplateShape = React.memo(({ data, gridSize, isSelected, onSelect, onChange, tokens, pan, zoom, snapToCell, gridSettings, isMovingGridMode }) => {
    const shapeRef = useRef();
    const trRef = useRef();
    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentPos, setCurrentPos] = useState({ x: data.x, y: data.y }); 
    const [localRotation, setLocalRotation] = useState(data.rotation || 0);
    const color = data.color || 'rgba(239, 68, 68, 0.4)';
    const strokeColor = isSelected ? 'white' : color.replace('0.4)', '1)');
    const isTethered = data.originTokenId && (data.type === 'cone' || data.type === 'line');
    const visualRotation = (localRotation) - (data.type === 'cone' ? 30 : 0);
    const handleDragMove = (e) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        let mouseX = (pointer.x - pan.x) / zoom;
        let mouseY = (pointer.y - pan.y) / zoom;
        if (gridSettings.snap) { const snapped = snapToCell(mouseX, mouseY); mouseX = snapped.x; mouseY = snapped.y; }
        if (isTethered) {
            const dx = mouseX - data.x; const dy = mouseY - data.y; const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            e.target.rotation(angle - (data.type === 'cone' ? 30 : 0)); e.target.position({ x: data.x, y: data.y }); setLocalRotation(angle); 
        } else { setCurrentPos({ x: e.target.x(), y: e.target.y() }); }
    };
    return (
        <Group>
            {data.originTokenId && isDragging && !isTethered && (<RangeLine originId={data.originTokenId} targetX={currentPos.x} targetY={currentPos.y} tokens={tokens} gridSize={gridSize} />)}
            <CachedShape
                ref={shapeRef} data={data} gridSize={gridSize} x={data.x} y={data.y} fill={color} stroke={strokeColor} strokeWidth={2} opacity={0.6} rotation={visualRotation} draggable={!isMovingGridMode}
                onMouseDown={(e) => { e.cancelBubble = true; onSelect(e); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(e); }}
                dragBoundFunc={(pos) => {
                    if (isTethered) return { x: data.x * zoom + pan.x, y: data.y * zoom + pan.y };
                    if (gridSettings.snap) { const wX = (pos.x - pan.x) / zoom; const wY = (pos.y - pan.y) / zoom; const s = snapToCell(wX, wY); return { x: s.x * zoom + pan.x, y: s.y * zoom + pan.y }; }
                    return pos;
                }}
                onDragStart={() => setIsDragging(true)} onDragMove={handleDragMove}
                onDragEnd={(e) => { setIsDragging(false); if (isTethered) onChange({ rotation: localRotation }); else onChange({ x: e.target.x(), y: e.target.y() }); }}
                onTransformEnd={(e) => { const node = shapeRef.current; const savedRotation = node.rotation() + (data.type === 'cone' ? 30 : 0); onChange({ x: node.x(), y: node.y(), rotation: savedRotation }); node.scaleX(1); node.scaleY(1); }}
            />
            {isSelected && !isTethered && <Transformer ref={trRef} resizeEnabled={false} rotateEnabled={true} borderStroke="white" anchorStroke="white" anchorFill="white" anchorSize={8} onMouseDown={(e) => e.cancelBubble = true} />}
        </Group>
    );
});

// --- 4. TOKEN ITEM ---
const TokenItem = React.memo(({ token, isSelected, gridSize, pan, zoom, gridSettings, snapToCell, onSelect, onUpdatePos, onDragStartGlobal, onDragMoveGlobal, onDragEndGlobal, isMovingGridMode }) => {
    const [dragState, setDragState] = useState(null); 
    const radius = (token.size || gridSize) / 2;
    const scale = gridSize / 50; 
    const fontSize = Math.max(10, 11 * scale); 
    const padding = 3 * scale; const pointerSize = 8 * scale; const offset = 15 * scale; const cornerRadius = 4 * scale;
    const handleDragStart = (e) => { 
        onSelect(e); 
        if (onDragStartGlobal) onDragStartGlobal(token.id); 
        setDragState({ startX: token.x, startY: token.y, currentX: token.x, currentY: token.y, text: "0 ft." }); 
    };
    const handleDragMove = (e) => {
        const currentX = e.target.x(); const currentY = e.target.y();
        let snapPos = { x: currentX, y: currentY }; 
        if (gridSettings.snap) snapPos = snapToCell(currentX, currentY);
        const dx = Math.abs(snapPos.x - dragState.startX); const dy = Math.abs(snapPos.y - dragState.startY);
        const cellsX = Math.round(dx / gridSize); const cellsY = Math.round(dy / gridSize); const feet = Math.max(cellsX, cellsY) * 5;
        setDragState(prev => ({ ...prev, currentX: currentX, currentY: currentY, text: `${feet} ft.` }));
        if (onDragMoveGlobal) onDragMoveGlobal(token.id, currentX, currentY);
    };
    const handleDragEnd = (e) => {
        setDragState(null); let newX = e.target.x(); let newY = e.target.y();
        if (gridSettings.snap) { const s = snapToCell(newX, newY); newX = s.x; newY = s.y; e.target.position({ x: newX, y: newY }); }
        if (onDragEndGlobal) onDragEndGlobal();
        onUpdatePos(token.id, newX, newY);
    };
    const ghostX = dragState ? dragState.startX - dragState.currentX : 0;
    const ghostY = dragState ? dragState.startY - dragState.currentY : 0;
    return (
        <Group 
            x={token.x} y={token.y} draggable={!isMovingGridMode} 
            dragBoundFunc={(pos) => { 
                if (gridSettings.snap) { const wX = (pos.x - pan.x) / zoom; const wY = (pos.y - pan.y) / zoom; const s = snapToCell(wX, wY); return { x: s.x * zoom + pan.x, y: s.y * zoom + pan.y }; } 
                return pos; 
            }} 
            onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} onMouseDown={(e) => { e.cancelBubble = true; onSelect(e); }}
        >
            {dragState && (<><Line points={[0, 0, ghostX, ghostY]} stroke="white" strokeWidth={3 * scale} dash={[10 * scale, 10 * scale]} opacity={0.8} shadowColor="black" shadowBlur={5} listening={false} perfectDrawEnabled={false} /><Circle x={ghostX} y={ghostY} radius={radius} fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth={1} dash={[5 * scale, 5 * scale]} listening={false} perfectDrawEnabled={false} /></>)}
            {isSelected && <Circle radius={radius + 3} stroke="#facc15" strokeWidth={3} shadowColor="#facc15" shadowBlur={20} shadowOpacity={0.8} opacity={1} listening={false} perfectDrawEnabled={false} shadowForStrokeEnabled={false} />}
            {token.image ? (<Group clipFunc={(ctx) => ctx.arc(0, 0, radius, 0, Math.PI * 2, false)}><URLImage src={token.image} x={-radius} y={-radius} width={radius*2} height={radius*2} fit="cover" perfectDrawEnabled={false} /></Group>) : (<Circle radius={radius} fill="red" stroke="black" strokeWidth={1} perfectDrawEnabled={false} />)}
            <Circle radius={radius} stroke="black" strokeWidth={1} listening={false} perfectDrawEnabled={false} shadowForStrokeEnabled={false} />
            {dragState && (<Label y={-radius - offset} listening={false}><Tag fill="rgba(15, 23, 42, 0.9)" cornerRadius={cornerRadius} stroke="white" strokeWidth={1 * scale} pointerDirection="down" pointerWidth={pointerSize} pointerHeight={pointerSize} shadowColor="black" shadowBlur={10} perfectDrawEnabled={false} /><Text text={dragState.text} fontFamily="monospace" fontSize={fontSize} fontStyle="bold" padding={padding} fill="white" perfectDrawEnabled={false} /></Label>)}
        </Group>
    );
});

const ResizableFogRect = ({ shapeProps, isSelected, onSelect, onChange, isCreatingFog }) => {
    const shapeRef = useRef(); const trRef = useRef();
    useEffect(() => { if (isSelected && trRef.current && shapeRef.current) { trRef.current.nodes([shapeRef.current]); trRef.current.getLayer().batchDraw(); } }, [isSelected]);
    return (<><Rect onMouseDown={(e) => { e.cancelBubble = true; onSelect(e); }} onTap={(e) => { e.cancelBubble = true; onSelect(e); }} ref={shapeRef} {...shapeProps} draggable={!isCreatingFog && isSelected} onDragEnd={(e) => { onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() }); }} onTransformEnd={(e) => { const node = shapeRef.current; const scaleX = node.scaleX(); const scaleY = node.scaleY(); node.scaleX(1); node.scaleY(1); onChange({ ...shapeProps, x: node.x(), y: node.y(), width: Math.max(5, node.width() * scaleX), height: Math.max(5, node.height() * scaleY) }); }} stroke={isSelected ? "#ef4444" : null} strokeWidth={2} fill="black" />{isSelected && !isCreatingFog && (<Transformer ref={trRef} rotateEnabled={false} keepRatio={false} borderStroke="#ef4444" anchorStroke="#ef4444" anchorFill="white" anchorSize={8} onMouseDown={(e) => e.cancelBubble = true} />)}</>);
};

// --- MAIN BOARD ---
const BattlefieldBoard = ({ logic }) => {
    const {
        boardRef, activeLayer, pan, zoom, gridSettings, fogEnabled,
        tokens = [], spellTemplates = [], fogBoxes = [], 
        activeLayerId, layers = [],
        isCreatingFog, fogTool, currentFogRect, currentPolyPoints, polyMousePos,
        selectedTokenIds, selectedTemplateIds,
        handleMouseDown, handleMapDragOver, handleMapDrop, handleWheel,
        updateTokenPosition, updateTemplate, setPan,
        snapToCell, updateFogBox, setSelectedTokenIds, updateTemplatePosition,
        isMovingGridMode, isSelecting, selectionBox 
    } = logic;

    const safeActiveLayerId = activeLayerId || (layers.length > 0 ? layers[0].id : null);
    const visibleTokens = useMemo(() => tokens.filter(t => t.layerId === safeActiveLayerId || (!t.layerId && layers[0] && safeActiveLayerId === layers[0].id)), [tokens, safeActiveLayerId, layers]);
    const visibleTemplates = useMemo(() => spellTemplates.filter(t => t.layerId === safeActiveLayerId || (!t.layerId && layers[0] && safeActiveLayerId === layers[0].id)), [spellTemplates, safeActiveLayerId, layers]);
    const visibleFogBoxes = useMemo(() => fogBoxes.filter(f => f.layerId === safeActiveLayerId || (!f.layerId && layers[0] && safeActiveLayerId === layers[0].id)), [fogBoxes, safeActiveLayerId, layers]);
    const gridSize = gridSettings?.size || 50;

    const [dragFeedback, setDragFeedback] = useState(null); 
    const handleGlobalDragMove = useCallback((id, currentX, currentY) => {
        const originToken = tokens.find(t => t.id === id);
        if(!originToken) return;
        setDragFeedback({ originId: id, deltaX: currentX - originToken.x, deltaY: currentY - originToken.y });
    }, [tokens]);
    const handleGlobalDragEnd = useCallback(() => { setDragFeedback(null); }, []);

    return (
        <div ref={boardRef} className="flex-1 relative overflow-hidden bg-slate-950" onDragOver={handleMapDragOver} onDrop={handleMapDrop}>
            <Stage 
                width={window.innerWidth} height={window.innerHeight} 
                draggable={!isCreatingFog && !isMovingGridMode && !isSelecting}
                x={pan.x} y={pan.y} scaleX={zoom} scaleY={zoom} 
                onWheel={handleWheel}
                onDragEnd={(e) => { if (e.target === e.target.getStage()) setPan({ x: e.target.x(), y: e.target.y() }); }}
                onMouseDown={(e) => { 
                    if (e.target.getParent()?.className === 'Transformer') return;
                    handleMouseDown(e.evt, 'map'); 
                }}
            >
                {/* LAYER 1: STATIC MAP (Rettet: Fjernet listening={false}) */}
                <Layer> 
                    {activeLayer?.mapData && <URLImage src={activeLayer.mapData} x={0} y={0} />}
                </Layer>
                
                {/* GRID LAYER (Rettet: Fjernet listening={false} fra Layer så events går igennem hvis nødvendigt, men selve GridLayer har det på linjer) */}
                <Layer listening={false}>
                    <GridLayer gridSettings={gridSettings} width={5000} height={5000} />
                </Layer>

                {/* LAYER 2: INTERACTIVE OBJECTS */}
                <Layer>
                    {visibleTemplates.map(t => {
                        const isTetheredToSelection = t.originTokenId && selectedTokenIds.has(t.originTokenId);
                        if (dragFeedback && isTetheredToSelection) {
                            return (<React.Fragment key={t.id}><StaticGhostTemplate data={t} x={t.x} y={t.y} rotation={t.rotation} gridSize={gridSize} /><MovingTemplate data={t} x={t.x + dragFeedback.deltaX} y={t.y + dragFeedback.deltaY} rotation={t.rotation} gridSize={gridSize} /></React.Fragment>);
                        }
                        return (<SpellTemplateShape key={t.id} data={t} gridSize={gridSize} tokens={tokens} pan={pan} zoom={zoom} snapToCell={snapToCell} gridSettings={gridSettings} isMovingGridMode={isMovingGridMode} isSelected={selectedTemplateIds?.has(t.id)} onSelect={(e) => handleMouseDown(e.evt, 'template', t.id)} onChange={(newAttrs) => { if(newAttrs.rotation !== undefined) updateTemplate(t.id, newAttrs); else updateTemplatePosition(t.id, newAttrs.x, newAttrs.y); }} />);
                    })}

                    {visibleTokens.map(token => {
                        const isFollower = dragFeedback && selectedTokenIds.has(token.id) && token.id !== dragFeedback.originId;
                        if (isFollower) {
                            return (<React.Fragment key={token.id}><StaticGhostToken token={token} x={token.x} y={token.y} gridSize={gridSize} /><MovingFollowerToken token={token} x={token.x + dragFeedback.deltaX} y={token.y + dragFeedback.deltaY} gridSize={gridSize} /></React.Fragment>);
                        }
                        return (<TokenItem key={token.id} token={token} isSelected={selectedTokenIds?.has(token.id)} gridSize={gridSize} pan={pan} zoom={zoom} gridSettings={gridSettings} snapToCell={snapToCell} isMovingGridMode={isMovingGridMode} onSelect={(e) => handleMouseDown(e.evt, 'token', token.id)} onDragStartGlobal={(id) => { if (!selectedTokenIds.has(id)) setSelectedTokenIds(new Set([id])); }} onDragMoveGlobal={handleGlobalDragMove} onDragEndGlobal={handleGlobalDragEnd} onUpdatePos={updateTokenPosition} />);
                    })}

                    {isSelecting && selectionBox && (<Rect x={Math.min(selectionBox.startX, selectionBox.currentX)} y={Math.min(selectionBox.startY, selectionBox.currentY)} width={Math.abs(selectionBox.currentX - selectionBox.startX)} height={Math.abs(selectionBox.currentY - selectionBox.startY)} fill="rgba(0, 162, 255, 0.2)" stroke="rgba(0, 162, 255, 0.8)" strokeWidth={1 / zoom} listening={false} />)}
                </Layer>

                {/* LAYER 3: FOG */}
                {fogEnabled && (
                    <Layer>
                        {visibleFogBoxes.map(box => box.type === 'poly' ? 
                            <Line key={box.id} points={box.points.flatMap(p => [p.x, p.y])} closed fill="black" stroke={logic.selectedFogIds?.has(box.id)?"red":null} strokeWidth={2} onMouseDown={(e)=>{e.cancelBubble=true;handleMouseDown(e.evt,'fogBox',box.id)}} /> :
                            <ResizableFogRect key={box.id} shapeProps={box} isSelected={logic.selectedFogIds?.has(box.id)} isCreatingFog={isCreatingFog} onSelect={(e)=>handleMouseDown(e.evt,'fogBox',box.id)} onChange={(attr)=>updateFogBox(box.id, attr)} />
                        )}
                        {isCreatingFog && fogTool === 'rect' && currentFogRect && <Rect {...currentFogRect} fill="rgba(0,0,0,0.5)" stroke="white" />}
                        {isCreatingFog && fogTool === 'poly' && (<><Line points={currentPolyPoints.flatMap(p=>[p.x,p.y])} stroke="white" dash={[5,5]} />{polyMousePos && currentPolyPoints.length>0 && <Line points={[currentPolyPoints[currentPolyPoints.length-1].x,currentPolyPoints[currentPolyPoints.length-1].y,polyMousePos.x,polyMousePos.y]} stroke="white" dash={[5,5]} opacity={0.7} />}</>)}
                    </Layer>
                )}
            </Stage>
        </div>
    );
};

export default BattlefieldBoard;