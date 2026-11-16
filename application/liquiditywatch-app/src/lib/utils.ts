import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Fusion des classes Tailwind. Les tailles de texte du thème (text-100, text-hero-800...)
 * sont déclarées comme tailles : sans cela, elles seraient prises pour des couleurs et
 * effacées dès qu'une couleur de texte (text-niveau-detresse...) les suit.
 */
const fusion = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                {
                    text: [
                        "100", "200", "300", "400", "500", "600",
                        "hero-700", "hero-800", "hero-900", "hero-1000",
                        "data-label", "page-title", "page-subtitle", "visual-title", "visual-subtitle",
                    ],
                },
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return fusion(clsx(inputs));
}
