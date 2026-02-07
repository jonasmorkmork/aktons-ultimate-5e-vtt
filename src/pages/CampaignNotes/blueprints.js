export const BLUEPRINTS = {
    blank: {
        label: "Blank Page",
        content: ``
    },
    npc: {
        label: "NPC",
        content: `
            <h2>Personal Data</h2>
            <p><strong>Name:</strong> [Name]</p>
            <p><strong>Race/Class:</strong> [Race] [Class]</p>
            <p><strong>Occupation:</strong> ...</p>
            
            <h2>Appearance</h2>
            <p>Describe their physical traits, clothing, and distinct features...</p>
            
            <h2>Personality</h2>
            <ul>
                <li><strong>Trait:</strong> ...</li>
                <li><strong>Ideal:</strong> ...</li>
                <li><strong>Bond:</strong> ...</li>
                <li><strong>Flaw:</strong> ...</li>
            </ul>
            
            <h2>Secrets & Goals</h2>
            <p>What are they hiding? What do they want?</p>
        `
    },
    location: {
        label: "Location",
        content: `
            <h2>Overview</h2>
            <p><strong>Type:</strong> (City, Dungeon, Tavern...)</p>
            <p><strong>Atmosphere:</strong> (Smells, sounds, lighting...)</p>
            
            <h2>Points of Interest</h2>
            <ul>
                <li><strong>Landmark 1:</strong> ...</li>
                <li><strong>Landmark 2:</strong> ...</li>
            </ul>
            
            <h2>NPCs Here</h2>
            <ul>
                <li>...</li>
            </ul>
        `
    },
    quest: {
        label: "Quest",
        content: `
            <h2>Quest Giver</h2>
            <p>Who is offering the job?</p>
            
            <h2>Objective</h2>
            <p>What needs to be done?</p>
            
            <h2>Reward</h2>
            <p>Gold, Items, Favors?</p>
            
            <h2>Twist</h2>
            <p>What is the catch?</p>
        `
    }
};