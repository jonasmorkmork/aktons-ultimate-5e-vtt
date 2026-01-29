import React, { useRef, useLayoutEffect } from 'react';

const TaperedRule = () => (
    <svg height="5" width="100%" className="my-3 fill-[#991b1b] w-full" preserveAspectRatio="none">
        <polyline points="0,0 400,2.5 0,5"></polyline>
    </svg>
);

const PropertyLine = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="text-[#991b1b] text-sm leading-tight mb-1">
            <span className="font-bold text-[#991b1b]">{label}</span> <span className="text-black">{value}</span>
        </div>
    );
};

const StatSection = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mt-4 first:mt-0">
            {title && <h3 className="text-xl font-serif-dnd border-b border-[#991b1b] text-[#991b1b] mb-2">{title}</h3>}
            {items.map((item, i) => (
                <div key={i} className="mb-2 text-sm text-black leading-snug">
                    {item.name && <span className="font-bold italic">{item.name}.</span>} {item.desc}
                </div>
            ))}
        </div>
    );
};

const AutoFitText = ({ text, className, as = "div" }) => {
    const ref = useRef(null);
    useLayoutEffect(() => {
        const el = ref.current; if (!el) return;
        let size = parseInt(window.getComputedStyle(el).fontSize);
        el.style.fontSize = "";
        el.style.whiteSpace = "nowrap";
        while (el.scrollWidth > el.clientWidth && size > 10) { size--; el.style.fontSize = size + "px"; }
        el.style.whiteSpace = ""; 
    }, [text]);
    const Tag = as;
    return <Tag ref={ref} className={`${className} overflow-hidden`}>{text}</Tag>;
};

const StatBlockDisplay = ({ data, scale = 1, className = "" }) => {
    if (!data) return null;

    return (
        <div 
            className={`bg-[#fdf1dc] text-black font-sans shadow-xl relative box-border selection:bg-[#f3c06d] w-full origin-top-left ${className}`}
            style={{ zoom: scale }}
        >
            <div className="border-[6px] border-double border-[#e69a28] h-full bg-[#fdf1dc] p-4 relative">
                <div className="space-y-1">
                    <AutoFitText as="h1" text={data.name} className="text-3xl font-serif-dnd font-bold text-[#991b1b] leading-none" />
                    <div className="text-sm italic font-serif text-black">{data.meta}</div>
                </div>
                
                <TaperedRule />
                
                <div className="space-y-1 text-[#991b1b]">
                    <div><span className="font-bold">Armor Class</span> <span className="text-black">{data.ac}</span></div>
                    <div><span className="font-bold">Hit Points</span> <span className="text-black">{data.hp}</span></div>
                    <div><span className="font-bold">Speed</span> <span className="text-black">{data.speed}</span></div>
                </div>

                <TaperedRule />

                <div className="grid grid-cols-6 gap-1 my-4 text-center">
                    {Object.keys(data.stats).map(key => (
                        <div key={key} className="flex flex-col items-center">
                            <div className="font-bold text-[#991b1b] uppercase text-[10px] tracking-wider">{key}</div>
                            <div className="text-[#991b1b] font-serif-dnd text-lg leading-none">{data.stats[key].val}</div>
                            <div className="text-xs text-gray-600">({data.stats[key].mod})</div>
                        </div>
                    ))}
                </div>

                <TaperedRule />

                <div className="space-y-1 mb-4">
                    <PropertyLine label="Saving Throws" value={data.props.saves} />
                    <PropertyLine label="Skills" value={data.props.skills} />
                    <PropertyLine label="Damage Vulnerabilities" value={data.props.vulnerabilities} />
                    <PropertyLine label="Damage Resistances" value={data.props.resistances} />
                    <PropertyLine label="Damage Immunities" value={data.props.immunities} />
                    <PropertyLine label="Condition Immunities" value={data.props.conditions} />
                    <PropertyLine label="Senses" value={data.props.senses} />
                    <PropertyLine label="Languages" value={data.props.languages} />
                    <PropertyLine label="Challenge" value={data.props.challenge} />
                </div>

                <TaperedRule />

                <div className="space-y-4">
                    <StatSection title="" items={data.traits} />
                    <StatSection title="Actions" items={data.actions} />
                    <StatSection title="Bonus Actions" items={data.bonusActions} />
                    <StatSection title="Reactions" items={data.reactions} />
                    <StatSection title="Legendary Actions" items={data.legendary} />
                </div>
                
                <div className="h-1.5 w-full bg-[#991b1b] mt-6 mb-[-24px] mx-[-24px] w-[calc(100%+48px)]"></div>
            </div>
        </div>
    );
};

export default StatBlockDisplay;