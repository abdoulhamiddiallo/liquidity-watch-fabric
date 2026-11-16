import { BellOff, BellRing, CheckCircle2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { BandeauRecit } from "@/components/signaletique/bandeau-recit";
import { EtatErreur, Squelette } from "@/components/signaletique/etats";
import { TitrePage } from "@/components/structure/titre-page";
import { lignesEnObjets } from "@/hooks/use-ligne";
import { useSelection } from "@/hooks/selection.context";
import { useTableModele } from "@/hooks/use-table-modele";
import { decouperParSession, evaluerSeuil, reglageConseille, SEUIL_ACTUEL, type ResultatSeuil, type SerieSession } from "@/lib/etalonnage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { cn } from "@/lib/utils";
import { lsiMinuteQuery } from "@/queries";

const CHAUFFE_ACTUELLE = 0;
const SEUIL_MAX = 7;
const definitionLsi = lsiMinuteQuery({});

const nombre = (x: number | null) => formaterValeur(x, FORMATS.lsi);

/** Courbe : minutes-marché au-dessus de chaque seuil, de 0 à 7 par pas de 0,1. */
function Courbes({ calme, crise, seuil, chauffe }: { calme: SerieSession; crise: SerieSession; seuil: number; chauffe: number }) {
    const pas = Array.from({ length: SEUIL_MAX * 10 + 1 }, (_, i) => i / 10);
    const c = pas.map((s) => evaluerSeuil(calme, s, chauffe).minutes);
    const k = pas.map((s) => evaluerSeuil(crise, s, chauffe).minutes);
    const haut = Math.max(1, ...c, ...k);
    const L = 600;
    const H = 220;
    const x = (s: number) => 40 + (s / SEUIL_MAX) * (L - 56);
    const y = (m: number) => 12 + (1 - m / haut) * (H - 40);
    const trace = (v: number[]) => v.map((m, i) => `${i ? "L" : "M"} ${x(pas[i]).toFixed(1)} ${y(m).toFixed(1)}`).join(" ");
    const separation = pas.filter((_, i) => c[i] === 0 && k[i] > 0);
    return (
        <svg viewBox={`0 0 ${L} ${H}`} className="h-64 w-full" role="img" aria-label="Minutes au-dessus du seuil selon le seuil choisi, pour les deux sessions">
            {separation.length > 0 && (
                <rect x={x(separation[0])} y="8" width={x(separation[separation.length - 1]) - x(separation[0])} height={H - 36} className="fill-niveau-calme/12" />
            )}
            {separation.length > 0 && (
                <text x={(x(separation[0]) + x(separation[separation.length - 1])) / 2} y="22" textAnchor="middle" className="fill-niveau-calme text-[11px] font-semibold">
                    zone qui sépare la crise du bruit
                </text>
            )}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
                <g key={s}>
                    <line x1={x(s)} x2={x(s)} y1="8" y2={H - 28} className="stroke-border" strokeWidth="1" />
                    <text x={x(s)} y={H - 10} textAnchor="middle" className="fill-muted-foreground font-numeric text-[11px]">
                        {s}
                    </text>
                </g>
            ))}
            <text x="36" y={y(haut) + 4} textAnchor="end" className="fill-muted-foreground font-numeric text-[11px]">
                {haut}
            </text>
            <text x="36" y={y(0) + 4} textAnchor="end" className="fill-muted-foreground font-numeric text-[11px]">
                0
            </text>
            <path d={trace(c)} fill="none" className="stroke-marche-btc" strokeWidth="2.5" strokeDasharray="6 4" />
            <path d={trace(k)} fill="none" className="stroke-niveau-detresse" strokeWidth="2.5" />
            <line x1={x(seuil)} x2={x(seuil)} y1="8" y2={H - 28} className="stroke-foreground" strokeWidth="2" />
            <circle cx={x(seuil)} cy={y(evaluerSeuil(crise, seuil, chauffe).minutes)} r="5" className="fill-niveau-detresse stroke-card" strokeWidth="2" />
            <circle cx={x(seuil)} cy={y(evaluerSeuil(calme, seuil, chauffe).minutes)} r="5" className="fill-marche-btc stroke-card" strokeWidth="2" />
        </svg>
    );
}

