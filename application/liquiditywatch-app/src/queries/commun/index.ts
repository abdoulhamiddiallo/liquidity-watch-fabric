import sessionsDax from "./sessions.dax?raw";
import { FORMATS } from "@/lib/formatage";
import { requete } from "../types";

/** Liste des sessions captées, la plus récente en tête. */
export function sessionsQuery() {
    return requete(sessionsDax, {
        "Temps[N° session]": { name: "Numero", displayName: "N° session" },
        "Temps[Session]": { name: "Session", displayName: "Session" },
        "[Debut]": { name: "Debut", displayName: "Début" },
        "[Fin]": { name: "Fin", displayName: "Fin" },
        "[MinutesChoc]": { name: "MinutesChoc", displayName: "Minutes de choc", format: FORMATS.entier },
    });
}
