// Perpignan Pulse — Service Worker "coquille instantanée".
//
// Objectif : supprimer la fenêtre blanche réseau au cold-boot en servant "/"
// immédiatement depuis le cache (l'intro SSR obsidienne + logo Pulse est
// alors peinte au premier frame, sans attendre le réseau).
//
// Périmètre STRICT :
//   - Précache à l'installation : uniquement la coquille de démarrage
//     ("/", manifest, favicon). Jamais de données, jamais de photos.
//   - Fetch handler, DEUX branches et deux seulement :
//       · navigation vers "/" : RÉSEAU D'ABORD, cache en secours après
//         `SHELL_DELAI_MS` (D-295 — c'était l'inverse, et l'application
//         démarrait donc systématiquement sur la version de la veille) ;
//       · /assets/*.css|js hors navigation : cache-first strict — les URL sont
//         hachées par le build, donc immuables, et la purge par BUILD_ID à
//         l'activation borne le stockage. (Cette branche existait déjà et
//         l'en-tête affirmait le contraire — « JAMAIS le JS/CSS hashé »,
//         « aucun respondWith » — jusqu'à ce que la contre-relecture de D-288
//         le relève. Le comportement est sain ; c'est sa description qui
//         était fausse.)
//     Tout le reste — navigations /meteo, /webcams, /agenda…, API, images —
//     passe intégralement au réseau.
//   - Les données dynamiques restent fraîches : elles s'hydratent via React
//     Query depuis les server functions, pas depuis ce SW.
//
// Mise à jour : à chaque déploiement, `BUILD_ID` est réécrit par
// `scripts/stamp-sw.ts` (pré-build). Le nouveau SW s'installe, purge les
// anciens caches, ANNONCE la version à ses clients sur un `MessageChannel`,
// leur laisse `GRACE_CLIENTS_MS` pour se déclarer occupés — et NAVIGUE tous
// ceux qui se sont tus (D-295). Le silence vaut consentement : c'est ce qui
// garantit qu'un bundle trop ancien pour savoir répondre finisse toujours par
// se réparer. Voir `register-sw.ts` pour le côté page.
//
// ⚠ DEUX RÈGLES ABSOLUES DANS CE FICHIER, ET ELLES ONT COÛTÉ CHER (D-298) :
//   ① on n'attend JAMAIS `client.navigate()` — l'attendre dans le `waitUntil`
//     de l'activation coince le worker en `activating` sous WebKit, et bloque
//     alors TOUTE navigation du client, y compris celles que la page tente
//     elle-même. C'était la cause réelle de « la PWA reste sur l'ancienne
//     version », cherchée pendant trois chantiers ;
//   ② le worker contrôle lui-même sa version (`controlerVersionSiUtile`), au
//     lieu de dépendre d'un `registration.update()` qui vit dans le bundle
//     qu'il faudrait justement télécharger.
//
// Handlers push / notificationclick : inchangés SAUF sur un point, et il faut
// le dire plutôt que de laisser la promesse « à l'identique » devenir fausse —
// `notificationclick` n'attend plus `client.navigate()` non plus (D-298). Le
// comportement est le même : le `return` qui suit rendait l'attente inutile.

const BUILD_ID = "1794301698130";

/* La phase de la migration vers werup.app, recopiée de `src/lib/migration/domaines.ts`
   (un test les tient ensemble). */
const MIGRATION_BASCULE = true;
const SHELL_CACHE = "pulse-shell-v" + BUILD_ID;
/**
 * ⚠ `HORS_LIGNE_URL` REJOINT LA COQUILLE — T-01, 09/09/2026.
 *
 * Reproduit sur la production, service worker réellement installé, réseau
 * coupé, puis rechargement : `/` était servie du cache, et `/agenda`,
 * `/meteo`, `/mon-pulse` et les fiches donnaient le DINOSAURE de Chrome.
 * Une route sur cinq. Dans une PWA installée il n'y a pas de barre d'adresse :
 * les quatre autres étaient une impasse dont on ne sort qu'en tuant l'app.
 *
 * ⚠ C'est un FICHIER STATIQUE, pas une route. Une route dépendrait du SSR,
 * c'est-à-dire du serveur — précisément ce qui manque quand on en a besoin.
 */
