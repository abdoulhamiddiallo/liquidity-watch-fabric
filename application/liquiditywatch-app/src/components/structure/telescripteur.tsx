import { useMemo } from "react";
import { TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { lignesEnObjets, useLigne } from "@/hooks/use-ligne";
import { useTableModele } from "@/hooks/use-table-modele";
import { niveauAncrage, niveauLsi, niveauRegimeVix, type Niveau } from "@/lib/affichage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { cn } from "@/lib/utils";
import { etatMarchesQuery, kpiMacroQuery, kpiPlateformesQuery, kpiVeilleQuery } from "@/queries";

export interface DepecheTelescripteur {
    cle: string;
    libelle: string;
    valeur: string;
    complement?: string;
    niveau?: Niveau;
}

/**
 * Téléscripteur de la salle : un bandeau qui défile en continu sous l'en-tête,
 * comme sur un mur de salle de marché, avec les chiffres clés de la session
 * (stress de chaque marché, ancrage, plateformes, contexte macro).
 */
export function Telescripteur({ session }: { session: string }) {
    const filtres = useMemo(() => ({ session }), [session]);
    const veille = useTableModele(useMemo(() => kpiVeilleQuery(filtres), [filtres]));
    const marches = useTableModele(useMemo(() => etatMarchesQuery(filtres), [filtres]));
    const plateformes = useTableModele(useMemo(() => kpiPlateformesQuery(filtres), [filtres]));
    const macro = useTableModele(useMemo(() => kpiMacroQuery(), []));
    const v = useLigne(veille.table);
    const p = useLigne(plateformes.table);
    const m = useLigne(macro.table);

    const depeches = useMemo<DepecheTelescripteur[]>(() => {
        const liste: DepecheTelescripteur[] = [];
        if (veille.table) {
            liste.push({ cle: "pic", libelle: "Pic de stress", valeur: `${v.t("MarcheTendu") ?? ""} ${v.f("PicLSI")}`, complement: `à ${v.t("HeurePic") ?? "n. d."}`, niveau: niveauLsi(v.n("PicLSI")) });
            liste.push({ cle: "detresse", libelle: "Minutes en détresse", valeur: v.f("MinutesDetresse"), complement: `sur ${v.f("MinutesObservees")}`, niveau: (v.n("MinutesDetresse") ?? 0) > 0 ? "detresse" : "calme" });
            liste.push({ cle: "usdt", libelle: "USDT face au dollar", valeur: v.f("PireUSDT"), complement: "au plus bas", niveau: niveauAncrage(v.n("PireUSDT")) });
        }
        for (const ligne of lignesEnObjets(marches.table)) {
            liste.push({
                cle: `m-${String(ligne.Marche)}`,
                libelle: String(ligne.Marche),
                valeur: `LSI ${formaterValeur(ligne.Max, FORMATS.lsi)}`,
                complement: `dernier ${formaterValeur(ligne.Dernier, FORMATS.lsi)}`,
                niveau: niveauLsi(ligne.Max),
            });
        }
        if (plateformes.table) {
            liste.push({ cle: "latence", libelle: "Latence moyenne", valeur: p.f("Latence"), complement: `${p.f("Carnets")} carnets` });
            liste.push({ cle: "anomalies", libelle: "Écartements anormaux", valeur: p.f("Anomalies"), niveau: (p.n("Anomalies") ?? 0) > 0 ? "tendu" : "calme" });
        }
        if (macro.table) {
            liste.push({ cle: "vix", libelle: "VIX", valeur: m.f("VIX"), complement: m.t("Regime") ?? undefined, niveau: niveauRegimeVix(m.t("Regime")) });
            liste.push({ cle: "estr", libelle: "€STR", valeur: m.f("ESTR"), complement: m.f("VariationVeille") ? `${m.f("VariationVeille")} sur la veille` : undefined });
        }
        return liste;
    }, [veille.table, marches.table, plateformes.table, macro.table, v, p, m]);

    if (depeches.length === 0) return <div className="h-8 border-t border-board-label/10 bg-board" aria-hidden="true" />;

    const serie = (doublon: boolean) =>
        depeches.map((d) => (
            <li key={`${doublon ? "b" : "a"}-${d.cle}`} aria-hidden={doublon || undefined} className="flex shrink-0 items-center gap-2 px-5">
                <span aria-hidden="true" className="text-board-label/50">◆</span>
                <span className="uppercase tracking-widest text-board-label">{d.libelle}</span>
                <span className={cn("font-numeric font-bold", d.niveau ? TEXTE_NIVEAU[d.niveau] : "text-rail-foreground")}>{d.valeur}</span>
                {d.complement && <span className="text-rail-foreground/70">{d.complement}</span>}
            </li>
        ));

    return (
        <div className="group relative h-8 overflow-hidden border-t border-board-label/10 bg-board text-200 leading-200" role="marquee" aria-label="Téléscripteur de la session">
            <ul className="flex h-full w-max items-center animate-telescripteur group-hover:[animation-play-state:paused] motion-reduce:animate-none">
                {serie(false)}
                {serie(true)}
            </ul>
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-board to-transparent" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-board to-transparent" />
        </div>
    );
}
