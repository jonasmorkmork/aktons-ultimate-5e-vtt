import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CampaignProvider } from './context/CampaignContext';
import CampaignManager from './pages/CampaignManager/CampaignManager';

// Components
import Layout from './Layout';
import Home from './pages/Home';
import CombatFlow from './pages/CombatFlow/CombatFlow';
import MapManager from './pages/MapManager/MapManager';
import StatBlockManager from './pages/StatBlock/StatBlockManager';
import CharacterSheet from './pages/CharacterSheet/CharacterSheet';
import Soundboard from './pages/Soundboard/Soundboard';

const App = () => {
  return (
    <AuthProvider>
      <CampaignProvider>
        <Router>
          <Routes>
            {/* Alle sider kører nu inde i Layoutet (menuen) uden krav om login */}
            <Route element={<Layout />}>
                
                {/* Hovedsiden */}
                <Route path="/" element={<Home />} />
                
                {/* Værktøjer */}
                <Route path="/combat-flow" element={<CombatFlow />} />
                <Route path="/map-manager" element={<MapManager />} />
                <Route path="/campaigns" element={<CampaignManager />} />
                
                {/* RETTELSE HER: Ændret fra "/statblock-manager" til "/stat-block" */}
                <Route path="/stat-block" element={<StatBlockManager />} />
                
                <Route path="/character-sheet" element={<CharacterSheet />} />
                <Route path="/soundboard" element={<Soundboard />} />
                
            </Route>
          </Routes>
        </Router>
      </CampaignProvider>
    </AuthProvider>
  );
};

export default App;