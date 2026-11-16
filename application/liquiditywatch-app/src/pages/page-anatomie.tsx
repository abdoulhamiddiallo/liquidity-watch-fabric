import { Scale } from "lucide-react";
import { useMemo } from "react";
import { BandeauRecit } from "@/components/signaletique/bandeau-recit";
import { BadgeNiveau } from "@/components/signaletique/pastille-signal";
import { TableauKpi, type TuileKpi } from "@/components/signaletique/tableau-kpi";
import { TitrePage } from "@/components/structure/titre-page";
import { Panneau } from "@/components/veille/panneau";
import { SelecteurMarche } from "@/components/veille/selecteurs";
import { TableauSignal } from "@/components/veille/tableau-signal";
import { VisuelModele } from "@/components/visuels/visuel-modele";
import { useJetonsCouleur } from "@/hooks/use-jetons-couleur";
import { useLigne } from "@/hooks/use-ligne";
import { useSelection } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { niveauLsi } from "@/lib/affichage";
import { formaterHeure, formaterValeur, FORMATS } from "@/lib/formatage";
import { apportsQuery, ciseauQuery, kpiAnatomieQuery, minutesTenduesQuery } from "@/queries";

const SIGNAUX = [
    { poids: "35 %", libelle: "Fourchette qui s'élargit", classe: "bg-apport-fourchette" },
    { poids: "35 %", libelle: "Profondeur qui s'évapore", classe: "bg-apport-profondeur" },
    { poids: "15 %", libelle: "Prix qui divergent entre plateformes", classe: "bg-apport-dislocation" },
    { poids: "15 %", libelle: "Volatilité du prix médian", classe: "bg-apport-volatilite" },
];

export function PageAnatomie() {
    const { session, marche, choisirMarche } = useSelection();
    const jetons = useJetonsCouleur();
    const filtres = useMemo(() => ({ session, marche }), [session, marche]);

    const kpi = useTableModele(useMemo(() => kpiAnatomieQuery(filtres), [filtres]));
    const top = useTableModele(useMemo(() => minutesTenduesQuery(filtres), [filtres]));
    const apports = useMemo(() => apportsQuery(filtres, jetons), [filtres, jetons]);
    const ciseau = useMemo(() => ciseauQuery(filtres, jetons), [filtres, jetons]);

    const { f, t, n } = useLigne(kpi.table);
    const tuiles = useMemo<TuileKpi[]>(() => {
        if (!kpi.table) return [];
        return [
            { cle: "fourchette", libelle: "Fourchette max", valeur: f("FourchetteMax") },
            { cle: "profondeur", libelle: "Profondeur min", valeur: f("ProfondeurMin"), note: "à ±5 pb du prix médian" },
            { cle: "chute", libelle: "Profondeur perdue", valeur: f("Chute"), niveau: (n("Chute") ?? 0) >= 0.3 ? "detresse" : (n("Chute") ?? 0) >= 0.15 ? "stress" : "calme", colorer: true },
            { cle: "dislocation", libelle: "Dislocation max", valeur: f("DislocationMax"), note: "écart de prix entre plateformes" },
            { cle: "volatilite", libelle: "Volatilité max", valeur: f("VolatiliteMax"), note: "par minute" },
            { cle: "tension", libelle: "Minutes sous tension", valeur: f("MinutesTension"), note: "LSI au moins égal à 1" },
        ];
    }, [kpi.table, f, n]);

    return (
        <div className="flex flex-col gap-grid">
            <TitrePage
                voie="2"
                titre="Anatomie du stress"
                sousTitre="Ce qui fait monter l'indice : fourchette, profondeur, dislocation et volatilité"
                actions={<SelecteurMarche valeur={marche} onChange={choisirMarche} />}
            />

            <TableauKpi titre="Les quatre signaux" contexte={marche ?? "Tous les cryptoactifs"} tuiles={tuiles} chargement={kpi.isLoading || !kpi.table} erreur={kpi.error} nombreAttendu={6} />

            <BandeauRecit surtitre="Diagnostic" texte={t("Recit")} chargement={kpi.isLoading} erreur={kpi.error} />

            <div className="grid grid-cols-1 gap-grid xl:grid-cols-12">
                <VisuelModele
                    definition={apports}
                    titre="D'où vient le stress : l'apport de chaque signal"
                    sousTitre="Points d'indice, moyenne des marchés sélectionnés · choisissez un marché pour lire sa crise"
                    className="h-104 xl:col-span-8"
                />
                <Panneau titre="Comment se lit l'indice" icone={<Scale className="icon-size-300 text-highlight" aria-hidden="true" />} className="xl:col-span-4">
                    <p>Chaque minute, quatre signaux sont comparés à leur niveau habituel, mesuré par la médiane et l'écart interquartile, deux repères que les extrêmes n'emportent pas.</p>
                    <ul className="flex flex-col gap-2">
                        {SIGNAUX.map((s) => (
                            <li key={s.libelle} className="flex items-center gap-3 text-foreground">
                                <span aria-hidden="true" className={`size-3 shrink-0 rounded-sm ${s.classe}`} />
                                <span className="w-12 font-numeric font-bold">{s.poids}</span>
                                {s.libelle}
                            </li>
                        ))}
                    </ul>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <BadgeNiveau niveau="calme" libelle="Calme < 1" />
                        <BadgeNiveau niveau="tendu" libelle="Tendu 1 à 2" />
                        <BadgeNiveau niveau="stress" libelle="Stress 2 à 3" />
                        <BadgeNiveau niveau="detresse" libelle="Détresse ≥ 3" />
                    </div>
                    <p>Chaque écart est borné entre -3 et 10 : un signal isolé ne suffit pas à déclencher l'alerte.</p>
                </Panneau>
                <VisuelModele
                    definition={ciseau}
                    titre="Le ciseau de la crise"
                    sousTitre="Orange : fourchette moyenne (pb, axe gauche) · bleu : profondeur cumulée à ±5 pb (M$, axe droit)"
                    className="h-96 xl:col-span-6"
                />
                <TableauSignal
                    titre="Les minutes les plus tendues"
                    sousTitre="Classées par LSI décroissant"
                    table={top.table}
                    chargement={top.isLoading}
                    erreur={top.error}
                    className="h-96 xl:col-span-6"
                    colonnes={[
                        { nom: "Heure", titre: "Heure", rendu: (v) => <span className="font-numeric">{formaterHeure(v)}</span> },
                        { nom: "Marche", titre: "Marché", rendu: (v) => <span className="font-numeric font-semibold">{String(v)}</span> },
                        { nom: "LSI", titre: "LSI", alignement: "droite", rendu: (v) => <BadgeNiveau niveau={niveauLsi(v)} libelle={formaterValeur(v, FORMATS.lsi)} /> },
                        { nom: "Fourchette", titre: "Fourchette", alignement: "droite" },
                        { nom: "Dislocation", titre: "Dislocation", alignement: "droite" },
                        { nom: "Volatilite", titre: "Volatilité", alignement: "droite" },
                    ]}
                />
            </div>
        </div>
    );
}
