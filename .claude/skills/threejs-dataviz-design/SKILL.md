---
name: threejs-dataviz-design
description: Design d'une data-visualisation 3D TECHNIQUE (défense, radar, trajectoire, télémétrie) avec React Three Fiber. À charger quand on construit/refond une scène 3D data-viz et qu'on veut un rendu "instrument" crédible — PAS un rendu 3D générique "IA". Couvre : anti-look-IA, palette C2/défense, techniques Three.js premium (fat lines glow, hologramme, grille, bloom), lisibilité 3D.
---

# Three.js Data-Viz — Design d'instrument, pas de jouet

Tu conçois une **data-visualisation 3D technique** (ici : couverture radar + trajectoire, style « poste de commandement »). L'objectif n'est pas « joli », c'est **crédible et lisible sous stress** : un opérateur doit croire que c'est un vrai système, et lire l'info en une fraction de seconde. Ce skill complète `frontend-design` (2D/typo) avec ce qui est propre à la 3D data-viz et au domaine défense.

Le test en une phrase (Jayse Hansen / Territory Studio) : **« Ça a l'air super complexe ET super clair, et un opérateur croirait que c'est un vrai système. »** Si c'est « joli mais générique », c'est raté.

---

## 1. Bannir le look IA (défaut = mort)

Un rendu 3D lit comme « généré par IA » quand il tombe dans la médiane statistique. Interdits explicites :

- **Sphère/dôme OPAQUE gris plastique** pour un volume → au contraire : translucide additif + arêtes, on voit à travers.
- **Dégradé violet→bleu / violet→cyan**, orbes flous, glassmorphism.
- **Fond `#000` pur** et texte `#fff` pur → anthracite teinté très sombre + off-white.
- **Tout entassé/centré au même endroit**, labels qui se chevauchent.
- **Glow qui prime sur la substance** (le piège FUI) : le bloom sert la lecture, pas la déco.
- Grille par défaut trop dense/uniforme qui domine la scène.
- Polices display génériques (Inter/Poppins/Space Grotesk/Geist).
- Mouvement décoratif : l'animation **signale un changement d'état** ou porte le sens (sens du vol), jamais « fade-in partout ».

## 2. Palette — le domaine défense (couleur = signal, pas déco)

Règle d'or : **sur un écran opérationnel, si tout est coloré, plus rien n'alerte.** Doctrine NATO / MIL-STD :

- **ROUGE = alarme / détection / hors-norme UNIQUEMENT.** Jamais une couleur « permanente » d'objet. Une menace VUE par un radar passe au rouge ; une trajectoire non encore détectée n'est PAS rouge.
- **Cyan / bleu froid** = données actives, radars/défenseur, sélection, trace.
- **Ambre** = attention, valeurs à surveiller, échos, altitude/temps — il **fatigue moins l'œil que le vert** sur longue session (raison réelle des salles de contrôle et de l'ATC). Préférer l'ambre au vert-hacker cliché.
- **Vert** = statut nominal/OK, par touches, jamais le « thème ».
- **Fond** = anthracite/bleu nuit très sombre teinté (jamais `#000`). **Texte** off-white (jamais `#fff`).
- Plafonner à ~3 teintes ; étendre par tons, jamais de nouvelle teinte.
- Couleurs de la data-viz 3D en **HDR (composantes > 1.0)** pour que seules elles captent le bloom.

## 3. Techniques Three.js premium (R3F + drei + postprocessing)

Le trio qui fait 80 % du rendu « instrument » :

**a. Traits qui brillent = fat line HDR + bloom sélectif**
- drei `<Line points lineWidth={3} color={[0,4,6]} toneMapped={false} />` (HDR + `toneMapped={false}` = ESSENTIEL, sinon la couleur est écrasée avant le bloom).
- `<EffectComposer><Bloom mipmapBlur luminanceThreshold={0.9} intensity={1} /></EffectComposer>` : seul ce qui dépasse 1.0 (les traits HDR) glow, le reste reste net.
- `meshline` (`widthCallback`) si largeur variable le long du tracé (épaisseur ∝ vitesse/altitude) ou dash animé.

