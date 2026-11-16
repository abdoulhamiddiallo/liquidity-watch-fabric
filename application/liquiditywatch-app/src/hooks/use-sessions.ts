import { useMemo } from "react";
import type { SessionCapture } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { sessionsQuery } from "@/queries";

const definition = sessionsQuery();

/** Sessions captées, la plus récente en tête (lues dans le modèle). */
export function useSessions(): { sessions: SessionCapture[]; isLoading: boolean; error: Error | undefined } {
    const { table, isLoading, error } = useTableModele(definition);
    const sessions = useMemo<SessionCapture[]>(() => {
        if (!table) return [];
        const i = (nom: string) => table.columns.findIndex((c) => c.name === nom);
        const [iNum, iLib, iDeb, iFin, iChoc] = ["Numero", "Session", "Debut", "Fin", "MinutesChoc"].map(i);
        return table.rows.map((ligne) => ({
            numero: Number(ligne[iNum]),
            libelle: String(ligne[iLib]),
            debut: ligne[iDeb],
            fin: ligne[iFin],
            testDeStress: Number(ligne[iChoc] ?? 0) > 0,
        }));
    }, [table]);
    return { sessions, isLoading, error };
}
