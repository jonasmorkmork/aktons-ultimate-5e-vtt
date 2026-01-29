import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../../utils/canvasUtils'; // Tjek at stien passer!

const ImageCropper = ({ imageSrc, onCancel, onSave }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onSave(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 w-full max-w-lg rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl flex flex-col h-[500px]">
                
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg">Adjust Profile Picture</h3>
                    <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // 1:1 Aspect Ratio (Kvadratisk)
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        showGrid={false}
                        cropShape="rect" // Kan ændres til "round" hvis du kun vil vise cirkel
                    />
                </div>

                {/* Controls */}
                <div className="p-6 bg-zinc-900 border-t border-zinc-800 space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-zinc-500 uppercase">Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(e.target.value)}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onCancel}
                            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
                        >
                            Save Photo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;