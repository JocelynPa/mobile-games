# Candy Blast 🍬

Jeu mobile de type match-3 (style Candy Crush) construit avec React Native + Expo.

## Fonctionnalités

- Grille 8x8, swap tactile (swipe ou tap-tap)
- Bonbons spéciaux : rayé (ligne/colonne), enrobé (zone 3x3), bombe (toute une couleur)
- Cascades en chaîne avec bonus de combo et retour haptique
- 12 niveaux répartis sur 4 univers visuels, objectifs de score et limite de coups
- Système d'étoiles (1 à 3) et progression sauvegardée localement
- Animations fluides (Reanimated) et dégradés (Linear Gradient)

## Lancer le projet

```bash
npm install
npx expo start
```

Scannez le QR code avec l'app **Expo Go** (Android/iOS) pour jouer sur votre téléphone, ou lancez `npx expo start --android` / `--ios` avec un simulateur.

## Structure

```
src/
  engine/    logique pure du jeu (matching, cascades, bonbons spéciaux)
  components/  Candy, Board (rendu + gestes)
  screens/   Home, LevelSelect, Game
  data/      niveaux, progression (AsyncStorage)
  theme/     couleurs et dégradés
  hooks/     useGame (score, coups, combo)
```
