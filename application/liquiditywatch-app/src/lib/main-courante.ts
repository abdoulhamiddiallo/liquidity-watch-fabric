import { LIBELLES_NIVEAU, niveauAncrage, SEUILS_LSI, type Niveau } from "@/lib/affichage";
import { formaterHeure, formaterValeur, FORMATS, VALEUR_ABSENTE } from "@/lib/formatage";
import { estAggravation, type SessionRejeu } from "@/lib/rejeu";

/** Famille d'un événement de la main courante. */
export type Famille = "indice" | "stablecoin" | "plateforme";

export interface Evenement {
    /** Clé de tri chronologique (horodatage ISO). */
    tri: string;
    heure: string;
    famille: Famille;
    niveau: Niveau;
    titre: string;
    detail: string;
}

export interface FicheIncident {
    debut: string;
    fin: string;
    pic: number;
    picMinute: string;
    picMarche: string;
    minutesDetresse: number;
    retourCalme: string | null;
    marchesTouches: string[];
}

export interface PointEcart {
    heure: unknown;
    serie: unknown;
    ecart: unknown;
}

export interface PointAnomalie {
    heure: unknown;
    plateforme: unknown;
    marche: unknown;
    observee: unknown;
    habituelle: unknown;
    score: unknown;
}

const LIBELLE_ANCRAGE: Record<Niveau, string> = {
    calme: "se réancre",
    tendu: "passe sous surveillance",
    stress: "passe sous surveillance",
    detresse: "décroche du dollar",
};

function cleTri(valeur: unknown): string {
    if (typeof valeur === "string") return valeur;
    if (valeur instanceof Date) return valeur.toISOString();
    if (typeof valeur === "number") return new Date(valeur).toISOString();
    return "";
}

/**
 * Fiche de l'incident : de la première à la dernière minute en détresse (LSI ≥ 3,
 * tous marchés confondus), avec le pic et le retour au calme. Null si la session
 * n'a jamais franchi le seuil de détresse.
 */
export function ficheIncident(rejeu: SessionRejeu): FicheIncident | null {
    const indices = rejeu.maximum.map((v, i) => (v !== null && v >= SEUILS_LSI.detresse ? i : -1)).filter((i) => i >= 0);
    if (indices.length === 0) return null;
    const premier = indices[0];
    const dernier = indices[indices.length - 1];
    let pic = -Infinity;
    let picIndex = premier;
    let picMarche = "";
    for (const m of rejeu.marches) {
        rejeu.valeurs[m].forEach((v, i) => {
            if (v !== null && v > pic) {
                pic = v;
                picIndex = i;
                picMarche = m;
            }
        });
    }
    const retour = rejeu.maximum.findIndex((v, i) => i > dernier && v !== null && v < SEUILS_LSI.tendu);
    const marchesTouches = rejeu.marches.filter((m) => rejeu.valeurs[m].some((v) => v !== null && v >= SEUILS_LSI.detresse));
    return {
        debut: rejeu.minutes[premier],
        fin: rejeu.minutes[dernier],
        pic,
        picMinute: rejeu.minutes[picIndex],
        picMarche,
        minutesDetresse: indices.length,
        retourCalme: retour >= 0 ? rejeu.minutes[retour] : null,
        marchesTouches,
    };
}

/** Bascules de niveau de l'indice, une ligne par changement. */
function evenementsIndice(rejeu: SessionRejeu): Evenement[] {
    return rejeu.bascules.map((b) => ({
        tri: rejeu.cles[b.index] ?? b.minute,
        heure: b.minute,
        famille: "indice",
        niveau: b.a,
        titre: `${b.marche} ${estAggravation(b) ? "monte" : "redescend"} en ${LIBELLES_NIVEAU[b.a].toLowerCase()}`,
        detail: `LSI ${formaterValeur(b.lsi, FORMATS.lsi)}, depuis ${LIBELLES_NIVEAU[b.de].toLowerCase()}`,
    }));
}

/** Changements d'état des ancrages (sous surveillance à -20 pb, décrochage à -50 pb). */
export function evenementsAncrage(points: PointEcart[]): Evenement[] {
    const parSerie = new Map<string, { tri: string; ecart: number }[]>();
    for (const p of points) {
        if (typeof p.serie !== "string" || typeof p.ecart !== "number" || !Number.isFinite(p.ecart)) continue;
        const liste = parSerie.get(p.serie) ?? [];
        liste.push({ tri: cleTri(p.heure), ecart: p.ecart });
        parSerie.set(p.serie, liste);
    }
    const evenements: Evenement[] = [];
    for (const [serie, liste] of parSerie) {
        liste.sort((a, b) => a.tri.localeCompare(b.tri));
        let etat: Niveau | undefined;
        for (const point of liste) {
            const niveau = niveauAncrage(point.ecart) ?? "calme";
            if (etat !== undefined && niveau !== etat) {
                evenements.push({
                    tri: point.tri,
                    heure: formaterHeure(point.tri),
                    famille: "stablecoin",
                    niveau,
                    titre: `${serie} ${niveau === "tendu" && etat === "detresse" ? "repasse au-dessus du seuil de décrochage" : LIBELLE_ANCRAGE[niveau]}`,
                    detail: `écart de ${formaterValeur(point.ecart, FORMATS.pb)} face au dollar`,
                });
            }
            etat = niveau;
        }
    }
    return evenements;
}

/** Première anomalie de fourchette détectée et anomalie la plus forte. */
export function evenementsPlateformes(points: PointAnomalie[]): Evenement[] {
    const valides = points.filter((p) => typeof p.score === "number" && cleTri(p.heure) !== "");
    if (valides.length === 0) return [];
    const premiere = [...valides].sort((a, b) => cleTri(a.heure).localeCompare(cleTri(b.heure)))[0];
    const pire = [...valides].sort((a, b) => (b.score as number) - (a.score as number))[0];
    const decrire = (p: PointAnomalie, titre: string): Evenement => ({
        tri: cleTri(p.heure),
        heure: formaterHeure(p.heure),
        famille: "plateforme",
        niveau: "stress",
        titre: `${titre} : ${String(p.plateforme)} sur ${String(p.marche)}`,
        detail: `fourchette de ${formaterValeur(p.observee, FORMATS.pb2)} pour ${formaterValeur(p.habituelle, FORMATS.pb2)} d'habitude (score ${formaterValeur(p.score, FORMATS.decimal1)})`,
    });
    return premiere === pire
        ? [decrire(pire, "Écartement de fourchette le plus anormal")]
        : [decrire(premiere, "Premier écartement anormal de fourchette"), decrire(pire, "Écartement le plus anormal")];
}

/** Main courante complète, dans l'ordre chronologique. */
export function construireMainCourante(rejeu: SessionRejeu, ecarts: PointEcart[], anomalies: PointAnomalie[]): Evenement[] {
    return [...evenementsIndice(rejeu), ...evenementsAncrage(ecarts), ...evenementsPlateformes(anomalies)]
        .filter((e) => e.heure !== VALEUR_ABSENTE)
        .sort((a, b) => a.tri.localeCompare(b.tri) || a.famille.localeCompare(b.famille));
}
