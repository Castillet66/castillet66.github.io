# Logos d'enseigne

**Un vectoriel officiel passe avant tout le reste.** `carrefour-emblem.svg` en
est un : 1,5 Ko, net à toutes les tailles, aucune retouche, aucun plafond de
hauteur. Chaque fois qu'on en obtient un, il remplace son équivalent matriciel
et toute la mécanique décrite plus bas devient inutile pour cette enseigne.

Le reste de ce document traite des logos livrés en PNG, qui sont la majorité.

Un logo n'est affiché que s'il est déposé ici. Toute enseigne sans fichier est
rendue par son **monogramme** — l'initiale dans la couleur de la marque. Il n'y
a plus aucune récupération d'icône sur les sites des marques (voir D-023).

## L'Espagne proche (D-1173, 26/10/2026)

Déposés : Repsol, Galp, Cepsa, Moeve (vectoriels de Wikimedia Commons, relevés par leurs
auteurs sur les sites des enseignes), Petronor (PNG de Commons), BP (le logo de la
navigation de bp.com), Petrem (l'emblème de petrem.com), Grupo HAM (l'icône de ham.es),
Andamur (andamur.com, sans la signature « cada viaje importa »). Les SVG ne sont que
recadrés (leur `viewBox` posée sur le contenu) ; les emblèmes de Repsol, Cepsa et Petronor
sont DÉCOUPÉS dans le fichier de la marque, aux colonnes vides qui séparent l'emblème du
mot — rien n'est redessiné. Les PNG sont rognés et inscrits dans 304 × 136 (palette).

Deux drapeaux nouveaux : **`fondSombre`** — le fichier n'existe que pour un fond sombre
(Intermarché : son « Inter » est blanc) et ne se pose jamais sur une plaque blanche ;
**`fondClair`** — le logotype nu se lit sur une plaque claire (Repsol, Moeve, Petronor,
Andamur : un mot bleu marine ou bleu). Aucune inversion de couleurs.

Introuvables en version authentique le 26/10 : **Shell, Avanza Oil, Aoil** (SR-62) — leur
nom écrit en attendant le fichier.

## Ce qui manque aujourd'hui