const HORS_LIGNE_URL = "/etape-0/hors-ligne.html";
const SHELL_URLS = ["/etape-0/", HORS_LIGNE_URL, "/etape-0/manifest.webmanifest", "/etape-0/favicon.svg"];
/** Au-delà, on sert la coquille en cache plutôt que de faire attendre. */
const SHELL_DELAI_MS = 1500;
/** Temps laissé aux clients pour se déclarer occupés avant qu'on les navigue. */
const GRACE_CLIENTS_MS = 1200;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Requête réseau explicite en mode "reload" pour éviter que le SW
      // capture une réponse elle-même issue d'un cache HTTP périmé.
      await Promise.all(
        SHELL_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload", credentials: "same-origin" });
            if (res && res.ok) await cache.put(url, res.clone());
          } catch (_) {
            // silencieux : l'app fonctionne sans précache
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * QUI PEUT ÊTRE NAVIGUÉ ? — LA POLARITÉ A ÉTÉ INVERSÉE (D-295)
 * ═════════════════════════════════════════════════════════════════════════════
 * D-288 faisait naviguer les clients d'autorité à l'activation, SAUF sur une
 * liste d'écrans jugés fragiles — l'administration, l'authentification, et les
 * jeux plein écran, « une partie en cours ne se rejoue pas ».
 *
 * Cette liste a produit exactement le défaut qu'elle voulait éviter ailleurs.
 * Le raisonnement, refait :
 *
 *  · le code qui écoute `shell-updated` appartient à l'ANCIEN build ;
 *  · sur un vieux bundle — celui d'avant D-291 — ce code exigeait
 *    `pathname === "/"` et ne rechargeait donc jamais ailleurs ;
 *  · et le worker, lui, refusait de naviguer les routes de jeu.
 *
 * Résultat : une PWA restaurée sur `/jeux/connect` avec un bundle ancien
 * n'avait **plus aucun chemin de sortie**. Ni le message, ni la navigation.
 * Elle pouvait rester indéfiniment sur sa version — ce qui est arrivé, et ce
 * qui obligeait à rouvrir le site dans Safari pour s'en défaire.
 *
 * La polarité est donc inversée, et c'est le seul réglage qui soit sûr :
 *
 *   > **LE SILENCE D'UN CLIENT VAUT « METS-MOI À JOUR ».**
 *   > Seul un client qui se DÉCLARE occupé est épargné.
 *
 * Un vieux bundle ne sait pas se déclarer : il est donc navigué, et il se
 * répare. Un bundle à jour qui porte une partie en cours répond
 * `pulse-differe`, garde la main, et affiche lui-même l'invitation à mettre à
 * jour (voir `register-sw.ts`). Aucun client ne peut plus rester bloqué sans
 * que personne ne s'en aperçoive.
 *
 * ⚠ CE QU'ON ACCEPTE DE PERDRE, ET C'EST BORNÉ. Un vieux bundle en pleine
 * partie sera navigué sans prévenir. Les deux jeux écrivent chaque tentative
 * dans `localStorage` au moment où elle devient vraie (D-278 ①, D-293 ②) :
 * ce qui se perd, c'est au plus une sélection de quatre tuiles non validée.
 * En face, on répare un appareil qui pouvait rester des semaines en arrière.
 *
 * ⚠ L'ADMINISTRATION ET L'AUTHENTIFICATION RESTENT EXCLUES. Elles portent des
 * saisies longues qui ne sont mémorisées nulle part, et `/admin` n'enregistre
 * même pas de worker. Le compromis n'y est pas le même : rien n'y est
 * récupérable, et personne n'y reste bloqué des semaines.
 */
function peutEtreNavigue(url) {
  let chemin;
  try {
    chemin = new URL(url).pathname;
  } catch (_) {
    return false;
  }
  // La même normalisation que `chrome-retour.ts`.
  if (chemin.length > 1 && chemin.endsWith("/")) chemin = chemin.slice(0, -1);
  if (chemin === "/etape-0/admin" || chemin.startsWith("/etape-0/admin/")) return false;
  // Pulse Control (D-686) : un cockpit en cours de geste ne se recharge pas
  // sous les doigts — et il a son propre worker, à la portée `/control`.
  if (chemin === "/etape-0/control" || chemin.startsWith("/etape-0/control/")) return false;
  if (chemin === "/etape-0/auth" || chemin.startsWith("/etape-0/auth/")) return false;
  return true;
}
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge de tous les caches d'anciennes versions.
      const keys = await caches.keys();
      const anciens = keys.filter((k) => k.startsWith("pulse-shell-v") && k !== SHELL_CACHE);
      await Promise.all(anciens.map((k) => caches.delete(k)));
      await self.clients.claim();

      /* ═══════════════════════════════════════════════════════════════════
         PREMIÈRE INSTALLATION OU VRAIE MISE À JOUR ? (D-291)
         ═══════════════════════════════════════════════════════════════════
         D-288 a fait recharger les clients à l'activation pour débloquer un
         appareil figé sur un vieux build. Le mécanisme est juste ; sa PORTÉE
         ne l'était pas. À la PREMIÈRE visite, ce worker s'installe et
         s'active alors que la page affiche déjà exactement le build qu'il
         vient de mettre en cache : il n'y a rien à mettre à jour, et l'on
         rechargeait quand même.

         Mesuré sur la production le 6 septembre 2026, contexte neuf, PWA iOS
         simulée : trois retours sur trois perdaient la position de
         défilement, contre zéro sur six en contexte déjà chaud. La trace le
         dit en clair — `sessionStorage` porte À LA FOIS `pulse-sw-reloaded-
         build` (nous) ET `tanstack_router_reload: "Importing a module script
         failed."` (le routeur), et le journal de navigation montre l'accueil
         chargé DEUX fois. Le premier rechargement annule les imports de
         chunk en vol ; le routeur voit l'échec et recharge à son tour. Une
         cascade, dont le seul déclencheur est une activation qui n'avait
         rien à débloquer.

         Le signal existait déjà, deux lignes plus haut : s'il n'y a AUCUN
         cache `pulse-shell-v*` d'une autre version, personne n'était servi
         avant nous. Pas de prédécesseur, pas de rechargement — ni la
         navigation ② ci-dessous, ni même le message ①, que `register-sw.ts`
         traduit lui aussi par un rechargement dans les huit secondes du
         démarrage. Les DEUX chemins se taisent, sinon on n'aurait fermé que
         la moitié de la cascade.

         ⚠ CE QUE ÇA NE CHANGE PAS : un appareil réellement figé a forcément
         un cache d'une version antérieure. Le correctif de D-288 reste entier
         là où il sert. */
      const miseAJour = anciens.length > 0;
      if (!miseAJour) return;

      /* ═══════════════════════════════════════════════════════════════════
         LA MISE À JOUR NE DOIT DÉPENDRE D'AUCUN JAVASCRIPT DE PAGE (D-288)
         ═══════════════════════════════════════════════════════════════════
         Reproduit en banc le 6 septembre 2026, moteur Chromium, avec CE
         fichier et le vrai `register-sw.ts` : une application déjà ouverte
         sur une sous-page voit le nouveau worker s'installer, s'activer et
         purger les caches — et reste servie par l'ancien bundle. Zéro
         rechargement. Seule la fermeture COMPLÈTE du processus la débloquait.
         Une PWA iOS n'est presque jamais fermée : elle est suspendue puis
         restaurée sur sa dernière route. Elle peut donc rester des semaines
         sur un build périmé. C'est ce qui est arrivé — trois chantiers de
         navigation publiés, aucun reçu.

         La cause n'est pas ici, elle est page-side : `register-sw.ts`
         conditionnait le rechargement à `pathname === "/"`. Mais la CORRECTION
         doit être ici, et voici pourquoi : le code qui reçoit `shell-updated`
         appartient à l'ANCIEN build. Toute amélioration du script de page
         n'a d'effet qu'après la mise à jour qu'elle était censée permettre.
         Le service worker est le SEUL composant qui s'exécute toujours dans
         sa version neuve — le navigateur le revalide (`Cache-Control:
         no-cache`) et exécute le fichier fraîchement téléchargé.

         Donc : on notifie ① pour les pages qui savent écouter, et on navigue
         ② pour toutes les autres. Deux mécanismes indépendants, dont le
         second ne suppose rien du bundle chargé.

         ⚠ ET LES DEUX NE S'EXÉCUTENT QUE SUR UNE VRAIE MISE À JOUR — voir la
         garde `miseAJour` juste au-dessus. À la première installation, il n'y
         a rien à débloquer et tout à casser.

         ⚠ PAS DE BOUCLE POSSIBLE : `activate` ne se déclenche qu'une fois par
         version de worker. La navigation provoque un chargement de page, donc
         un contrôle de mise à jour, qui ne trouve rien de neuf — pas de
         nouvelle installation, pas de nouvelle activation.

         ⚠ `client.navigate()` demande Safari 16.4+ — la même version qui a
         apporté le support des service workers aux applications installées
         sur iOS. Un iPhone capable d'exécuter ce fichier sait donc l'appeler.
         Le `typeof` reste là pour les moteurs plus anciens, où le message ①
         garde la main. */
      /* ═══════════════════════════════════════════════════════════════════
         ON ANNONCE, ON LAISSE UNE PORTE, PUIS ON NAVIGUE (D-295)
         ═══════════════════════════════════════════════════════════════════
         Trois temps, dans cet ordre :
          ① on annonce la nouvelle version à tous les clients ;
          ② on laisse `GRACE_CLIENTS_MS` à ceux qui savent répondre pour se
             déclarer occupés (`pulse-differe`) — une partie en cours, une
             saisie ;
          ③ on navigue tous les autres. Le silence vaut consentement, et c'est
             ce qui garantit qu'un bundle trop ancien pour savoir répondre
             finisse toujours par se réparer.

         ⚠ LA RÉPONSE PASSE PAR UN `MessageChannel`, pas par un
         `postMessage` global. Un client répondant sur le canal général
         obligerait le worker à écouter en permanence et à démêler qui parle ;
         ici chaque annonce porte son propre port, la réponse ne peut pas être
         confondue avec une autre, et le port meurt avec l'échéance. */
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const differes = new Set();
      await Promise.all(
        clientsList.map(
          (client) =>
            new Promise((resolve) => {
              let fini = false;
              const terminer = () => {
                if (fini) return;
                fini = true;
                resolve();
              };
              try {
                const canal = new MessageChannel();
                canal.port1.onmessage = (e) => {
                  if (e.data && e.data.type === "pulse-differe") differes.add(client.id);
                  terminer();
                };
                client.postMessage({ type: "shell-updated", buildId: BUILD_ID }, [canal.port2]);
              } catch (_) {
                terminer();
              }
              setTimeout(terminer, GRACE_CLIENTS_MS);
            }),
        ),
      );

      /* ═══════════════════════════════════════════════════════════════════
         ⚠ ON N'ATTEND JAMAIS `client.navigate()`. JAMAIS. (D-298)
         ═══════════════════════════════════════════════════════════════════
         C'était `await client.navigate(client.url)`, et c'était LA cause du
         bug que trois chantiers ont cherché ailleurs.

         Le raisonnement, qui n'a rien d'exotique une fois vu : cette boucle
         est dans le `waitUntil` de l'activation, donc le worker reste en état
         `activating` tant qu'elle n'a pas fini. Or sous WebKit, la navigation
         d'un client CONTRÔLÉ attend que son worker soit `activated`. Le worker
         attend la navigation, la navigation attend le worker : interblocage.

         Mesuré, même banc, même page, une seule ligne d'écart :
           · `await client.navigate(...)` → worker `activating` pour toujours,
             version JAMAIS rattrapée, et le `location.reload()` de la page ne
             commet pas non plus — puisqu'il est bloqué par le même verrou ;
           · `client.navigate(...).catch(...)` → worker `activated`, version
             rattrapée, page rechargée proprement.

         ⚠ CE VERROU BLOQUAIT TOUTES LES VOIES DE SORTIE À LA FOIS, et c'est
         ce qui rendait le diagnostic trompeur : cinq mécanismes d'échappement
         différents ont été essayés au banc — rechargement, purge des caches
         puis rechargement, désinscription du worker, changement d'URL, et les
         trois combinés — TOUS échouaient à l'identique. Ce n'était pas cinq
         échecs, c'était un seul verrou en amont. D-295 ⑥ bis en a conclu « une
         limite du banc WebKit » : c'était faux, et cette décision le corrige.

         ⚠ Chromium, lui, ne bloquait pas : les deux variantes y passent. Un
         banc Chromium seul ne pouvait donc RIEN voir. C'est la raison d'être
         du banc WebKit. */
      for (const client of clientsList) {
        if (differes.has(client.id)) continue;
        try {
          if (typeof client.navigate === "function" && peutEtreNavigue(client.url)) {
            client.navigate(client.url).catch(function () {
              /* refusée (client non contrôlé, URL hors périmètre) : le message
                 reste le chemin de repli */
            });
          }
        } catch (_) {
          // `navigate` absent ou jetant de façon synchrone : idem.
        }
      }
    })(),
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LE WORKER VÉRIFIE SA PROPRE MISE À JOUR (D-298)
   ═══════════════════════════════════════════════════════════════════════════
   D-288 avait déjà nommé le problème : « une PWA résidente ne demande jamais
   /sw.js ». iOS suspend l'application et la restaure telle quelle — aucun
   chargement de document, donc aucun contrôle de version par le navigateur.
   La réponse d'alors était un `registration.update()` au retour au premier
   plan, côté PAGE. Elle est juste, et elle a un défaut structurel : elle vit
   dans le bundle qu'il faut justement télécharger pour l'obtenir. Un appareil
   resté sur un build antérieur ne l'a pas, et ne l'aura jamais par ce chemin.

   Le service worker, lui, est le SEUL composant qui s'exécute toujours dans sa
   version fraîche — et il se réveille à chaque requête réseau de
   l'application, y compris quand la page n'a rien rechargé. C'est donc ici que
   le contrôle doit vivre, en plus de la page et non à sa place.

   ⚠ IL EST BRIDÉ, ET CE N'EST PAS DÉCORATIF. `registration.update()` fait une
   requête réseau : sans limite, chaque image et chaque appel d'API en
   déclencherait une. Une fois par demi-heure suffit très largement pour un
   produit qui publie quelques fois par jour, et ne coûte rien.

   ⚠ ET IL N'EST PAS ATTENDU NON PLUS. Même leçon qu'au-dessus : rien de ce
   qui touche au cycle de vie du worker ne doit jamais bloquer un chemin par
   lequel une réponse est servie. */
