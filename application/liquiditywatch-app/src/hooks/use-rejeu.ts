import { useEffect, useState } from "react";

/** Vitesses du rejeu : durée d'une minute de session à l'écran (ms). */
export const VITESSES_REJEU = [
    { libelle: "×1", pas: 800 },
    { libelle: "×4", pas: 200 },
    { libelle: "×10", pas: 80 },
] as const;

export interface EtatRejeu {
    /** Minute affichée (la dernière de la session hors rejeu). */
    index: number;
    /** Vrai dès qu'une minute antérieure est rejouée ou que la lecture tourne. */
    actif: boolean;
    lecture: boolean;
    vitesse: number;
    basculerLecture: () => void;
    changerVitesse: () => void;
    allerA: (index: number) => void;
    revenirAuDirect: () => void;
}

/**
 * Pilote le rejeu d'une session de n minutes : lecture, pause, vitesse et
 * déplacement de la tête de lecture.
 */
export function useRejeu(n: number): EtatRejeu {
    const [position, setPosition] = useState<number | null>(null);
    const [lecture, setLecture] = useState(false);
    const [vitesse, setVitesse] = useState(1);
    const dernier = Math.max(n - 1, 0);
    const index = Math.min(position ?? dernier, dernier);

    useEffect(() => {
        if (!lecture || n === 0) return;
        const minuteur = window.setInterval(() => {
            setPosition((p) => Math.min((p ?? 0) + 1, dernier));
        }, VITESSES_REJEU[vitesse].pas);
        return () => window.clearInterval(minuteur);
    }, [lecture, n, vitesse, dernier]);

    // Arrivée en bout de session : la lecture s'arrête d'elle-même.
    const enLecture = lecture && index < dernier;

    return {
        index,
        actif: position !== null && (enLecture || index < dernier),
        lecture: enLecture,
        vitesse,
        basculerLecture: () => {
            if (enLecture) return setLecture(false);
            setPosition(index >= dernier ? 0 : index);
            setLecture(true);
        },
        changerVitesse: () => setVitesse((v) => (v + 1) % VITESSES_REJEU.length),
        allerA: (i) => {
            setLecture(false);
            setPosition(Math.max(0, Math.min(i, dernier)));
        },
        revenirAuDirect: () => {
            setLecture(false);
            setPosition(null);
        },
    };
}
