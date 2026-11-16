import { Anchor, ClipboardList, Globe2, SlidersHorizontal, Microscope, Network, Radar, type LucideIcon } from "lucide-react";

/** Identifiants des sept sections de la salle de veille. */
export type IdSection = "veille" | "anatomie" | "plateformes" | "stablecoins" | "macro" | "incident" | "etalonnage";

export interface Section {
    id: IdSection;
    voie: string;
    libelle: string;
    description: string;
    icone: LucideIcon;
    /** La section propose le filtre de marché. */
    filtreMarche: boolean;
}

export const SECTIONS: Section[] = [
    { id: "veille", voie: "1", libelle: "Poste de veille", description: "Indice de stress, carte de chaleur", icone: Radar, filtreMarche: false },
    { id: "anatomie", voie: "2", libelle: "Anatomie du stress", description: "Les quatre signaux de l'indice", icone: Microscope, filtreMarche: true },
    { id: "plateformes", voie: "3", libelle: "Plateformes", description: "Binance, Kraken, Coinbase", icone: Network, filtreMarche: true },
    { id: "stablecoins", voie: "4", libelle: "Stablecoins", description: "Ancrage de l'USDT et de l'USDC", icone: Anchor, filtreMarche: false },
    { id: "macro", voie: "5", libelle: "Contexte macro", description: "VIX et €STR depuis 2024", icone: Globe2, filtreMarche: false },
    { id: "incident", voie: "6", libelle: "Main courante", description: "Chronologie de l'incident", icone: ClipboardList, filtreMarche: false },
    { id: "etalonnage", voie: "7", libelle: "Étalonnage", description: "Régler l'alerte sur les deux sessions", icone: SlidersHorizontal, filtreMarche: false },
];
