# Werup Sport : proposition finale

*16 novembre 2026. Pour ChatGPT, qui organise le projet, et pour le développeur. Trois propositions, notées par deux jurys, sont fusionnées ici. Rien n'a été codé : tout a été lu, et les points contestés ont été revérifiés dans le dépôt (voir §18).*

---

## 0. L'idée en une phrase

**Le Sport de Werup part des équipes que la personne suit.** Ces équipes passent devant partout : à l'accueil, dans la rubrique et dans les compétitions. Le reste du sport réellement alimenté est rangé dans un sommaire sobre, par sport puis par compétition, et ce sommaire se construit à partir des données. Le football, le rugby à XV et le rugby à XIII utilisent les mêmes gabarits. Ajouter une compétition, comme la NRL, revient à ajouter une ligne de configuration, sans refonte.

---

## 1. Comment cette proposition a été construite

- **Trois propositions :**
  - P1 « Mes équipes d'abord » ;
  - P2 « Les compétitions d'abord » ;
  - P3 « Le moment d'abord ».
- **Les jurys ne sont pas d'accord sur la gagnante :**
  - jury 1 : P1 46, P2 45, P3 40 ;
  - jury 2 : P2 47, P3 43, P1 42 ;
  - cumul : P2 92, P1 88, P3 83.
- **Mais leurs greffes mènent au même hybride.** C'est cet hybride qui est écrit ici :
  - **Le squelette vient de P2** : un sommaire construit par les données, la sobriété, une porte d'activation stricte, et les équipes du territoire montrées seulement quand elles jouent.
  - **Le cœur vient de P1** : Mes équipes partout, une feuille de choix, une page d'équipe générique avec un complément propre à chaque club, et le lot 0 de corrections livré en premier.
  - **Les greffes viennent de P3** :
    - une vraie adresse par sport ;
    - la section « Aujourd'hui », avec les matchs en cours en tête ;
    - le repli « Autres matchs (N) » ;
    - le masquage du score en direct garanti dans le composant ;
    - un plafond de 30 équipes ;
    - les redirections vers `/rugby/*` ;
    - une feuille de match qui reprend ce que faisait la fiche club.
- **Corrections.** Les erreurs factuelles relevées par les jurys ont été revérifiées dans le dépôt, puis corrigées (§15).
- **Hors périmètre.** Le titre et le hero de l'accueil ne sont pas rouverts : ils ont été arbitrés ailleurs.

---

## 2. Point de départ (constaté)

- **Le chapitre Sport de l'accueil** n'a que deux cartes, USAP et Dragons, écrites en dur. Toucher une carte ouvre la fiche du club, qui mène à la page du club.
- **Les deux clubs sont soudés dans au moins 10 contrats** : `EQUIPES_ACCUEIL`, `ClubRugby`, `ClubPulse`, `ClubSuivable`, `ClubId`, `BLASONS`, `PremiumNewsCard.club`, `LigueRugby`, `CLUBS` et `PAGE_DU_CLUB`. Suivre un club écrit aujourd'hui l'univers `usap` ou `dragons` dans `pulse:univers`.
- **Le modèle commun en base est déjà générique** (`lecture.server.ts`). Pourtant, le football, France XV et la Ligue des nations ne sont visibles que sur `/sport/technique`, une page interne en noindex vers laquelle aucun lien ne mène.
- **Les pages `/rugby/usap` (1 169 lignes) et `/rugby/dragons-catalans` (1 446 lignes)** utilisent le même gabarit, recopié deux fois.
- **D-2079 n'est appliquée qu'à moitié.** Le chapitre n'est masqué que s'il n'y a aucun lieu (MN-02 n'est pas fait).
- **Défauts visibles en production :**
  - « &amp;rsquo; » s'affiche en clair dans 5 titres d'actualité des Dragons ;
  - « Calendrier et scores : TheSportsDB » apparaît à 5 endroits. C'est inexact pour l'USAP, et D-321 interdit de toute façon de nommer un fournisseur ;
  - « L'Indépendant » est cité parmi les sources des Dragons alors qu'il a été retiré.

---

## 3. Direction : les huit règles qui tranchent le reste

1. **On suit des équipes**, jamais des sports ni des compétitions. Les compétitions se déduisent : suivre l'USAP montre le Top 14 ET la Challenge Cup.
2. **Mes équipes passent devant, et rien n'est caché.** Une préférence change l'ordre, jamais ce qui existe. Ne rien suivre est un choix valide.
3. **Un match ouvre une feuille.** Une compétition ou une équipe ouvre une page.
4. **Un seul dessin pour les trois sports** : une carte de match, une ligne de match, un tableau de classement, une page d'équipe, une page de compétition.
5. **On ne montre que ce qu'une source réelle alimente.** Une compétition sans données n'apparaît nulle part : pas de « bientôt », pas d'onglet vide.
6. **Le vivant d'abord, partout** : en cours, puis aujourd'hui, puis le résultat récent, puis le prochain match.
7. **Aucune ville par défaut.** Le lieu choisi ajoute seulement les équipes de son territoire, et seulement quand elles jouent.
8. **Aucune nouvelle grammaire.** On n'utilise que les composants de la charte.

---

## 4. Architecture

### 4.1 Hiérarchie

**Sport** (la rubrique) → **sport** (Football, Rugby à XV, Rugby à XIII) → **compétition** (une page) → **équipe** (une page).

- Il n'y a jamais un « Rugby » unique : le XV et le XIII ont deux publics distincts (raisonnement de D-165, toujours valable).
- Le match n'est jamais une page : il s'ouvre en feuille.
- Une équipe joue plusieurs compétitions. Sa page n'est donc rangée sous aucune d'elles.

### 4.2 Adresses

| Adresse | Ce qu'elle sert |
| --- | --- |
| `/sport` | Le sommaire, onglet « Tout ». |
| `/sport/football`, `/sport/rugby-a-xv`, `/sport/rugby-a-xiii` | Le même sommaire, filtré, avec le même composant. Changer d'onglet est une navigation `replace` avec `state: true` : rien ne s'empile dans l'historique, et Retour rend l'onglet et le défilement. |
| `/sport/{sport}/{competition}` | Par exemple `/sport/rugby-a-xv/top-14`. Le segment est l'identifiant du catalogue, après les deux-points. |
| `/sport/{sport}/equipe/{slug}` | Le slug est l'identifiant de `sport_equipes`, après les deux-points. |
| `/rugby/usap`, `/rugby/dragons-catalans` | Elles restent les adresses officielles de ces deux clubs et passent sur le gabarit d'équipe commun. `/sport/rugby-a-xv/equipe/usap` et `/sport/rugby-a-xiii/equipe/catalans-dragons` y redirigent en 301, ce qui évite le contenu dupliqué (question 5). |
| `/sport/technique` | Inchangée : interne, noindex. |

