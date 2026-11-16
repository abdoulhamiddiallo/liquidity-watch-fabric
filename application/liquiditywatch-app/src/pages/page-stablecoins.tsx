import { Anchor } from "lucide-react";
import { useMemo } from "react";
import { BandeauRecit } from "@/components/signaletique/bandeau-recit";
import { EtatErreur, Squelette } from "@/components/signaletique/etats";
import { TableauKpi, type TuileKpi } from "@/components/signaletique/tableau-kpi";
import { TitrePage } from "@/components/structure/titre-page";
import { CarteAncrage } from "@/components/veille/carte-ancrage";
import { Panneau } from "@/components/veille/panneau";
import { VisuelModele } from "@/components/visuels/visuel-modele";
import { useJetonsCouleur } from "@/hooks/use-jetons-couleur";
import { lignesEnObjets, useLigne } from "@/hooks/use-ligne";
import { useSelection } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { niveauAncrage, niveauEtat } from "@/lib/affichage";
import { ancragesQuery, ecartMinuteQuery, kpiStablesQuery } from "@/queries";

const COULEUR_ANCRAGE: Record<string, string> = {
    "USDT · Kraken": "bg-ancrage-usdt-kraken",
    "USDT · Coinbase": "bg-ancrage-usdt-coinbase",
    "USDC · Kraken": "bg-ancrage-usdc-kraken",
};
const num = (x: unknown) => (typeof x === "number" ? x : null);

export function PageStablecoins() {
    const { session } = useSelection();
    const jetons = useJetonsCouleur();
    const filtres = useMemo(() => ({ session }), [session]);

    const kpi = useTableModele(useMemo(() => kpiStablesQuery(filtres), [filtres]));
    const ancrages = useTableModele(useMemo(() => ancragesQuery(filtres), [filtres]));
    const ecart = useMemo(() => ecartMinuteQuery(filtres, jetons), [filtres, jetons]);

    const { f, t, n } = useLigne(kpi.table);
    const tuiles = useMemo<TuileKpi[]>(() => {
        if (!kpi.table) return [];
        return [
            { cle: "usdt", libelle: "Pire écart USDT", valeur: f("PireUSDT"), niveau: niveauAncrage(n("PireUSDT")), colorer: true },
            { cle: "usdc", libelle: "Pire écart USDC", valeur: f("PireUSDC"), niveau: niveauAncrage(n("PireUSDC")), colorer: true },
            { cle: "habituel", libelle: "Écart habituel USDT", valeur: f("Habituel"), note: "médiane hors choc" },
            { cle: "plancher", libelle: "Plancher USDT", valeur: f("Plancher") },
            { cle: "decrochage", libelle: "Minutes en décrochage", valeur: f("Decrochage"), niveau: (n("Decrochage") ?? 0) > 0 ? "detresse" : "calme", colorer: true, note: "au-delà de 50 pb" },
            { cle: "etat", libelle: "État de l'ancrage", valeur: t("Etat") ?? "n. d.", niveau: niveauEtat(t("Etat")), colorer: true, note: "au pire moment" },
        ];
    }, [kpi.table, f, t, n]);

    const lignes = lignesEnObjets(ancrages.table);

    return (
        <div className="flex flex-col gap-grid">
            <TitrePage voie="4" titre="L'ancrage des stablecoins" sousTitre="USDT et USDC doivent valoir 1 dollar : chaque point de base d'écart est un signal" />

            <TableauKpi titre="Ancrage au dollar" contexte="USDT et USDC" tuiles={tuiles} chargement={kpi.isLoading || !kpi.table} erreur={kpi.error} nombreAttendu={6} />

            <BandeauRecit surtitre="Lecture de l'ancrage" texte={t("Recit")} chargement={kpi.isLoading} erreur={kpi.error} />

            <div className="grid grid-cols-1 gap-grid xl:grid-cols-12">
                <VisuelModele
                    definition={ecart}
                    titre="Écart au dollar, minute par minute"
                    sousTitre="0 = exactement 1 dollar · -50 pb = 0,9950 dollar"
                    className="h-112 xl:col-span-8"
                />
                <Panneau titre="Pourquoi l'USDT cote sous le dollar" icone={<Anchor className="icon-size-300 text-highlight" aria-hidden="true" />} className="xl:col-span-4">
                    <p>Hors choc, l'USDT s'échange environ 10 points de base sous le dollar sur Kraken et Coinbase. Ce n'est pas un stress : c'est la base USDT/USD, le prix que le marché attache à la conversion en vrais dollars.</p>
                    <p className="font-semibold text-foreground">Le signal, c'est la rupture de cette base.</p>
                    <p>
                        <span className="font-semibold text-niveau-tendu">Au-delà de 20 pb</span> l'ancrage passe sous surveillance ;{" "}
                        <span className="font-semibold text-niveau-detresse">au-delà de 50 pb</span> il décroche.
                    </p>
                    <p>Le test de stress fait chuter l'USDT vers -80 pb pendant dix minutes pour vérifier que l'indice, le tableau et l'alerte réagissent. Ses lignes portent la marque STRESS_TEST dans l'Eventhouse.</p>
                </Panneau>
            </div>

            <section aria-label="Bilan de chaque ancrage" className="grid grid-cols-1 gap-grid md:grid-cols-3">
                {ancrages.error ? (
                    <EtatErreur titre="Ancrages indisponibles" erreur={ancrages.error} className="md:col-span-3" />
                ) : ancrages.isLoading || !ancrages.table ? (
                    [0, 1, 2].map((i) => <Squelette key={i} className="h-72" />)
                ) : (
                    lignes.map((a) => (
                        <CarteAncrage
                            key={String(a.Serie)}
                            couleur={COULEUR_ANCRAGE[String(a.Serie)] ?? "bg-highlight"}
                            donnees={{
                                serie: String(a.Serie),
                                ecartMoyen: num(a.EcartMoyen),
                                pireEcart: num(a.PireEcart),
                                plancher: num(a.Plancher),
                                decrochage: num(a.Decrochage),
                                etat: typeof a.Etat === "string" ? a.Etat : null,
                            }}
                        />
                    ))
                )}
            </section>
        </div>
    );
}
