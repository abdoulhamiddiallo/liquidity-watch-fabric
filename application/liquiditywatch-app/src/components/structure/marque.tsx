/**
 * Emblème Liquidity Watch : un radar de veille dont les anneaux balaient un carnet
 * d'ordres. Les barres de profondeur (achat à gauche, vente à droite) encadrent
 * le prix médian ; le faisceau dit la surveillance en continu.
 */
export function Embleme({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="lwFond" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#0f1d3a" />
                    <stop offset="1" stopColor="#050913" />
                </linearGradient>
                <radialGradient id="lwFaisceau" cx="32" cy="34" r="26" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
                </radialGradient>
                <clipPath id="lwTuile">
                    <rect width="64" height="64" rx="14" />
                </clipPath>
            </defs>
            <g clipPath="url(#lwTuile)">
                <rect width="64" height="64" rx="14" fill="url(#lwFond)" />
                <g fill="none" stroke="#2dd4bf" strokeOpacity="0.28" strokeWidth="1.2">
                    <circle cx="32" cy="34" r="8" />
                    <circle cx="32" cy="34" r="16" />
                    <circle cx="32" cy="34" r="24" />
                </g>
                <path d="M32 34 L32 10 A24 24 0 0 1 53 23 Z" fill="url(#lwFaisceau)" />
                <g>
                    <rect x="9" y="40" width="4" height="12" rx="1" fill="#34c38f" />
                    <rect x="15" y="36" width="4" height="16" rx="1" fill="#34c38f" opacity="0.85" />
                    <rect x="21" y="31" width="4" height="21" rx="1" fill="#34c38f" opacity="0.7" />
                    <rect x="39" y="31" width="4" height="21" rx="1" fill="#ef5350" opacity="0.7" />
                    <rect x="45" y="36" width="4" height="16" rx="1" fill="#ef5350" opacity="0.85" />
                    <rect x="51" y="40" width="4" height="12" rx="1" fill="#ef5350" />
                </g>
                <line x1="32" y1="18" x2="32" y2="54" stroke="#f5c451" strokeWidth="2" strokeDasharray="2 2.5" />
                <circle cx="32" cy="34" r="3.4" fill="#f5c451" />
                <circle cx="32" cy="34" r="6.5" fill="#f5c451" opacity="0.22" />
            </g>
        </svg>
    );
}

/** Logotype : emblème et nom de la salle de veille. */
export function Marque() {
    return (
        <div className="flex items-center gap-3">
            <Embleme className="size-11 shrink-0 drop-shadow-md" />
            <span className="leading-tight">
                <span className="block font-heading text-500 font-bold leading-500 tracking-tight text-rail-foreground">Liquidity Watch</span>
                <span className="block text-200 uppercase leading-200 tracking-widest text-rail-muted">Salle de veille de la liquidité</span>
            </span>
        </div>
    );
}