function CarteVerdict({ titre, attendu, r }: { titre: string; attendu: "silence" | "alerte"; r: ResultatSeuil }) {
    const reussi = attendu === "silence" ? r.alertes === 0 : r.alertes > 0;
    const Icone = attendu === "silence" ? (r.alertes === 0 ? BellOff : BellRing) : r.alertes > 0 ? BellRing : BellOff;
    return (
        <article className={cn("rounded-xl border bg-card p-5 shadow-4", reussi ? "border-niveau-calme/60" : "border-niveau-detresse/70")}>
            <header className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-heading text-500 font-bold leading-500">
                    <Icone className={cn("icon-size-400", reussi ? "text-niveau-calme" : "text-niveau-detresse")} aria-hidden="true" />
                    {titre}
                </p>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-200 font-semibold leading-200", reussi ? "bg-niveau-calme/15 text-niveau-calme" : "bg-niveau-detresse/15 text-niveau-detresse")}>
                    {reussi ? <CheckCircle2 className="icon-size-100" aria-hidden="true" /> : <XCircle className="icon-size-100" aria-hidden="true" />}
                    {attendu === "silence" ? (reussi ? "Silence tenu" : "Fausses alertes") : reussi ? "Crise captée" : "Crise manquée"}
                </span>
            </header>
            <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Alertes</dt>
                    <dd className={cn("font-numeric text-hero-800 font-bold leading-hero-800", r.alertes > 0 ? (attendu === "silence" ? "text-niveau-detresse" : "text-niveau-calme") : "")}>{r.alertes}</dd>
                </div>
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Minutes en alerte</dt>
                    <dd className="font-numeric text-hero-800 font-bold leading-hero-800">{r.minutes}</dd>
                </div>
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Première</dt>
                    <dd className="font-numeric text-hero-800 font-bold leading-hero-800">{r.premiere ?? "aucune"}</dd>
                </div>
            </dl>
            <p className="mt-3 text-200 leading-200 text-muted-foreground">
                LSI le plus haut pris en compte : <span className="font-numeric font-semibold text-foreground">{nombre(r.max)}</span>
                {r.marches.length > 0 && <> · déclenchée par {r.marches.join(", ")}</>}
            </p>
        </article>
    );
}

/**
 * Banc d'étalonnage : on rejoue les deux sessions avec un autre seuil de détresse et
 * une période de chauffe, pour trouver le réglage qui sonne pendant la crise et se
 * tait un jour de marché ordinaire.
 */
