// Beregninger
export const getMod = (score) => Math.floor((score - 10) / 2);
export const formatMod = (mod) => (mod >= 0 ? `+${mod}` : mod);
export const getProfBonus = (level) => Math.ceil(level / 4) + 1;

// Tekst Helpers
export const getTabTitle = (tab) => ({
    armor: "Armor Proficiencies", 
    weapon: "Weapon Proficiencies", 
    tool: "Tool Proficiencies", 
    languages: "Languages",
    weapons: "Weapons Inventory", 
    armorInv: "Armor Inventory",
    items: "Items Inventory", 
    backstory: "Character Backstory", 
    ideals: "Ideals", 
    bonds: "Bonds", 
    flaws: "Flaws", 
    appearance: "Physical Appearance", 
    // campaignNotes er fjernet herfra
    resistances: "Damage Resistances", 
    vulnerabilities: "Damage Vulnerabilities", 
    immunities: "Damage Immunities"
}[tab] || tab);

// Konstanter
export const conditionOptions = [
    "Blinded", "Charmed", "Dazed", "Deafened", "Drunk", 
    "Frightened", "Grappled", "Incapacitated", "Invisible", 
    "Paralyzed", "Petrified", "Poisoned", "Prone", 
    "Restrained", "Stunned", "Unconscious"
];

export const abilitySkills = {
    strength: ["Athletics"],
    dexterity: ["Acrobatics", "Sleight of Hand", "Stealth"],
    intelligence: ["Arcana", "History", "Investigation", "Nature", "Religion"],
    wisdom: ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"],
    charisma: ["Deception", "Intimidation", "Performance", "Persuasion"]
};

// Factory Function
export const createNewCharacter = () => ({
    id: Date.now().toString(),
    imageUrl: "",
    name: "New Hero", class: "", subclass: "", level: 1, species: "", background: "", alignment: "", size: "",
    isSpellcaster: false, heroicInspiration: false, hasShield: false,
    spellcastingAbility: "Intelligence",
    stats: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    proficiencies: {}, skillMiscBonuses: {}, 
    savingThrowsProf: {}, saveMiscBonuses: {},
    hp: { current: 10, max: 10, temp: 0 },
    ac: 10, initiativeMisc: 0, speed: 30,
    hitDice: { spent: 0, total: 1, type: "d10" },
    deathSaves: { success: 0, failure: 0 },
    exhaustion: 0,
    conditions: [],
    resistances: "", vulnerabilities: "", immunities: "",
    currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
    profArmor: "", profWeapon: "", profTool: "", profLanguages: "",
    weaponsInv: "", armorInv: "", itemsInv: "",
    actions: [], resources: [], features: [],
    appearance: "", bonds: "", flaws: "", ideals: "", backstory: "", 
    // campaignNotes er fjernet herfra
    spells: [],
    spellSlots: {
        1: { max: 0, used: 0 }, 2: { max: 0, used: 0 }, 3: { max: 0, used: 0 },
        4: { max: 0, used: 0 }, 5: { max: 0, used: 0 }, 6: { max: 0, used: 0 },
        7: { max: 0, used: 0 }, 8: { max: 0, used: 0 }, 9: { max: 0, used: 0 }
    }
});