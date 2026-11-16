import { useMemo } from "react";
import type { DataTable } from "@microsoft/fabric-visuals-core";
import { formaterValeur } from "@/lib/formatage";
import { formatColonne, ligneEnObjet } from "@/lib/table-resultat";

/** Première ligne d'un résultat, avec un formateur par colonne (fr-FR). */
export function useLigne(table: DataTable | undefined) {
    return useMemo(() => {
        const v = table ? (ligneEnObjet(table) ?? {}) : {};
        const f = (nom: string) => (table ? formaterValeur(v[nom], formatColonne(table, nom)) : "");
        const t = (nom: string) => (typeof v[nom] === "string" ? (v[nom] as string) : null);
        const n = (nom: string) => (typeof v[nom] === "number" ? (v[nom] as number) : null);
        return { v, f, t, n };
    }, [table]);
}

/** Toutes les lignes d'un résultat, indexées par alias de colonne. */
export function lignesEnObjets(table: DataTable | undefined): Record<string, unknown>[] {
    if (!table) return [];
    return table.rows.map((r) => Object.fromEntries(table.columns.map((c, i) => [c.name, r[i] ?? null])));
}
