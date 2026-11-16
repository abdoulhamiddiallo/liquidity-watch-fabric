import { Activity, Zap } from "lucide-react";
import { useMemo } from "react";
import { TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { Squelette } from "@/components/signaletique/etats";
import type { SessionCapture } from "@/hooks/selection.context";
import { useSelection } from "@/hooks/selection.context";
import { useLigne } from "@/hooks/use-ligne";
import { useTableModele } from "@/hooks/use-table-modele";
import { niveauAncrage, niveauLsi } from "@/lib/affichage";
import { formaterHeure, formaterJour } from "@/lib/formatage";
import { cn } from "@/lib/utils";
import { kpiVeilleQuery } from "@/queries";

/** Une session résumée en quatre chiffres ; un clic la sélectionne pour toute la salle. */
function CarteSession({ session, active, onChoisir }: { session: SessionCapture; active: boolean; onChoisir: () => void }) {
    const kpi = useTableModele(useMemo(() => kpiVeilleQuery({ session: session.libelle }), [session.libelle]));
    const { f, t, n } = useLigne(kpi.table);
    const Icone = session.testDeStress ? Zap : Activity;
    const niveauPic = niveauLsi(n("PicLSI"));
    const niveauUsdt = niveauAncrage(n("PireUSDT"));

    return (
        <button
            type="button"
            onClick={onChoisir}
            aria-pressed={active}
            className={cn(
                "flex flex-col rounded-xl border bg-card p-4 text-left shadow-4 transition-all hover:-translate-y-0.5 hover:border-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-highlight ring-1 ring-highlight" : "border-border",
            )}
        >
            <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-heading text-400 font-bold leading-400">
                    <Icone className="icon-size-300 text-highlight" aria-hidden="true" />
                    {session.testDeStress ? "Test de stress" : "Marché réel"}
                </span>
                <span className="font-numeric text-200 leading-200 text-muted-foreground">
                    {formaterJour(session.debut)} {formaterHeure(session.debut)} à {formaterHeure(session.fin)}
                </span>
            </span>
            {kpi.isLoading || !kpi.table ? (
                <Squelette className="mt-3 h-24" />
            ) : (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                    <div>
                        <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Pic de stress</dt>
                        <dd className={cn("whitespace-nowrap font-numeric text-500 font-bold leading-500 2xl:text-600 2xl:leading-600", niveauPic ? TEXTE_NIVEAU[niveauPic] : "")}>{f("PicLSI")}</dd>
                        <dd className="text-200 leading-200 text-muted-foreground">
                            {t("MarcheTendu") ?? ""} à {t("HeurePic") ?? "n. d."}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">En détresse</dt>
                        <dd className={cn("whitespace-nowrap font-numeric text-500 font-bold leading-500 2xl:text-600 2xl:leading-600", (n("MinutesDetresse") ?? 0) > 0 ? "text-niveau-detresse" : "text-niveau-calme")}>
                            {f("MinutesDetresse")}
                        </dd>
                        <dd className="text-200 leading-200 text-muted-foreground">minutes sur {f("MinutesObservees")}</dd>
                    </div>
                    <div>
                        <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Sous tension</dt>
                        <dd className="whitespace-nowrap font-numeric text-500 font-bold leading-500 2xl:text-600 2xl:leading-600">{f("PartTension")}</dd>
                        <dd className="text-200 leading-200 text-muted-foreground">du temps</dd>
                    </div>
                    <div>
                        <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Pire USDT</dt>
                        <dd className={cn("whitespace-nowrap font-numeric text-500 font-bold leading-500 2xl:text-600 2xl:leading-600", niveauUsdt ? TEXTE_NIVEAU[niveauUsdt] : "")}>{f("PireUSDT")}</dd>
                        <dd className="text-200 leading-200 text-muted-foreground">face au dollar</dd>
                    </div>
                </dl>
            )}
            <span className={cn("mt-3 text-200 font-semibold leading-200", active ? "text-highlight" : "text-muted-foreground")}>
                {active ? "Session affichée dans la salle" : "Cliquer pour afficher cette session"}
            </span>
        </button>
    );
}

/**
 * Duel des sessions : le marché réel face au test de stress, côte à côte,
 * pour juger d'un regard si l'indice distingue bien une crise d'un jour ordinaire.
 */
export function DuelSessions() {
    const { sessions, session, choisirSession } = useSelection();
    if (sessions.length < 2) return null;
    return (
        <section aria-label="Les sessions face à face" className="flex flex-col gap-3">
            <div>
                <h3 className="font-heading text-500 font-bold leading-500">Les sessions face à face</h3>
                <p className="text-200 leading-200 text-muted-foreground">Le même indice sur un jour de marché réel et sur la crise simulée : l'écart entre les deux mesure sa capacité à donner l'alerte</p>
            </div>
            <div className="grid grid-cols-1 gap-grid xl:grid-cols-2">
                {sessions.map((s) => (
                    <CarteSession key={s.numero} session={s} active={s.libelle === session} onChoisir={() => choisirSession(s.libelle)} />
                ))}
            </div>
        </section>
    );
}
