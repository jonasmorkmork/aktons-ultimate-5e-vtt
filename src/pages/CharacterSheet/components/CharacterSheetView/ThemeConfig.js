// src/pages/CharacterSheet/components/ThemeConfig.js

export const THEMES = {
    default: {
        name: 'Shadow (Default)',
        bg: 'bg-zinc-900',
        bgPanel: 'bg-zinc-900',
        border: 'border-zinc-800',
        accentText: 'text-red-500',
        accentBg: 'bg-red-700',
        accentBorder: 'border-red-700',
        text: 'text-zinc-300',
        subText: 'text-zinc-500',
        button: 'hover:bg-zinc-700',
        input: 'bg-transparent border-b border-zinc-700 focus:border-red-500'
    },
    paladin: {
        name: 'Divine Gold',
        bg: 'bg-slate-900',
        bgPanel: 'bg-slate-800',
        border: 'border-amber-700',
        accentText: 'text-amber-400',
        accentBg: 'bg-amber-600',
        accentBorder: 'border-amber-500',
        text: 'text-slate-200',
        subText: 'text-slate-400',
        button: 'hover:bg-slate-700',
        input: 'bg-transparent border-b border-amber-800 focus:border-amber-400'
    },
    druid: {
        name: 'Forest Grove',
        bg: 'bg-stone-900',
        bgPanel: 'bg-stone-800',
        border: 'border-stone-700',
        accentText: 'text-emerald-400',
        accentBg: 'bg-emerald-700',
        accentBorder: 'border-emerald-600',
        text: 'text-stone-200',
        subText: 'text-stone-400',
        button: 'hover:bg-stone-700',
        input: 'bg-transparent border-b border-emerald-900 focus:border-emerald-500'
    },
    wizard: {
        name: 'Arcane Blue',
        bg: 'bg-indigo-950',
        bgPanel: 'bg-indigo-900/50',
        border: 'border-indigo-800',
        accentText: 'text-cyan-400',
        accentBg: 'bg-cyan-700',
        accentBorder: 'border-cyan-500',
        text: 'text-indigo-100',
        subText: 'text-indigo-400',
        button: 'hover:bg-indigo-800',
        input: 'bg-transparent border-b border-indigo-700 focus:border-cyan-400'
    },
    paper: {
        name: 'Old Parchment',
        bg: 'bg-[#f5e6d3]', // Hex code for custom paper color
        bgPanel: 'bg-[#e8dcc5]',
        border: 'border-[#8b4513]', // SaddleBrown
        accentText: 'text-[#8b4513]',
        accentBg: 'bg-[#8b4513]',
        accentBorder: 'border-[#8b4513]',
        text: 'text-gray-900', // Mørk tekst på lys baggrund!
        subText: 'text-gray-600',
        button: 'hover:bg-[#dcb]',
        input: 'bg-transparent border-b border-[#8b4513] focus:border-black text-gray-900'
    },
    custom: {
        name: 'Custom (User)',
        // Vi bruger Tailwind arbitrary values til at pege på CSS variabler
        bg: 'bg-transparent', // Vi håndterer baggrunden manuelt i index.jsx for at støtte billeder
        bgPanel: 'bg-[var(--c-panel)]',
        border: 'border-[var(--c-border)]',
        accentText: 'text-[var(--c-accent)]',
        accentBg: 'bg-[var(--c-accent)]',
        accentBorder: 'border-[var(--c-accent)]',
        text: 'text-[var(--c-text)]',
        subText: 'text-[var(--c-subtext)]',
        button: 'bg-[var(--c-panel)] hover:brightness-110', // Simpel hover effekt
        input: 'bg-transparent border-b border-[var(--c-border)] focus:border-[var(--c-accent)] text-[var(--c-text)]'
    }
};

// Hjælpefunktion til at hente temaet sikkert
export const getTheme = (themeId) => {
    return THEMES[themeId] || THEMES.default;
};