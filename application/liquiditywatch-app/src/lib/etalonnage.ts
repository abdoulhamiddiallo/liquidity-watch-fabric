import { formaterHeure } from "@/lib/formatage";

/** Une ligne du LSI minute par minute, toutes sessions confondues. */
export interface PointEtalonnage {
    heure: unknown;
    marche: unknown;
    lsi: unknown;
}

/** Bornes d'une session (horodatages reçus du modèle). */
export interface BornesSession {
    cle: string;
    debut: unknown;
    fin: unknown;
}

/** Série d'une session : pour chaque marché, les LSI dans l'ordre des minutes. */
export interface SerieSession {
    cle: string;
    minutes: string[];
    marches: Record<string, (number | null)[]>;
}

export interface ResultatSeuil {
    /** Minutes-marché au-dessus du seuil (une minute compte une fois par marché). */
    minutes: number;
    /** Nombre d'alertes : entrées d'un marché au-dessus du seuil. */
    alertes: number;
    /** Heure de la première alerte. */
    premiere: string | null;
    /** Marchés qui ont déclenché au moins une alerte. */
    marches: string[];
    /** LSI le plus haut pris en compte (après la période de chauffe). */
    max: number | null;
}

function cle(valeur: unknown): string {
    if (typeof valeur === "string") return valeur;
    if (valeur instanceof Date) return valeur.toISOString();
    if (typeof valeur === "number") return new Date(valeur).toISOString();
    return "";
}

/** Range chaque point dans sa session d'après les bornes de début et de fin. */
export function decouperParSession(points: PointEtalonnage[], sessions: BornesSession[]): SerieSession[] {
    return sessions.map((s) => {
        const debut = cle(s.debut);
        const fin = cle(s.fin);
        const dansSession = points.filter((p) => {
            const c = cle(p.heure);
            return c !== "" && c >= debut && c <= fin && typeof p.marche === "string" && typeof p.lsi === "number";
        });
        const cles = [...new Set(dansSession.map((p) => cle(p.heure)))].sort();
        const rang = new Map(cles.map((c, i) => [c, i]));
        const marches: Record<string, (number | null)[]> = {};
        for (const p of dansSession) {
            const m = p.marche as string;
            marches[m] ??= cles.map(() => null);
            marches[m][rang.get(cle(p.heure))!] = p.lsi as number;
        }
        return { cle: s.cle, minutes: cles.map((c) => formaterHeure(c)), marches };
    });
}

/**
 * Ce que l'alerte aurait donné sur une session avec un seuil donné, en ignorant
 * les premières minutes (période de chauffe, quand l'indice n'a pas encore
 * d'historique pour situer la fourchette et la profondeur habituelles).
 */
export function evaluerSeuil(serie: SerieSession, seuil: number, chauffe: number): ResultatSeuil {
    let minutes = 0;
    let alertes = 0;
    let premiereIndex = Infinity;
    let max: number | null = null;
    const touches = new Set<string>();
    for (const [marche, valeurs] of Object.entries(serie.marches)) {
        let dessus = false;
        valeurs.forEach((v, i) => {
            if (i < chauffe || v === null) return;
            if (max === null || v > max) max = v;
            const au = v >= seuil;
            if (au) {
                minutes += 1;
                if (!dessus) {
                    alertes += 1;
                    touches.add(marche);
                    premiereIndex = Math.min(premiereIndex, i);
                }
            }
            dessus = au;
        });
    }
    return {
        minutes,
        alertes,
        premiere: Number.isFinite(premiereIndex) ? serie.minutes[premiereIndex] : null,
        marches: [...touches].sort(),
        max,
    };
}

/**
 * Seuil le plus bas (au dixième) qui ne déclenche aucune alerte sur la session
 * de référence tout en en déclenchant sur la session de crise. Null si aucun
 * seuil ne sépare les deux sessions.
 */
export function seuilSeparateur(calme: SerieSession, crise: SerieSession, chauffe: number): number | null {
    const maxCalme = evaluerSeuil(calme, Infinity, chauffe).max;
    const maxCrise = evaluerSeuil(crise, Infinity, chauffe).max;
    if (maxCalme === null || maxCrise === null) return null;
    const candidat = Math.floor(maxCalme * 10) / 10 + 0.1;
    return candidat <= maxCrise ? Math.round(candidat * 10) / 10 : null;
}

/** Seuil de détresse en service dans le modèle. */
export const SEUIL_ACTUEL = 3;

/** Réglage conseillé : on garde le seuil de 3 et on cherche la plus courte période de chauffe qui fait taire le marché réel. */
export function reglageConseille(calme: SerieSession, crise: SerieSession): { seuil: number; chauffe: number } | null {
    for (let chauffe = 0; chauffe <= 10; chauffe++) {
        if (evaluerSeuil(calme, SEUIL_ACTUEL, chauffe).alertes === 0 && evaluerSeuil(crise, SEUIL_ACTUEL, chauffe).alertes > 0) return { seuil: SEUIL_ACTUEL, chauffe };
    }
    const seuil = seuilSeparateur(calme, crise, 0);
    return seuil === null ? null : { seuil, chauffe: 0 };
}

