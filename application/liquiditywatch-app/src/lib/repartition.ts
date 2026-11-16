import type { DataTable } from "@microsoft/fabric-visuals-core";
import { lignesEnObjets } from "@/hooks/use-ligne";
import type { Niveau } from "@/lib/affichage";

/** Niveau d'un libellé du modèle (« 4 · Détresse » donne « detresse »). */
export function niveauDuLibelle(libelle: unknown): Niveau | undefined {
    if (typeof libelle !== "string") return undefined;
    const bas = libelle.toLowerCase();
    if (bas.includes("calme")) return "calme";
    if (bas.includes("tendu")) return "tendu";
    if (bas.includes("stress")) return "stress";
    if (bas.includes("tresse")) return "detresse";
    return undefined;
}

/** Minutes par niveau, les quatre niveaux toujours présents (zéro compris). */
export function minutesParNiveau(table: DataTable | undefined): Record<Niveau, number> {
    const total: Record<Niveau, number> = { calme: 0, tendu: 0, stress: 0, detresse: 0 };
    for (const ligne of lignesEnObjets(table)) {
        const niveau = niveauDuLibelle(ligne.Niveau);
        if (niveau && typeof ligne.Minutes === "number") total[niveau] += ligne.Minutes;
    }
    return total;
}
