import { formatValue } from "@microsoft/fabric-visuals-core";

/** Locale de mise en forme de toute l'application. */
export const LOCALE_APPLICATION = "fr-FR";

/** Chaînes de format VBA partagées (rendues en fr-FR : espaces de milliers, virgule décimale). */
export const FORMATS = {
    entier: "#,0",
    decimal1: "#,0.0",
    decimal2: "#,0.00",
    lsi: "0.00",
    pb: '#,0.0 "pb"',
    pb2: '#,0.00 "pb"',
    pbSigne: '+#,0.0 "pb";-#,0.0 "pb";0.0 "pb"',
    millionsDollars: '#,0.00 "M$"',
    dollar: '0.0000 "$"',
    ms: '#,0 "ms"',
    pourcentage: "0 %",
    taux: '0.000 "%"',
} as const;

/** Libellé affiché quand une valeur est absente. */
export const VALEUR_ABSENTE = "n. d.";

/** Met en forme une valeur avec une chaîne de format VBA, en fr-FR. */
export function formaterValeur(valeur: unknown, format: string | undefined): string {
    if (valeur === null || valeur === undefined || valeur === "") return VALEUR_ABSENTE;
    if (typeof valeur === "number" && !Number.isFinite(valeur)) return VALEUR_ABSENTE;
    const resultat = formatValue(valeur, format, { locale: LOCALE_APPLICATION });
    return String(resultat);
}

interface PartiesDate {
    annee: number;
    mois: number;
    jour: number;
    heures: number;
    minutes: number;
}

const MOTIF_ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

/**
 * Décompose une date renvoyée par le modèle. Les chaînes ISO sans fuseau sont
 * lues telles quelles (heure d'exploitation locale), sans conversion de fuseau.
 */
export function decomposerDate(valeur: unknown): PartiesDate | undefined {
    if (typeof valeur === "string") {
        const m = MOTIF_ISO.exec(valeur);
        if (!m) return undefined;
        return {
            annee: Number(m[1]),
            mois: Number(m[2]),
            jour: Number(m[3]),
            heures: Number(m[4] ?? 0),
            minutes: Number(m[5] ?? 0),
        };
    }
    const date = valeur instanceof Date ? valeur : typeof valeur === "number" ? new Date(valeur) : undefined;
    if (!date || Number.isNaN(date.getTime())) return undefined;
    return {
        annee: date.getFullYear(),
        mois: date.getMonth() + 1,
        jour: date.getDate(),
        heures: date.getHours(),
        minutes: date.getMinutes(),
    };
}

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** Formate un départ prévu en « jj/MM HH:mm ». */
export function formaterDepart(valeur: unknown): string {
    const p = decomposerDate(valeur);
    if (!p) return VALEUR_ABSENTE;
    return `${deuxChiffres(p.jour)}/${deuxChiffres(p.mois)} ${deuxChiffres(p.heures)}:${deuxChiffres(p.minutes)}`;
}

/** Formate l'heure d'un départ en « HH:mm ». */
export function formaterHeure(valeur: unknown): string {
    const p = decomposerDate(valeur);
    if (!p) return VALEUR_ABSENTE;
    return `${deuxChiffres(p.heures)}:${deuxChiffres(p.minutes)}`;
}

/** Formate le jour d'un départ en « jj/MM ». */
export function formaterJour(valeur: unknown): string {
    const p = decomposerDate(valeur);
    if (!p) return VALEUR_ABSENTE;
    return `${deuxChiffres(p.jour)}/${deuxChiffres(p.mois)}`;
}

/**
 * Met en forme un grand nombre de façon compacte pour l'afficheur à palettes :
 * 1 776 117 devient « 1,78 M », 23 450 devient « 23 450 ».
 */
export function formaterCompact(valeur: unknown, format: string | undefined): string {
    if (typeof valeur !== "number" || !Number.isFinite(valeur) || Math.abs(valeur) < 1_000_000) {
        return formaterValeur(valeur, format);
    }
    const millions = valeur / 1_000_000;
    const decimales = Math.abs(millions) >= 100 ? 0 : Math.abs(millions) >= 10 ? 1 : 2;
    return `${millions.toLocaleString(LOCALE_APPLICATION, { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} M`;
}