export function PageEtalonnage() {
    const { sessions } = useSelection();
    const lsi = useTableModele(definitionLsi);
    const [seuil, setSeuil] = useState(SEUIL_ACTUEL);
    const [chauffe, setChauffe] = useState(CHAUFFE_ACTUELLE);

    const series = useMemo(() => {
        if (!lsi.table) return null;
        const points = lignesEnObjets(lsi.table).map((l) => ({ heure: l.Heure, marche: l.Marche, lsi: l.LSI }));
        const reel = sessions.find((s) => !s.testDeStress);
        const test = sessions.find((s) => s.testDeStress);
        if (!reel || !test) return null;
        const [calme, crise] = decouperParSession(points, [
            { cle: reel.libelle, debut: reel.debut, fin: reel.fin },
            { cle: test.libelle, debut: test.debut, fin: test.fin },
        ]);
        return { calme, crise };
    }, [lsi.table, sessions]);

    if (lsi.error) return <EtatErreur titre="Étalonnage indisponible" erreur={lsi.error} />;

    const conseil = series ? reglageConseille(series.calme, series.crise) : null;
    const rCalme = series ? evaluerSeuil(series.calme, seuil, chauffe) : null;
    const rCrise = series ? evaluerSeuil(series.crise, seuil, chauffe) : null;
    const actuelCalme = series ? evaluerSeuil(series.calme, SEUIL_ACTUEL, CHAUFFE_ACTUELLE) : null;

    const verdict =
        series && rCalme && rCrise && actuelCalme && conseil
            ? `Réglage actuel (seuil ${SEUIL_ACTUEL}, sans chauffe) : ${actuelCalme.alertes} fausse${actuelCalme.alertes > 1 ? "s" : ""} alerte${actuelCalme.alertes > 1 ? "s" : ""} sur le marché réel` +
              (conseil.chauffe > 0 ? `, toutes dans les ${conseil.chauffe} premières minutes de la séance. ` : ". ") +
              `Réglage conseillé : seuil ${conseil.seuil.toLocaleString("fr-FR")}${conseil.chauffe ? ` avec ${conseil.chauffe} minutes de chauffe` : ""}. Le marché réel se tait et la crise reste captée.`
            : undefined;

    return (
        <div className="flex flex-col gap-grid">
            <TitrePage voie="7" titre="Le banc d'étalonnage de l'alerte" sousTitre="Rejouez les deux sessions avec un autre réglage : l'alerte doit sonner pendant la crise et se taire un jour de marché ordinaire" />

            {!series || !rCalme || !rCrise ? (
                <Squelette className="h-96" />
            ) : (
                <>
                    <BandeauRecit surtitre="Verdict de l'étalonnage" texte={verdict ?? null} chargement={false} />

                    <section aria-label="Réglages" className="grid grid-cols-1 gap-grid rounded-xl border border-board-label/15 bg-board p-5 text-rail-foreground shadow-8 lg:grid-cols-[1fr_1fr_auto]">
                        <label className="flex flex-col gap-2">
                            <span className="text-100 uppercase leading-100 tracking-widest text-board-label">Seuil de détresse (LSI)</span>
                            <span className="font-numeric text-hero-900 font-bold leading-hero-900 text-board-foreground">{nombre(seuil)}</span>
                            <input type="range" min={1} max={SEUIL_MAX} step={0.1} value={seuil} onChange={(e) => setSeuil(Number(e.target.value))} className="accent-highlight" />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-100 uppercase leading-100 tracking-widest text-board-label">Période de chauffe ignorée</span>
                            <span className="font-numeric text-hero-900 font-bold leading-hero-900 text-board-foreground">
                                {chauffe} <span className="text-400">min</span>
                            </span>
                            <input type="range" min={0} max={10} step={1} value={chauffe} onChange={(e) => setChauffe(Number(e.target.value))} className="accent-highlight" />
                        </label>
                        <div className="flex flex-col justify-end gap-2">
                            {conseil && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSeuil(conseil.seuil);
                                        setChauffe(conseil.chauffe);
                                    }}
                                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-highlight px-4 text-300 font-semibold leading-300 text-highlight-foreground shadow-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <Sparkles className="icon-size-200" aria-hidden="true" />
                                    Réglage conseillé
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setSeuil(SEUIL_ACTUEL);
                                    setChauffe(CHAUFFE_ACTUELLE);
                                }}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-board-label/30 px-4 text-300 font-semibold leading-300 hover:border-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <RotateCcw className="icon-size-200" aria-hidden="true" />
                                Réglage actuel
                            </button>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-grid xl:grid-cols-2">
                        <CarteVerdict titre="Marché réel" attendu="silence" r={rCalme} />
                        <CarteVerdict titre="Test de stress" attendu="alerte" r={rCrise} />
                    </div>

                    <section aria-label="Courbes d'étalonnage" className="rounded-xl border border-border bg-card p-5 shadow-4">
                        <h3 className="font-heading text-500 font-bold leading-500">Minutes en alerte selon le seuil</h3>
                        <p className="text-200 leading-200 text-muted-foreground">
                            Trait plein : test de stress · pointillés : marché réel · trait vertical : seuil choisi · la bande verte marque les seuils qui sonnent pendant la crise sans jamais sonner sur le marché réel
                        </p>
                        <Courbes calme={series.calme} crise={series.crise} seuil={seuil} chauffe={chauffe} />
                    </section>
                </>
            )}
        </div>
    );
}
