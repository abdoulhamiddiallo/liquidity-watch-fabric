import anomaliesDax from "./anomalies.dax?raw";
import fourchetteMinuteDax from "./fourchette-minute.dax?raw";
import fourchetteMinuteSpec from "./fourchette-minute.json";
import grilleCarnetsDax from "./grille-carnets.dax?raw";
import grilleCarnetsSpec from "./grille-carnets.json";
import kpiPlateformesDax from "./kpi-plateformes.dax?raw";
import latenceDax from "./latence.dax?raw";
import latenceSpec from "./latence.json";
import type { Filtres } from "@/lib/filtres";
import { FORMATS } from "@/lib/formatage";
import type { JetonsCouleur } from "@/lib/jetons-couleur";
import { resoudreJetons } from "@/lib/jetons-spec";
import { requete, visuel } from "../types";

export function kpiPlateformesQuery(filtres: Filtres) {
    return requete(kpiPlateformesDax, {
        "[Plateformes]": { name: "Plateformes", displayName: "Plateformes actives", format: FORMATS.entier },
        "[Marches]": { name: "Marches", displayName: "Marchés suivis", format: FORMATS.entier },
        "[Carnets]": { name: "Carnets", displayName: "Carnets analysés", format: FORMATS.entier },
        "[CarnetsMinute]": { name: "CarnetsMinute", displayName: "Carnets par minute", format: FORMATS.entier },
        "[Latence]": { name: "Latence", displayName: "Latence moyenne", format: FORMATS.ms },
        "[Anomalies]": { name: "Anomalies", displayName: "Écartements anormaux", format: FORMATS.entier },
        "[Recit]": { name: "Recit", displayName: "Récit" },
    }, filtres);
}

export function latenceQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(latenceDax, latenceSpec, {
        "Plateforme[Ordre]": { name: "Ordre", displayName: "Ordre" },
        "Plateforme[Plateforme]": { name: "Plateforme", displayName: "Plateforme" },
        "[Latence]": { name: "Latence", displayName: "Latence (ms)", format: FORMATS.ms },
        "[Carnets]": { name: "Carnets", displayName: "Carnets", format: FORMATS.entier },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function grilleCarnetsQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(grilleCarnetsDax, grilleCarnetsSpec, {
        "Marché[Ordre]": { name: "Ordre", displayName: "Ordre" },
        "Marché[Marché]": { name: "Marche", displayName: "Marché" },
        "Plateforme[Plateforme]": { name: "Plateforme", displayName: "Plateforme" },
        "[Fourchette]": { name: "Fourchette", displayName: "Fourchette (pb)", format: FORMATS.pb2 },
        "[Profondeur]": { name: "Profondeur", displayName: "Profondeur (M$)", format: FORMATS.millionsDollars },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function fourchetteMinuteQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(fourchetteMinuteDax, fourchetteMinuteSpec, {
        "Temps[Heure]": { name: "Heure", displayName: "Heure" },
        "Plateforme[Plateforme]": { name: "Plateforme", displayName: "Plateforme" },
        "[Fourchette]": { name: "Fourchette", displayName: "Fourchette (pb)", format: FORMATS.pb2 },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function anomaliesQuery(filtres: Filtres) {
    return requete(anomaliesDax, {
        "Anomalies[Heure]": { name: "Heure", displayName: "Heure" },
        "Plateforme[Plateforme]": { name: "Plateforme", displayName: "Plateforme" },
        "Marché[Marché]": { name: "Marche", displayName: "Marché" },
        "Anomalies[Fourchette observée (pb)]": { name: "Observee", displayName: "Observée", format: FORMATS.pb2 },
        "Anomalies[Fourchette habituelle (pb)]": { name: "Habituelle", displayName: "Habituelle", format: FORMATS.pb2 },
        "Anomalies[Score]": { name: "Score", displayName: "Score", format: FORMATS.decimal1 },
        "[Nombre]": { name: "Nombre", displayName: "Nombre", format: FORMATS.entier },
    }, filtres);
}
