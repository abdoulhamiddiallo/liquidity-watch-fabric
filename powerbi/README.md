# 📊 Power BI

| Élément | Format | Contenu |
|---|---|---|
| [`LiquidityWatch.pbip`](LiquidityWatch.pbip) | projet Power BI | à ouvrir dans Power BI Desktop |
| [`SM_LiquidityWatch.SemanticModel/`](SM_LiquidityWatch.SemanticModel/) | TMDL | 9 tables, relations en étoile, 74 mesures DAX en six dossiers |
| [`RPT_LiquidityWatch.Report/`](RPT_LiquidityWatch.Report/) | PBIR | 5 pages : Synthèse, Anatomie du stress, Plateformes, Stablecoins, Contexte macro |
| [`../docs/RPT_LiquidityWatch.pdf`](../docs/RPT_LiquidityWatch.pdf) | PDF | le rapport exporté |

## Le modèle

| Rôle | Tables | Source KQL |
|---|---|---|
| Dimensions | `Temps`, `Marché`, `Plateforme` | sessions et minutes de `lw_book_silver` |
| Faits | `LSI`, `Carnets`, `Anomalies` | `LW_StressIndex`, `lw_book_silver`, `LW_SpreadAnomalies` |
| Contexte | `VIX`, `Taux €STR` | raccourcis `macro_vix` et `macro_estr` |
| Mesures | `Mesures` | 01 Stress · 02 Liquidité · 03 Plateformes · 04 Stablecoins · 05 Contexte macro · 06 Textes et couleurs |

## Ouvrir et publier

1. Ouvrez `LiquidityWatch.pbip` dans Power BI Desktop.
2. **Transformer les données → Modifier les paramètres** : `Cluster` reçoit l'URI de requête de votre Eventhouse (page de l'Eventhouse, **Copier l'URI**), `Base` reste `EH_LiquidityWatch`.
3. **Actualiser**, connexion avec votre compte organisationnel.
4. **Accueil → Publier** dans votre espace de travail.
