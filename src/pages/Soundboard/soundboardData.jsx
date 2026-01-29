import React from 'react';

// --- ICONS ---
export const Icon = ({ path, className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{path}</svg>
);

export const Icons = {
    Play: <polygon points="5 3 19 12 5 21 5 3" />,
    Pause: <><line x1="6" y1="4" x2="6" y2="20" /><line x1="18" y1="4" x2="18" y2="20" /></>,
    Stop: <rect x="4" y="4" width="16" height="16" />,
    Volume: <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />,
    Trash: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    Plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    Music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    Loop: <><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>,
    OneShot: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    Check: <polyline points="20 6 9 17 4 12" />,
    Fade: <path d="M2 12h20M2 12l6-6m-6 6l6 6" />,
    Loading: <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />,
    Settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
    Folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
    Alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    Upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
    Cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />, 
    Bolt: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    Sliders: <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" />,
    Close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    Edit: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /> // NEW
};

// --- CONSTANTS ---
export const COLOR_OPTIONS = [
    { id: 'purple', name: 'Bardic',     active: 'bg-purple-600 border-purple-400 text-white', idle: 'hover:border-purple-500/50', btn: 'text-purple-400', bgRaw: 'bg-purple-600' },
    { id: 'red',    name: 'Combat',     active: 'bg-red-700 border-red-500 text-white',       idle: 'hover:border-red-500/50',    btn: 'text-red-400',    bgRaw: 'bg-red-700' },
    { id: 'amber',  name: 'Tavern',     active: 'bg-amber-600 border-amber-400 text-white',   idle: 'hover:border-amber-500/50',  btn: 'text-amber-400',  bgRaw: 'bg-amber-600' },
    { id: 'blue',   name: 'Magic',      active: 'bg-blue-600 border-blue-400 text-white',     idle: 'hover:border-blue-500/50',   btn: 'text-blue-400',   bgRaw: 'bg-blue-600' },
    { id: 'green',  name: 'Nature',     active: 'bg-green-700 border-green-500 text-white',   idle: 'hover:border-green-500/50',  btn: 'text-green-400',  bgRaw: 'bg-green-700' },
    { id: 'zinc',   name: 'Dungeon',    active: 'bg-zinc-600 border-zinc-400 text-white',     idle: 'hover:border-zinc-500/50',   btn: 'text-zinc-400',   bgRaw: 'bg-zinc-600' },
];

export const SOUND_TYPES = [
    { id: 'music',    name: 'Music',    icon: Icons.Music, desc: 'Exclusive. Crossfades other music.' },
    { id: 'ambience', name: 'Ambience', icon: Icons.Cloud, desc: 'Layered. Plays over everything.' },
    { id: 'sfx',      name: 'SFX',      icon: Icons.Bolt,  desc: 'One-shot. Sound effects.' },
];

// --- HELPER ---
export const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};