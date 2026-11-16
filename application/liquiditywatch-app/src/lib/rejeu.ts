import { formaterHeure, VALEUR_ABSENTE } from "@/lib/formatage";
import { LIBELLES_NIVEAU, niveauLsi, type Niveau } from "@/lib/affichage";

/** Une ligne du résultat « LSI minute par minute ». */
export interface PointLsi {
    heure: unknown;
    marche: unknown;
    lsi: unknown;
}

/** Changement de niveau d'un marché, tel qu'il apparaît au rejeu. */
export interface Bascule {
    index: number;
    minute: string;
    marche: string;
    de: Niveau;
    a: Niveau;
    lsi: number;
}

/** Session prête à être rejouée minute par minute. */
export interface SessionRejeu {
    /** Minutes de la session, dans l'ordre (libellé HH:MM). */
    minutes: string[];
    /** Horodatages bruts des minutes, dans le même ordre (clés de tri). */
    cles: string[];
    /** Marchés présents, dans l'ordre alphabétique. */
    marches: string[];
    /** LSI de chaque marché à chaque minute (null si le marché n'a pas coté). */
    valeurs: Record<string, (number | null)[]>;
    /** LSI le plus haut tous marchés confondus, minute par minute. */
    maximum: (number | null)[];
    /** Changements de niveau, dans l'ordre chronologique. */
    bascules: Bascule[];
}

const RANG: Record<Niveau, number> = { calme: 0, tendu: 1, stress: 2, detresse: 3 };

/** Libellé HH:MM d'une heure reçue du modèle (texte ISO, horodatage ou Date). */
export function libelleMinute(valeur: unknown): string | null {
    const texte = formaterHeure(valeur);
    return texte === VALEUR_ABSENTE ? null : texte;
}

/** Clé de tri chronologique d'une heure reçue du modèle. */
function cleTri(valeur: unknown): string {
    if (typeof valeur === "string") return valeur;
    if (valeur instanceof Date) return valeur.toISOString();
    if (typeof valeur === "number") return new Date(valeur).toISOString();
    return "";
}

/** Construit la session rejouable à partir des lignes du LSI minute par minute. */
export function construireRejeu(points: PointLsi[]): SessionRejeu {
    const parCle = new Map<string, { minute: string; lsi: Map<string, number> }>();
    const marches = new Set<string>();
    for (const p of points) {
        const minute = libelleMinute(p.heure);
        if (!minute || typeof p.marche !== "string" || typeof p.lsi !== "number" || !Number.isFinite(p.lsi)) continue;
        const cle = cleTri(p.heure);
        const entree = parCle.get(cle) ?? { minute, lsi: new Map<string, number>() };
        entree.lsi.set(p.marche, p.lsi);
        parCle.set(cle, entree);
        marches.add(p.marche);
    }
    const ordre = [...parCle.keys()].sort();
    const listeMarches = [...marches].sort();
    const minutes = ordre.map((c) => parCle.get(c)!.minute);
    const valeurs: Record<string, (number | null)[]> = {};
    for (const m of listeMarches) valeurs[m] = ordre.map((c) => parCle.get(c)!.lsi.get(m) ?? null);
    const maximum = ordre.map((_, i) => {
        const vals = listeMarches.map((m) => valeurs[m][i]).filter((v): v is number => v !== null);
        return vals.length ? Math.max(...vals) : null;
    });

    const bascules: Bascule[] = [];
    for (const m of listeMarches) {
        let precedent: Niveau | undefined;
        valeurs[m].forEach((v, i) => {
            const niveau = niveauLsi(v);
            if (!niveau || v === null) return;
            if (precedent && niveau !== precedent) bascules.push({ index: i, minute: minutes[i], marche: m, de: precedent, a: niveau, lsi: v });
            precedent = niveau;
        });
    }
    bascules.sort((a, b) => a.index - b.index || a.marche.localeCompare(b.marche));
    return { minutes, cles: ordre, marches: listeMarches, valeurs, maximum, bascules };
}

/** Dernière valeur connue d'un marché à la minute donnée (ou avant). */
export function valeurA(session: SessionRejeu, marche: string, index: number): number | null {
    const serie = session.valeurs[marche];
    if (!serie) return null;
    for (let i = Math.min(index, serie.length - 1); i >= 0; i--) if (serie[i] !== null) return serie[i];
    return null;
}

/** Une bascule vers un niveau plus grave est une aggravation. */
export function estAggravation(b: Bascule): boolean {
    return RANG[b.a] > RANG[b.de];
}

/** Phrase de journal d'une bascule : « SOL-USD passe de Stress à Détresse ». */
export function phraseBascule(b: Bascule): string {
    return `${b.marche} ${estAggravation(b) ? "monte" : "redescend"} de ${LIBELLES_NIVEAU[b.de]} à ${LIBELLES_NIVEAU[b.a]}`;
}
