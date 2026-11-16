import ancragesDax from "./ancrages.dax?raw";
import ecartMinuteDax from "./ecart-minute.dax?raw";
import ecartMinuteSpec from "./ecart-minute.json";
import kpiStablesDax from "./kpi-stables.dax?raw";
import type { Filtres } from "@/lib/filtres";
import { FORMATS } from "@/lib/formatage";
import type { JetonsCouleur } from "@/lib/jetons-couleur";
import { resoudreJetons } from "@/lib/jetons-spec";
import { requete, visuel } from "../types";

export function kpiStablesQuery(filtres: Filtres) {
    return requete(kpiStablesDax, {
        "[PireUSDT]": { name: "PireUSDT", displayName: "Pire écart USDT", format: FORMATS.pb },
        "[PireUSDC]": { name: "PireUSDC", displayName: "Pire écart USDC", format: FORMATS.pb },
        "[Habituel]": { name: "Habituel", displayName: "Écart habituel USDT", format: FORMATS.pb },
        "[Plancher]": { name: "Plancher", displayName: "Plancher USDT", format: FORMATS.dollar },
        "[Decrochage]": { name: "Decrochage", displayName: "Minutes en décrochage", format: FORMATS.entier },
        "[Etat]": { name: "Etat", displayName: "État de l'ancrage" },
        "[Recit]": { name: "Recit", displayName: "Récit" },
    }, filtres);
}

export function ecartMinuteQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(ecartMinuteDax, ecartMinuteSpec, {
        "Temps[Heure]": { name: "Heure", displayName: "Heure" },
        "Carnets[Série]": { name: "Serie", displayName: "Ancrage" },
        "[Ecart]": { name: "Ecart", displayName: "Écart au dollar (pb)", format: FORMATS.pb },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function ancragesQuery(filtres: Filtres) {
    return requete(ancragesDax, {
        "Carnets[Série]": { name: "Serie", displayName: "Ancrage" },
        "[EcartMoyen]": { name: "EcartMoyen", displayName: "Écart moyen", format: FORMATS.pb },
        "[PireEcart]": { name: "PireEcart", displayName: "Pire écart", format: FORMATS.pb },
        "[Plancher]": { name: "Plancher", displayName: "Prix plancher", format: FORMATS.dollar },
        "[Decrochage]": { name: "Decrochage", displayName: "Minutes en décrochage", format: FORMATS.entier },
        "[Etat]": { name: "Etat", displayName: "État" },
    }, filtres);
}
