import { BadgeNiveau, TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { niveauLsi, SEUILS_LSI } from "@/lib/affichage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { cn } from "@/lib/utils";

/** Valeur maximale de l'échelle des jauges (au-delà, l'aiguille reste en butée). */
export const ECHELLE_JAUGE = 6;

const ANGLE_DEBUT = -90;
const ANGLE_FIN = 90;

/** Angle (degrés) correspondant à une valeur du LSI sur l'arc de la jauge. */
export function angleJauge(lsi: number): number {
    const borne = Math.max(-1, Math.min(ECHELLE_JAUGE, lsi));
    const t = (borne + 1) / (ECHELLE_JAUGE + 1);
    return ANGLE_DEBUT + t * (ANGLE_FIN - ANGLE_DEBUT);
}

function point(angle: number, rayon: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 60 + rayon * Math.cos(rad), y: 62 + rayon * Math.sin(rad) };
}

function arc(de: number, a: number, rayon: number) {
    const p1 = point(angleJauge(de), rayon);
    const p2 = point(angleJauge(a), rayon);
    const grand = angleJauge(a) - angleJauge(de) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${rayon} ${rayon} 0 ${grand} 1 ${p2.x} ${p2.y}`;
}

const SEGMENTS = [
    { de: -1, a: SEUILS_LSI.tendu, classe: "stroke-niveau-calme" },
    { de: SEUILS_LSI.tendu, a: SEUILS_LSI.stress, classe: "stroke-niveau-tendu" },
    { de: SEUILS_LSI.stress, a: SEUILS_LSI.detresse, classe: "stroke-niveau-stress" },
    { de: SEUILS_LSI.detresse, a: ECHELLE_JAUGE, classe: "stroke-niveau-detresse" },
];

export interface DonneesJauge {
    marche: string;
    actif: string;
    dernier: number | null;
    max: number | null;
    pic: string | null;
    detresse: number | null;
    fourchette: number | null;
}

/**
 * Jauge d'un marché : arc gradué aux couleurs des niveaux, aiguille sur le pic de
 * la session, repère clair sur la dernière minute.
 */
export function JaugeMarche({
    donnees,
    couleur,
    rejeu,
}: {
    donnees: DonneesJauge;
    couleur: string;
    /** Pendant le rejeu : LSI du marché à la minute rejouée. */
    rejeu?: { valeur: number | null; minute: string };
}) {
    const affiche = rejeu ? rejeu.valeur : donnees.max;
    const niveau = niveauLsi(affiche);
    const niveauDernier = niveauLsi(donnees.dernier);
    const repere = donnees.dernier !== null ? point(angleJauge(donnees.dernier), 50) : null;

    return (
        <article
            aria-label={`${donnees.actif} (${donnees.marche})`}
            className={cn(
                "relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 shadow-4 animate-entree",
                niveau === "detresse" && "border-niveau-detresse/60",
            )}
        >
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1", couleur)} />
            <header className="flex items-start justify-between gap-2">
                <div>
                    <p className="font-heading text-500 font-bold leading-500">{donnees.actif}</p>
                    <p className="font-numeric text-200 leading-200 text-muted-foreground">{donnees.marche}</p>
                </div>
                <BadgeNiveau niveau={niveau} />
            </header>

            <svg viewBox="0 -2 120 92" className="mx-auto mt-2 w-full max-w-64" role="img" aria-label={`${rejeu ? `LSI à ${rejeu.minute}` : "LSI maximal"} ${formaterValeur(affiche, FORMATS.lsi)}`}>
                {SEGMENTS.map((s) => (
                    <path key={s.classe} d={arc(s.de, s.a, 50)} className={s.classe} fill="none" strokeWidth="10" strokeLinecap="butt" opacity="0.92" />
                ))}
                {[SEUILS_LSI.tendu, SEUILS_LSI.stress, SEUILS_LSI.detresse].map((seuil) => {
                    const p = point(angleJauge(seuil), 60);
                    return (
                        <text key={seuil} x={p.x} y={p.y + 3} textAnchor="middle" className="fill-muted-foreground font-numeric text-[7px]">
                            {seuil}
                        </text>
                    );
                })}
                {repere && !rejeu && <circle cx={repere.x} cy={repere.y} r="4.2" className="fill-foreground stroke-card" strokeWidth="1.5" />}
                {affiche !== null && (
                    <g style={{ transform: `rotate(${angleJauge(affiche)}deg)`, transformOrigin: "60px 62px", transition: "transform 260ms cubic-bezier(.3,1.4,.5,1)" }}>
                        <line x1="60" y1="62" x2="60" y2="20" className="stroke-foreground" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                )}
                <circle cx="60" cy="62" r="5" className="fill-foreground" />
                <text x="60" y="86" textAnchor="middle" className={cn("font-numeric text-[19px] font-bold", niveau ? `fill-current ${TEXTE_NIVEAU[niveau]}` : "fill-foreground")}>
                    {formaterValeur(affiche, FORMATS.lsi)}
                </text>
            </svg>
            <p className="mt-1 text-center text-100 uppercase leading-100 tracking-widest text-muted-foreground">
                {rejeu ? `Rejeu · LSI à ${rejeu.minute}` : "Pic de la session"}
            </p>

            <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Dernier LSI</dt>
                    <dd className={cn("font-numeric text-400 font-bold leading-400", niveauDernier ? TEXTE_NIVEAU[niveauDernier] : "")}>
                        {formaterValeur(donnees.dernier, FORMATS.lsi)}
                    </dd>
                </div>
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Pic à</dt>
                    <dd className="font-numeric text-400 font-bold leading-400">{donnees.pic ?? "n. d."}</dd>
                </div>
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Détresse</dt>
                    <dd className="font-numeric text-400 font-bold leading-400">
                        {formaterValeur(donnees.detresse, FORMATS.entier)} <span className="text-200 font-medium text-muted-foreground">min</span>
                    </dd>
                </div>
            </dl>
        </article>
    );
}
