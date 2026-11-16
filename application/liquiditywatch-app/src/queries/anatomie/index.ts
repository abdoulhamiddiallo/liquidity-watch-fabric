import apportsDax from "./apports.dax?raw";
import apportsSpec from "./apports.json";
import ciseauDax from "./ciseau.dax?raw";
import ciseauSpec from "./ciseau.json";
import kpiAnatomieDax from "./kpi-anatomie.dax?raw";
import minutesTenduesDax from "./minutes-tendues.dax?raw";
import type { Filtres } from "@/lib/filtres";
import { FORMATS } from "@/lib/formatage";
import type { JetonsCouleur } from "@/lib/jetons-couleur";
import { resoudreJetons } from "@/lib/jetons-spec";
import { requete, visuel } from "../types";

export function kpiAnatomieQuery(filtres: Filtres) {
    return requete(kpiAnatomieDax, {
        "[FourchetteMax]": { name: "FourchetteMax", displayName: "Fourchette max", format: FORMATS.pb2 },
        "[ProfondeurMin]": { name: "ProfondeurMin", displayName: "Profondeur min", format: FORMATS.millionsDollars },
        "[Chute]": { name: "Chute", displayName: "Profondeur perdue", format: FORMATS.pourcentage },
        "[DislocationMax]": { name: "DislocationMax", displayName: "Dislocation max", format: FORMATS.pb },
        "[VolatiliteMax]": { name: "VolatiliteMax", displayName: "Volatilité max", format: FORMATS.pb2 },
        "[MinutesTension]": { name: "MinutesTension", displayName: "Minutes sous tension", format: FORMATS.entier },
        "[Recit]": { name: "Recit", displayName: "Récit" },
    }, filtres);
}

export function apportsQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(apportsDax, apportsSpec, {
        "Temps[Heure]": { name: "Heure", displayName: "Heure" },
        "[Fourchette]": { name: "Fourchette", displayName: "Fourchette", format: FORMATS.lsi },
        "[Profondeur]": { name: "Profondeur", displayName: "Profondeur", format: FORMATS.lsi },
        "[Dislocation]": { name: "Dislocation", displayName: "Dislocation", format: FORMATS.lsi },
        "[Volatilite]": { name: "Volatilite", displayName: "Volatilité", format: FORMATS.lsi },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function ciseauQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(ciseauDax, ciseauSpec, {
        "Temps[Heure]": { name: "Heure", displayName: "Heure" },
        "[Fourchette]": { name: "Fourchette", displayName: "Fourchette (pb)", format: FORMATS.pb2 },
        "[Profondeur]": { name: "Profondeur", displayName: "Profondeur (M$)", format: FORMATS.millionsDollars },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function minutesTenduesQuery(filtres: Filtres) {
    return requete(minutesTenduesDax, {
        "Temps[Heure]": { name: "Heure", displayName: "Heure" },
        "Marché[Marché]": { name: "Marche", displayName: "Marché" },
        "[LSI]": { name: "LSI", displayName: "LSI", format: FORMATS.lsi },
        "[Fourchette]": { name: "Fourchette", displayName: "Fourchette", format: FORMATS.pb2 },
        "[Dislocation]": { name: "Dislocation", displayName: "Dislocation", format: FORMATS.pb },
        "[Volatilite]": { name: "Volatilite", displayName: "Volatilité", format: FORMATS.pb2 },
    }, filtres);
}
