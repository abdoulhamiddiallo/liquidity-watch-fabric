import { createContext, useContext } from "react";

/** Une session de capture du producteur (bornes en heure de Paris). */
export interface SessionCapture {
    numero: number;
    libelle: string;
    debut: unknown;
    fin: unknown;
    /** Vrai si la session contient le test de stress balisé STRESS_TEST. */
    testDeStress: boolean;
}

export interface ContexteSelection {
    sessions: SessionCapture[];
    chargementSessions: boolean;
    session: string | null;
    choisirSession: (session: string) => void;
    marche: string | null;
    choisirMarche: (marche: string | null) => void;
}

export const SelectionContext = createContext<ContexteSelection | undefined>(undefined);

export function useSelection(): ContexteSelection {
    const contexte = useContext(SelectionContext);
    if (!contexte) throw new Error("useSelection doit être utilisé dans SelectionContext.Provider");
    return contexte;
}