Une seule enseigne du département attend son fichier : **OIL!**, une station à
Saint-Laurent-de-la-Salanque (#66250003). Elle est correctement identifiée —
QID Q2007561 — et rendue par son monogramme en attendant.

Les cinq autres stations sans logo sont de **vrais indépendants** : Petrop et
Agnel & Fils, Montaner et Fils (deux stations), GKO. Elles n'ont pas d'identité
graphique à déposer, et n'en attendent pas : elles affichent leur nom réel à
côté d'une pompe générique. Voir D-108.

## Ajouter un logo

1. Récupérer le fichier officiel, **fond transparent**.
2. Le recadrer sur son contenu et le redimensionner :

   ```
   convert logo-source.png -trim +repage -resize 304x136 -strip \
     public/brands/<clé>.png
   ```

   `304 × 136` est un PLAFOND, pas une cible : `-resize` conserve les
   proportions, donc chaque logo s'inscrit dans ce cadre selon sa forme. Un
   logotype est borné par la largeur (Carrefour 308 × 60, Super U 310 × 80),
   un emblème par la hauteur (Leclerc 146 × 146, Esso 203 × 146). C'est
   plus de deux fois l'emplacement d'affichage (88 × 40) : net sur un écran à haute
   densité, sans stocker plus que nécessaire. Les fichiers pèsent 2 à 6 Ko une
   fois en palette 8 bits.

3. Déclarer l'entrée dans `LOCAL_LOGOS`, dans `src/lib/fuel-brands.ts` :

   ```ts
   carrefour: { file: "carrefour.png", wordmark: true },
   dyneff:    { file: "dyneff.png", plated: true },
   ```

## Les drapeaux

**`wordmark`** — le nom de l'enseigne écrit en toutes lettres, plutôt qu'un
emblème. Un logotype est très allongé : il est alors borné par la largeur de
l'emplacement, et écarté du widget du Hero où, à 18 px de haut, il serait
illisible. L'emblème du E.Leclerc y reste, le mot « Intermarché » non.

**`plated`** — le logo apporte déjà son propre fond opaque. Seul le Dyneff est
dans ce cas : c'est un rectangle plein tricolore, qui n'a jamais eu de liseré à
retirer.

**`emblem`** — le fichier de la variante emblème, pour les petites surfaces.

Certains logotypes portent un emblème accolé au mot : le chevron « C » du
Carrefour, le rond « U » du Super U, la marguerite du Casino. Isolé, cet emblème
est compact — il tient toute la hauteur de l'emplacement là où le logotype
complet, bridé par la largeur, retombe au tiers. C'est aussi le seul dessin
lisible sur la ligne du Hero, à 19 px.

Découper l'emblème plutôt que le redessiner :

```
python3 - <<'PY'
from PIL import Image
import numpy as np
im = Image.open("carrefour.png").convert("RGBA")
a  = np.array(im)[:, :, 3]
# les colonnes entièrement transparentes séparent le mot de l'emblème
print([i for i, v in enumerate((a > 16).sum(axis=0)) if v == 0])
PY
```

Recadrer du côté de l'intervalle vide, **sans agrandir**, puis déclarer
`emblem: "<clé>-emblem.png"` dans `LOCAL_LOGOS`.

**Intermarché, Netto et Auchan n'en ont pas** : leurs lettres se touchent,
aucune colonne n'est entièrement transparente, et un découpage trancherait au
milieu d'un caractère — essayé, illisible. Dans une liste ils montrent donc leur
**logotype complet**, plus petit mais vrai. On ne leur substitue jamais un
monogramme : une lettre dans une pastille n'est pas le logo de la marque, et ça
se voit (D-030). Sur la ligne du Hero, où ils tomberaient sous 5 px de haut, on
ne montre rien.

## Aucun liseré, aucune plaque

Les fichiers sont posés **nus** sur l'obsidienne. Un liseré blanc avait été
gravé pour les détacher du fond ; il a été retiré — il cernait chaque marque
d'un halo qui se voyait plus qu'elle (D-030).

Le retirer proprement demande un peu de soin, parce que le liseré traçait
**tout** le contour : le pourtour extérieur, mais aussi l'intérieur de chaque
contre-forme — le creux du « a », l'anneau du « o », le triangle du « A ».
Un remplissage venu de l'extérieur ne les atteint pas, et il reste des taches
blanches au milieu des lettres. C'est arrivé, et ça se voyait.

La règle qui marche, sur les composantes connexes de blanc :

1. Calculer la distance de chaque pixel à l'**encre** — tout ce qui est opaque
   et pas blanc.
2. Repérer la composante blanche qui touche l'extérieur transparent : c'est le
   liseré. Sa profondeur maximale **k** donne son épaisseur, propre à chaque
   fichier (4 px sur un logotype de 60 px de haut, 10 px sur un emblème de 146).
3. Supprimer cette composante, **et** toute composante intérieure dont la
   profondeur ne dépasse pas `k` et qui reste sous 1 500 px.

Le seuil de taille est ce qui distingue un liseré rentré dans une lettre d'un
blanc de dessin. Le disque intérieur du E.Leclerc fait 3 695 px pour une
profondeur de 10, exactement celle de son liseré : sans le critère de taille il
serait effacé, et le logo deviendrait faux. L'ovale de l'Esso (9 148 px) et
celui du Cora (8 098 px) sont dans le même cas.

**Vérifier ensuite qu'il reste de l'encre visible.** Sur obsidienne, une encre
sombre ET peu saturée disparaît — critère : luminance < 75 et saturation < 60.
Seul Intermarché était dans ce cas, avec 51 % de son encre : son « Inter » est
noir. Le fichier livré est donc sa version **inversée**, celle que la marque
publie elle-même pour les fonds sombres. Toutes les autres enseignes mesurent
0 % — le bleu du Carrefour, du Cora et de l'Esso est sombre mais saturé, donc
parfaitement lisible.

## Ne jamais agrandir un emblème découpé (matriciel)

Un emblème est recadré dans le fichier de l'enseigne, à sa résolution native, et
**jamais suréchantillonné**. Agrandir n'ajoute aucun détail : cela interpole, et
le flou ainsi créé ne se rattrape plus à l'affichage. Le chevron du Carrefour
avait été porté de 56 à 136 px de haut, puis réduit à 40 à l'écran — deux
rééchantillonnages au lieu d'un, et un logo visiblement mou.

Conséquence : la finesse d'un emblème matriciel est plafonnée par son fichier
source. Le champ `emblemMaxHeight` existe pour ça — au-delà, on retombe sur le
logotype complet, plus petit mais net.

**Le Carrefour a été le cas d'école, et il est résolu.** Son fichier ne faisait
que 308 × 60, donc son chevron 84 × 56 : net à 19 px, mou à 40. Le vectoriel
officiel, fourni le 2026-08-10, supprime le problème à la racine. Aucune
enseigne ne porte plus de plafond.

## Optimiser tout SVG déposé, sans exception

Un SVG sorti d'Illustrator ou d'Inkscape traîne ses métadonnées, ses espaces
de noms d'éditeur et des coordonnées à quinze décimales. Le TotalEnergies
officiel pesait **18,9 Ko**, soit cinq fois son ancien PNG. Il n'y a rien de
vectoriel là-dedans : c'est du texte inutile.

```
npx svgo --config svgo.config.mjs -i <clé>.svg -o <clé>.svg
```

Mesuré sur les quatre fichiers : **−36 % à −68 %**, sans aucune perte visible.
`removeViewBox` doit rester DÉSACTIVÉ — c'est la `viewBox` qui découpe
l'emblème dans le fichier complet, la supprimer afficherait le logo entier.

**Et ne jamais garder deux fichiers pour une même enseigne.** Le verrouillage
complet du TotalEnergies dormait à côté de son emblème : 19 Ko qui n'étaient
affichés nulle part, l'emblème gagnant toujours. Supprimé.

## Pourquoi du PNG, et pourquoi c'est plus léger que du SVG ici

**Attention au piège de Wikipédia.** Sur Wikimedia Commons, cliquer l'aperçu
d'un fichier SVG télécharge son RENDU MATRICIEL, pas le vectoriel. Il faut
cliquer « Original file » pour obtenir le `.svg`. Les dix logos livrés comme
« des SVG » étaient en réalité des PNG — signature `89 50 4E 47` en tête de
fichier.

**Ne pas vectoriser un PNG.** La vectorisation automatique redessine l'image à
partir des pixels : le résultat est toujours moins fidèle, et impossible sur un
dégradé continu comme celui de TotalEnergies.

**Et le SVG ne serait pas plus léger.** Un logo vectoriel pèse le nombre de
courbes qu'il contient, pas sa taille d'affichage. Le SVG officiel
d'Intermarché — un simple logotype à deux couleurs — faisait **8,9 Ko** ; son
PNG en fait **3,7**. Un Casino ou un TotalEnergies, avec leurs dégradés et
leurs dizaines de tracés, dépasseraient largement les 20 Ko chacun.

**Le vrai levier, c'est la palette.** Ces logos sont des aplats : quelques
centaines de couleurs suffisent. Encodés en PNG 8 bits avec palette, les huit
fichiers matriciels pèsent **33 Ko**, et le rendu est strictement
indiscernable du 24 bits, vérifié par comparaison côte à côte.

**Le chiffre qui compte est celui SERVI, pas celui du disque.** Un PNG est
déjà compressé, gzip ne lui reprend presque rien ; un SVG est du texte et se
comprime de trois quarts. Sur le dossier complet, une fois optimisé :

| | sur le disque | servi (gzip) |
| --- | --- | --- |
| 8 PNG | 33 Ko | 30 Ko |
| 4 SVG | 18 Ko | **6 Ko** |

Autrement dit : les quatre vectoriels, qui sont les quatre enseignes les plus
fréquentes du département, coûtent **six kilo-octets** au chargement. Le
format n'est pas le sujet — le sujet, c'est d'optimiser ce qu'on dépose.

## Enseignes encore au monogramme

Shell · BP · Lidl · Monoprix · Colruyt · Élan · Eni

## Les supermarchés — Cuisine et comparateur de panier (D-1451, 31/10/2026)

Ajoutés pour le registre des enseignes de supermarché (`src/lib/enseignes/enseignes.ts`,
composant `LogoMagasin`), **dans ce même dossier** : un logo = un fichier, quel que soit
l'écran qui l'affiche. Relevés sur Wikimedia Commons, sans retouche de dessin ni de
couleur.

| Fichier | Source | Note |
| --- | --- | --- |
| `lidl.svg` | [File:Lidl logo.svg](https://commons.wikimedia.org/wiki/File:Lidl_logo.svg) (CC0) | emblème carré |
| `aldi.svg` | [File:Aldi Nord 201x logo.svg](https://commons.wikimedia.org/wiki/File:Aldi_Nord_201x_logo.svg) | Aldi France est Aldi Nord |
| `grand-frais.png` | [File:Grand Frais logo.png](https://commons.wikimedia.org/wiki/File:Grand_Frais_logo.png) | rogné, 160 × 160, palette (66 → 5 Ko) |
| `intermarche-clair.svg` | [File:Intermarché logo 2009 classic.svg](https://commons.wikimedia.org/wiki/File:Intermarch%C3%A9_logo_2009_classic.svg) | la version POUR FOND CLAIR (« Inter » noir, « marché » rouge) ; `intermarche.png` reste celle pour fond sombre — deux fichiers de la marque, pas un doublon : D-1173 (un fichier fait pour le sombre reste sur le graphite, un fichier fait pour le clair va sur une plaque claire, jamais d'inversion) |

Netto, E.Leclerc, Carrefour, Super U, Auchan et Casino : les fichiers déjà déposés
ci-dessus servent aussi aux supermarchés.

**Le fondement de la réutilisation.** Commons classe ces fichiers dans le domaine public
(sous le seuil d'originalité, au sens du droit américain) avec la mention « marque
déposée ». En France, ce qui fonde leur emploi ici est l'**usage d'identification** :
le logo désigne le magasin dont on parle, sans suggérer de partenariat. La marque reste
celle de son titulaire.
