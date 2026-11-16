# Liquidity Watch · Salle de veille de la liquidité

Application Microsoft Fabric (Fabric Apps, moteur Rayfin) qui transforme le flux temps réel du projet Liquidity Watch en salle de surveillance : un écran de veille lisible en trois secondes, puis quatre écrans d'analyse pour comprendre d'où vient la tension, sur quelle plateforme, sur quel stablecoin et dans quel contexte macro.

Toutes les données sont lues en direct dans le modèle sémantique **SM_LiquidityWatch** par des requêtes DAX. L'application ne stocke aucune donnée.

## 📺 Les sept écrans

| Écran | Contenu |
|---|---|
| 1 · Veille | Tableau d'affichage (pic de stress, marché le plus tendu, minutes en détresse, temps sous tension, pire écart USDT, carnets analysés), console de rejeu de la session, jauge de stress par marché, LSI minute par minute avec bandes Calme, Tendu, Stress et Détresse, temps passé à chaque niveau, carte de chaleur par tranche de 5 minutes |
| 2 · Anatomie | Apport de chaque composante au LSI (fourchette, profondeur, dislocation, volatilité), ciseau fourchette contre profondeur sur deux axes, les huit minutes les plus tendues |
| 3 · Plateformes | Latence moyenne par plateforme, grille marché × plateforme (fourchette et profondeur), fourchette minute par minute, journal des anomalies |
| 4 · Stablecoins | Écart au dollar de USDT et USDC minute par minute avec seuils à -20 et -50 pb, règle d'ancrage par paire |
| 5 · Macro | VIX avec régimes (15, 20, 30), €STR en escalier, lecture du contexte |
| 6 · Main courante | Fiche de l'incident (début, pic, fin de la détresse, retour au calme, durée) et chronologie horodatée qui fond l'indice, les ancrages et les plateformes, filtrable par famille et imprimable |
| 7 · Étalonnage | Banc d'étalonnage de l'alerte : seuil de détresse et période de chauffe réglables, fausses alertes du marché réel face à la crise captée, courbes des minutes en alerte selon le seuil et réglage conseillé calculé sur les deux sessions |

Deux sélecteurs pilotent toute la salle : la **session** (par défaut la plus récente) et le **marché** (BTC, ETH, SOL ou tous). Chaque visuel, chaque indicateur et chaque récit se recalcule sur la sélection.

Bouton jour / nuit dans l'en-tête : la salle s'ouvre en mode nuit, pensée pour un écran de surveillance, et bascule en mode jour d'un clic.

## ⏯️ Le rejeu de la session

La salle ne se contente pas de montrer le bilan : elle rejoue la crise. Un clic sur « Rejouer la session » fait défiler les minutes une à une (vitesse ×1, ×4 ou ×10) :

- l'horloge de rejeu affiche la minute en cours et le stress le plus haut tous marchés confondus ;
- les aiguilles des trois jauges suivent le LSI de chaque marché en temps réel ;
- la frise de la session, une barre par minute à la couleur de son niveau, porte la tête de lecture ; on la fait glisser pour aller à n'importe quelle minute ;
- le journal des bascules consigne chaque changement de niveau au moment où il se produit (« SOL Calme → Détresse à 18:15 »).

Dès qu'un marché passe en détresse pendant le rejeu, la salle se met en alarme : un liseré rouge pulse autour de l'écran et une alerte indique la minute, le marché et son LSI, comme l'alerte que l'Activator envoie sur Teams.

Le bouton « Bilan » ramène les jauges sur le pic de la session.

## ⚖️ Les sessions face à face

En bas de l'écran de veille, le jour de marché réel et le test de stress sont comparés côte à côte : pic de stress, minutes en détresse, temps sous tension et pire écart de l'USDT. Un clic sur une session l'affiche dans toute la salle.

## 🖥️ Le mur de surveillance

