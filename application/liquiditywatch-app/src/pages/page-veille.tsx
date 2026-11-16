import { useEffect, useMemo } from "react";
import { BandeauRecit } from "@/components/signaletique/bandeau-recit";
import { EtatErreur, Squelette } from "@/components/signaletique/etats";
import { TableauKpi, type TuileKpi } from "@/components/signaletique/tableau-kpi";
import { TitrePage } from "@/components/structure/titre-page";
import { ConsoleRejeu } from "@/components/veille/console-rejeu";
import { JaugeMarche } from "@/components/veille/jauge-marche";
import { RepartitionNiveaux } from "@/components/veille/repartition-niveaux";
import { DuelSessions } from "@/components/veille/duel-sessions";
import { Siren } from "lucide-react";
import { VisuelModele } from "@/components/visuels/visuel-modele";
import { useJetonsCouleur } from "@/hooks/use-jetons-couleur";
import { lignesEnObjets, useLigne } from "@/hooks/use-ligne";
import { useSelection } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { niveauLsi } from "@/lib/affichage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { construireRejeu, valeurA } from "@/lib/rejeu";
import { useRejeu } from "@/hooks/use-rejeu";
import { carteChaleurQuery, etatMarchesQuery, kpiVeilleQuery, lsiMinuteQuery, niveauxQuery } from "@/queries";

const COULEUR_MARCHE: Record<string, string> = { "BTC-USD": "bg-marche-btc", "ETH-USD": "bg-marche-eth", "SOL-USD": "bg-marche-sol" };
const num = (x: unknown) => (typeof x === "number" ? x : null);

