export const BLUEPRINTS = {
    blank: {
        label: "Blank Page",
        content: ``
    },
    npc: {
        label: "NPC",
        content: `
            <h2>Basic Info</h2>
            <p><strong>Name & Alias:</strong> [Name]</p>
            <p><strong>Role/Occupation:</strong> ...</p>
            <p><strong>Physical Distinctiveness:</strong> (One key feature...)</p>
            
            <h2>The Core (DEPTH)</h2>
            <ul>
                <li><strong>Desire:</strong> What do they want right now?</li>
                <li><strong>Exclusion:</strong> What will they never do? (Moral line)</li>
                <li><strong>Problem:</strong> What stands in their way?</li>
                <li><strong>Tie:</strong> Connection to party/villain?</li>
                <li><strong>Hook:</strong> What do they offer?</li>
            </ul>
            
            <h2>Roleplay Cues</h2>
            <p><strong>Voice/Tone:</strong> ...</p>
            <p><strong>Key Phrase:</strong> ...</p>
        `
    },
    settlement: {
        label: "Settlement",
        content: `
            <h2>Overview</h2>
            <p><strong>Name:</strong> [Name]</p>
            <p><strong>Scale/Population:</strong> ...</p>
            <p><strong>Atmosphere:</strong> (3 adjectives...)</p>
            
            <h2>Structure</h2>
            <p><strong>Geography:</strong> Why is it here?</p>
            <p><strong>Main Export:</strong> How do they survive?</p>
            <p><strong>Leadership:</strong> Official vs. Actual power?</p>
            
            <h2>Points of Interest</h2>
            <ul>
                <li><strong>Landmark:</strong> ...</li>
                <li><strong>Social Hub:</strong> ...</li>
                <li><strong>The Danger Zone:</strong> ...</li>
            </ul>
            
            <h2>Current State</h2>
            <p><strong>The Threat:</strong> Immediate problem?</p>
            <p><strong>Local Rumor:</strong> ...</p>
        `
    },
    region: {
        label: "Region/Country",
        content: `
            <h2>Identity</h2>
            <p><strong>Name:</strong> [Name]</p>
            <p><strong>Motto/Core Value:</strong> ...</p>
            <p><strong>Government Type:</strong> ...</p>
            
            <h2>The Land</h2>
            <p><strong>Geography/Climate:</strong> ...</p>
            <p><strong>Major Cities:</strong> ...</p>
            
            <h2>Culture & Society</h2>
            <p><strong>Social Hierarchy:</strong> ...</p>
            <p><strong>Taboos:</strong> What is forbidden?</p>
            <p><strong>Tech/Magic Level:</strong> ...</p>
            
            <h2>Dynamics</h2>
            <p><strong>Relations:</strong> Allies/Enemies?</p>
            <p><strong>Internal Strife:</strong> Factions?</p>
            <p><strong>History:</strong> One major event...</p>
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