import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext'; 

const CampaignContext = createContext();

export function useCampaign() {
    return useContext(CampaignContext);
}

export function CampaignProvider({ children }) {
    const { currentUser } = useAuth();

    // --- 1. EKSISTERENDE: ENCOUNTER BUILDER STATE ---
    const [activeEncounterData, setActiveEncounterData] = useState(() => {
        const saved = localStorage.getItem('vtt_active_encounter');
        return saved ? JSON.parse(saved) : null;
    });

    const sendEncounterToCombat = (encounter) => {
        setActiveEncounterData(encounter);
        localStorage.setItem('vtt_active_encounter', JSON.stringify(encounter));
    };

    const clearActiveEncounter = () => {
        setActiveEncounterData(null);
        localStorage.removeItem('vtt_active_encounter');
    };

    // --- 2. NYT: CAMPAIGN STATE ---
    const [activeCampaignId, setActiveCampaignId] = useState(() => {
        return localStorage.getItem('vtt_active_campaign_id') || null;
    });
    
    const [campaignData, setCampaignData] = useState(null);
    const [role, setRole] = useState(null); // 'dm' | 'player' | null
    const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);

    // LISTENER: Sync Campaign Data Real-time
    useEffect(() => {
        if (!activeCampaignId) {
            setCampaignData(null);
            setRole(null);
            return;
        }

        setIsLoadingCampaign(true);
        
        // Opret live forbindelse til den specifikke kampagne
        const unsub = onSnapshot(doc(db, "campaigns", activeCampaignId), (docSnap) => {
            setIsLoadingCampaign(false);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCampaignData({ id: docSnap.id, ...data });

                // Bestem brugerens rolle
                if (currentUser && data.dmId === currentUser.uid) {
                    setRole('dm');
                } else {
                    setRole('player');
                }
            } else {
                // Kampagnen findes ikke mere (eller ID er forkert)
                setCampaignData(null);
                setRole(null);
            }
        }, (error) => {
            console.error("Campaign sync error:", error);
            setIsLoadingCampaign(false);
        });

        // Ryd op når komponenten unmonteres eller ID skifter
        return () => unsub();
    }, [activeCampaignId, currentUser]);

    // Helpers til at forbinde/afbryde
    const connectToCampaign = (campaignId) => {
        setActiveCampaignId(campaignId);
        localStorage.setItem('vtt_active_campaign_id', campaignId);
    };

    const disconnectCampaign = () => {
        setActiveCampaignId(null);
        setCampaignData(null);
        setRole(null);
        localStorage.removeItem('vtt_active_campaign_id');
    };

    const value = {
        // Encounter stuff
        activeEncounterData,
        sendEncounterToCombat,
        clearActiveEncounter,

        // Campaign stuff
        activeCampaignId,
        campaignData,
        role,
        isLoadingCampaign,
        connectToCampaign,
        disconnectCampaign
    };

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    );
}