const CONTROLE_INTERVALLE_MS = 30 * 60 * 1000;
let dernierControleVersion = 0;

function controlerVersionSiUtile() {
  const maintenant = Date.now();
  if (maintenant - dernierControleVersion < CONTROLE_INTERVALLE_MS) return;
  dernierControleVersion = maintenant;
  try {
    self.registration.update().catch(function () {
      /* hors ligne, ou contrôle déjà en cours : sans conséquence */
    });
  } catch (_) {
    /* moteur sans `update()` sur la registration : on n'insiste pas */
  }
}

// Fetch : réseau d'abord (cache en secours) pour la navigation vers "/",
// cache-first strict pour les assets hachés.
// Tout le reste = passthrough réseau natif (pas de event.respondWith).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  controlerVersionSiUtile();
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* LA BASCULE VERS werup.app (D-1590) : sur l'ancien domaine, plus rien ne sort du
     cache — chaque requête va au Worker, qui redirige ou sert la page de transfert.
     Sans cela, la coquille en cache de `/` (D-295) ferait rouvrir l'ancienne
     application hors de la migration. À passer à `true` avec la phase de
     `src/lib/migration/domaines.ts`. */
  if (MIGRATION_BASCULE && /(^|\.)perpignanpulse\.com$/.test(self.location.hostname)) return;

  // Assets hashés immuables (/assets/*.css | *.js) : cache-first strict.
  // Hashés par le build → aucun risque de version périmée. La purge par
  // BUILD_ID à l'activation borne le stockage à chaque déploiement.
  if (
    req.mode !== "navigate" &&
    url.pathname.startsWith("/assets/") &&
    (url.pathname.endsWith(".css") || url.pathname.endsWith(".js"))
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          try {
            await cache.put(req, fresh.clone());
          } catch (_) {}
        }
        return fresh;
      })(),
    );
    return;
  }

  if (req.mode !== "navigate") return;

  /* ═════════════════════════════════════════════════════════════════════════
     LE FILET HORS LIGNE DES AUTRES ROUTES — T-01
     ═════════════════════════════════════════════════════════════════════════
     ⚠ ON NE DEVANCE JAMAIS LE RÉSEAU ICI, ET C'EST TOUTE LA CONCEPTION.

     Le correctif « évident » aurait été d'étendre à toutes les navigations le
     motif de `/` — réseau d'abord, coquille en cache après `SHELL_DELAI_MS`.
     Il est plus dangereux que le défaut qu'il corrige : il servirait le
     document de `/` SOUS L'URL `/agenda`, c'est-à-dire une charge utile SSR
     qui ne correspond pas à la route, en pleine hydratation TanStack Start. Et
     pas seulement hors ligne : sur un réseau lent — le banc de D-295 mesure la
     coquille servie à 1 520 ms sur 6 s de latence — un lecteur EN LIGNE sur
     `/agenda` recevrait l'accueil. On échangerait une impasse rare contre une
     régression quotidienne.

     Ici, aucune course, aucun délai, aucun cache consulté par avance : on
     passe la requête au réseau, telle quelle. La branche ne s'ouvre QUE si le
     `fetch` ÉCHOUE — c'est-à-dire quand la seule autre issue possible est la
     page d'erreur du navigateur. Un réseau lent n'y entre jamais ; il n'y a
     rien à arbitrer entre deux réponses, puisqu'il n'y en a qu'une.

     ⚠ ET LE REPLI EST SERVI SOUS L'URL DEMANDÉE, ce qui est voulu : l'adresse
     reste `/agenda`, donc « Réessayer » y revient vraiment. C'est le motif de
     repli hors ligne standard ; il ne fonctionne que parce que la page servie
     ne porte AUCUN script d'application, donc rien qui puisse s'étonner de
     l'URL sous laquelle elle est rendue.

     ⚠ `catch` SEULEMENT, PAS `!res.ok`. Un 404 ou un 500 sont des réponses du
     serveur, et le produit a ses propres écrans pour ça. Les remplacer par
     « pas de connexion » serait un second mensonge. */
  if (url.pathname !== "/etape-0/" && url.pathname !== "/etape-0") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(SHELL_CACHE);
        const repli = await cache.match(HORS_LIGNE_URL);
        if (repli) return repli;
        /* La coquille n'a pas été précachée — installation interrompue, quota
           plein. On rend quand même un document lisible plutôt qu'un corps
           vide : quelques lignes valent mieux qu'un écran noir muet. */
        return new Response(
          "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>" +
            "<title>Hors ligne</title>" +
            "<body style='margin:0;height:100vh;display:flex;align-items:center;justify-content:center;" +
            "background:#111;color:#fff;font:600 16px/1.5 -apple-system,system-ui,sans-serif;text-align:center'>" +
            "<div><p>Pas de connexion.</p><p style='font-weight:400;opacity:.6'>" +
            "<a href='/etape-0/' style='color:#fff'>Aller à l\u2019accueil</a></p></div>",
          { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }),
    );
    return;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     RÉSEAU D'ABORD, CACHE EN SECOURS — ET C'EST UN RENVERSEMENT (D-295)
     ═════════════════════════════════════════════════════════════════════════
     C'était « cache d'abord, revalidation derrière ». Le raisonnement était
     bon — supprimer la fenêtre blanche au démarrage à froid — mais sa
     conséquence ne l'était pas : au premier démarrage suivant un déploiement,
     l'application servait TOUJOURS la coquille de la veille. Elle bootait donc
     sur l'ancien build, découvrait la mise à jour, et se rechargeait sous les
     yeux de l'utilisateur. Mesuré au banc : « 1re ouverture : v1 », puis v2
     deux secondes plus tard.

     Le réseau d'abord avec un délai court obtient les deux : sur une connexion
     normale le HTML frais arrive en quelques centaines de millisecondes — donc
     PAS de version périmée, et pas de fenêtre blanche non plus puisque le SSR
     peint immédiatement. Le cache ne sert plus que dans le cas pour lequel il
     avait été fait : réseau lent ou absent.

     ⚠ LE DÉLAI EST UNE COURSE, PAS UN `setTimeout` QUI ANNULE. La requête
     réseau continue et met le cache à jour même si le repli a déjà répondu :
     abandonner la réponse en vol ferait vieillir le cache d'un tour à chaque
     démarrage lent. */
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      /* ⚠ LA REQUÊTE DE NAVIGATION ELLE-MÊME, PAS UN `fetch("/")` REFAIT (D-915).
         L'hébergeur épingle chaque client sur le déploiement qu'il a chargé : un
         cookie `__dpl`, valable 24 h. Il ne sert le DERNIER déploiement — et ne
         ré-épingle — qu'à une vraie navigation (`Sec-Fetch-Mode: navigate`,
         `Sec-Fetch-Dest: document`), mesuré en-tête par en-tête le 14/10. Ce
         `fetch("/")` refait par le worker n'en était pas une : l'app installée,
         qui démarre sur `/`, recevait le déploiement épinglé — la version
         d'avant, jusqu'à 24 h après sa dernière vraie navigation —, et sa
         vérification de version relisait le même `sw.js`. C'est « la PWA reste
         sur l'ancienne version malgré la publication ».
         ⚠ ET LE CACHE NE GARDE QUE LA RACINE NUE : une navigation vers
         `/?ciel=1` est servie telle qu'elle est demandée, mais ne remplace pas
         la coquille de `/`. Le cache HTTP n'est pas un risque : `/` est servie
         en `no-cache, must-revalidate`. */
      const racineNue = url.search === "";
      const reseau = fetch(req)
        .then(async (res) => {
          /* Jamais une page de transfert (D-1590) : elle porte un code à usage unique. */
          if (res && res.ok && racineNue && !res.headers.get("x-werup-transfert")) {
            try {
              await cache.put("/etape-0/", res.clone());
            } catch (_) {}
          }
          return res;
        })
        .catch(() => null);
      event.waitUntil(reseau);

      const cached = await cache.match("/etape-0/");
      if (!cached) {
        const fresh = await reseau;
        if (fresh) return fresh;
        /* ⚠ CE 504 AVAIT UN CORPS VIDE — un écran entièrement noir, sans un
           mot (T-01). Il ne s'atteint que si la coquille n'a pas été précachée
           ET que le réseau tombe, mais l'issue pour le lecteur était pire que
           la page d'erreur du navigateur : au moins celle-ci dit quelque
           chose. On sert le même repli que les autres routes. */
        const repli = await cache.match(HORS_LIGNE_URL);
        if (repli) return repli;
        return new Response("", { status: 504, statusText: "Offline" });
      }

      const gagnant = await Promise.race([
        reseau,
        new Promise((r) => setTimeout(() => r(null), SHELL_DELAI_MS)),
      ]);
      return gagnant || cached;
    })(),
  );
});

