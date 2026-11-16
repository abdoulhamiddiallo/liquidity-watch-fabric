import estrDax from "./estr.dax?raw";
import estrSpec from "./estr.json";
import kpiMacroDax from "./kpi-macro.dax?raw";
import vixDax from "./vix.dax?raw";
import vixSpec from "./vix.json";
import { FORMATS } from "@/lib/formatage";
import type { JetonsCouleur } from "@/lib/jetons-couleur";
import { resoudreJetons } from "@/lib/jetons-spec";
import { requete, visuel } from "../types";

export function kpiMacroQuery() {
    return requete(kpiMacroDax, {
        "[VIX]": { name: "VIX", displayName: "VIX", format: FORMATS.decimal2 },
        "[Regime]": { name: "Regime", displayName: "Régime du VIX" },
        "[VIXMax]": { name: "VIXMax", displayName: "VIX maximal", format: FORMATS.decimal2 },
        "[DateVIXMax]": { name: "DateVIXMax", displayName: "Date du VIX maximal" },
        "[VIXMoyen]": { name: "VIXMoyen", displayName: "VIX moyen", format: FORMATS.decimal1 },
        "[ESTR]": { name: "ESTR", displayName: "€STR", format: FORMATS.taux },
        "[VariationVeille]": { name: "VariationVeille", displayName: "Variation sur la veille", format: FORMATS.pbSigne },
        "[VariationAn]": { name: "VariationAn", displayName: "Variation sur un an", format: '+#,0 "pb";-#,0 "pb";0 "pb"' },
        "[Recit]": { name: "Recit", displayName: "Récit" },
    });
}

export function vixQuery(jetons?: JetonsCouleur) {
    return visuel(vixDax, vixSpec, {
        "VIX[Date]": { name: "Date", displayName: "Date" },
        "[VIX]": { name: "VIX", displayName: "VIX", format: FORMATS.decimal2 },
    }, {}, (s) => resoudreJetons(s, jetons));
}

export function estrQuery(jetons?: JetonsCouleur) {
    return visuel(estrDax, estrSpec, {
        "Taux €STR[Date]": { name: "Date", displayName: "Date" },
        "[ESTR]": { name: "ESTR", displayName: "€STR (%)", format: FORMATS.taux },
    }, {}, (s) => resoudreJetons(s, jetons));
}
