import { LIBELLES_NIVEAU, type Niveau } from "@/lib/affichage";
import { cn } from "@/lib/utils";

export const FOND_NIVEAU: Record<Niveau, string> = {
    calme: "bg-niveau-calme",
    tendu: "bg-niveau-tendu",
    stress: "bg-niveau-stress",
    detresse: "bg-niveau-detresse",
};

export const TEXTE_NIVEAU: Record<Niveau, string> = {
    calme: "text-niveau-calme",
    tendu: "text-niveau-tendu",
    stress: "text-niveau-stress",
    detresse: "text-niveau-detresse",
};

/** Voyant lumineux d'un niveau ; il pulse en détresse. */
export function PastilleSignal({ niveau, className }: { niveau: Niveau | undefined; className?: string }) {
    return (
        <span aria-hidden="true" className={cn("relative inline-flex size-2.5 shrink-0", className)}>
            {niveau === "detresse" && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-niveau-detresse opacity-60" />
            )}
            <span className={cn("relative inline-flex size-2.5 rounded-full", niveau ? FOND_NIVEAU[niveau] : "bg-muted-foreground")} />
        </span>
    );
}

/** Badge de niveau : voyant et libellé. */
export function BadgeNiveau({ niveau, libelle, className }: { niveau: Niveau | undefined; libelle?: string; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-current/25 bg-current/5 px-2.5 py-0.5 font-heading text-200 font-semibold uppercase leading-200 tracking-wider",
                niveau ? TEXTE_NIVEAU[niveau] : "text-muted-foreground",
                className,
            )}
        >
            <PastilleSignal niveau={niveau} />
            {libelle ?? (niveau ? LIBELLES_NIVEAU[niveau] : "n. d.")}
        </span>
    );
}
