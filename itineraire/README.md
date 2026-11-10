# Icônes des applications d'itinéraire

Les trois icônes de la feuille « Ouvrir l'itinéraire » (D-1172). Ce sont les icônes
OFFICIELLES des applications, telles que leurs éditeurs les publient sur leur fiche de
l'App Store (France) — pas des dessins refaits.

| Fichier | Application | Éditeur | Source (relue le 26/10/2026) |
| --- | --- | --- | --- |
| `plans.png` | Plans | Apple Distribution International | App Store, id 915056765 — illustration 512 × 512 de la fiche |
| `google-maps.png` | Google Maps | Google LLC | App Store, id 585027354 — illustration 512 × 512 de la fiche |
| `waze.png` | Waze | Waze | App Store, id 323229106 — illustration 512 × 512 de la fiche |

Obtenues par l'API publique de recherche d'Apple
(`https://itunes.apple.com/lookup?id=…&country=fr`, champ `artworkUrl512`, au format
PNG), puis réduites à 192 × 192 (`sips -Z 192`) : trois fois la taille d'affichage
(64 px au plus), nettes sur un écran à haute densité. Aucune autre retouche ; l'arrondi est
celui que l'écran applique, comme le système le fait pour l'icône sur l'écran d'accueil.

**Conditions.** Ces icônes et ces noms sont des marques de leurs détenteurs (Apple Inc.,
Google LLC, Waze Mobile Ltd.). Pulse les montre seulement pour désigner l'application
qu'un bouton ouvre, à côté de son nom — l'usage d'identification d'un « Ouvrir dans… »,
sans suggérer de partenariat ni d'approbation. Elles ne servent à rien d'autre (ni
décoration, ni publicité). Les liens ouverts sont ceux que les éditeurs documentent :

- Google Maps : https://developers.google.com/maps/documentation/urls/get-started
- Waze : https://developers.google.com/waze/deeplinks
- Plans : https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html

À refaire si un éditeur change son icône : relire la fiche, remplacer le fichier, et dater
ce tableau.
