# 📓 Notebooks

| Notebook | Étape du guide | Rôle |
|---|---|---|
| [`NB_02_Macro_Context.ipynb`](NB_02_Macro_Context.ipynb) | 3 | Télécharge le VIX (CBOE) et l'€STR (BCE) depuis janvier 2024, calcule le régime de volatilité et écrit les tables Delta `macro_vix` et `macro_estr` dans `LH_LiquidityWatch`. |
| [`NB_01_Liquidity_Producer.ipynb`](NB_01_Liquidity_Producer.ipynb) | 5 et 11 | Photographie toutes les 5 secondes 12 carnets d'ordres publics (Binance, Kraken, Coinbase), calcule les mesures de liquidité et les envoie à l'Eventstream `ES_LiquidityWatch`. |

## Importer un notebook dans Fabric

1. Sur GitHub, ouvrez le fichier `.ipynb`, puis **Download raw file**.
2. Dans l'espace de travail : **Importer → Notebook → Depuis cet ordinateur**.

## Réglages du producteur

```python
CONNECTION_STRING = "COLLEZ_ICI_LA_CHAINE_DE_CONNEXION_CLE_PRIMAIRE"
DURATION_MIN = 45                      # durée d'exécution, en minutes
TICK_SEC = 5                           # une photo des carnets toutes les 5 secondes
STRESS_TEST = False                    # True à l'étape 11 : rejoue un épisode de stress balisé
STRESS_START_MIN, STRESS_LEN_MIN = 5, 10
```

La chaîne de connexion se copie dans la source `src_orderbooks` de l'Eventstream (protocole Event Hub, clé primaire). C'est un mot de passe : ne la publiez jamais.

Chaque événement porte 17 colonnes : horodatage, plateforme, marché, classe d'actif, meilleurs prix, prix milieu, microprix, fourchette, profondeurs à ±5 et ±20 pb, déséquilibre, couverture, latence et scénario (`LIVE` ou `STRESS_TEST`).
