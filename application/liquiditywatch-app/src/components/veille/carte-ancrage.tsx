import { BadgeNiveau, FOND_NIVEAU, TEXTE_NIVEAU } from "@/components/signaletique/pastille-signal";
import { niveauEtat } from "@/lib/affichage";
import { formaterValeur, FORMATS } from "@/lib/formatage";
import { cn } from "@/lib/utils";

/** Graduation de la règle d'ancrage, de 0 à -100 pb. */
const ECHELLE = 100;

export interface DonneesAncrage {
    serie: string;
    ecartMoyen: number | null;
    pireEcart: number | null;
    plancher: number | null;
    decrochage: number | null;
    etat: string | null;
}

/** Position (0 à 100 %) d'un écart sur la règle d'ancrage. */
export function positionRegle(ecart: number | null): number {
    if (ecart === null || !Number.isFinite(ecart)) return 0;
    return Math.min(100, (Math.min(0, ecart) / -ECHELLE) * 100);
}

/**
 * Carte d'un ancrage : état, pire écart, et règle graduée qui place l'écart moyen
 * et le pire écart face aux seuils de surveillance (-20 pb) et de décrochage (-50 pb).
 */
export function CarteAncrage({ donnees, couleur }: { donnees: DonneesAncrage; couleur: string }) {
    const niveau = niveauEtat(donnees.etat);
    return (
        <article aria-label={donnees.serie} className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-4 animate-entree">
            <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", couleur)} />
            <header className="flex flex-col gap-2 pl-1">
                <BadgeNiveau niveau={niveau} libelle={donnees.etat ?? undefined} className="self-start" />
                <p className="whitespace-nowrap font-heading text-500 font-bold leading-500">{donnees.serie}</p>
            </header>
            <p className={cn("mt-3 pl-1 font-numeric text-hero-800 font-bold leading-hero-800", niveau ? TEXTE_NIVEAU[niveau] : "")}>
                {formaterValeur(donnees.pireEcart, FORMATS.pb)}
            </p>
            <p className="pl-1 text-200 leading-200 text-muted-foreground">pire écart au dollar sur la session</p>

            <div className="relative mt-5 h-3 rounded-full bg-muted" aria-hidden="true">
                <span className="absolute inset-y-0 left-[20%] right-[50%] bg-niveau-tendu/35" />
                <span className="absolute inset-y-0 left-[50%] right-0 rounded-r-full bg-niveau-detresse/35" />
                <span className="absolute -top-1 h-5 w-0.5 rounded bg-foreground/60" style={{ left: `${positionRegle(donnees.ecartMoyen)}%` }} />
                <span
                    className={cn("absolute -top-1.5 size-6 -translate-x-1/2 rounded-full border-2 border-card shadow-4", niveau ? FOND_NIVEAU[niveau] : "bg-foreground")}
                    style={{ left: `${positionRegle(donnees.pireEcart)}%` }}
                />
            </div>
            <div className="relative mt-1.5 h-4 font-numeric text-100 leading-100 text-muted-foreground" aria-hidden="true">
                <span className="absolute left-0">0 pb</span>
                <span className="absolute left-[20%] -translate-x-1/2">-20</span>
                <span className="absolute left-[50%] -translate-x-1/2">-50</span>
                <span className="absolute right-0">-100</span>
            </div>

            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center [&_dd]:whitespace-nowrap">
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Écart moyen</dt>
                    <dd className="font-numeric text-300 font-bold leading-300 xl:text-400 xl:leading-400">{formaterValeur(donnees.ecartMoyen, FORMATS.pb)}</dd>
                </div>
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Plancher</dt>
                    <dd className="font-numeric text-300 font-bold leading-300 xl:text-400 xl:leading-400">{formaterValeur(donnees.plancher, FORMATS.dollar)}</dd>
                </div>
                <div>
                    <dt className="text-100 uppercase leading-100 tracking-wider text-muted-foreground">Décrochage</dt>
                    <dd className="font-numeric text-300 font-bold leading-300 xl:text-400 xl:leading-400">
                        {formaterValeur(donnees.decrochage, FORMATS.entier)} <span className="text-200 font-medium text-muted-foreground">min</span>
                    </dd>
                </div>
            </dl>
        </article>
    );
}
