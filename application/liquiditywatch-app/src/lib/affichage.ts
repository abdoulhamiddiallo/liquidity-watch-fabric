/** Valeur d'afficheur scindée en partie chiffrée (palettes) et unité (étiquette). */
export interface ValeurAfficheur {
    chiffres: string;
    unite: string;
}

const MOTIF_VALEUR = /^([+-]?[\d\s\u00a0\u202f.,]*\d)\s*(.*)$/u;

/** Sépare « 6 480 carnets » en { chiffres: "6 480", unite: "carnets" }. */
export function separerUnite(texte: string): ValeurAfficheur {
    const propre = texte.trim();
    const m = MOTIF_VALEUR.exec(propre);
    if (!m) return { chiffres: propre, unite: "" };
    return { chiffres: m[1], unite: m[2].trim() };
}

/** Niveau de l'indice de stress de liquidité (LSI). */
export type Niveau = "calme" | "tendu" | "stress" | "detresse";

/** Seuils du LSI : tendu à partir de 1, stress à partir de 2, détresse à partir de 3. */
export const SEUILS_LSI = { tendu: 1, stress: 2, detresse: 3 } as const;

export function niveauLsi(lsi: unknown): Niveau | undefined {
    if (typeof lsi !== "number" || !Number.isFinite(lsi)) return undefined;
    if (lsi >= SEUILS_LSI.detresse) return "detresse";
    if (lsi >= SEUILS_LSI.stress) return "stress";
    if (lsi >= SEUILS_LSI.tendu) return "tendu";
    return "calme";
}

export const LIBELLES_NIVEAU: Record<Niveau, string> = {
    calme: "Calme",
    tendu: "Tendu",
    stress: "Stress",
    detresse: "Détresse",
};

/** Niveau d'un ancrage de stablecoin à partir de son pire écart au dollar (pb). */
export function niveauAncrage(ecart: unknown): Niveau | undefined {
    if (typeof ecart !== "number" || !Number.isFinite(ecart)) return undefined;
    const a = Math.abs(ecart);
    if (a >= 50) return "detresse";
    if (a >= 20) return "tendu";
    return "calme";
}

/** Niveau correspondant à un libellé d'état produit par le modèle. */
export function niveauEtat(etat: unknown): Niveau | undefined {
    switch (etat) {
        case "Décrochage":
            return "detresse";
        case "Sous surveillance":
            return "tendu";
        case "Ancré":
            return "calme";
        default:
            return undefined;
    }
}

/** Niveau correspondant au régime du VIX. */
export function niveauRegimeVix(regime: unknown): Niveau | undefined {
    switch (regime) {
        case "Calme":
            return "calme";
        case "Normal":
            return "calme";
        case "Tendu":
            return "stress";
        case "Stress":
            return "detresse";
        default:
            return undefined;
    }
}