export function PageVeille() {
    const { session } = useSelection();
    const jetons = useJetonsCouleur();
    const filtres = useMemo(() => ({ session }), [session]);

    const kpi = useTableModele(useMemo(() => kpiVeilleQuery(filtres), [filtres]));
    const etat = useTableModele(useMemo(() => etatMarchesQuery(filtres), [filtres]));
    const lsi = useMemo(() => lsiMinuteQuery(filtres, jetons), [filtres, jetons]);
    const chaleur = useMemo(() => carteChaleurQuery(filtres, jetons), [filtres, jetons]);
    const niveaux = useTableModele(useMemo(() => niveauxQuery(filtres), [filtres]));
    const lsiBrut = useTableModele(useMemo(() => lsiMinuteQuery(filtres), [filtres]));
    const rejeu = useMemo(
        () => (lsiBrut.table ? construireRejeu(lignesEnObjets(lsiBrut.table).map((l) => ({ heure: l.Heure, marche: l.Marche, lsi: l.LSI }))) : undefined),
        [lsiBrut.table],
    );
    const pilote = useRejeu(rejeu?.minutes.length ?? 0);
    const { basculerLecture } = pilote;

    // Alarme du rejeu : un marché est en détresse à la minute rejouée.
    const alarme = useMemo(() => {
        if (!pilote.actif || !rejeu) return null;
        const enDetresse = rejeu.marches
            .map((m) => ({ marche: m, lsi: valeurA(rejeu, m, pilote.index) }))
            .filter((x) => niveauLsi(x.lsi) === "detresse");
        return enDetresse.length ? { minute: rejeu.minutes[pilote.index], marches: enDetresse } : null;
    }, [pilote.actif, pilote.index, rejeu]);

    // Touche R : lance ou met en pause le rejeu.
    useEffect(() => {
        const surTouche = (e: KeyboardEvent) => {
            const cible = e.target as HTMLElement | null;
            if (e.ctrlKey || e.metaKey || e.altKey || (cible && ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName))) return;
            if (e.key === "r" || e.key === "R") basculerLecture();
        };
        window.addEventListener("keydown", surTouche);
        return () => window.removeEventListener("keydown", surTouche);
    }, [basculerLecture]);

    const { f, t, n } = useLigne(kpi.table);
    const tuiles = useMemo<TuileKpi[]>(() => {
        if (!kpi.table) return [];
        const pic = n("PicLSI");
        const pireUsdt = n("PireUSDT");
        return [
            { cle: "pic", libelle: "Pic de stress", valeur: f("PicLSI"), niveau: niveauLsi(pic), colorer: true, note: `à ${t("HeurePic") ?? "n. d."}` },
            { cle: "marche", libelle: "Marché le plus tendu", valeur: t("MarcheTendu") ?? "n. d.", note: t("NiveauPic") ?? undefined },
            { cle: "detresse", libelle: "Minutes en détresse", valeur: f("MinutesDetresse"), niveau: (n("MinutesDetresse") ?? 0) > 0 ? "detresse" : "calme", colorer: true, note: `sur ${f("MinutesObservees")} minutes observées` },
            { cle: "tension", libelle: "Temps sous tension", valeur: f("PartTension"), note: "LSI au moins égal à 1" },
            { cle: "usdt", libelle: "Pire écart USDT", valeur: f("PireUSDT"), niveau: pireUsdt !== null && Math.abs(pireUsdt) >= 50 ? "detresse" : pireUsdt !== null && Math.abs(pireUsdt) >= 20 ? "tendu" : "calme", colorer: true, note: "face au dollar" },
            { cle: "carnets", libelle: "Carnets analysés", valeur: f("Carnets"), note: "3 plateformes, 12 marchés" },
        ];
    }, [kpi.table, f, t, n]);

    const marches = lignesEnObjets(etat.table);

    return (
        <div className="flex flex-col gap-grid">
            <TitrePage
                voie="1"
                titre="Poste de veille"
                sousTitre="L'indice de stress de liquidité (LSI) de chaque marché, minute par minute"
            />

            <TableauKpi
                titre="Tableau de veille"
                contexte={t("Dernier") ?? undefined}
                tuiles={tuiles}
                chargement={kpi.isLoading || !kpi.table}
                erreur={kpi.error}
                nombreAttendu={6}
            />

            <BandeauRecit surtitre="Lecture de la session" texte={t("Recit")} chargement={kpi.isLoading} erreur={kpi.error} />

            {alarme && (
                <>
                    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 animate-alarme motion-reduce:animate-none" />
                    <div role="alert" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-niveau-detresse bg-board px-5 py-3 text-rail-foreground shadow-28 animate-entree">
                        <Siren className="icon-size-400 animate-pulse text-niveau-detresse" aria-hidden="true" />
                        <span className="font-heading text-300 font-bold uppercase leading-300 tracking-widest text-niveau-detresse">Alerte détresse</span>
                        <span className="font-numeric text-400 font-bold leading-400">{alarme.minute}</span>
                        {alarme.marches.map((x) => (
                            <span key={x.marche} className="font-numeric text-300 leading-300">
                                {x.marche} <span className="font-bold text-niveau-detresse">{formaterValeur(x.lsi, FORMATS.lsi)}</span>
                            </span>
                        ))}
                        <span className="hidden text-200 leading-200 text-board-label lg:inline">Activator envoie l'alerte Teams</span>
                    </div>
                </>
            )}

            <ConsoleRejeu session={rejeu} rejeu={pilote} chargement={lsiBrut.isLoading} erreur={lsiBrut.error} />

            <section aria-label="Jauges des marchés" className="grid grid-cols-1 gap-grid md:grid-cols-3">
                {etat.error ? (
                    <EtatErreur titre="Jauges indisponibles" erreur={etat.error} className="md:col-span-3" />
                ) : etat.isLoading || !etat.table ? (
                    [0, 1, 2].map((i) => <Squelette key={i} className="h-80" />)
                ) : (
                    marches.map((m) => (
                        <JaugeMarche
                            key={String(m.Marche)}
                            couleur={COULEUR_MARCHE[String(m.Marche)] ?? "bg-highlight"}
                            rejeu={
                                pilote.actif && rejeu
                                    ? { valeur: valeurA(rejeu, String(m.Marche), pilote.index), minute: rejeu.minutes[pilote.index] }
                                    : undefined
                            }
                            donnees={{
                                marche: String(m.Marche),
                                actif: String(m.Actif),
                                dernier: num(m.Dernier),
                                max: num(m.Max),
                                pic: typeof m.Pic === "string" ? m.Pic : null,
                                detresse: num(m.Detresse),
                                fourchette: num(m.Fourchette),
                            }}
                        />
                    ))
                )}
            </section>

            <div className="grid grid-cols-1 gap-grid xl:grid-cols-12">
                <VisuelModele
                    definition={lsi}
                    titre="Indice de stress de liquidité, minute par minute"
                    sousTitre="Heure de Paris · bandes : tendu, stress, détresse · cliquez une légende pour isoler un marché"
                    className="h-112 xl:col-span-8"
                    capabilities={{ disableLineChartCrosshairTooltip: false }}
                />
                <RepartitionNiveaux table={niveaux.table} chargement={niveaux.isLoading} erreur={niveaux.error} className="xl:col-span-4" />
                <VisuelModele
                    definition={chaleur}
                    titre="Carte de chaleur du stress"
                    sousTitre="LSI le plus haut de chaque tranche de 5 minutes · vert calme, jaune tendu, orange stress, rouge détresse"
                    className="h-72 xl:col-span-12"
                />
            </div>

            <DuelSessions />
        </div>
    );
}
