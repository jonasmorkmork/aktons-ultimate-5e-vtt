import { useCombatState } from './useCombatState';
import { useCombatPersistence } from './useCombatPersistence';
import { useCombatMethods } from './useCombatMethods';

export const useCombatLogic = () => {
    // 1. Hent tilstand (Data, UI, Forms, groupInit osv.)
    const state = useCombatState();

    // 2. Kør persistence (Håndterer Firebase save/load automatisk)
    useCombatPersistence(state);

    // 3. Hent metoder (addCombatant, nextTurn, updateHP osv.)
    const methods = useCombatMethods(state);

    // 4. Returner det hele samlet, så resten af appen tror det er én stor hook
    return {
        ...state,
        ...methods
    };
};