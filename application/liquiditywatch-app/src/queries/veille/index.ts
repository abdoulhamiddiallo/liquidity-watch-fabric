import carteChaleurDax from "./carte-chaleur.dax?raw";
import carteChaleurSpec from "./carte-chaleur.json";
import etatMarchesDax from "./etat-marches.dax?raw";
import kpiVeilleDax from "./kpi-veille.dax?raw";
import lsiMinuteDax from "./lsi-minute.dax?raw";
import lsiMinuteSpec from "./lsi-minute.json";
import niveauxDax from "./niveaux.dax?raw";
import niveauxSpec from "./niveaux.json";
import type { Filtres } from "@/lib/filtres";
import { FORMATS } from "@/lib/formatage";
import type { JetonsCouleur } from "@/lib/jetons-couleur";
import { resoudreJetons } from "@/lib/jetons-spec";
import { requete, visuel } from "../types";

export const kpiVeilleColonnes = {
    "[PicLSI]": { name: "PicLSI", displayName: "Pic de stress", format: FORMATS.lsi },
    "[MarcheTendu]": { name: "MarcheTendu", displayName: "Marché le plus tendu" },
    "[HeurePic]": { name: "HeurePic", displayName: "Heure du pic" },
    "[NiveauPic]": { name: "NiveauPic", displayName: "Niveau au pic" },
    "[MinutesDetresse]": { name: "MinutesDetresse", displayName: "Minutes en détresse", format: FORMATS.entier },
    "[MinutesObservees]": { name: "MinutesObservees", displayName: "Minutes observées", format: FORMATS.entier },
    "[PartTension]": { name: "PartTension", displayName: "Temps sous tension", format: FORMATS.pourcentage },
    "[PireUSDT]": { name: "PireUSDT", displayName: "Pire écart USDT", format: FORMATS.pb },
    "[Carnets]": { name: "Carnets", displayName: "Carnets analysés", format: FORMATS.entier },
    "[Recit]": { name: "Recit", displayName: "Récit" },
    "[Dernier]": { name: "Dernier", displayName: "Dernier carnet" },
};

export function kpiVeilleQuery(filtres: Filtres) {
    return requete(kpiVeilleDax, kpiVeilleColonnes, filtres);
}

export function etatMarchesQuery(filtres: Filtres) {
    return requete(etatMarchesDax, {
        "Marché[Ordre]": { name: "Ordre", displayName: "Ordre" },
        "Marché[Marché]": { name: "Marche", displayName: "Marché" },
        "Marché[Actif]": { name: "Actif", displayName: "Actif" },
        "[Dernier]": { name: "Dernier", displayName: "Dernier LSI", format: FORMATS.lsi },
        "[Max]": { name: "Max", displayName: "LSI maximal", format: FORMATS.lsi },
        "[Pic]": { name: "Pic", displayName: "Heure du pic" },
        "[Detresse]": { name: "Detresse", displayName: "Minutes en détresse", format: FORMATS.entier },
        "[Fourchette]": { name: "Fourchette", displayName: "Fourchette moyenne", format: FORMATS.pb2 },
    }, filtres);
}

export function lsiMinuteQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(lsiMinuteDax, lsiMinuteSpec, {
        "Temps[Heure]": { name: "Heure", displayName: "Heure" },
        "Marché[Marché]": { name: "Marche", displayName: "Marché" },
        "[LSI]": { name: "LSI", displayName: "LSI", format: FORMATS.lsi },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function carteChaleurQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(carteChaleurDax, carteChaleurSpec, {
        "Marché[Ordre]": { name: "Ordre", displayName: "Ordre" },
        "Marché[Marché]": { name: "Marche", displayName: "Marché" },
        "Temps[Tranche de 5 min]": { name: "Tranche", displayName: "Tranche de 5 minutes" },
        "[LSI]": { name: "LSI", displayName: "LSI le plus haut", format: FORMATS.lsi },
    }, filtres, (s) => resoudreJetons(s, jetons));
}

export function niveauxQuery(filtres: Filtres, jetons?: JetonsCouleur) {
    return visuel(niveauxDax, niveauxSpec, {
        "LSI[Niveau]": { name: "Niveau", displayName: "Niveau" },
        "[Minutes]": { name: "Minutes", displayName: "Minutes-marché", format: FORMATS.entier },
    }, filtres, (s) => resoudreJetons(s, jetons));
}