- **Téléscripteur** : sous l'en-tête, un bandeau défile en continu avec les chiffres clés de la session (pic de stress, minutes en détresse, USDT face au dollar, LSI de chaque marché, latence, écartements anormaux, VIX, €STR), chacun à la couleur de son niveau. Il se met en pause au survol.
- **Mode mur** : un clic (ou la touche M) passe l'application en plein écran et fait défiler les sept écrans toutes les 20 secondes, avec un minuteur sous l'en-tête. L'application devient un écran mural de salle de surveillance.
- **Raccourcis clavier** : 1 à 7 pour changer d'écran, M pour le mode mur, R pour lancer ou suspendre le rejeu.
- **Mode nuit tenu** : la salle s'ouvre en mode nuit et garde le thème choisi, même si l'hôte Fabric impose le sien.

## 🎨 Code couleur

Une seule grammaire de couleurs dans toute l'application, définie une fois dans `src/global.css` :

- niveaux du LSI : Calme vert, Tendu ambre, Stress orange, Détresse rouge ;
- une couleur fixe par marché, par plateforme et par paire stablecoin, identique sur tous les écrans ;
- les seuils sont toujours en pointillés et nommés sur le graphique.

Les specs Vega-Lite ne contiennent aucune couleur brute : elles reçoivent les jetons du thème actif, ce qui garde le mode jour et le mode nuit cohérents.

## 🏗️ Architecture

```
Producteur Python (marchés crypto, VIX, €STR)
        │
Eventstream ES_LiquidityWatch
        │
Eventhouse EH_LiquidityWatch (KQL, fonctions LSI)
        │
Modèle sémantique SM_LiquidityWatch (Import, 70+ mesures)
        │  requêtes DAX en direct
Fabric App LiquidityWatch_SalleDeVeille (React, Vega-Lite)
```

## 🧰 Pile technique

Microsoft Fabric (Real-Time Intelligence, Eventhouse, modèle sémantique, Fabric Apps), DAX, KQL, React 19, TypeScript, Vite, Tailwind CSS 4, Vega-Lite, Vitest.

## 📁 Organisation du code

- `src/queries/` : une requête DAX (`.dax`) et une spec Vega-Lite (`.json`) par visuel, rangées par écran ;
- `src/lib/filtres.ts` : injection des filtres session et marché dans chaque requête ;
- `src/lib/jetons-couleur.ts` et `src/lib/jetons-spec.ts` : passage des couleurs du thème vers les visuels ;
- `src/components/` : signalétique (voyants, badges), jauges, tableau d'affichage, panneaux ;
- `src/pages/` : les sept écrans ;
- `fabric.yaml` : connexion `liquidite` vers le modèle SM_LiquidityWatch (espace LiquidityWatch_RTI).

## 🚀 Déploiement

Prérequis : Node.js 20 ou plus, le rôle Contributeur sur l'espace LiquidityWatch_RTI, et dans le portail d'administration les paramètres de tenant « Enable Fabric App Items (preview) » et « Semantic Model Execute Queries REST API » activés.

```
npm install
npx rayfin login
npx rayfin up --workspace-id <ID_DE_VOTRE_ESPACE_DE_TRAVAIL> --item-name LiquidityWatch_SalleDeVeille --yes
```

L'élément **LiquidityWatch_SalleDeVeille** apparaît ensuite dans l'espace de travail et s'ouvre depuis le portail Fabric.

## ✅ Qualité

```
npm test
npm run lint
```

110 tests : formats, seuils de niveau, filtres DAX, rejeu et journal des bascules, main courante de l'incident, étalonnage de l'alerte, raccourcis clavier, répartition par niveau, résolution des couleurs et rendu sans navigateur de chacun des onze visuels.

## 💡 Conclusion

Une salle de veille ne se lit pas, elle se regarde. Liquidity Watch place le signal d'alerte au premier plan, garde la même couleur pour le même sens partout, et réserve l'explication aux écrans suivants : on voit d'abord, on comprend ensuite.

Auteur : Abdoul Hamid Diallo
