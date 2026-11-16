import type { DataTable } from "@microsoft/fabric-visuals-core";
import { FOND_NIVEAU, TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { EtatErreur, Squelette } from "@/components/signaletique/etats";
import { LIBELLES_NIVEAU, type Niveau } from "@/lib/affichage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { minutesParNiveau } from "@/lib/repartition";
import { cn } from "@/lib/utils";

const ORDRE: Niveau[] = ["calme", "tendu", "stress", "detresse"];
const SEUIL_TEXTE: Record<Niveau, string> = { calme: "LSI < 1", tendu: "1 à 2", stress: "2 à 3", detresse: "LSI ≥ 3" };

/**
 * Répartition du temps entre les quatre niveaux : une barre pleine largeur
 * découpée en parts, puis une ligne par niveau avec minutes et pourcentage.
 */
export function RepartitionNiveaux({ table, chargement, erreur, className }: { table: DataTable | undefined; chargement: boolean; erreur?: Error; className?: string }) {
    if (erreur) return <EtatErreur titre="Répartition indisponible" erreur={erreur} className={className} />;
    if (chargement || !table) return <Squelette className={cn("h-112", className)} />;

    const minutes = minutesParNiveau(table);
    const total = ORDRE.reduce((s, n) => s + minutes[n], 0) || 1;

    return (
        <article className={cn("flex flex-col rounded-xl border border-border bg-card p-5 shadow-4 animate-entree", className)}>
            <h3 className="font-heading text-500 font-bold leading-500">Temps passé à chaque niveau</h3>
            <p className="text-200 leading-200 text-muted-foreground">Minutes-marché : une minute compte une fois par marché</p>

            <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {ORDRE.map((n) =>
                    minutes[n] > 0 ? <span key={n} className={FOND_NIVEAU[n]} style={{ width: `${(minutes[n] / total) * 100}%` }} /> : null,
                )}
            </div>

            <ul className="mt-5 flex flex-1 flex-col justify-between gap-3">
                {ORDRE.map((n) => {
                    const part = minutes[n] / total;
                    return (
                        <li key={n} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3">
                            <span aria-hidden="true" className={cn("size-3 rounded-full", FOND_NIVEAU[n], minutes[n] === 0 && "opacity-30")} />
                            <div className="min-w-0">
                                <p className="text-300 font-semibold leading-300">{LIBELLES_NIVEAU[n]}</p>
                                <p className="font-numeric text-100 leading-100 text-muted-foreground">{SEUIL_TEXTE[n]}</p>
                            </div>
                            <p className="text-right">
                                <span className={cn("font-numeric text-600 font-bold leading-600", minutes[n] > 0 ? TEXTE_NIVEAU[n] : "text-muted-foreground")}>
                                    {formaterValeur(minutes[n], FORMATS.entier)}
                                </span>
                                <span className="ml-2 inline-block w-12 font-numeric text-200 leading-200 text-muted-foreground">
                                    {formaterValeur(part, FORMATS.pourcentage)}
                                </span>
                            </p>
                            <div className="col-span-3 col-start-2 mt-1 h-1.5 rounded-full bg-muted" aria-hidden="true">
                                <div className={cn("h-full rounded-full", FOND_NIVEAU[n])} style={{ width: `${Math.max(part * 100, minutes[n] > 0 ? 1.5 : 0)}%` }} />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}