- Un résolveur unique, `pageDeLEquipe(id)`, remplace les deux `PAGE_DU_CLUB`.
- Une compétition inactive, ou sans rencontre dans la saison, rend une 404 propre. Un sport sans compétition active rend une 404 et n'a pas d'onglet.
- **Pourquoi une adresse par sport :** quand un sport arrive, il faut une adresse stable à communiquer (werup.app/sport/rugby-a-xiii). Ce n'est pas une page mince : elle montre le sommaire filtré.
- Une nouvelle visite de `/sport` s'ouvre toujours sur « Tout ». Un sport choisi ne devient jamais un filtre caché.

### 4.3 En-tête et retour

- **En-tête.** `getPageLabel` dit « Sport » sur `/sport/**` ET sur `/rugby/**`. Aujourd'hui il dit « Rugby » (`page-label.ts:111`).
- **Titre.** Le nom de la compétition ou de l'équipe est le titre du contenu (`.ouverture-page`), pas celui de l'en-tête.
- **Pas de rangée de capsules** sur ces pages.
- **Replis** déclarés dans `lib/navigation/repli.ts` :
  - compétition → `/sport/{sport}` ;
  - équipe → `/sport/{sport}` ;
  - `/rugby/*` → `/sport/rugby-a-xv` ou `/sport/rugby-a-xiii`, ce qui met fin à `SANS_PARENT "/rugby/"` ;
  - `/sport` → l'accueil.
- **Retour** rend l'onglet, le défilement (ancres `ViewportMount`) et les blocs « Voir les N autres » déjà dépliés.
- **Fil d'Ariane** en JSON-LD seulement, invisible à l'écran.

### 4.4 Entrées dans la navigation existante

La barre basse ne change pas : c'est une ligne rouge. On arrive au Sport par cinq chemins.

1. **L'accueil** : le chapitre Sport reçoit la porte « Tout voir » vers `/sport`. Elle existe enfin, puisqu'il y a désormais un index (charte §2).
2. **La Recherche** :
   - une porte vers `/sport` dans le groupe Sport (question 13) ;
   - l'index de saisie, généré depuis le catalogue et `sport_equipes` : « psg », « top 14 », « xiii » et « foot » mènent aux bonnes pages.
3. **Mon Werup › Suivis** : chaque équipe mène à sa page, et « Modifier » ouvre la feuille Mes équipes.
4. **Le menu « Explorer Werup » du pied** : une entrée « Sport » (`portes.ts`), qui appartient à la session « Werup cleanup et SEO national » (D-2083).
5. **Les raccourcis de la rangée de tête** : USAP et Dragons restent choisissables. Rien n'est ajouté.

---

## 5. Le chapitre Sport de l'accueil (le « rail de présentation »)

**Ce qui ne change pas :**
- le titre et le hero de l'accueil ;
- le titre « Sport » (`TitreChapitre`, D-1881) ;
- sa place : 4e par défaut, masquable et ordonnable ;
- le `ViewportMount` avec l'ancre « sport » et sa hauteur réservée ;
- le `RailChapitre` ;
- les dimensions des cartes : 86 % de largeur (92 % sous 375 px, 96 % sous 340 px), au moins 132 px de haut, grille de 2 colonnes en `lg`.

**Ce qui change :** le contenu, la règle d'apparition, la porte « Tout voir » et ce qu'ouvre le toucher.

### 5.1 Quand le chapitre paraît (D-2079 réalisée)

