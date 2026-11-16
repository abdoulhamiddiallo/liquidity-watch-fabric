import { Activity, Layers, Zap } from "lucide-react";
import type { SessionCapture } from "@/hooks/selection.context";
import { formaterHeure, formaterJour } from "@/lib/formatage";
import { cn } from "@/lib/utils";

const PUCE =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-200 font-medium leading-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const ACTIVE = "border-highlight bg-highlight text-highlight-foreground shadow-4";
const INACTIVE = "border-border bg-card text-foreground hover:border-highlight hover:text-highlight";

/** Choix de la session captée : une puce par session, la plus récente en tête. */
export function SelecteurSession({
    sessions,
    valeur,
    onChange,
    chargement,
}: {
    sessions: SessionCapture[];
    valeur: string | null;
    onChange: (session: string) => void;
    chargement: boolean;
}) {
    if (chargement) return <span className="h-9 w-72 animate-pulse rounded-lg bg-accent" aria-hidden="true" />;
    return (
        <div role="radiogroup" aria-label="Session captée" className="flex flex-wrap items-center gap-2">
            {sessions.map((s) => {
                const active = s.libelle === valeur;
                const Icone = s.testDeStress ? Zap : Activity;
                return (
                    <button
                        key={s.numero}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(s.libelle)}
                        title={s.libelle}
                        className={cn(PUCE, active ? ACTIVE : INACTIVE)}
                    >
                        <Icone className="icon-size-200" aria-hidden="true" />
                        <span className="font-numeric">
                            {formaterJour(s.debut)} {formaterHeure(s.debut)} à {formaterHeure(s.fin)}
                        </span>
                        <span className={cn("hidden sm:inline", active ? "opacity-90" : "text-muted-foreground")}>
                            {s.testDeStress ? "test de stress" : "marché réel"}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

const MARCHES = [
    { valeur: null, libelle: "Tous", classe: "" },
    { valeur: "BTC-USD", libelle: "BTC", classe: "bg-marche-btc" },
    { valeur: "ETH-USD", libelle: "ETH", classe: "bg-marche-eth" },
    { valeur: "SOL-USD", libelle: "SOL", classe: "bg-marche-sol" },
];

/** Choix du marché observé (sections Anatomie et Plateformes). */
export function SelecteurMarche({ valeur, onChange }: { valeur: string | null; onChange: (marche: string | null) => void }) {
    return (
        <div role="radiogroup" aria-label="Marché observé" className="flex flex-wrap items-center gap-2">
            {MARCHES.map((m) => {
                const active = m.valeur === valeur;
                return (
                    <button
                        key={m.libelle}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(m.valeur)}
                        className={cn(PUCE, "font-numeric", active ? ACTIVE : INACTIVE)}
                    >
                        {m.classe ? (
                            <span aria-hidden="true" className={cn("size-2.5 rounded-full", m.classe)} />
                        ) : (
                            <Layers className="icon-size-200" aria-hidden="true" />
                        )}
                        {m.libelle}
                    </button>
                );
            })}
        </div>
    );
}
