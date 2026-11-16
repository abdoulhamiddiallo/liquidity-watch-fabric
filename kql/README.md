# ⚡ KQL

| Fichier | Étape du guide | Contenu |
|---|---|---|
| [`KQL_LiquidityWatch.kql`](KQL_LiquidityWatch.kql) | 7 et 8 | La couche KQL de la base `EH_LiquidityWatch`, en 10 blocs |
| [`RTD_LiquidityWatch.kql`](RTD_LiquidityWatch.kql) | 9 | Les 12 requêtes du tableau de bord temps réel `RTD_LiquidityWatch` |

## Les 10 blocs

| Bloc | Ce qu'il construit | Objets |
|---|---|---|
| 1 | La table typée | `lw_book_silver` |
| 2 | La fonction de typage | `LW_ParseBook()` |
| 3 | Historique, branchement, rétention | politique de mise à jour, 7 jours de brut, 30 jours de typé |
| 4 | La vue matérialisée | `lw_minute` |
| 5 | L'horloge et la fenêtre glissante | `LW_Clock()`, `LW_Window()` |
| 6 | Les mesures consolidées par minute | `LW_MinuteMetrics()` |
| 7 | L'indice de stress de liquidité | `LW_StressIndex()` |
| 8 | Stablecoins, santé des flux, anomalies | `LW_Depeg()`, `LW_VenueHealth()`, `LW_SpreadAnomalies()` |
| 9 | Les contrôles | requêtes de vérification |
| 10 | Le contexte macro par raccourci OneLake | `LW_Macro()` |

## Exécuter

Sur GitHub, **Copy raw file**, puis collez tout le fichier dans l'éditeur de requêtes de la base. Sélectionnez **une seule commande** à la fois (de son point `.` à sa dernière ligne), puis **Exécuter**. Le bloc 10 attend les raccourcis de l'étape 8.
