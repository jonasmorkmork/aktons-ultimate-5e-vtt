import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export const SlashMenu = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Vælg item funktion
  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  // Nulstil index når listen ændres (f.eks. ved søgning)
  useEffect(() => setSelectedIndex(0), [props.items]);

  // Exposed methods til Tiptap renderer
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true; // Return true stopper Tiptap fra at flyttecursoren op
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true; // Return true stopper Tiptap fra at flytte cursoren ned
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true; // Return true stopper Tiptap fra at lave ny linje
      }
      return false;
    },
  }));

  if (!props.items || props.items.length === 0) {
      return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden min-w-[200px] flex flex-col p-1 animate-in fade-in zoom-in-95 duration-100">
      <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 border-b border-slate-800 mb-1">Commands</div>
      {props.items.map((item, index) => (
        <button
          key={index}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)} // Gør musen også opdaterer index
          className={`flex items-center gap-3 px-3 py-2 text-left rounded text-sm transition-colors ${
            index === selectedIndex ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <div className={`w-6 h-6 flex items-center justify-center rounded border shadow-sm ${index === selectedIndex ? 'border-amber-400 bg-amber-700' : 'border-slate-700 bg-slate-950'}`}>
            {item.icon}
          </div>
          <div className="flex flex-col">
              <span className="font-bold text-xs">{item.title}</span>
              <span className={`text-[10px] ${index === selectedIndex ? 'text-amber-200' : 'text-slate-500'}`}>{item.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
});