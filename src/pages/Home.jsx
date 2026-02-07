import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ToolCard = ({ to, title, desc, icon, colorClass, bgColor }) => (
  <Link 
    to={to} 
    className={`group relative bg-slate-900/50 border border-slate-700 rounded-xl p-8 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl ${colorClass} overflow-hidden`}
  >
    <div className={`absolute top-0 right-0 p-20 -mr-10 -mt-10 ${bgColor} rounded-full group-hover:opacity-30 transition-opacity pointer-events-none`}></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className={`flex items-center gap-4 mb-4 ${colorClass.split('hover:border')[0].replace('border-', 'text-')}`}>
        {icon}
        <h2 className="text-2xl font-serif font-bold text-slate-100 transition-colors">
          {title}
        </h2>
      </div>
      <p className="text-slate-400 mb-6 flex-1">
        {desc}
      </p>
      <div className="flex items-center text-sm font-bold uppercase tracking-wider group-hover:translate-x-2 transition-transform opacity-70 group-hover:opacity-100">
        Open Tool &rarr;
      </div>
    </div>
  </Link>
);

const Home = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-[#0f172a] text-slate-200">
      
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mt-6 mb-16 gap-6 animate-fade-in border-b border-slate-800 pb-8">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 drop-shadow-lg">
            Akton's DnD Tools
          </h1>
          <p className="text-slate-400 text-lg uppercase tracking-widest font-semibold">
            Game Master Suite & Player Utilities
          </p>
        </div>

        <div>
            {currentUser ? (
                <div className="flex items-center gap-4 bg-slate-800 p-2 pr-4 rounded-full border border-slate-700 shadow-lg">
                    {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-emerald-500" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white select-none">
                            {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider leading-none">Logged In</span>
                        <span className="text-xs text-slate-300 font-mono truncate max-w-[150px]">{currentUser.email}</span>
                    </div>
                    <button 
                        onClick={logout} 
                        className="ml-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                        Log Out
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => navigate('/login')} 
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-all hover:scale-105 hover:shadow-blue-900/20"
                >
                    Log In / Sign Up
                </button>
            )}
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">

        {/* Campaign Manager */}
        <ToolCard 
          to="/campaigns"
          title="Campaign Manager"
          desc="Create campaigns, invite players via join-codes, and manage active sessions."
          colorClass="hover:border-indigo-600"
          bgColor="bg-indigo-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>}
        />

        {/* Character Manager */}
        <ToolCard 
          to="/character-sheet"
          title="Character Manager"
          desc="Manage your characters with this complete 5e 2024 sheet, including spells and leveling."
          colorClass="hover:border-red-800"
          bgColor="bg-red-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
        />

        {/* NOTES (NY) */}
        <ToolCard 
          to="/notes"
          title="Personal Notes"
          desc="Your private campaign journals, world-building wiki, and session notes."
          colorClass="hover:border-emerald-700"
          bgColor="bg-emerald-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
        />

        {/* Combat Flow */}
        <ToolCard 
          to="/combat-flow"
          title="Combat Flow"
          desc="Track initiative, conditions, and monster HP in an intuitive encounter manager."
          colorClass="hover:border-amber-800"
          bgColor="bg-amber-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6 2l3-3l-2-6l-7-1"/><path d="M8 16l2-2"/><path d="M19 5l-2 2"/></svg>}
        />

        {/* Stat Block */}
        <ToolCard 
          to="/stat-block"
          title="Stat Block Generator"
          desc="Quickly create or view monster and NPC stats with a clean, classic 5e layout."
          colorClass="hover:border-blue-800"
          bgColor="bg-blue-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>}
        />

        {/* Map Manager */}
        <ToolCard 
          to="/map-manager"
          title="Map Manager"
          desc="Organize your campaign maps with pins, fog of war, and scaling tools."
          colorClass="hover:border-cyan-800"
          bgColor="bg-cyan-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M3 6l6-3 9 4.5L21 4.5V18l-6 3-9-4.5L3 19.5z"/><path d="M9 3v13.5"/><path d="M15 7.5V21"/></svg>}
        />

        {/* Soundboard */}
        <ToolCard 
          to="/soundboard"
          title="DJ Bard's Soundboard"
          desc="Create immersive ambiance with YouTube loops, sound effects, and volume control."
          colorClass="hover:border-purple-800"
          bgColor="bg-purple-900/10"
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
        />

      </main>

      <footer className="mt-20 mb-10 text-slate-600 text-xs uppercase tracking-widest">
        &copy; 2026 Akton's DnD Tools
      </footer>
    </div>
  );
};

export default Home;