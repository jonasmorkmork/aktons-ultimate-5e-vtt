import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import { useAuth } from './AuthContext'; 

// Importér logik fra den nye fil
import * as CombatSync from './CombatSync';

const CampaignContext = createContext();

export function useCampaign() {
    return useContext(CampaignContext);
}

export function CampaignProvider({ children }) {
    const { currentUser } = useAuth();

    // --- 1. ENCOUNTER BUILDER STATE (LOKALT) ---
    const [activeEncounterData, setActiveEncounterData] = useState(() => {
        const saved = localStorage.getItem('vtt_active_encounter');
        return saved ? JSON.parse(saved) : null;
    });

    const sendEncounterToCombat = async (encounter) => {
        setActiveEncounterData(encounter);
        localStorage.setItem('vtt_active_encounter', JSON.stringify(encounter));
        return await CombatSync.addEncounterToCombat(currentUser, encounter);
    };

    const clearActiveEncounter = () => {
        setActiveEncounterData(null);
        localStorage.removeItem('vtt_active_encounter');
    };

    // --- 2. CAMPAIGN STATE ---
    const [activeCampaignId, setActiveCampaignId] = useState(() => {
        return localStorage.getItem('vtt_active_campaign_id') || null;
    });
    
    const [campaignData, setCampaignData] = useState(null);
    const [role, setRole] = useState(null);
    const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);

    // --- EFFECT: RESET ON USER CHANGE ---
    useEffect(() => {
        if (!currentUser) {
            setCampaignData(null);
            setRole(null);
        }
    }, [currentUser]);

    // --- EFFECT: SYNC CAMPAIGN DATA ---
    useEffect(() => {
        if (!currentUser || !activeCampaignId) {
            setCampaignData(null);
            setRole(null);
            return;
        }

        setIsLoadingCampaign(true);

        const unsub = onSnapshot(doc(db, "campaigns", activeCampaignId), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCampaignData({ id: docSnap.id, ...data });
                    
                    if (data.dmId === currentUser.uid) {
                        setRole('dm');
                    } else if (data.players && data.players.includes(currentUser.uid)) {
                        setRole('player');
                    } else {
                        console.warn("User does not have access to this campaign");
                        disconnectCampaign();
                    }
                } else {
                    console.warn("Campaign deleted or not found");
                    disconnectCampaign();
                }
                setIsLoadingCampaign(false);
            }, 
            (error) => {
                console.error("Campaign sync error:", error);
                if (error.code === 'permission-denied') {
                    console.error("Permission denied. Disconnecting.");
                    disconnectCampaign();
                }
                setIsLoadingCampaign(false);
            }
        );

        return () => unsub();
    }, [activeCampaignId, currentUser?.uid]);

    const connectToCampaign = (campaignId) => {
        if (!campaignId) return;
        setActiveCampaignId(campaignId);
        localStorage.setItem('vtt_active_campaign_id', campaignId);
    };

    const disconnectCampaign = () => {
        setActiveCampaignId(null);
        setCampaignData(null);
        setRole(null);
        localStorage.removeItem('vtt_active_campaign_id');
    };

    // --- WRAPPER FUNKTIONER ---
    
    const sendToCombat = (char, uid) => 
        CombatSync.sendCharacterToCombat(currentUser, char, uid);

    const syncPartyToCombat = (playerCharacters) => 
        CombatSync.syncPartyToCombat(currentUser, playerCharacters);

    // FIX: Accepterer nu targetUid (valgfri)
    const syncHpToCombat = (currentHp, maxHp, tempHp, targetUid) => 
        CombatSync.syncHpToCombat(currentUser, campaignData, role, currentHp, maxHp, tempHp, targetUid);

    const sendItemToCharacter = (targetUid, item) => 
        CombatSync.sendItemToCharacter(campaignData, targetUid, item);

    const value = {
        activeEncounterData,
        sendEncounterToCombat,
        clearActiveEncounter,

        activeCampaignId,
        campaignData,
        role,
        isLoadingCampaign,
        connectToCampaign,
        disconnectCampaign,
        
        sendItemToCharacter,
        sendToCombat,       
        syncPartyToCombat,
        syncHpToCombat
    };

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    );
}