**b. Volume de couverture = hologramme, PAS une sphère**
- Décomposer comme les vrais outils (Cesium) : surfaces SÉPARÉES — dôme de portée / plafond / cône de silence / empreinte au sol. Pas un mesh unique.
- Rendu : `meshBasicMaterial transparent opacity={0.05..0.15} side={DoubleSide} depthWrite={false}` + drei `<Edges>` (arêtes lumineuses), OU matériau holographique (Fresnel rim + scanlines, additif). `lamina` permet des matériaux par couches sans GLSL brut.
- Cône de silence = cône inversé, apex sur l'antenne, demi-angle ≈ 63° depuis la verticale (règle rayon ≈ 2×altitude).

**c. Sol « mission control » = drei `<Grid>`**
- `<Grid infiniteGrid cellColor="#1a3a4a" sectionColor={cyan} fadeDistance={80} fadeStrength={1.5} />` : cellules sombres discrètes, sections en accent, fondu en distance. Réserver la couleur vive aux sections (hiérarchie de lecture).

**d. Lisibilité 3D**
- **Trajectoire lisible** (langage missile standard) : trace 3D + **ground track pointillé au sol** + **stems verticaux** (drop lines trajectoire→sol) + **marqueur d'apogée** labellisé. Ça donne l'altitude au premier coup d'œil.
- Convention visibilité : **vert/couleur radar = vu, gris = angle mort** ; segmenter la trajectoire par état.
- **Sillage** drei `<Trail>` sur la tête en mouvement = sens du vol évident.
- **Labels** : drei `<Text>` (SDF, net, compatible bloom/fog) dans un `<Billboard>` (face caméra). `<Html>` réservé à 1-2 panneaux HUD riches (coûteux en nombre).
- **Profondeur** : `<fogExp2>` de la couleur du fond (depth cueing) + tone mapping **ACES Filmic** (le bloom ne crame pas).
- **Cadrage auto** : drei `<Bounds fit clip observe>` pour une scène de taille variable (attention repère Box3 monde/parent).

## 4. Densité & information (doctrine Bloomberg / mission control)

- **Densité maximale LISIBLE** : beaucoup d'info d'un coup, mais organisée en grille — ne pas aérer artificiellement un cockpit.
- **Dissimuler la complexité non pertinente** au contexte (couches activables) plutôt que tout aplatir.
- **Chargement/feedback instantané** (densité temporelle) ; un paramètre hors-norme passe au rouge et devient un « singleton » qui capte l'œil.
- **Indicateurs doubles** : valeur chiffrée + icône/état (redondance = lecture sous stress).
- **`font-variant-numeric: tabular-nums`** sur toute télémétrie (chiffres alignés en colonnes).

## 5. Écosystème R3F utile

`@react-three/drei` (Line, Grid, Text, Billboard, Edges, Trail, Bounds, Html), `@react-three/postprocessing` (Bloom, Vignette, N8AO), `lamina` (matériaux shader par couches), `leva` (régler la DA en live pendant le dev), `maath` (easing/courbes), `@react-three/rapier` (physique si besoin).

## 6. Process

1. **Ancrer dans le domaine** : quel est le sujet exact, qui lit l'écran, quelle décision il prend en le regardant.
2. **Plan de tokens** (couleur/typo/motion) AVANT de coder, dans un `DESIGN.md` à la racine (sinon chaque écran redérive vers la moyenne).
3. **Critique anti-IA** : relire le plan — si une partie ressemble au défaut générique, la réviser et dire pourquoi.
4. Coder en respectant la structure du projet (three : canvas/models/hooks/constants ; couleurs en tokens, jamais en dur).
5. Vérifier le contraste et TOUS les états (live, vide, erreur), pas seulement le « happy path ».

## Références clés
Cesium ion (décomposition volume capteur), STK/AGI (volumétrie), MIL-STD-2525/APP-6 (symbologie & couleurs réservées), radartutorial.eu (cône de silence), pmndrs drei/postprocessing (techniques), Territory Studio / Jayse Hansen (crédibilité HMI). Détail complet des URLs dans la recherche archivée du projet.
