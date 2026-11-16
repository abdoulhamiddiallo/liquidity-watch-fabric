import type { JetonsCouleur } from "@/lib/jetons-couleur";

/**
 * Les specs Vega-Lite écrivent leurs couleurs sous forme de jetons (« @calme »,
 * « @marches »…). Cette fonction remplace chaque jeton par la valeur résolue du thème :
 * une couleur pour un jeton simple, une échelle { domain, range } pour un jeton d'échelle.
 */
export function tableJetons(j: JetonsCouleur): Record<string, unknown> {
    const echelle = (couleurs: Record<string, string>) => ({ domain: Object.keys(couleurs), range: Object.values(couleurs) });
    return {
        "@calme": j.niveaux.calme,
        "@tendu": j.niveaux.tendu,
        "@stress": j.niveaux.stress,
        "@detresse": j.niveaux.detresse,
        "@fourchette": j.apports.fourchette,
        "@profondeur": j.apports.profondeur,
        "@dislocation": j.apports.dislocation,
        "@volatilite": j.apports.volatilite,
        "@vix": j.macro.vix,
        "@estr": j.macro.estr,
        "@texte": j.texte,
        "@texteSecondaire": j.texteSecondaire,
        "@fond": j.fond,
        "@marches": echelle(j.marches),
        "@plateformes": echelle(j.plateformes),
        "@ancrages": echelle(j.ancrages),
    };
}

/** Remplace récursivement les jetons d'une spec (copie modifiée en place). */
export function resoudreJetons(spec: unknown, jetons: JetonsCouleur | undefined): void {
    if (!jetons) return;
    const table = tableJetons(jetons);
    const parcourir = (noeud: unknown): unknown => {
        if (typeof noeud === "string" && noeud.startsWith("@") && noeud in table) {
            const valeur = table[noeud];
            return typeof valeur === "object" ? structuredClone(valeur) : valeur;
        }
        if (Array.isArray(noeud)) {
            noeud.forEach((element, i) => {
                noeud[i] = parcourir(element);
            });
            return noeud;
        }
        if (noeud && typeof noeud === "object") {
            for (const [cle, valeur] of Object.entries(noeud)) {
                (noeud as Record<string, unknown>)[cle] = parcourir(valeur);
            }
        }
        return noeud;
    };
    parcourir(spec);
}

/** Liste les jetons restant dans une spec (aide aux tests). */
export function jetonsRestants(spec: unknown): string[] {
    const trouves: string[] = [];
    const parcourir = (noeud: unknown) => {
        if (typeof noeud === "string" && /^@[a-zA-Z]+$/.test(noeud)) trouves.push(noeud);
        else if (Array.isArray(noeud)) noeud.forEach(parcourir);
        else if (noeud && typeof noeud === "object") Object.values(noeud).forEach(parcourir);
    };
    parcourir(spec);
    return trouves;
}
