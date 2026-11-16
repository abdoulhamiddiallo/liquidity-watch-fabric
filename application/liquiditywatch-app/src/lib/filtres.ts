/**
 * Filtres partagés par toute la salle de veille : la session captée et, sur les
 * sections qui le proposent, le marché observé.
 *
 * Les fichiers .dax portent des jetons commentés, inertes tant qu'aucun filtre n'est actif :
 *   - `/*FILTRES,*\/` : arguments de filtre de SUMMARIZECOLUMNS (suivis d'une virgule) ;
 *   - `/*,FILTRES*\/` : arguments de filtre finaux de CALCULATETABLE (précédés d'une virgule).
 * Chaque filtre actif devient un TREATAS sur la colonne correspondante du modèle.
 */

export const JETON_FILTRES_ARGUMENT = "/*FILTRES,*/";
export const JETON_FILTRES_FINAL = "/*,FILTRES*/";

/** Sélection courante de la salle de veille. */
export interface Filtres {
    session?: string | null;
    marche?: string | null;
}

/** Échappe une chaîne pour un littéral DAX entre guillemets doubles. */
export function echapperChaineDax(valeur: string): string {
    return valeur.replace(/"/g, '""');
}

/** Liste les expressions TREATAS correspondant aux filtres actifs. */
export function expressionsFiltres(filtres: Filtres = {}): string[] {
    const expressions: string[] = [];
    const session = filtres.session?.trim();
    const marche = filtres.marche?.trim();
    if (session) expressions.push(`TREATAS({"${echapperChaineDax(session)}"}, 'Temps'[Session])`);
    if (marche) expressions.push(`TREATAS({"${echapperChaineDax(marche)}"}, 'Marché'[Marché])`);
    return expressions;
}

/** Indique si une requête DAX porte au moins un jeton de filtre. */
export function contientJetonFiltres(dax: string): boolean {
    return dax.includes(JETON_FILTRES_ARGUMENT) || dax.includes(JETON_FILTRES_FINAL);
}

/**
 * Applique les filtres actifs à une requête DAX. Sans filtre, la requête est rendue
 * telle quelle ; avec un filtre, une requête sans jeton est une erreur de conception.
 */
export function appliquerFiltres(dax: string, filtres: Filtres = {}): string {
    const expressions = expressionsFiltres(filtres);
    if (expressions.length === 0) return dax;
    if (!contientJetonFiltres(dax)) {
        throw new Error("La requête DAX ne contient aucun jeton de filtre.");
    }
    const liste = expressions.join(", ");
    return dax
        .split(JETON_FILTRES_ARGUMENT).join(`${liste},`)
        .split(JETON_FILTRES_FINAL).join(`, ${liste}`);
}
