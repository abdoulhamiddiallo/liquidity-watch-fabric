import type { DataTable } from "@microsoft/fabric-visuals-core";
import type { ReactNode } from "react";
import { EtatErreur, EtatVide, Squelette } from "@/components/signaletique/etats";
import { formaterValeur } from "@/lib/formatage";
import { cn } from "@/lib/utils";

export interface ColonneTableau {
    nom: string;
    titre: string;
    alignement?: "gauche" | "droite";
    /** Rendu personnalisé d'une cellule. */
    rendu?: (valeur: unknown, ligne: Record<string, unknown>) => ReactNode;
    className?: string;
}

/**
 * Tableau de veille : en-tête collant, chiffres en chasse fixe alignés à droite,
 * rangées alternées, rendu de cellule personnalisable (badges, voyants, couleurs).
 */
export function TableauSignal({
    titre,
    sousTitre,
    table,
    colonnes,
    chargement,
    erreur,
    className,
}: {
    titre: string;
    sousTitre?: string;
    table: DataTable | undefined;
    colonnes: ColonneTableau[];
    chargement: boolean;
    erreur?: Error;
    className?: string;
}) {
    const index = new Map(table?.columns.map((c, i) => [c.name, i]) ?? []);
    const lignes =
        table?.rows.map((r) => Object.fromEntries(table.columns.map((c, i) => [c.name, r[i] ?? null]))) ?? [];

    return (
        <section aria-label={titre} className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card shadow-4 animate-entree", className)}>
            <header className="px-4 pb-2 pt-3">
                <h2 className="font-heading text-400 font-semibold leading-400">{titre}</h2>
                {sousTitre && <p className="text-200 leading-200 text-muted-foreground">{sousTitre}</p>}
            </header>
            <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
                {erreur ? (
                    <EtatErreur titre={`${titre} : chargement impossible`} erreur={erreur} />
                ) : chargement || !table ? (
                    <div className="flex flex-col gap-2 p-2">
                        {Array.from({ length: 5 }, (_, i) => (
                            <Squelette key={i} className="h-7" />
                        ))}
                    </div>
                ) : lignes.length === 0 ? (
                    <EtatVide message="Aucune ligne pour cette sélection." />
                ) : (
                    <table className="w-full border-separate border-spacing-0 text-300 leading-300">
                        <thead className="sticky top-0 z-10">
                            <tr>
                                {colonnes.map((c) => (
                                    <th
                                        key={c.nom}
                                        scope="col"
                                        className={cn(
                                            "border-b border-border bg-card px-3 py-2 font-heading text-200 font-semibold uppercase leading-200 tracking-wider text-muted-foreground",
                                            c.alignement === "droite" ? "text-right" : "text-left",
                                        )}
                                    >
                                        {c.titre}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {lignes.map((ligne, i) => (
                                <tr key={i} className="odd:bg-muted/40 hover:bg-hover">
                                    {colonnes.map((c) => {
                                        const format = table.columns[index.get(c.nom) ?? -1]?.format;
                                        const valeur = ligne[c.nom];
                                        return (
                                            <td
                                                key={c.nom}
                                                className={cn(
                                                    "whitespace-nowrap px-3 py-2",
                                                    c.alignement === "droite" ? "text-right font-numeric" : "text-left",
                                                    c.className,
                                                )}
                                            >
                                                {c.rendu ? c.rendu(valeur, ligne) : formaterValeur(valeur, format)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}
