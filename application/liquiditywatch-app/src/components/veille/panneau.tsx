import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Panneau éditorial : titre, contenu explicatif, aux couleurs de la salle de veille. */
export function Panneau({ titre, icone, children, className }: { titre: string; icone?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section aria-label={titre} className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-4 animate-entree", className)}>
            <h2 className="flex items-center gap-2 font-heading text-400 font-semibold leading-400">
                {icone}
                {titre}
            </h2>
            <div className="flex flex-col gap-2.5 text-300 leading-300 text-muted-foreground">{children}</div>
        </section>
    );
}
