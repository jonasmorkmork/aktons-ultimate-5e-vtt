import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase'; 
// NYT: Tilføjet updateDoc og arrayUnion til imports
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
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

    // --- 2. CAMPAIGN STATE ---
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
        
        const unsub = onSnapshot(doc(db, "campaigns", activeCampaignId), (docSnap) => {
            setIsLoadingCampaign(false);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCampaignData({ id: docSnap.id, ...data });

                if (currentUser && data.dmId === currentUser.uid) {
                    setRole('dm');
                } else {
                    setRole('player');
                }
            } else {
                setCampaignData(null);
                setRole(null);
            }
        }, (error) => {
            console.error("Campaign sync error:", error);
            setIsLoadingCampaign(false);
        });

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

    // --- 3. NYT: SEND ITEM LOGIC (Mellemmanden) ---
    const sendItemToCharacter = async (characterId, itemData) => {
        if (!characterId) return { success: false, message: "No character selected" };

        try {
            // 1. Bestem kategori baseret på item type (matcher SheetBio logik)
            // Vi antager at itemData har en 'type' eller 'category' property, eller vi gætter
            let category = 'items'; // Default
            let typeLower = (itemData.type || "").toLowerCase();
            
            // Simpel logik til at placere det rigtigt i inventory
            if (itemData.damage || typeLower.includes('weapon') || typeLower.includes('sword') || typeLower.includes('axe') || typeLower.includes('bow')) {
                category = 'weapons';
            } else if (itemData.ac || typeLower.includes('armor') || typeLower.includes('shield')) {
                category = 'armor';
            }

            // 2. Klargør data (Sikr at det har et unikt ID til modtageren)
            const itemToSend = {
                ...itemData,
                id: Date.now(), // Nyt ID så det ikke konflikter
                addedAt: new Date().toISOString()
            };

            // 3. Opdater karakterens dokument i 'characters' kollektionen
            const charRef = doc(db, "characters", characterId);
            
            // Vi bruger dot-notation til at opdatere et array inde i et objekt: "inventory.weapons"
            await updateDoc(charRef, {
                [`inventory.${category}`]: arrayUnion(itemToSend)
            });

            return { success: true, message: `Sent ${itemData.name} to player!` };

        } catch (error) {
            console.error("Error sending item:", error);
            return { success: false, message: "Failed to send item." };
        }
    };

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
        
        // Den nye funktion
        sendItemToCharacter 
    };

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    );
}