// --- Notifications push (V1 test interne) — INCHANGÉ ---
self.addEventListener("push", (event) => {
  let payload = { title: "Werup", body: "Nouvelle notification", url: "/etape-0/" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch (_) {
    // payload non JSON : on garde les valeurs par défaut
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      /* ⚠ « /icon-192.png », PAS « /icons/… » — MESURÉ EN PRODUCTION LE
         09/09/2026. Le chemin portait un répertoire `icons/` qui n'existe pas :
         `curl https://perpignanpulse.com/icons/icon-192.png` rendait **404**
         (26 956 octets de page d'erreur HTML), quand `/icon-192.png` rend
         **200 image/png, 18 467 octets**. Aucun `public/icons/` dans le dépôt,
         et ces deux lignes étaient les seules du projet à le nommer.
         Conséquence : chaque briefing quotidien arrivait sur Android SANS
         l'icône Pulse — une notification anonyme, avec un badge générique dans
         la barre d'état. C'est le seul endroit où la marque apparaît hors de
         l'application.
         ⚠ AVEC LE `?v=` DU MANIFESTE (D-1572) : sans lui, une icône en cache
         HTTP montrerait encore le P de Perpignan Pulse sous le W de WERUP. */
      icon: "/etape-0/icon-192.png?v=6",
      badge: "/etape-0/icon-192.png?v=6",
      data: { url: payload.url || "/etape-0/" },
      tag: payload.tag || "pulse-default",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/etape-0/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) {
            try {
              /* ⚠ NON ATTENDU, comme partout ailleurs dans ce fichier (D-298).
                 L'interblocage prouvé sous WebKit concerne l'activation, pas
                 ce gestionnaire — mais la forme est la même, le `return` qui
                 suit rend l'attente inutile, et on ne laisse pas traîner dans
                 le fichier la construction exacte qui vient de coûter trois
                 chantiers. Une règle qui souffre une exception ne se retient
                 pas. */
              client.navigate(targetUrl).catch(function () {});
            } catch (_) {}
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
