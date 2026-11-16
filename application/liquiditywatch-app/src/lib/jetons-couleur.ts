/**
 * Couleurs sémantiques lues depuis les jetons de global.css et injectées dans les
 * specs Vega-Lite. Aucune couleur brute n'est écrite hors de global.css : les specs
 * reçoivent les valeurs résolues, ce qui suit aussi la bascule clair / sombre.
 */
export interface JetonsCouleur {
    niveaux: { calme: string; tendu: string; stress: string; detresse: string };
    marches: Record<string, string>;
    plateformes: Record<string, string>;
    ancrages: Record<string, string>;
    apports: { fourchette: string; profondeur: string; dislocation: string; volatilite: string };
    macro: { vix: string; estr: string };
    texte: string;
    texteSecondaire: string;
    fond: string;
    marque: string;
}

/** Lecture d'une variable CSS ; renvoie une chaîne vide si elle est absente. */
export type LecteurVariable = (nom: string) => string;

export function lireJetonsCouleur(lire: LecteurVariable): JetonsCouleur {
    const v = (nom: string) => lire(nom).trim();
    return {
        niveaux: {
            calme: v("--color-niveau-calme"),
            tendu: v("--color-niveau-tendu"),
            stress: v("--color-niveau-stress"),
            detresse: v("--color-niveau-detresse"),
        },
        marches: {
            "BTC-USD": v("--color-marche-btc"),
            "ETH-USD": v("--color-marche-eth"),
            "SOL-USD": v("--color-marche-sol"),
        },
        plateformes: {
            Binance: v("--color-plateforme-binance"),
            Kraken: v("--color-plateforme-kraken"),
            Coinbase: v("--color-plateforme-coinbase"),
        },
        ancrages: {
            "USDT · Kraken": v("--color-ancrage-usdt-kraken"),
            "USDT · Coinbase": v("--color-ancrage-usdt-coinbase"),
            "USDC · Kraken": v("--color-ancrage-usdc-kraken"),
        },
        apports: {
            fourchette: v("--color-apport-fourchette"),
            profondeur: v("--color-apport-profondeur"),
            dislocation: v("--color-apport-dislocation"),
            volatilite: v("--color-apport-volatilite"),
        },
        macro: { vix: v("--color-macro-vix"), estr: v("--color-macro-estr") },
        texte: v("--color-foreground"),
        texteSecondaire: v("--color-muted-foreground"),
        fond: v("--color-card"),
        marque: v("--color-brand"),
    };
}

/** Lit les jetons sur un élément du document (par défaut la racine). */
export function lireJetonsDocument(element: Element = document.documentElement): JetonsCouleur {
    const style = getComputedStyle(element);
    return lireJetonsCouleur((nom) => style.getPropertyValue(nom));
}
