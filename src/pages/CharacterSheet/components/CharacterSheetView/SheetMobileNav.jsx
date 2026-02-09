import React from 'react';
import { Icons } from '../CharacterIcons';

const SheetMobileNav = ({ tab, setTab, isSpellcaster, theme }) => {
    return (
        <div className={`fixed bottom-0 left-0 w-full ${theme.bgPanel} border-t ${theme.border} p-1 flex justify-around z-50 backdrop-blur-lg shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-colors duration-300`}>
            <button onClick={() => setTab('stats')} className={`flex flex-col items-center gap-0.5 p-2 flex-1 rounded-lg transition-colors ${tab === 'stats' ? `${theme.accentText} bg-white/5` : theme.subText}`}>
                <Icons.User />
                <span className="text-[8px] font-bold uppercase tracking-widest">Stats</span>
            </button>
            <button onClick={() => setTab('combat')} className={`flex flex-col items-center gap-0.5 p-2 flex-1 rounded-lg transition-colors ${tab === 'combat' ? `${theme.accentText} bg-white/5` : theme.subText}`}>
                <Icons.Sword />
                <span className="text-[8px] font-bold uppercase tracking-widest">Combat</span>
            </button>
            <button onClick={() => setTab('bio')} className={`flex flex-col items-center gap-0.5 p-2 flex-1 rounded-lg transition-colors ${tab === 'bio' ? `${theme.accentText} bg-white/5` : theme.subText}`}>
                <Icons.Book />
                <span className="text-[8px] font-bold uppercase tracking-widest">Bio</span>
            </button>
            
            {isSpellcaster && (
                <button onClick={() => setTab('spells')} className={`flex flex-col items-center gap-0.5 p-2 flex-1 rounded-lg transition-colors ${tab === 'spells' ? `${theme.accentText} bg-white/5` : theme.subText}`}>
                    <Icons.Flame />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Spells</span>
                </button>
            )}
        </div>
    );
};

export default SheetMobileNav;