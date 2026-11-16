import { Anchor, Gauge, Network, Printer, ShieldCheck, Siren } from "lucide-react";
import { useMemo, useState } from "react";
import { EtatErreur, Squelette } from "@/components/signaletique/etats";
import { FOND_NIVEAU, TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { TitrePage } from "@/components/structure/titre-page";
import { lignesEnObjets } from "@/hooks/use-ligne";
import { useSelection } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { construireMainCourante, ficheIncident, type Famille } from "@/lib/main-courante";
import { construireRejeu } from "@/lib/rejeu";
import { cn } from "@/lib/utils";
import { anomaliesQuery, ecartMinuteQuery, lsiMinuteQuery } from "@/queries";

const FAMILLES: { id: Famille; libelle: string; icone: typeof Gauge }[] = [
    { id: "indice", libelle: "Indice", icone: Gauge },
    { id: "stablecoin", libelle: "Stablecoins", icone: Anchor },
    { id: "plateforme", libelle: "Plateformes", icone: Network },
];

function Case({ libelle, valeur, note, classe }: { libelle: string; valeur: string; note?: string; classe?: string }) {
    return (
        <div className="min-w-0">
            <p className="text-100 uppercase leading-100 tracking-widest text-board-label">{libelle}</p>
            <p className={cn("whitespace-nowrap font-numeric text-600 font-bold leading-600", classe ?? "text-rail-foreground")}>{valeur}</p>
            {note && <p className="text-200 leading-200 text-rail-foreground/70">{note}</p>}
        </div>
    );
}

/**
 * Main courante : le journal horodaté de l'incident, comme le tient une salle de
 * surveillance. L'indice, les ancrages et les plateformes y sont fondus dans une
 * seule chronologie, avec la fiche de l'incident en tête et une version imprimable.
 */
export function PageMainCourante() {
    const { session, sessions } = useSelection();
    const filtres = useMemo(() => ({ session }), [session]);
    const lsi = useTableModele(useMemo(() => lsiMinuteQuery(filtres), [filtres]));
    const ecarts = useTableModele(useMemo(() => ecartMinuteQuery(filtres), [filtres]));
    const anomalies = useTableModele(useMemo(() => anomaliesQuery(filtres), [filtres]));
    const [masquees, setMasquees] = useState<Set<Famille>>(new Set());

    const rejeu = useMemo(
        () => (lsi.table ? construireRejeu(lignesEnObjets(lsi.table).map((l) => ({ heure: l.Heure, marche: l.Marche, lsi: l.LSI }))) : undefined),
        [lsi.table],
    );
    const fiche = useMemo(() => (rejeu ? ficheIncident(rejeu) : null), [rejeu]);
    const evenements = useMemo(() => {
        if (!rejeu) return [];
        const pointsEcart = lignesEnObjets(ecarts.table).map((l) => ({ heure: l.Heure, serie: l.Serie, ecart: l.Ecart }));
        const pointsAnomalie = lignesEnObjets(anomalies.table).map((l) => ({
            heure: l.Heure,
            plateforme: l.Plateforme,
            marche: l.Marche,
            observee: l.Observee,
            habituelle: l.Habituelle,
            score: l.Score,
        }));
        return construireMainCourante(rejeu, pointsEcart, pointsAnomalie);
    }, [rejeu, ecarts.table, anomalies.table]);

    const visibles = evenements.filter((e) => !masquees.has(e.famille));
    const infoSession = sessions.find((s) => s.libelle === session);
    const chargement = lsi.isLoading || !lsi.table || ecarts.isLoading || anomalies.isLoading;
    const basculer = (f: Famille) =>
        setMasquees((avant) => {
            const apres = new Set(avant);
            if (apres.has(f)) apres.delete(f);
            else apres.add(f);
            return apres;
        });

    return (
        <div className="flex flex-col gap-grid">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <TitrePage voie="6" titre="La main courante de l'incident" sousTitre="Chaque événement de la session, horodaté et classé : l'indice, les ancrages et les plateformes dans une seule chronologie" />
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-300 font-semibold leading-300 shadow-2 hover:border-highlight hover:text-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
                >
                    <Printer className="icon-size-200" aria-hidden="true" />
                    Imprimer la main courante
                </button>
            </div>

            {lsi.error ? (
                <EtatErreur titre="Main courante indisponible" erreur={lsi.error} />
            ) : chargement || !rejeu ? (
                <Squelette className="h-56" />
            ) : (
                <section aria-label="Fiche d'incident" className="overflow-hidden rounded-xl border border-board-label/15 bg-board text-rail-foreground shadow-8 animate-entree print:shadow-none">
                    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-3", fiche ? "bg-niveau-detresse/15" : "bg-niveau-calme/10")}>
                        <p className="flex items-center gap-3 font-heading text-500 font-bold leading-500">
                            {fiche ? <Siren className="icon-size-400 text-niveau-detresse" aria-hidden="true" /> : <ShieldCheck className="icon-size-400 text-niveau-calme" aria-hidden="true" />}
                            {fiche ? `Incident de détresse sur ${fiche.marchesTouches.join(", ")}` : "Aucun incident de détresse"}
                        </p>
                        <p className="font-numeric text-200 leading-200 text-board-label">{infoSession?.libelle ?? session}</p>
                    </div>
                    {fiche ? (
                        <div className="grid grid-cols-2 gap-5 p-5 md:grid-cols-3 xl:grid-cols-6">
                            <Case libelle="Début" valeur={fiche.debut} note="premier LSI ≥ 3" classe="text-niveau-detresse" />
                            <Case libelle="Pic" valeur={formaterValeur(fiche.pic, FORMATS.lsi)} note={`${fiche.picMarche} à ${fiche.picMinute}`} classe="text-niveau-detresse" />
                            <Case libelle="Fin de la détresse" valeur={fiche.fin} note="dernier LSI ≥ 3" />
                            <Case libelle="Retour au calme" valeur={fiche.retourCalme ?? "n. d."} note="LSI sous 1" classe="text-niveau-calme" />
                            <Case libelle="Durée en détresse" valeur={`${fiche.minutesDetresse} min`} note="minutes au-delà du seuil" />
                            <Case libelle="Événements" valeur={String(evenements.length)} note="consignés ci-dessous" />
                        </div>
                    ) : (
                        <p className="p-5 text-300 leading-300 text-rail-foreground/85">
                            Le LSI n'a jamais atteint le seuil de détresse (3) pendant cette session. La main courante consigne quand même chaque changement de niveau.
                        </p>
                    )}
                </section>
            )}

            <section aria-label="Chronologie" className="rounded-xl border border-border bg-card p-5 shadow-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-heading text-500 font-bold leading-500">Chronologie</h3>
                        <p className="text-200 leading-200 text-muted-foreground">Heure de Paris · un clic sur une famille la masque ou l'affiche</p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        {FAMILLES.map((f) => {
                            const actif = !masquees.has(f.id);
                            const Icone = f.icone;
                            const nombre = evenements.filter((e) => e.famille === f.id).length;
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    aria-pressed={actif}
                                    onClick={() => basculer(f.id)}
                                    className={cn(
                                        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-200 font-semibold leading-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        actif ? "border-highlight bg-highlight text-highlight-foreground" : "border-border bg-card text-muted-foreground",
                                    )}
                                >
                                    <Icone className="icon-size-200" aria-hidden="true" />
                                    {f.libelle}
                                    <span className="font-numeric">{nombre}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {chargement ? (
                    <Squelette className="mt-4 h-96" />
                ) : visibles.length === 0 ? (
                    <p className="mt-4 text-300 leading-300 text-muted-foreground">Aucun événement pour les familles choisies.</p>
                ) : (
                    <ol className="relative mt-5 ml-2 border-l-2 border-border">
                        {visibles.map((e, i) => {
                            const famille = FAMILLES.find((f) => f.id === e.famille)!;
                            const Icone = famille.icone;
                            return (
                                <li key={`${e.tri}-${e.titre}`} className="relative grid grid-cols-[4.5rem_1fr] gap-x-4 pb-4 pl-6 last:pb-0 animate-entree" style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}>
                                    <span aria-hidden="true" className={cn("absolute -left-[9px] top-1 size-4 rounded-full border-2 border-card", FOND_NIVEAU[e.niveau], e.niveau === "detresse" && "ring-4 ring-niveau-detresse/25")} />
                                    <span className="font-numeric text-400 font-bold leading-400">{e.heure}</span>
                                    <div className="min-w-0">
                                        <p className="flex flex-wrap items-center gap-2 text-300 font-semibold leading-300">
                                            <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 text-100 font-semibold uppercase leading-200 tracking-wider text-muted-foreground">
                                                <Icone className="icon-size-100" aria-hidden="true" />
                                                {famille.libelle}
                                            </span>
                                            <span className={TEXTE_NIVEAU[e.niveau]}>{e.titre}</span>
                                        </p>
                                        <p className="text-200 leading-200 text-muted-foreground">{e.detail}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </section>
        </div>
    );
}
