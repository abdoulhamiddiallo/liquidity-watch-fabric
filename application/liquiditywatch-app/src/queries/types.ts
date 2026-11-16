import type { VisualizationSpec } from "@microsoft/fabric-visuals";
import { appliquerFiltres, type Filtres } from "@/lib/filtres";
import type { ColumnMetadataMap } from "@/lib/to-data-table";

/** Alias de connexion du modèle sémantique SM_LiquidityWatch (fabric.yaml). */
export const CONNEXION = "liquidite";

/** Requête DAX et métadonnées de colonnes (indicateurs, récits, tableaux). */
export interface DefinitionRequete {
    connection: string;
    query: string;
    columnMetadata: ColumnMetadataMap;
}

/** Requête DAX accompagnée de sa spec Vega-Lite. */
export interface DefinitionVisuel extends DefinitionRequete {
    vegaLiteSpec: VisualizationSpec;
}

/** Copie profonde d'une spec JSON importée, pour la personnaliser sans la muter. */
export function copierSpec<T>(spec: T): T {
    return structuredClone(spec);
}

/** Construit une définition de requête filtrée. */
export function requete(dax: string, columnMetadata: ColumnMetadataMap, filtres: Filtres = {}): DefinitionRequete {
    return { connection: CONNEXION, query: appliquerFiltres(dax, filtres), columnMetadata };
}

/** Construit une définition de visuel filtrée ; `personnaliser` reçoit une copie de la spec. */
export function visuel(
    dax: string,
    spec: unknown,
    columnMetadata: ColumnMetadataMap,
    filtres: Filtres = {},
    personnaliser?: (spec: Record<string, unknown>) => void,
): DefinitionVisuel {
    const copie = copierSpec(spec) as Record<string, unknown>;
    personnaliser?.(copie);
    return { ...requete(dax, columnMetadata, filtres), vegaLiteSpec: copie as unknown as VisualizationSpec };
}

/** Échelle de couleur ordinale (domaine et palette) écrite dans un encodage Vega-Lite. */
export function echelle(domaine: string[], palette: string[]) {
    return { domain: domaine, range: palette };
}
