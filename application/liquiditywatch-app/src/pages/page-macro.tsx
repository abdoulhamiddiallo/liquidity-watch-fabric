import { Globe2 } from "lucide-react";
import { useMemo } from "react";
import { BandeauRecit } from "@/components/signaletique/bandeau-recit";
import { TableauKpi, type TuileKpi } from "@/components/signaletique/tableau-kpi";
import { TitrePage } from "@/components/structure/titre-page";
import { Panneau } from "@/components/veille/panneau";
import { VisuelModele } from "@/components/visuels/visuel-modele";
import { useJetonsCouleur } from "@/hooks/use-jetons-couleur";
import { useLigne } from "@/hooks/use-ligne";
import { useTableModele } from "@/hooks/use-table-modele";
import { niveauRegimeVix } from "@/lib/affichage";
import { estrQuery, kpiMacroQuery, vixQuery } from "@/queries";

const definitionKpi = kpiMacroQuery();

export function PageMacro() {
    const jetons = useJetonsCouleur();
    const kpi = useTableModele(definitionKpi);
    const vix = useMemo(() => vixQuery(jetons), [jetons]);
    const estr = useMemo(() => estrQuery(jetons), [jetons]);

    const { f, t, n } = useLigne(kpi.table);
    const tuiles = useMemo<TuileKpi[]>(() => {
        if (!kpi.table) return [];
        const vixMax = n("VIXMax");
        return [
            { cle: "vix", libelle: "VIX, dernière clôture", valeur: f("VIX") },
            { cle: "regime", libelle: "Régime du VIX", valeur: t("Regime") ?? "n. d.", niveau: niveauRegimeVix(t("Regime")), colorer: true },
            { cle: "vixmax", libelle: "VIX max depuis 2024", valeur: f("VIXMax"), niveau: vixMax !== null && vixMax >= 30 ? "detresse" : "calme", colorer: true, note: `le ${t("DateVIXMax") ?? "n. d."}` },
            { cle: "estr", libelle: "€STR", valeur: f("ESTR"), note: "dernier taux publié" },
            { cle: "veille", libelle: "Variation sur la veille", valeur: f("VariationVeille") },
            { cle: "an", libelle: "Variation sur un an", valeur: f("VariationAn") },
        ];
    }, [kpi.table, f, t, n]);

    return (
        <div className="flex flex-col gap-grid">
            <TitrePage voie="5" titre="Le contexte macro" sousTitre="La peur des marchés actions (VIX) et le prix de l'argent au jour le jour en zone euro (€STR)" />

            <TableauKpi titre="Climat de marché" contexte="Séries quotidiennes depuis janvier 2024" tuiles={tuiles} chargement={kpi.isLoading || !kpi.table} erreur={kpi.error} nombreAttendu={6} />

            <BandeauRecit surtitre="Toile de fond" texte={t("Recit")} chargement={kpi.isLoading} erreur={kpi.error} />

            <div className="grid grid-cols-1 gap-grid xl:grid-cols-12">
                <VisuelModele
                    definition={vix}
                    titre="VIX, clôture quotidienne depuis janvier 2024"
                    sousTitre="Indice de volatilité implicite du S&P 500 (CBOE) · pointillés : 15 calme, 20 tendu, 30 stress"
                    className="h-104 xl:col-span-8"
                />
                <Panneau titre="Pourquoi ce contexte" icone={<Globe2 className="icon-size-300 text-highlight" aria-hidden="true" />} className="xl:col-span-4 xl:row-span-2">
                    <p>La liquidité crypto ne vit pas en vase clos. Deux repères quotidiens disent dans quel climat elle évolue.</p>
                    <p>
                        <span className="font-semibold text-macro-vix">Le VIX</span> mesure la peur sur les actions américaines : sous 15 le marché est calme, au-delà de 30 il est en stress. Quand il s'envole, la liquidité se raréfie souvent sur tous les marchés.
                    </p>
                    <p>
                        <span className="font-semibold text-macro-estr">L'€STR</span> est le taux auquel les banques de la zone euro se prêtent au jour le jour, publié chaque matin par la BCE : le coût de l'argent qui finance les positions.
                    </p>
                    <p>
                        <span className="font-semibold text-foreground">Comment c'est branché.</span> Le notebook NB_02 écrit ces séries dans le lakehouse LH_LiquidityWatch ; l'Eventhouse les lit par raccourci OneLake, sans copie, et le modèle sémantique les importe avec les carnets.
                    </p>
                </Panneau>
                <VisuelModele
                    definition={estr}
                    titre="€STR, taux au jour le jour de la zone euro"
                    sousTitre="Publié par la BCE chaque jour ouvré depuis janvier 2024"
                    className="h-96 xl:col-span-8"
                />
            </div>
        </div>
    );
}
