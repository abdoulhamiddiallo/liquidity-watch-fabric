import { ArrowRight, FastForward, Pause, Play, Radio, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { VITESSES_REJEU, type EtatRejeu } from "@/hooks/use-rejeu";
import { PastilleSignal, TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { EtatErreur, Squelette } from "@/components/signaletique/etats";
import { LIBELLES_NIVEAU, niveauLsi, SEUILS_LSI } from "@/lib/affichage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { estAggravation, valeurA, type SessionRejeu } from "@/lib/rejeu";
import { cn } from "@/lib/utils";

const REMPLI_NIVEAU = { calme: "fill-niveau-calme", tendu: "fill-niveau-tendu", stress: "fill-niveau-stress", detresse: "fill-niveau-detresse" } as const;

const POINT_MARCHE: Record<string, string> = { "BTC-USD": "bg-marche-btc", "ETH-USD": "bg-marche-eth", "SOL-USD": "bg-marche-sol" };

/** Hauteur de la frise (unités SVG) et plafond de l'échelle du LSI. */
const H = 64;
const PLAFOND = 6.5;

/**
 * Frise de la session : une barre par minute, à la hauteur et à la couleur du LSI
 * le plus haut tous marchés confondus ; la tête de lecture suit le rejeu.
 */
function Frise({ session, index, onSeek }: { session: SessionRejeu; index: number; onSeek: (i: number) => void }) {
    const n = session.maximum.length;
    const largeur = Math.max(n, 1);
    const y = (v: number) => H - (Math.max(0, Math.min(PLAFOND, v)) / PLAFOND) * (H - 4);
    return (
        <div className="relative">
            <svg viewBox={`0 0 ${largeur} ${H}`} preserveAspectRatio="none" className="h-20 w-full" aria-hidden="true">
                {[SEUILS_LSI.tendu, SEUILS_LSI.stress, SEUILS_LSI.detresse].map((s) => (
                    <line key={s} x1="0" x2={largeur} y1={y(s)} y2={y(s)} className="stroke-board-label/40" strokeWidth="0.6" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                ))}
                {session.maximum.map((v, i) => {
                    const niveau = niveauLsi(v);
                    if (v === null || !niveau) return null;
                    const haut = y(Math.max(v, 0.25));
                    return (
                        <rect
                            key={i}
                            x={i + 0.12}
                            width="0.76"
                            y={haut}
                            height={H - haut}
                            className={cn(REMPLI_NIVEAU[niveau], i > index && "opacity-25")}
                        />
                    );
                })}
                <line x1={index + 0.5} x2={index + 0.5} y1="0" y2={H} className="stroke-board-foreground" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <input
                type="range"
                min={0}
                max={Math.max(n - 1, 0)}
                value={index}
                onChange={(e) => onSeek(Number(e.target.value))}
                aria-label="Minute rejouée"
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
            <div className="mt-1 flex justify-between font-numeric text-100 leading-100 text-board-label">
                <span>{session.minutes[0]}</span>
                <span>{session.minutes[Math.floor(n / 2)]}</span>
                <span>{session.minutes[n - 1]}</span>
            </div>
        </div>
    );
}

/**
 * Console de rejeu : la session repasse minute par minute comme sur un mur de
 * salle de marché. Chaque marché affiche son LSI à la minute rejouée, et le
 * journal consigne chaque bascule de niveau au moment où elle se produit.
 */
export function ConsoleRejeu({
    session,
    rejeu,
    chargement,
    erreur,
}: {
    session: SessionRejeu | undefined;
    rejeu: EtatRejeu;
    chargement: boolean;
    erreur?: Error;
}) {
    const n = session?.minutes.length ?? 0;
    const { index } = rejeu;

    const journal = useMemo(() => (session ? session.bascules.filter((b) => b.index <= index).slice(-7).reverse() : []), [session, index]);

    if (erreur) return <EtatErreur titre="Rejeu indisponible" erreur={erreur} />;
    if (chargement || !session) return <Squelette className="h-72" />;
    if (n === 0) return null;

    const maxCourant = session.maximum[index];
    const niveauCourant = niveauLsi(maxCourant);

    return (
        <section aria-label="Rejeu de la session" className="overflow-hidden rounded-xl border border-board-label/15 bg-board text-rail-foreground shadow-8 animate-entree">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-board-label/10 px-5 py-3">
                <p className="flex items-center gap-2 font-heading text-200 font-semibold uppercase leading-200 tracking-widest text-board-label">
                    <PastilleSignal niveau={niveauCourant} />
                    Rejeu de la session · minute par minute
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={rejeu.basculerLecture}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-highlight px-4 text-300 font-semibold leading-300 text-highlight-foreground shadow-4 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {rejeu.lecture ? <Pause className="icon-size-200" aria-hidden="true" /> : <Play className="icon-size-200" aria-hidden="true" />}
                        {rejeu.lecture ? "Pause" : rejeu.actif ? "Reprendre" : "Rejouer la session"}
                    </button>
                    <button
                        type="button"
                        onClick={rejeu.changerVitesse}
                        title="Vitesse du rejeu"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-board-label/20 px-3 font-numeric text-300 font-semibold leading-300 hover:border-highlight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <FastForward className="icon-size-200" aria-hidden="true" />
                        {VITESSES_REJEU[rejeu.vitesse].libelle}
                    </button>
                    <button
                        type="button"
                        onClick={rejeu.revenirAuDirect}
                        disabled={!rejeu.actif}
                        title="Revenir au bilan de la session"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-board-label/20 px-3 text-300 font-semibold leading-300 hover:border-highlight disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Radio className="icon-size-200" aria-hidden="true" />
                        Bilan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-12">
                <div className="flex flex-col gap-4 xl:col-span-8">
                    <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                        <div>
                            <p className="text-100 uppercase leading-100 tracking-widest text-board-label">Minute rejouée</p>
                            <p className="font-numeric text-hero-900 font-bold leading-hero-900 tracking-wider text-board-foreground" aria-live="polite">
                                {session.minutes[index]}
                            </p>
                        </div>
                        <div>
                            <p className="text-100 uppercase leading-100 tracking-widest text-board-label">Stress le plus haut</p>
                            <p className={cn("font-numeric text-hero-800 font-bold leading-hero-800", niveauCourant ? TEXTE_NIVEAU[niveauCourant] : "")}>
                                {formaterValeur(maxCourant, FORMATS.lsi)}
                                <span className="ml-2 align-middle text-400 font-semibold uppercase tracking-wider">{niveauCourant ? LIBELLES_NIVEAU[niveauCourant] : ""}</span>
                            </p>
                        </div>
                        <ul className="grid min-w-72 flex-1 grid-cols-3 gap-2">
                            {session.marches.map((m) => {
                                const v = valeurA(session, m, index);
                                const niv = niveauLsi(v);
                                return (
                                    <li
                                        key={m}
                                        className={cn(
                                            "rounded-lg border border-board-label/15 px-3 py-2 transition-colors",
                                            niv === "detresse" && "border-niveau-detresse bg-niveau-detresse/15",
                                            niv === "stress" && "border-niveau-stress/70",
                                        )}
                                    >
                                        <p className="flex items-center gap-1.5 font-numeric text-200 font-semibold leading-200 text-rail-foreground/85">
                                            <span aria-hidden="true" className={cn("size-2 rounded-full", POINT_MARCHE[m] ?? "bg-highlight")} />
                                            {m}
                                        </p>
                                        <p className={cn("font-numeric text-600 font-bold leading-600", niv ? TEXTE_NIVEAU[niv] : "")}>{formaterValeur(v, FORMATS.lsi)}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <Frise
                        session={session}
                        index={index}
                        onSeek={rejeu.allerA}
                    />
                </div>

                <div className="xl:col-span-4 xl:border-l xl:border-board-label/10 xl:pl-5">
                    <p className="text-100 uppercase leading-100 tracking-widest text-board-label">Journal des bascules</p>
                    {journal.length === 0 ? (
                        <p className="mt-3 text-300 leading-300 text-board-label">Aucun changement de niveau à cette minute : tous les marchés tiennent leur niveau d'ouverture.</p>
                    ) : (
                        <ol className="mt-2 flex flex-col">
                            {journal.map((b, i) => {
                                const Icone = estAggravation(b) ? TrendingUp : TrendingDown;
                                return (
                                    <li
                                        key={`${b.index}-${b.marche}`}
                                        className={cn("grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-2.5 border-b border-board-label/10 py-2 last:border-0", i === 0 && "animate-entree")}
                                    >
                                        <span className="font-numeric text-300 font-bold leading-300 text-board-label">{b.minute}</span>
                                        <Icone className={cn("icon-size-200 shrink-0", TEXTE_NIVEAU[b.a])} aria-hidden="true" />
                                        <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-300 leading-300">
                                            <span className="font-numeric font-semibold">{b.marche.replace("-USD", "")}</span>
                                            <span className={TEXTE_NIVEAU[b.de]}>{LIBELLES_NIVEAU[b.de]}</span>
                                            <ArrowRight className="icon-size-100 text-board-label" aria-hidden="true" />
                                            <span className={cn("font-semibold", TEXTE_NIVEAU[b.a])}>{LIBELLES_NIVEAU[b.a]}</span>
                                        </span>
                                        <span className={cn("font-numeric text-300 font-bold leading-300", TEXTE_NIVEAU[b.a])}>{formaterValeur(b.lsi, FORMATS.lsi)}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </div>
        </section>
    );
}
