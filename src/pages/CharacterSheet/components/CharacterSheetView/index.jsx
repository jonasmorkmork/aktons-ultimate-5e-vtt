import React, { useState, useEffect, useRef } from 'react';
import { createNewCharacter } from '../CharacterHelpers';
import ImageCropper from '../ImageCropper'; 
import { useAuth } from '../../../../context/AuthContext';
import { useCampaign } from '../../../../context/CampaignContext';
import { db } from '../../../../firebase'; 
import { doc, updateDoc, addDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getTheme } from './ThemeConfig';

// SUB-COMPONENTS
import SheetToolbar from './SheetToolbar';
import SheetHeader from './SheetHeader';
import SheetStats from './SheetStats';
import SheetCombat from './SheetCombat';
import SheetBio from './SheetBio';
import SheetSpells from './Spellcasting/SheetSpells';
import SheetMobileNav from './SheetMobileNav';
import MessageToast from './MessageToast';
import SendMessageModal from './SendMessageModal';

const CharacterSheetView = ({ character, onUpdate, onBack, onExport, saveStatus }) => {
    const { currentUser } = useAuth();
    const { campaignData, activeCampaignId } = useCampaign(); 

    // --- LIVE UPDATE LOGIK STARTER HER ---
    // 1. Vi opretter en lokal state til karakteren, så vi kan opdatere den live
    const [liveChar, setLiveChar] = useState(character);

    // 2. Hvis parent (props) ændrer sig, opdater vores state
    useEffect(() => {
        setLiveChar(character);
    }, [character]);

    // 3. LYT TIL DATABASEN (Fix til Live Items)
    useEffect(() => {
        if (!currentUser || !character?.id) return;

        // Vi lytter på dokumentet hvor alle brugerens karakterer ligger
        const charDocRef = doc(db, "users", currentUser.uid, "data", "characters");
        
        const unsub = onSnapshot(charDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const charList = data.list || [];
                
                // Find præcis denne karakter i listen
                const foundChar = charList.find(ch => ch.id === character.id);
                
                if (foundChar) {
                    // Opdater vores view med den nyeste data fra databasen
                    // Dette fanger nye items, hp ændringer fra andre kilder osv.
                    setLiveChar(prev => {
                        // Lille tjek for at undgå unødvendige renders
                        if (JSON.stringify(prev) === JSON.stringify(foundChar)) return prev;
                        return foundChar;
                    });
                }
            }
        });

        return () => unsub();
    }, [currentUser, character?.id]);

    // Vi bruger nu 'liveChar' i stedet for 'character' prop til at bygge 'c'
    const c = { ...createNewCharacter(), ...liveChar };
    // --- LIVE UPDATE LOGIK SLUT ---

    const [mobileTab, setMobileTab] = useState('stats');
    
    // Sikr at arrays/objekter eksisterer
    c.stats = c.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
    c.hp = c.hp || { current: 10, max: 10, temp: 0 };
    c.hitDice = c.hitDice || { spent: 0, total: 1, type: "d10" };
    c.spellSlots = c.spellSlots || createNewCharacter().spellSlots;

    // --- THEME LOGIC ---
    const theme = getTheme(c.theme || 'default');
    
    const customStyle = c.theme === 'custom' && c.customTheme ? {
        '--c-panel': c.customTheme.panel || '#18181b',
        '--c-border': c.customTheme.border || '#27272a',
        '--c-accent': c.customTheme.accent || '#ef4444',
        '--c-text': c.customTheme.text || '#e4e4e7',
        '--c-subtext': c.customTheme.subText || '#71717a',
    } : {};

    // --- CROPPER & MESSAGE STATES ---
    const [cropImage, setCropImage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [messageQueue, setMessageQueue] = useState([]); 
    const [showDmMsgModal, setShowDmMsgModal] = useState(false);

    // --- SYNC TIL KAMPAGNE ---
    useEffect(() => {
        if (!activeCampaignId || !currentUser || !campaignData?.playerCharacters) return;
        const myEntry = campaignData.playerCharacters[currentUser.uid];
        // Tjekker på 'c' som nu er live-opdateret
        if (myEntry && (myEntry.name !== c.name || myEntry.class !== c.class || myEntry.level !== c.level)) {
            const timer = setTimeout(() => {
                updateDoc(doc(db, "campaigns", activeCampaignId), {
                    [`playerCharacters.${currentUser.uid}.name`]: c.name,
                    [`playerCharacters.${currentUser.uid}.class`]: c.class,
                    [`playerCharacters.${currentUser.uid}.level`]: c.level
                }).catch(err => console.error("Sync error:", err));
            }, 2000); 
            return () => clearTimeout(timer);
        }
    }, [c.name, c.class, c.level, activeCampaignId, currentUser, campaignData]);

    // --- MESSAGES ---
    useEffect(() => {
        if (!activeCampaignId || !currentUser) return;
        const targetIds = [currentUser.uid, "ALL"];
        if (c.id) targetIds.push(c.id);
        const q = query(collection(db, "campaigns", activeCampaignId, "messages"), where("to", "in", targetIds), where("read", "==", false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const msg = change.doc.data();
                    const msgId = change.doc.id;
                    if (msg.senderId === currentUser.uid) return;
                    setMessageQueue(prev => [...prev, { ...msg, id: msgId }]);
                    updateDoc(doc(db, "campaigns", activeCampaignId, "messages", msgId), { read: true }).catch(err => console.error(err));
                }
            });
        });
        return () => unsubscribe();
    }, [activeCampaignId, currentUser, c.id]);

    useEffect(() => {
        document.title = messageQueue.length > 0 ? `(${messageQueue.length}) New Message` : "Character Sheet";
    }, [messageQueue.length]);

    const handleSendToDM = async (text) => {
        if (!text.trim() || !activeCampaignId) return;
        try {
            await addDoc(collection(db, "campaigns", activeCampaignId, "messages"), {
                text, sender: c.name || "Player", senderId: currentUser.uid, to: "DM", timestamp: serverTimestamp(), read: false 
            });
            setShowDmMsgModal(false);
        } catch (error) { console.error("Fejl ved afsendelse:", error); }
    };

    const handleLongRest = () => {
        const newSlots = Object.fromEntries(Object.entries(c.spellSlots).map(([k, v]) => [k, { ...v, used: 0 }]));
        onUpdate({ 
            spellSlots: newSlots, 
            resources: (c.resources || []).map(r => ({ ...r, current: 0 })), 
            hp: { ...c.hp, current: c.hp.max },
            heroicInspiration: false 
        });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5000000) { alert("File is too large! Please select an image under 5MB."); return; }
        const reader = new FileReader();
        reader.onload = () => { setCropImage(reader.result); setShowCropper(true); };
        reader.readAsDataURL(file);
        e.target.value = null; 
    };

    const handleCropSave = (croppedImageBase64) => {
        onUpdate({ imageUrl: croppedImageBase64 });
        setShowCropper(false);
        setCropImage(null);
    };

    const bgStyle = c.theme === 'custom' && c.customTheme?.bgImage 
        ? { backgroundImage: `url(${c.customTheme.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
        : {};

    return (
        <div 
            className={`min-h-screen p-2 md:p-8 pb-24 md:pb-8 fade-in relative transition-colors duration-300 ${theme.bg} ${theme.text}`}
            style={{ ...customStyle, ...bgStyle }}
        >
            {c.theme === 'custom' && c.customTheme?.bgImage && <div className="fixed inset-0 bg-black/60 z-[-1]" />}

            {showCropper && cropImage && <ImageCropper imageSrc={cropImage} onCancel={() => { setShowCropper(false); setCropImage(null); }} onSave={handleCropSave} />}
            <MessageToast message={messageQueue[0]} queueCount={messageQueue.length} onDismiss={() => setMessageQueue(prev => prev.slice(1))} />
            <SendMessageModal isOpen={showDmMsgModal} onClose={() => setShowDmMsgModal(false)} onSend={handleSendToDM} />

            <div className="max-w-7xl mx-auto space-y-6">
                <SheetToolbar theme={theme} c={c} onUpdate={onUpdate} onBack={onBack} onExport={onExport} saveStatus={saveStatus} onLongRest={handleLongRest} onOpenMessage={() => setShowDmMsgModal(true)} />
                <SheetHeader theme={theme} c={c} onUpdate={onUpdate} onImageSelect={handleImageSelect} />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className={`md:col-span-3 ${mobileTab !== 'stats' ? 'hidden md:block' : 'fade-in'}`}>
                        <SheetStats theme={theme} c={c} onUpdate={onUpdate} />
                    </div>
                    <div className={`md:col-span-5 ${mobileTab !== 'combat' ? 'hidden md:block' : 'fade-in'}`}>
                        <SheetCombat theme={theme} c={c} onUpdate={onUpdate} />
                    </div>
                    <div className={`md:col-span-4 ${mobileTab !== 'bio' ? 'hidden md:block' : 'fade-in'}`}>
                        <SheetBio theme={theme} c={c} onUpdate={onUpdate} />
                    </div>
                </div>

                {c.isSpellcaster && (
                    <div className={`mt-6 ${mobileTab !== 'spells' ? 'hidden md:block' : 'fade-in'}`}>
                        <SheetSpells theme={theme} c={c} onUpdate={onUpdate} />
                    </div>
                )}
            </div>

            <SheetMobileNav theme={theme} tab={mobileTab} setTab={setMobileTab} isSpellcaster={c.isSpellcaster} />
        </div>
    );
};

export default CharacterSheetView;