- **a)** Au moins une équipe est suivie : il paraît toujours, même sans lieu.
- **b)** Aucune équipe n'est suivie, mais le lieu choisi est dans un territoire qui a des équipes déclarées (aujourd'hui seulement le 66 : USAP et Dragons), ET l'une d'elles a une carte vivante. Une carte vivante veut dire : un match en cours, un match aujourd'hui, un résultat de moins de 14 jours, ou un prochain match.
- **Dans tous les autres cas, il ne paraît pas.** Aucune carte d'invitation, aucun remplissage (question 2).
- **Conséquences voulues :**
  - une personne dont le lieu est hors du 66 et qui ne suit rien ne voit plus le chapitre (c'est le défaut actuel, corrigé) ;
  - un Perpignanais qui ne suit personne ne voit pas, pendant trois mois, des Dragons figés au 11 septembre.

### 5.2 Quelles cartes

- **Chaque équipe suivie** a toujours sa carte, même « Aucun match programmé pour l'instant » : la personne l'a choisie.
- **Ensuite**, si le lieu est dans leur territoire, les équipes du territoire non suivies, **seulement si elles sont vivantes** (question 3).
- **Un match entre deux équipes de la liste ne fait qu'une carte.**
- **8 cartes au plus.** Au-delà, « Tout voir » mène au reste.
- **Le territoire est une donnée portée par l'équipe** (`territoire: "66"`), posée seulement quand elle est vérifiée. Ce n'est pas une constante du moteur (question 4).

### 5.3 Ordre : `ordreDesClubs` devient `ordreDesEquipes`

1. Match en cours : statut de jeu relevé il y a 15 minutes au plus.
2. Match d'aujourd'hui, pas encore commencé.
3. Résultat de moins de 48 h.
4. Prochain match, le plus proche d'abord.
5. Résultat de 14 jours au plus, sans match à venir.
6. Équipe sans match.

À égalité, une équipe suivie passe avant une équipe du territoire, puis la date la plus proche départage. Il n'y a jamais d'ordre éditorial figé.

### 5.4 Toucher une carte

**La carte ouvre la feuille de match** (§6.4). Cette feuille garde tout ce que la fiche club apportait : la vidéo, une actualité, « Voir la page » et « Suivre ».

- **Pourquoi :** avec N équipes, une carte peut opposer deux équipes suivies. Elle représente un match, pas un club. C'est aussi la règle de la charte : un match ouvre une feuille.
- **C'est un changement visible du parcours.** Il fait partie de la refonte demandée, et il sera annoncé.

### 5.5 États

- **Chargement :** deux squelettes aux dimensions finales. Les suivis sont stockés sur l'appareil, donc le chapitre s'hydrate côté client.
- **Une équipe en erreur :** sa carte dit « Calendrier indisponible pour le moment ».
- **Tout en erreur :** le chapitre se tait.
- **Match en cours :** `PastilleDirect` et « En cours », sans score (D-2120).

### 5.6 Couleur, en attendant l'arbitrage

L'USAP (`#7c1220`) et les Dragons (`#9a6a00`) gardent leur teinte : on ne retire rien d'identitaire sans accord. Toutes les autres équipes sont en anthracite neutre. La règle finale fait l'objet de la question 1.

### 5.7 Données et propriété

- **Données :** une seule lecture serveur, `rencontresDesEquipes(ids)`, remplace les deux requêtes `[usap]` et `[dragons]` du loader. Dans le registre `chapitres.ts`, la source devient « les calendriers et résultats des équipes que tu suis ».
- **Propriété :** ces cartes et leur règle appartiennent à la session « Werup cleanup et SEO national » (MN-02). Il faut une coordination écrite dans `docs/CHANTIERS.md` **avant la première ligne de code**.

---

## 6. Les pages

### 6.1 `/sport` : le sommaire (et `/sport/{sport}`, la même page filtrée)

1. **Ouverture** (`.ouverture-page`) :
   - l'en-tête dit « Sport », le h1 est masqué ;
   - les onglets « Tout · Football · Rugby à XV · Rugby à XIII » utilisent `OngletsChapitre` en mode défilant : casse normale, un filet sous l'onglet actif, cible de 44 px. Ils ne sont pas collants, et on ne glisse pas d'un sport à l'autre ;
   - un onglet n'existe que si son sport a au moins une compétition active qui a des rencontres ;
   - si aucune équipe n'est suivie, un seul bouton texte sur la ligne utile : « Choisir mes équipes », qui ouvre la feuille de choix. Aucune phrase d'explication.
2. **Mes équipes** (seulement si au moins une équipe suivie appartient au sport filtré) :
   - un `.titre-section` et, sur la même ligne, l'action « Modifier » (`PorteChapitre`, forme bouton) ;
   - le même rail que l'accueil : mêmes cartes, même ordre, une carte par match.
3. **Aujourd'hui** (seulement s'il y a au moins un match aujourd'hui dans le filtre) :
   - les matchs en cours d'abord (« En cours », sans score), puis ceux à venir par heure, puis ceux terminés ;
   - groupés par compétition. Les groupes se rangent ainsi : d'abord celui qui a un match en cours, puis celui qui contient une équipe suivie, puis le coup d'envoi le plus proche ;
   - 4 lignes par groupe, puis « Voir les N autres », déplié sur place ;
   - pour une compétition de sélections (Ligue des nations) : la France et les équipes suivies d'abord, les autres repliées sous « Autres matchs (N) ».
4. **Les sports et leurs compétitions :**
   - En « Tout », un `.titre-section` par sport. Dans un sport filtré, pas de titre de sport.
   - Chaque compétition active est un bloc (`surface-flow`, filets internes `divide-white/[0.07]`).
   - **La tête du bloc :** le nom de la compétition, avec « Tout voir » à droite vers sa page.
   - **La ligne d'état**, à 55 % : « Journée 10 · 28 – 30 nov. », « Poules · journée 3 » ou « Phase de ligue terminée ».
   - **Jusqu'à 3 lignes de match**, choisies dans cet ordre :
     - (a) la journée en cours, ou la prochaine si elle commence dans les 7 jours, sans répéter les matchs déjà montrés dans Aujourd'hui ;
     - (b) à défaut, les résultats de la dernière journée jouée il y a 3 jours au plus ;
     - (c) à défaut, un **bloc compact** : la tête et « Aucun match programmé pour l'instant ». On ajoute « Prochain match : sam. 6 févr. » seulement si cette date réelle est en base. Le bloc compact est placé en fin de son sport.
   - **Dans un bloc :** les matchs en cours d'abord, puis ceux de mes équipes, puis l'ordre des heures.
   - **Ordre en « Tout » :**
     - d'abord les sports de mes équipes, puis Football, Rugby à XV, Rugby à XIII (question 9) ;
     - dans un sport : d'abord les compétitions de mes équipes, puis championnat, coupe, sélections.
5. **Pied :** une mention de fraîcheur (« Mis à jour à 21 h 04 ») et la mention de non-affiliation. Aucun nom de fournisseur.

**États :**
- squelettes aux dimensions finales, section par section : Mes équipes s'hydrate seul, le reste est rendu côté serveur pour le référencement national ;
- une erreur se dit en une phrase, à l'endroit concerné ;
- aucune section n'est rendue vide ;
- au moins un bloc par compétition active reste toujours présent, donc l'écran n'est jamais vide ;
- en intersaison, des blocs compacts honnêtes, jamais « Saison terminée » (D-1729).

**Tablette :** les blocs passent sur deux colonnes. **Bureau :** largeurs bornées.

### 6.2 `/sport/{sport}/{competition}` : la page d'une compétition

1. **Ouverture.** Le titre est le nom (« Top 14 »), d'une seule encre. La ligne utile : « Rugby à XV · 2026-2027 ». Pas de logo de compétition tant que la question 12 n'est pas tranchée.
2. **Matchs.** `OngletsChapitre` « À venir · Résultats » :
   - groupés par journée, ou par tour pour une coupe (« Journée 10 · 21 – 23 nov. »), en lignes denses ;
   - la journée du moment en entier, puis « Voir la journée suivante » (ou « précédente ») ;
   - les équipes suivies se repèrent par la graisse, jamais par la couleur ;
   - une rencontre reportée ou annulée garde sa ligne, grisée, avec « Reporté » ou « Annulé » en texte `--alerte` et sans score. C'est une extension de contrat, à écrire (§7) ;
   - pour une compétition de sélections, le repli « Autres matchs (N) ».
3. **Classement**, seulement s'il est publié : Super League (calculé, 0 écart avec le classement officiel) et Ligue 1.
   - **Contenu :** un tableau commun (rang en Geist Mono, écusson de 24 px, nom court qui s'enroule, J, diff., Pts), puis `MentionClassement`.
   - **Règles :** une seule phase (D-2103), aucune zone de qualification sans règlement sourcé.
   - **Top 14 :** voir la question 10. Challenge Cup, Nations Championship et Ligue des nations : pas de section.
   - **Hors saison :** quand aucun match n'est prévu dans les 7 jours, le classement final passe devant les matchs, et l'onglet « Résultats » s'ouvre par défaut.
4. **Les équipes.** Une grille d'écussons réels (`BlasonEquipe`, aire égalisée, sans disque), le nom court dessous et une cible de 44 px au moins. Chaque écusson mène à la page de l'équipe. Les équipes suivies d'abord, puis l'ordre alphabétique.
5. **Mentions** : fraîcheur et non-affiliation.

**États :** squelettes de journée et de tableau ; « Aucun match programmé pour l'instant » ; une erreur en une phrase par section ; une compétition inactive rend une 404.

### 6.3 `/sport/{sport}/equipe/{slug}` : la page d'une équipe

`/rugby/usap` et `/rugby/dragons-catalans` utilisent ce même gabarit.

1. **La tête :**
   - **Visuel.** Une photo réelle du club, sous licence, s'il en existe une (USAP, Dragons) : elle porte `voile-texte` et `data-sous-entete="image"`. Sinon, un grand écusson égalisé sur l'obsidienne, sans fond flouté.
   - **Nom, et une ligne dessous** : « Rugby à XV · Top 14 · Challenge Cup », déduite des rencontres de la saison.
   - **Le bouton « Suivre » / « Suivie »**, blanc à texte sombre, visible au premier écran à 390 × 844.
2. **Le match** : `BlocMatch` au format « page ». Il montre le match en cours, sinon celui d'aujourd'hui, sinon le prochain et le dernier résultat. Il ouvre la feuille de match.
3. **Calendrier** : `OngletsChapitre` « À venir · Résultats », 6 lignes puis « Voir les N autres ». Une ligne ne nomme sa compétition que si ce n'est pas la compétition principale de l'équipe (« Challenge Cup »).
4. **Classement**, s'il est publié : un extrait de 5 lignes centré sur l'équipe, sa ligne en graisse, puis une porte vers le classement complet.
5. **Vidéos**, seulement si une chaîne officielle intégrable est déclarée pour l'équipe : un rail de vignettes, le lecteur monté au toucher.
6. **Actualités**, seulement si une source réelle existe (aujourd'hui l'USAP et les Dragons) : titre, source et date, sans extrait de tiers (question 11).
7. **Complément du club** : un emplacement facultatif, rempli seulement avec des faits vérifiés. Il contient le stade et sa capacité, la billetterie et le site officiel (jamais en premier geste), et pour les Dragons la signature « Allez papa d'amour ♥ Alma », intacte et protégée par son test (question 6).
8. **Mentions** : fraîcheur et non-affiliation. Aucun nom de fournisseur.

**États :**
- « Aucun match programmé pour l'instant », avec le dernier résultat et sa date ;
- une sélection nationale hors fenêtre de compétition affiche le même texte, sans rien inventer sur la compétition suivante ;
- « Calendrier indisponible pour le moment » en cas d'erreur ;
- une équipe inconnue, ou appartenant seulement à des compétitions inactives, rend une 404.

### 6.4 La feuille de match

C'est une `PulseModal` de nature « lire » : panneau opaque, croix et glissement, sans pied, une seule couche visible.

1. **Le visuel de tête** : la vignette réelle de la rencontre si la source en fournit une, sinon rien. Jamais de vidéo en tête.
2. **`BlocMatch` au format « fiche »** : écussons de 52 à 56 px, noms entiers, et au centre l'état (heure, « En cours », score final).
3. **`LigneMeta`** : compétition · journée ou tour · lieu, plus « Heure à confirmer » quand il y a lieu.
4. **Le résumé** : la vidéo officielle, dans la feuille, avec le lecteur monté au toucher. Pour la Ligue 1, elle n'est lisible qu'en France, et la feuille le dit si la lecture échoue.
5. **Les deux équipes**, une rangée chacune : écusson, nom, rang et points si le classement est publié, puis « Voir la page » et « Suivre ». Ouverte depuis une carte d'équipe, la feuille place cette équipe en premier, avec son actualité si une source existe (`RangeeActuClub`). On garde ainsi tout ce que la fiche club avait.

- **États :** ceux de la carte (§7).
- **Pas de partage**, puisqu'il n'existe pas de page publique stable pour un match.
- **Ouverte depuis une page d'équipe**, la feuille la couvre sans la fermer.
- **`FicheClubSheet` est absorbée** par cette feuille.

### 6.5 La feuille « Mes équipes »

C'est une `PulseModal` de nature « choisir » : verre fumé, texte au contraste 4,5:1.

**D'où on l'ouvre :** depuis `/sport` (« Choisir mes équipes » ou « Modifier ») et depuis Mon Werup. **Jamais depuis l'accueil.**

1. **Une recherche par nom**, en tête. « Toulouse » montre le Stade Toulousain ET le Toulouse FC, chacun avec son sport écrit.
2. **« Suivies »**, si au moins une équipe est suivie : une rangée de ronds (le rond veut dire « suivie », D-1714). Toucher retire l'équipe, avec un toast « Annuler ».
3. **Des onglets** « Football · Rugby à XV · Rugby à XIII ».
4. **« Près de toi »**, seulement si le lieu choisi est dans un territoire vérifié. Jamais de ville par défaut.
5. **Une sous-section par compétition active** : une grille d'écussons (4 par rangée à 390 px), le nom court dessous, une cible de 44 px au moins. Toucher suit ou ne suit plus, sur place : une coche ET le mot « Suivie », pas seulement une couleur.

- **Aucun ordre manuel, aucun glisser** : l'ordre vivant suffit.
- **Plafond de 30 équipes** : au-delà, un toast refuse la nouvelle équipe, et rien n'est retiré en silence.
- **Aucun questionnaire au démarrage.** Ne rien choisir est valide.

### 6.6 Mon Werup › Suivis

- **N équipes en ronds**, au lieu de 2, à côté des salles de cinéma suivies.
- **Ordre d'ajout** : Mon Werup est une bibliothèque, pas un moment.
- **Chaque équipe mène à sa page.** On retire une équipe par le geste existant.
- **Aucune équipe suivie :** la section suit la règle actuelle, sans invitation.
- **Un identifiant inconnu est écarté** à la lecture.

### 6.7 Recherche, groupe Sport

- La tuile d'identifiant « sport » est **« Sport et sensations »** : c'est la pratique, et elle mène à Sortir. **On n'y touche pas.**
- **Proposé (sans dépense) :** une porte « Tout voir » vers `/sport` sur la ligne de titre du groupe. Cela demande une petite extension de `GroupeCatalogue`, qui n'a pas de porte aujourd'hui.
- **Les tuiles du groupe** (aujourd'hui USAP et Dragons pour tout le monde) : leur devenir est à trancher avec la session du ménage national (question 13).

---

## 7. La carte de match (`BlocMatch`)

**Un seul dessin pour le XV, le XIII et le football.** Il est alimenté par **un adaptateur générique** `RencontreLue → VueMatch`, qui remplace, pour les nouvelles surfaces, `resumeUsap`, `resumeDragons` et `matchDepuis*`. Tout texte vient de `etat-match` : aucun libellé n'est déduit dans un composant.

**Formats :**
- « carte » : pour les rails, écussons de 52 à 56 px ;
- « ligne » : `LigneMatch`, extraite des deux `FixtureRow` recopiés, écussons de 24 à 28 px ;
- « fiche » et « page ».

**La perspective devient facultative.** Aujourd'hui `BlocMatch` exige une `equipe`. Sans équipe, la carte est neutre (sommaire, journée). Avec une équipe suivie, celle-ci est appuyée par la graisse.

**Anatomie de la carte :**
- **En haut**, une ligne à 55 % : la compétition, dite une seule fois, avec la journée (« Top 14 · J10 »). Jamais « SPORT ».
- **Au centre** : écusson, nom, bloc central, nom, écusson. Les noms courts viennent de la table vérifiée. Ils s'enroulent ou réduisent leur taille, jamais tronqués.
- **Le bloc central** est en Geist Mono tabulaire.
- **La surface** : `surface-raised`, sans ombre dans un rail, `rounded-3xl`.

**États.** Ce sont ceux du contrat réel de `etat-match.ts:73-88`.

1. **À venir** (`a-venir`) : « sam. 28 nov. » et « 16:35 », à l'heure de l'appareil (la NRL tombera donc vers 9 h).
2. **Aujourd'hui** (`jour-j`) : « Aujourd'hui » et l'heure.
3. **Heure à confirmer** : c'est un modificateur. Quand `horaireConfirme` est faux, la date reste et « Heure à confirmer » remplace l'heure (D-1716).
4. **En cours** (`en-cours`) :
   - il exige un statut de jeu relevé il y a 15 minutes au plus ;
   - il s'affiche par `PastilleDirect` et « En cours » (« Mi-temps » si la source le dit) ;
   - **aucun score tant que le flux (compétition × fournisseur) n'est pas qualifié** (D-2120). Aucun flux ne l'est au 16/11 ;
   - jamais de « 0–0 » ;
   - **cette garde est testée dans le composant**, ce n'est pas une simple convention ;
   - une fois le flux qualifié : le score, avec « relevé à 21 h 04 » ;
   - si la fraîcheur se perd, on repasse aussitôt à l'affichage sans score.
5. **Résultat attendu** (`resultat-attendu`) : l'heure est passée, le résultat n'est pas encore là, sans score supposé. Au-delà de 24 h, la rencontre devient `sans-nouvelle` et ne se lit plus : c'est la rencontre suivante qui parle.
6. **Terminé** (`termine`) :
   - score en 26 px tabulaire ;
   - le vainqueur à 100 %, le perdant à 55 %, un nul à égalité. Jamais de vert ni de rouge ;
   - « Terminé · ven. 7 nov. », puis le mot « Résumé » si une vidéo officielle existe.
7. **Intersaison**, pour une équipe sans match : « Aucun match programmé pour l'instant », avec le dernier résultat s'il date de moins de 14 jours. Jamais « Saison terminée ».
8. **Reporté, annulé, abandonné** (`retiree`) :
   - **dans une carte de rail** (la vue d'une équipe), le contrat actuel ne change pas : la rencontre ne se lit plus, c'est la suivante qui parle ;
   - **dans une liste** (journée, calendrier), *extension du contrat, à écrire et à tester* : la ligne garde sa place, grisée, avec « Reporté » ou « Annulé » en `--alerte`, sans score, et la nouvelle date seulement si la source la donne.

**Écusson qui échoue au chargement :** l'emplacement reste vide, à la même taille. Jamais de lettres ni de monogramme. L'anomalie est consignée. C'est rare, puisque la porte d'activation exige 100 % d'écussons.

**Interdits sur la carte :** cote, pari, publicité, bouton de partage, teinte de club non validée, initiales, W de la marque, `#FF5A00`, turquoise, corail, `border`, `ring`, ombre dans un rail, animation de score.

**Accessibilité :**
- la carte entière est un bouton de 44 px au moins ;
- son `aria-label` est la phrase de l'état (« USAP contre La Rochelle, samedi 28 novembre, 16 h 35, Top 14 journée 10 ») ;
- l'`alt` de chaque écusson est le nom de l'équipe ;
- elle se lit à 320 px et avec un texte agrandi à 150 % ;
- transitions de 200 à 400 ms, `prefers-reduced-motion` respecté.

---

## 8. Choisir ses équipes et trier son sport

- **Un seul geste : « Suivre », sur une équipe.**
  - Les compétitions s'en déduisent (`competitionsDeLEquipe`).
  - On évite ainsi le défaut d'Apple Sports, où suivre une équipe ne montre pas sa ligue.
  - Il n'y a pas d'épinglage de compétition sans équipe dans cette première version (question 14).
- **Où l'on suit :**
  - la tête de la page d'une équipe ;
  - les rangées d'équipe de la feuille de match ;
  - la feuille Mes équipes ;
  - Mon Werup.
  - Un toast confirme : « PSG rejoint tes suivis ».
- **Ce que le suivi change :**
  - Mes équipes en tête de `/sport` et sur l'accueil ;
  - leurs sports et leurs compétitions passent devant dans « Tout » ;
  - leurs lignes sont appuyées par la graisse.
  - **Rien n'est caché.** La forme des cartes ne change pas.
- **Trier par sport :** ce sont les onglets de `/sport`. C'est un geste explicite, gardé dans l'adresse, et jamais appliqué ailleurs par défaut.
- **Stockage :** voici le plan corrigé (voir §15, erreur n° 1).
  - **Aujourd'hui**, suivre un club écrit l'univers `usap` ou `dragons` dans `pulse:univers`, par `ajouterUnivers` et `useUniversChoisis`. Ces univers sont lus par `bouton-suivre-club`, `bouton-suivre-univers`, `bouton-suivre-groupe`, `section-suivis` et `bibliotheque.ts`.
  - **Le repère `{ type: "club" }`** (`types.ts:408`) n'a aucun écrivain, et `clubsSuivis` n'a aucun consommateur.
  - **À l'arrivée**, un repère `{ type: "equipe"; id: "xv:usap" }` dans le magasin des repères (`pulse:mon-pulse:reperes:v1`, `reperes.ts:52`). Il remplace le repère `club` mort. Les identifiants sont revalidés contre `sport_equipes` à la lecture (patron `cinemas-suivis.ts`).
  - **Migration**, une seule fois et sans perte :
    - univers `usap` → `xv:usap` ;
    - univers `dragons` → `xiii:catalans-dragons`.
  - **Pendant la transition**, les deux univers sont tenus en miroir à chaque suivi ou retrait de ces deux clubs, tant que leurs autres lecteurs n'ont pas migré. Ce travail est consigné au backlog.
  - **Le test de non-perte lit le VRAI magasin.**
- **Compte futur :** une liste d'identifiants stables, sans donnée personnelle. SPT-07 et SPT-08 la recopieront telle quelle dans l'abonnement push, puis dans le compte. Il n'y aura pas de second système de suivi.

---

## 9. Ajouter une compétition ou un sport

### 9.1 Une compétition, c'est une entrée de catalogue, pas une refonte (D-2101)

**La porte d'activation.** Une compétition passe à `actif: true` seulement si les sept conditions suivantes sont remplies. Un test garde ce qui peut l'être.

1. Les identifiants du fournisseur sont vérifiés par une réponse réelle.
2. La saison courante est en base, avec la pré-saison exclue.
3. **100 % des équipes ont un écusson réel**, rattaché à la bonne équipe (D-2107, D-246).
4. Les correspondances sont posées : aucune « deuxième USAP ».
5. La règle de classement est l'une de ces trois :
   - « fournisseur », relu ;
   - « calcul », avec un règlement sourcé et une contre-épreuve à 0 écart ;
   - « aucun ».
6. Les heures sont lues correctement en heure de Paris, et les vidéos sont vérifiées intégrables (`videos.list`, SPT-09).
7. Le direct se qualifie à part, flux par flux (D-2120). Tant que ce n'est pas fait, il reste sans score.

**Ensuite, sans écrire de code d'interface :**
- son bloc entre dans le sommaire ;
- sa page existe ;
- ses équipes ont leur page et deviennent suivables ;
- la feuille Mes équipes, l'index de Recherche et le plan du site la reçoivent.

Une compétition activée mais encore vide reste invisible.

### 9.2 Un sport de plus

- **Sport de rencontre** (basket, hand) : on étend `Sport` (`modele.ts`) et la contrainte SQL de `sport_equipes`, on ajoute un libellé, un segment d'adresse (`/sport/basket`) et sa configuration de direct. Son onglet paraît avec sa première compétition active. Les gabarits restent les mêmes.
- **Course ou tableau** (F1, cyclisme, tennis) : ils n'entrent pas dans un modèle à deux équipes. C'est un autre chantier, de niveau D, à signaler et non à improviser.

### 9.3 Annoncer une nouveauté

- **Quand :** une fois la compétition réellement alimentée, avec au moins un match dans les 14 jours.
- **Comment, dans l'app :**
  - le point blanc `PastilleNouveaute` sur la tête de son bloc (ou sur l'onglet d'un nouveau sport) et sur sa rangée dans la feuille Mes équipes ;
  - il s'éteint à la première visite de la page, et au plus tard après 14 jours (question 15).
- **Jamais** de badge rouge, d'orange, de bandeau ni de carte d'annonce.
- **Hors de l'app :** Geoffrey communique sur les réseaux, avec l'adresse stable de la page (werup.app/sport/rugby-a-xiii/nrl).
- **Une notification « Nouveau : la NRL »** passera seulement par SPT-08 et par le consentement aux notifications.

### 9.4 La NRL

Voir le verdict séparé. En résumé : elle est faisable avec l'abonnement TheSportsDB déjà payé. On la prépare maintenant, invisible, et on l'active quand le calendrier 2027 est en base.

---

## 10. Ce qu'on peut montrer au 16/11, sans rien inventer

| Compétition | Sport | Faits | Classement | Direct | Vidéos | Actualités |
| --- | --- | --- | --- | --- | --- | --- |
| Top 14 | XV | API-Rugby, complété par TheSportsDB | Non (D-2114) | « En cours » sans score ; flux XV jamais éprouvé en match | Chaîne USAP, liens TheSportsDB | USAP |
| Challenge Cup | XV | TheSportsDB | Non | Sans score | Liens TheSportsDB | — |
| Nations Championship | XV (France) | API-Rugby seul | Non | Sans score | Non vérifié | — |
| Super League | XIII | TheSportsDB | Oui, calculé, 0 écart | Aucun ; 2027 pas encore publié | Archives 2026, chaîne officielle | Dragons |
| Ligue 1 | Football | API-Football, puis TheSportsDB (D-2110) | Oui (fournisseur) | Qualifiable, score masqué | Chaînes officielles, France seulement | — |
| Ligue des nations | Football | API-Football, puis TheSportsDB | Non | Qualifiable, score masqué | Non vérifié | — |

**Ne paraissent nulle part :**
- les compétitions préparées et inactives (Champions Cup, Six Nations, Ligue des champions, Liga, Serie A) ;
- la NRL ;
- le classement du Top 14 ;
- un score en direct non qualifié ;
- les statistiques, compositions et marqueurs ;
- des actualités pour les équipes qui n'ont pas de source.

**Échéances des abonnements :**
- API-Rugby Pro et API-Football Pro : payés pour un mois, jusqu'au 16/12/2026, **sans renouvellement automatique** (D-2108) ;
- TheSportsDB Premium : 9 € TTC par mois, période en cours du 06/11 au 06/12. Son renouvellement automatique n'est pas vérifié.

---

## 11. Conformité à la charte (l'essentiel)

**Composants et feuilles :**
- `PulseModal` pour toute feuille : nature « lire » pour le match, nature « choisir » pour Mes équipes ;
- un seul `BlocMatch`, une `LigneMatch`, un `TableauClassement`, une page d'équipe et une page de compétition. Aucun composant par club ni par sport.

**Sélection et rails :**
- sélection par `OngletsChapitre` ;
- rails par `RailChapitre`, sans ombre ni fondu de bord ;
- listes à lire en colonnes avec filets internes (D-378) ;
- porte « Tout voir » sur la ligne de titre, seulement si une destination existe.

**Navigation :**
- barre basse inchangée ;
- pas de capsules de l'en-tête comme filtre ;
- rien de collant sous l'en-tête ;
- aucun glissement latéral entre sports ;
- retour par l'en-tête, avec des replis déclarés.

**Surfaces et couleurs :**
- `surface-raised` pour une carte qui se touche, `surface-flow` pour une liste ;
- aucun `border`, `ring` ni `shadow` dans un composant ;
- page sur l'obsidienne, sans nouvelle lumière ;
- `--live` seulement par `PastilleDirect`, `--alerte` seulement pour Reporté ou Annulé ;
- résultats lus par la graisse ;
- teinte de club seulement par une exception nommée et mesurée (question 1).

**Typographie :**
- `.titre-section` et `.ouverture-page` ;
- Geist Mono pour les heures et les scores ;
- Inter en casse normale, 12 px au moins ;
- aucun titre tronqué, aucun surtitre en capitales, aucun slogan, aucun « du 66 » ni « catalan » comme titre.

**Données et textes :**
- écussons réels partout, et suppression du repli sur initiales de `Blason()` ;
- aucun nom de fournisseur à l'écran : l'attribution due va sur `/credits` (D-321) ;
- pas de pictogramme de ballon : on écrit le mot ;
- PWA et navigateur ont le même rendu, sans règle `standalone` nécessaire.

**Documents à réécrire dans le même mouvement :**
- **Charte §12**, qui dit encore « pas d'univers Sport » alors que D-2100 l'a renversé. Si un univers `sport` est ajouté, la réécriture se fait dans le même commit, avec `inventaire-charte.test.ts` au vert.
- **D-1726** (« Source citée (TheSportsDB) »), à aligner sur D-321.
- **SPORT.md §9** :
  - il dit « aucune actualité Dragons », alors que la page en sert ;
  - il présente la Ligue des champions comme alimentée, alors que le §10 la dit inactive.

---

## 12. Risques

1. **Soudure à deux clubs, dans au moins 10 contrats.** C'est un chantier de niveau D. Une migration du suivi ratée ferait perdre leurs suivis aux utilisateurs.
2. **Périmètre partagé.** Les cartes de l'accueil et la règle D-2079 (MN-02), le menu « Explorer Werup » (`portes.ts`) et la Recherche touchent la session « Werup cleanup et SEO national ». Les sections de Mon Werup touchent aussi d'autres sessions. Une coordination écrite dans `CHANTIERS.md` est obligatoire avant d'écrire.
3. **Changement visible.** Le rail garde sa forme et ses dimensions, et rien n'est ajouté hors du sport. La cible du toucher change (feuille de match) : c'est dans la refonte demandée, et c'est annoncé.
4. **Abonnements au 16/12.** Sans renouvellement :
   - le Nations Championship s'éteint ;
   - le Top 14 et la Ligue 1 retombent sur TheSportsDB ;
   - le Six Nations devra changer de fournisseur fondateur.
   Le sommaire retire proprement ce qui devient inactif, mais il maigrit.
5. **Écussons.** Des dizaines d'équipes de football et de coupes d'Europe dépendent de SPT-10. Sans lui, la porte d'activation bloque leur compétition.
6. **Intersaison.**
   - Le XIII n'a pas de match avant février.
   - La France football et la France XV n'ont plus de « prochain match » après novembre.
   Le dessin doit rester beau avec des blocs compacts, sans remplissage.
7. **Volume et longueur.**
   - La Ligue des nations réunit toutes les sélections UEFA (d'où « Autres matchs (N) »).
   - À 15 compétitions, la vue « Tout » s'allonge. Les garde-fous : 3 lignes par bloc, blocs compacts en fin de sport, onglets.
8. **Faux direct.** Le flux du XV n'a jamais été éprouvé en match. Le masquage doit être une garde testée dans le composant.
9. **Doublons d'équipes entre deux fournisseurs non rapprochés.** L'identifiant est figé dès sa création, mais un club vu sous deux noms peut naître deux fois. Il faut surveiller `sport_rapprochements` (SPT-15).
10. **Actualités.**
    - Le flux des Dragons mêle la brasserie et la boutique.
    - Les photos de L'Indépendant sont à remplacer, sauf accord de l'éditeur.
11. **Coût de lecture.** Le sommaire lit 6 compétitions. Il faut une lecture serveur groupée, bornée à une fenêtre de dates et mise en cache par le cache nommé de D-2012 (le cache de bord est inerte).
12. **Restes à deux clubs, hors de ce chantier**, à consigner au backlog sans les traiter au passage :
    - le domaine Intelligence « sport » ;
    - `sport-to-events` ;
    - `GROUPES_RUBRIQUES`, sans rendu ;
    - les anciennes tables (SPT-11).

---

## 13. Lots, dans l'ordre

Chaque lot est livré seul, avec ses tests écrits et passés avant le commit. Un seul traitement lourd à la fois sur la machine.

### A. Sans regret : à construire tout de suite, sans attendre d'arbitrage

| Lot | Contenu | Niveau |
| --- | --- | --- |
| **A0. Défauts visibles** | • Décoder les entités nommées des actualités Dragons. • Retirer « Calendrier et scores : TheSportsDB » (5 endroits) au profit d'une mention de fraîcheur, et poser l'attribution due sur `/credits`. • Retirer « L'Indépendant » des sources Dragons. • Corriger SPORT.md §9. • Tests ciblés : entités, aucun nom de fournisseur. | B |
| **A1. Socle de lecture** (invisible) | • Dans `lecture.server.ts` : `rencontresDesEquipes(ids)`, `competitionsDeLEquipe(id, saison)`, `equipesDeLaCompetition(id, saison)`, `competitionsAlimentees()`, `resumeDuSommaire(fenêtre)`, avec le cache nommé. • L'adaptateur générique `RencontreLue → VueMatch`. • `ordreDesEquipes` avec dédoublonnage par match. • Le champ `territoire`, vérifié (66 pour USAP et Dragons). • Le test de la porte d'activation. • Contre-épreuves : aucune compétition inactive lue, aucun score en jeu sans flux qualifié. | D |
| **A2. Suivre N équipes** (invisible tant que les pages n'existent pas) | • Repère `equipe`. • Migration depuis `pulse:univers`, avec miroir des deux univers. • Revalidation. • Plafond de 30. • `BoutonSuivreEquipe`. • Test de non-perte sur le vrai magasin. • Coordination Mon Werup écrite. | D |
| **A3. Écussons partout (SPT-10)** | • Écusson du fournisseur servi par le proxy. • Contrôle de l'homonyme. • Suppression des initiales. • Égalisation mesurée généralisée. • Garde « 100 % d'écussons » pour activer une compétition. | C |
| **A4. Pièces communes**, rendu identique | • Extraire `LigneMatch`, `TableauClassement`, le calendrier à onglets et la tête d'équipe. • `BlocMatch` à perspective facultative, avec la garde D-2120 testée. • La feuille de match. • `/rugby/usap` et `/rugby/dragons-catalans` reconstruites sur le gabarit d'équipe, avec l'emplacement « complément du club » (signature intacte, avec son test). • Captures avant / après à 390 et 1280 px : identiques, sauf les corrections de A0. | C |
| **A5. NRL préparée, invisible** | Voir le verdict NRL. | C |

### B. Après arbitrage, ou après coordination

| Lot | Contenu | Attend | Niveau |
| --- | --- | --- | --- |
| **B1. Pages nationales** | • `/sport`, `/sport/{sport}`, la page de compétition, la page d'équipe. • Les 301 vers `/rugby/*`. • En-tête « Sport », replis, SEO (titres, canonique, plan du site, 404), en coordination avec la session SEO. • La feuille Mes équipes. • Mon Werup › Suivis à N équipes. • L'extension de contrat « retiree dans une liste ». • La charte §12. • Responsive à 320, 390 et 1280 px. | Questions 5, 9, 10, 14 (des valeurs par défaut sont proposées : on peut commencer) | D |
| **B2. Chapitre Sport de l'accueil** | • D-2079 réalisée. • Équipes suivies, puis équipes du territoire vivantes. • 8 cartes. • Porte « Tout voir ». • Toucher → feuille de match. • Mêmes dimensions. • `chapitres.ts`. | Questions 2, 3, 4 et la coordination écrite MN-02 | C |
| **B3. Entrées** | • Porte du groupe Sport de la Recherche. • Index de saisie. • Lien dans « Explorer Werup ». | Question 13 et la session ménage | B |
| **B4. Activations** | • Champions Cup (décembre). • Six Nations (février). • Compétitions qui redonnent un prochain match aux Bleus du football. • NRL et World Club Challenge. • `PastilleNouveaute`. | Questions 7, 8, 15 | C |
| **B5. Teinte des équipes** | Règle systémique, ou neutre pour toutes. | Question 1 | B |

---

## 14. Questions qui demandent un arbitrage

Elles sont listées séparément dans le champ « questions ». Chacune porte une recommandation, et les lots A n'en dépendent pas. Celles qui touchent à l'identité, à une dépense ou à un choix personnel reviennent à Geoffrey, en une phrase simple et une à la fois : la 1, la 6 et la 7.

---

## 15. Erreurs factuelles corrigées

Elles ont été relevées par les jurys, puis vérifiées dans le dépôt (HEAD `66055c6ea` du worktree sport).

1. **Le suivi d'un club n'est pas un repère `{ type: "club" }`.** C'est l'univers `usap` ou `dragons` dans `pulse:univers` (`univers.ts:227`, `bouton-suivre-club.tsx`, `section-suivis.tsx:63-67`). Le repère `club` (`types.ts:408`) n'a aucun écrivain. Une migration « repère club → equipe » n'aurait migré personne. *Vérifié.*
2. **Le magasin des repères est `pulse:mon-pulse:reperes:v1`** (`reperes.ts:52`). `pulse:mon-werup:persistance:v1` est la marque de `navigator.storage.persist()` (`persistance.ts:44`). *Vérifié.*
3. **Il n'existe pas de tuile « Sport » de la rubrique dans la Recherche.** `GROUPE_SPORT` ne contient que USAP et Dragons. La tuile d'identifiant « sport » est « Sport et sensations », la pratique, qui mène à Sortir. La repointer casserait D-1724. *Vérifié.*
4. **Le Six Nations n'est pas « déjà payé ».** Son fondateur est `api-rugby` (`catalogue.ts:150-161`), dont l'abonnement s'arrête le 16/12. En février, il faudra renouveler, ou basculer le fondateur sur TheSportsDB 4714. *Vérifié.*
5. **`etat-match` a six états lisibles** : `a-venir`, `jour-j`, `en-cours`, `resultat-attendu`, `termine` et `intersaison`. `sans-nouvelle` et `retiree` ne se lisent pas. « Résultat attendu » n'est pas `sans-nouvelle`. Afficher « Reporté » dans une liste est une **extension** du contrat, pas une réutilisation. *Vérifié* (`etat-match.ts:73-88`).
6. **L'identifiant `football:<slug>` est figé dès sa création** : `resoudreEquipe` renvoie l'identifiant déjà connu par `sport_correspondances` (`persistance.ts:240-256`). Le vrai risque est un doublon entre deux fournisseurs non rapprochés. *Vérifié.*
7. **D-2100 ne garde pas les adresses `/rugby/*`.** Il garde USAP et Dragons comme entrées. L'argument SEO tient, mais aucune décision ne le porte encore : d'où la question 5. *Vérifié.*
8. **Le cache n'est pas « impossible ».** D-2012 constate que le cache de bord est inerte et le remplace par un cache nommé, utilisable pour le sommaire. *Vérifié* (titre de D-2012).
9. **Ligue 1 et Ligue des nations : le fondateur est TheSportsDB** (c'est lui qui crée les équipes), et les faits viennent d'abord d'API-Football (D-2110). *Vérifié.*
10. **La NRL est absente du catalogue** (11 entrées). « Sans nouvel abonnement » veut dire : portée par TheSportsDB Premium, déjà payé (9 € TTC par mois). Ce n'est pas gratuit. *Vérifié.*
11. **Calendriers 2027 de la NRL et de la Super League : toujours vides chez TheSportsDB le 16/11 dans l'après-midi** (`{"events":null}`, relu avec la clé de test publique). La date du 16/11 annoncée par la presse australienne n'est pas confirmée. *Observé.*
12. **Attribution de la porte.** Le refus d'une porte « faute de destination » vient de la charte §2 (« Rugby catalan a deux pages et aucun index »), et non de D-196 / D-198. *Relevé par le jury 2, non relu.*

---

## 16. Idées écartées, et pourquoi

| Idée | Pourquoi elle est écartée |
| --- | --- |
| Réordonner ses équipes à la main (P1) | De la complexité sans bénéfice prouvé : l'ordre vivant suffit. On le rajoutera si le besoin se constate. |
| Hub en cinq sections temporelles, dont « À venir 7 jours » (P3) | Trop long, et il gonfle à chaque compétition ajoutée. |
| « Ce soir » au lieu d'« Aujourd'hui » après 18 h (P3) | Ambigu : les matchs de 15 h sont encore « aujourd'hui ». |
| Fond flouté de l'écusson en tête d'équipe (P3) | C'est une ambiance d'identité non validée. |
| Une section « Résumés » sur la page de compétition (P1) | Le mot « Résumé » sur la ligne, qui ouvre la feuille, suffit. |
| `/sport/<sport>` qui redirige vers `?sport=` (P2) | Pas d'adresse stable à communiquer quand un sport arrive. |
| La carte qui ouvre la fiche équipe (P1) | Ambigu quand deux équipes suivies s'affrontent, et contraire à la règle « un match ouvre une feuille ». |
| Les pastilles ivoire de Sortir pour les sports (P1) | Les onglets texte laissent les écussons comme objets les plus lumineux, et ils sont déjà employés par Streaming. |
| Repointer la tuile « sport » de la Recherche (P1, P3) | Elle est « Sport et sensations ». |
| Activer le Six Nations « avec les abonnements actuels » (P3) | Son fondateur est API-Rugby, qui s'arrête le 16/12. |

---

## 17. Décisions à écrire

Elles se placent dans la plage réservée à la session Sport, D-2121 à D-2129.

- **D-2121** Architecture du Sport : hiérarchie, adresses, en-tête « Sport », replis.
- **D-2122** On suit des équipes : repère `equipe`, migration depuis `pulse:univers`, miroir temporaire, plafond de 30.
- **D-2123** Une carte de match ouvre la feuille de match ; `FicheClubSheet` est absorbée.
- **D-2124** Une rencontre retirée garde sa ligne dans une liste (extension de `etat-match`).
- **D-2125** La porte d'activation d'une compétition (sept conditions, écussons à 100 %).
- **D-2126** Le chapitre Sport de l'accueil : apparition, ordre, territoire (avec MN-02).
- **D-2127** `OngletsChapitre` pour choisir un sport.
- **D-2128** La NRL préparée, inactive.
- **D-2129** réservée à l'arbitrage des couleurs d'équipe.

---

## 18. Ce qui est vérifié, et ce qui ne l'est pas

- **Observé dans cette passe** :
  - lecture du dépôt (worktree sport, HEAD `66055c6ea`) : stockage du suivi, clés de stockage, catalogue, `etat-match`, `resoudreEquipe`, groupe Sport de la Recherche, composants partagés existants (`PastilleNouveaute`, `OngletsChapitre`, `PorteChapitre`, `RailChapitre`, `PastilleDirect`, `BandeTemporelle`, route `/credits`) ;
  - D-2100, D-2108 et D-2110 ;
  - calendriers 2027 NRL et Super League vides chez TheSportsDB ;
  - presse australienne : seulement des articles d'avant la publication du calendrier NRL 2027.
- **Repris des études, non revérifié ici** :
  - HTML servi le 16/11 vers 16 h 33 UTC (défauts du lot A0, contenu des pages) ;
  - mesures NRL 2026 avec la clé de Werup (229 rencontres, 18 écussons, 225 vidéos) ;
  - numéros de ligne cités par les études.
- **Non vérifié** :
  - aucun rendu dans un navigateur, à aucune largeur ;
  - aucun test lancé ;
  - le commit servi en production n'a pas été relevé ;
  - le renouvellement automatique de TheSportsDB Premium ;
  - la présence de toutes les équipes de chaque compétition dans `sport_equipes` (inférée) ;
  - les identifiants API-Football des ligues candidates ;
  - les vidéos NRL réellement intégrables.
