import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CampaignProvider } from './context/CampaignContext';
import { StorageProvider } from './context/StorageContext'; // <--- NY IMPORT
import CampaignManager from './pages/CampaignManager/CampaignManager';

// Components
import Layout from './Layout';
import Home from './pages/Home';
import Login from './pages/Login';

// Tools
import CombatFlow from './pages/CombatFlow/CombatFlow';
import MapManager from './pages/MapManager/MapManager';
import StatBlockManager from './pages/StatBlock/StatBlockManager';
import CharacterSheet from './pages/CharacterSheet/CharacterSheet';
import Soundboard from './pages/Soundboard/Soundboard';
import CampaignNotes from './pages/CampaignNotes';

const App = () => {
  return (
    <AuthProvider>
      <StorageProvider> {/* <--- NY PROVIDER HER */}
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
                  
                  <Route path="/stat-block" element={<StatBlockManager />} />
                  <Route path="/notes" element={<CampaignNotes />} />
                  
                  <Route path="/character-sheet" element={<CharacterSheet />} />
                  <Route path="/soundboard" element={<Soundboard />} />
                  <Route path="/login" element={<Login />} />
                  
              </Route>
            </Routes>
          </Router>
        </CampaignProvider>
      </StorageProvider> {/* <--- SLUT PROVIDER */}
    </AuthProvider>
  );
};

export default App;