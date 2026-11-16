import { useMemo } from "react";
import { BandeauRecit } from "@/components/signaletique/bandeau-recit";
import { TableauKpi, type TuileKpi } from "@/components/signaletique/tableau-kpi";
import { TitrePage } from "@/components/structure/titre-page";
import { SelecteurMarche } from "@/components/veille/selecteurs";
import { TableauSignal } from "@/components/veille/tableau-signal";
import { VisuelModele } from "@/components/visuels/visuel-modele";
import { useJetonsCouleur } from "@/hooks/use-jetons-couleur";
import { useLigne } from "@/hooks/use-ligne";
import { useSelection } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { anomaliesQuery, fourchetteMinuteQuery, grilleCarnetsQuery, kpiPlateformesQuery, latenceQuery } from "@/queries";

const PUCE_PLATEFORME: Record<string, string> = {
    Binance: "bg-plateforme-binance",
    Kraken: "bg-plateforme-kraken",
    Coinbase: "bg-plateforme-coinbase",
};

export function PagePlateformes() {
    const { session, marche, choisirMarche } = useSelection();
    const jetons = useJetonsCouleur();
    const filtres = useMemo(() => ({ session, marche }), [session, marche]);

    const kpi = useTableModele(useMemo(() => kpiPlateformesQuery(filtres), [filtres]));
    const anomalies = useTableModele(useMemo(() => anomaliesQuery(filtres), [filtres]));
    const latence = useMemo(() => latenceQuery(filtres, jetons), [filtres, jetons]);
    const grille = useMemo(() => grilleCarnetsQuery(filtres, jetons), [filtres, jetons]);
    const fourchette = useMemo(() => fourchetteMinuteQuery(filtres, jetons), [filtres, jetons]);

    const { f, t, n } = useLigne(kpi.table);
    const tuiles = useMemo<TuileKpi[]>(() => {
        if (!kpi.table) return [];
        return [
            { cle: "plateformes", libelle: "Plateformes actives", valeur: f("Plateformes"), note: "Binance, Kraken, Coinbase" },
            { cle: "marches", libelle: "Marchés suivis", valeur: f("Marches") },
            { cle: "carnets", libelle: "Carnets analysés", valeur: f("Carnets") },
            { cle: "rythme", libelle: "Carnets par minute", valeur: f("CarnetsMinute"), note: "une lecture toutes les 5 s" },
            { cle: "latence", libelle: "Latence moyenne", valeur: f("Latence"), note: "depuis France Central" },
            { cle: "anomalies", libelle: "Écartements anormaux", valeur: f("Anomalies"), niveau: (n("Anomalies") ?? 0) > 0 ? "stress" : "calme", colorer: true, note: "fourchette au pas de 30 s" },
        ];
    }, [kpi.table, f, n]);

    return (
        <div className="flex flex-col gap-grid">
            <TitrePage
                voie="3"
                titre="Trois plateformes, trois carnets"
                sousTitre="Binance, Kraken et Coinbase lus en parallèle toutes les 5 secondes : prix, profondeur, latence"
                actions={<SelecteurMarche valeur={marche} onChange={choisirMarche} />}
            />

            <TableauKpi titre="Santé des flux" contexte={marche ?? "Tous les marchés"} tuiles={tuiles} chargement={kpi.isLoading || !kpi.table} erreur={kpi.error} nombreAttendu={6} />

            <BandeauRecit surtitre="Lecture des flux" texte={t("Recit")} chargement={kpi.isLoading} erreur={kpi.error} />

            <div className="grid grid-cols-1 gap-grid xl:grid-cols-12">
                <VisuelModele
                    definition={grille}
                    titre="Fourchette et profondeur, marché par plateforme"
                    sousTitre="Couleur : fourchette moyenne (pb) · étiquette : fourchette puis profondeur à ±5 pb (M$)"
                    className="h-112 xl:col-span-7"
                />
                <VisuelModele
                    definition={latence}
                    titre="Temps de réponse des plateformes"
                    sousTitre="Latence moyenne de lecture d'un carnet, en millisecondes"
                    className="h-112 xl:col-span-5"
                />
                <VisuelModele
                    definition={fourchette}
                    titre="Fourchette minute par minute, plateforme par plateforme"
                    sousTitre="Choisissez un marché en haut de page pour comparer les trois carnets"
                    className="h-96 xl:col-span-7"
                />
                <TableauSignal
                    titre="Écartements de fourchette les plus anormaux"
                    sousTitre="Score : écart robuste à la fourchette habituelle de la plateforme"
                    table={anomalies.table}
                    chargement={anomalies.isLoading}
                    erreur={anomalies.error}
                    className="h-96 xl:col-span-5"
                    colonnes={[
                        { nom: "Heure", titre: "Heure", rendu: (v) => <span className="font-numeric">{typeof v === "string" ? v.slice(11, 19) : formaterValeur(v, undefined)}</span> },
                        {
                            nom: "Plateforme",
                            titre: "Plateforme",
                            rendu: (v) => (
                                <span className="inline-flex items-center gap-2 font-semibold">
                                    <span aria-hidden="true" className={`size-2.5 rounded-full ${PUCE_PLATEFORME[String(v)] ?? "bg-muted-foreground"}`} />
                                    {String(v)}
                                </span>
                            ),
                        },
                        { nom: "Marche", titre: "Marché", rendu: (v) => <span className="font-numeric">{String(v)}</span> },
                        { nom: "Observee", titre: "Observée", alignement: "droite" },
                        { nom: "Habituelle", titre: "Habituelle", alignement: "droite" },
                        { nom: "Score", titre: "Score", alignement: "droite", rendu: (v) => <span className="font-bold text-niveau-detresse">{formaterValeur(v, FORMATS.decimal1)}</span> },
                    ]}
                />
            </div>
        </div>
    );
}
