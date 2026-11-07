/* ═══════════════════════════════════════════════════════════════════════════
   BANC — LA BARRE DE NAVIGATION DE WERUP (essai isolé, BN-01, 07/11/2026)
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const racine = document.documentElement;
  const params = new URLSearchParams(location.search);
  const standaloneReel =
    matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  /* ── l'état de l'essai (chaque réglage est aussi lisible dans l'adresse) ── */
  const DEFAUT = {
    mode: standaloneReel ? "pwa" : "navigateur", // navigateur | pwa | pwa-grande | pwa-reduite
    h: "62",
    e: "10",
    s: "galet", // galet | galet-vectoriel | flaneur | masquee | isard | corsaire | coeur | coeur-pulse
    av: "24",
    actif: "0",
    fond: "defile", // defile | noir | blanc | photo | vert
    pose: "36",
    marge: "16",
    gabarit: "A",
    plafond: "420",
    texte: "100",
    matiere: "affinee",
    loupe: "rentree",
    point: "non",
  };
  const etat = { ...DEFAUT };
  if (params.has("planche")) racine.classList.add("planche");
  for (const k of Object.keys(DEFAUT)) if (params.has(k)) etat[k] = params.get(k);
  if (etat.gabarit === "B") for (const [k, v] of Object.entries({ h: "66", e: "11", av: "28" })) if (!params.has(k)) etat[k] = v;

  const ONGLETS = [
    { nom: "Accueil", g: "accueil" },
    { nom: "Live", g: "live" },
    { nom: "Sortir", g: "sortir" },
    { nom: "Recherche", g: "recherche" },
    { nom: "Mon Werup", g: "monwerup" },
  ];
  const PERSONNAGES = {
    galet: "Galet (généré) — défaut",
    "galet-vectoriel": "Galet (vectoriel) — défaut",
    flaneur: "Le flâneur (accessoires)",
    masquee: "La masquée",
    isard: "L'isard",
    corsaire: "Le corsaire",
  };

  /* ── les fonds ── */
  const FONDS = {
    noir: ["fond-noir", "Fond noir"],
    blanc: ["fond-blanc", "Fond blanc"],
    photo: ["fond-photo", "Photo (sortie)"],
    vert: ["fond-vert", "Vert vif"],
    photo2: ["fond-photo2", "Photo (mer)"],
  };
  function rendreFonds() {
    const ordre = etat.fond === "defile" ? ["noir", "photo", "blanc", "vert", "photo2"] : racine.classList.contains("planche") ? [etat.fond] : [etat.fond, etat.fond, etat.fond];
    $("#fonds").innerHTML = ordre
      .map(
        (f) =>
          `<section class="fond ${FONDS[f][0]}"><span class="nom">${FONDS[f][1]}</span><p class="texte-temoin">Werup — Perpignan et les Pyrénées-Orientales : sortir, la météo en direct, le cinéma, et tout ce que vous avez gardé dans Mon Werup.</p></section>`,
      )
      .join("");
  }

  /* ── le symbole de Mon Werup ── */
  function symboleMonWerup(actif) {
    if (etat.s === "coeur") return `<svg viewBox="0 0 24 24">${GLYPHES.coeur(actif)}</svg><span class="point"></span>`;
    if (etat.s === "coeur-pulse") return `<svg viewBox="0 0 24 24">${GLYPHES.coeurPulse(actif)}</svg><span class="point"></span>`;
    const n = +etat.av;
    if (etat.s === "galet-vectoriel")
      return `<span class="pastille"><img src="avatars/galet-vectoriel.svg" width="${n}" height="${n}" alt=""><span class="point"></span></span>`;
    const src = (k) => `avatars/${etat.s}-${n * k}.webp`;
    return `<span class="pastille"><img src="${src(1)}" srcset="${src(1)} 1x, ${src(2)} 2x, ${src(3)} 3x" width="${n}" height="${n}" alt="" decoding="async"><span class="point"></span></span>`;
  }

  function rendreBarre() {
    const actif = +etat.actif;
    const html = ONGLETS.map((o, i) => {
      const a = i === actif;
      let g;
      if (o.g === "monwerup") g = symboleMonWerup(a);
      else if (o.g === "recherche") g = `<svg viewBox="0 0 24 24">${(GLYPHES.loupes[etat.loupe] || GLYPHES.loupes.servie)(a)}</svg>`;
      else g = `<svg viewBox="0 0 24 24">${GLYPHES[o.g](a)}</svg>`;
      const nom = o.nom === "Mon Werup" ? 'Mon<span class="br"></span> Werup' : o.nom;
      return `<a class="cible" href="#" data-i="${i}" aria-label="${o.nom}"${a ? ' aria-current="page"' : ""}><span class="glyphe">${g}</span><span class="etiq">${nom}</span></a>`;
    }).join("");
    $("#rangee").innerHTML = `<span class="pilule" id="pilule"></span>` + html;
  }

  /* ── la géométrie : variables, débord, adaptation des légendes, pilule ── */
  const barre = () => $("#barre");
  function appliquerVariables() {
    const r = racine.style;
    const h = +etat.h;
    r.setProperty("--h", h + "px");
    r.setProperty("--h-reduite", "52px");
    r.setProperty("--avatar", etat.av + "px");
    r.setProperty("--max", etat.plafond + "px");
    const navigateur = etat.mode === "navigateur";
    r.setProperty("--marge", navigateur ? "12px" : etat.marge + "px");
    racine.dataset.matiere = etat.matiere;
    barre().dataset.point = etat.point;
    barre().dataset.mode = etat.mode;
    barre().dataset.legendes = etat.mode === "pwa-reduite" ? "non" : "oui";
    // la pose basse : en navigateur, la formule servie ; en PWA, la variante comparée
    if (navigateur) r.setProperty("--pose", "calc(max(env(safe-area-inset-bottom, 0px), 8px) + 2px)");
    else r.setProperty("--pose", etat.pose + "px");
  }

  /** Mesure la largeur naturelle des cinq légendes au corps donné (graisse 600, la plus large). */
  function largeursLegendes(corps, ls) {
    const sonde = document.createElement("span");
    sonde.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:600 ${corps}px/1 Inter, sans-serif;letter-spacing:${ls}`;
    document.body.appendChild(sonde);
    const w = ONGLETS.map((o) => { sonde.textContent = o.nom; return sonde.getBoundingClientRect().width; });
    sonde.textContent = "Werup"; const werup = sonde.getBoundingClientRect().width;
    sonde.remove();
    return { w, werup };
  }

  /**
   * LA DISPOSITION — calculée, pour que les cinq légendes restent lisibles partout.
   * Tant que tout tient, les icônes sont à pas égal et la pilule fait « pas + 2 × débord ».
   * Sinon : seuls les écarts trop courts s'élargissent, juste ce qu'il faut (les autres restent
   * égaux entre eux), et la pilule s'élargit pour contenir sa légende avec de l'air.
   * Niveaux : 0 pas égal · 1 écarts ajustés · 2 lettres resserrées · 3 « Mon Werup » sur deux lignes.
   */
  const JEU = 6;
  function debordPour(W) { return Math.max(0, Math.min(6, (W - 340) / 10)); }
  function disposer(W, w, air, g) {
    const d = debordPour(W), pas = (W - 2 * (JEU + d)) / 5, P0 = pas + 2 * d;
    if (!w) return { ok: true, uniforme: true, d, c: [0, 1, 2, 3, 4].map((i) => JEU + d + pas / 2 + i * pas), pil: [P0, P0, P0, P0, P0] };
    const pil = w.map((x) => Math.max(P0, x + 2 * air));
    const lo = JEU + pil[0] / 2, hi = W - JEU - pil[4] / 2, span = hi - lo;
    const dmin = [0, 1, 2, 3].map((i) => Math.max((w[i] + w[i + 1]) / 2 + g, 40));
    if (dmin.reduce((a, x) => a + x, 0) > span + 0.01) return { ok: false };
    let s = span / 4;
    for (let k = 0; k < 6; k++) {
      const fixes = dmin.filter((x) => x > s);
      s = (span - fixes.reduce((a, x) => a + x, 0)) / (4 - fixes.length || 1);
    }
    const c = [lo];
    for (let i = 0; i < 4; i++) c.push(c[i] + Math.max(dmin[i], s));
    const uniforme = Math.abs(s - pas) < 0.5 && dmin.every((x) => x <= s + 0.01) && pil.every((x) => Math.abs(x - P0) < 0.5);
    return { ok: true, uniforme, d, c, pil };
  }

  let niveau = 0, dispo = null;
  function adapter() {
    const b = barre();
    const corps = (+etat.e * +etat.texte) / 100;
    const r = racine.style;
    const gap = 3;
    /* la boîte du symbole de Mon Werup : la pastille et son anneau actif (1,5 px collé) comptent ;
       les légendes de toutes les cellules se posent sous la plus haute boîte, pour rester alignées */
    const avatar = !String(etat.s).startsWith("coeur");
    const boite = avatar ? +etat.av + 3 : 26;
    r.setProperty("--boite", boite + "px");
    r.setProperty("--etiq-eff", corps + "px");
    r.setProperty("--gap", gap + "px");
    const W = b.getBoundingClientRect().width;
    const compact = b.dataset.compact === "true" || b.dataset.legendes === "non";
    if (!compact) {
      let n = 0, lignes = 1, ls = "0.005em";
      let { w, werup } = largeursLegendes(corps, ls);
      let res = disposer(W, w, 6, 8);
      if (res.ok && !res.uniforme) n = 1;
      if (!res.ok) { n = 2; ls = "-0.01em"; ({ w, werup } = largeursLegendes(corps, ls)); res = disposer(W, w, 5, 6); }
      if (!res.ok) { n = 3; lignes = 2; const w2 = w.slice(); w2[4] = werup; res = disposer(W, w2, 5, 6); }
      niveau = n; dispo = res;
      b.dataset.adapte = String(n);
      r.setProperty("--etiq-ls", ls);
      const lh = corps * 1.05 * lignes;
      r.setProperty("--lh-etiq", lh.toFixed(2) + "px");
      // la capsule grandit si le contenu l'exige (texte agrandi), jamais en dessous du réglage choisi
      const hMin = Math.ceil(boite + gap + lh + 2 * 4 + 2 * JEU);
      r.setProperty("--h", Math.max(+etat.h, hMin) + "px");
    } else {
      dispo = disposer(W, null); // réduite : pas égal, icônes seules
    }
    if (!dispo || !dispo.ok) dispo = disposer(W, null);
    // les colonnes (zones tactiles) vont d'un milieu à l'autre, du bord gauche au bord droit de la capsule
    const c = dispo.c, bornes = [0, (c[0] + c[1]) / 2, (c[1] + c[2]) / 2, (c[2] + c[3]) / 2, (c[3] + c[4]) / 2, W];
    $("#rangee").style.gridTemplateColumns = bornes.slice(1).map((x, i) => (x - bornes[i]).toFixed(2) + "px").join(" ");
    b.querySelectorAll(".cible").forEach((el, i) => el.style.setProperty("--cx", (c[i] - bornes[i]).toFixed(2) + "px"));
    placerPilule();
    lireMesure();
  }

  function placerPilule() {
    const p = $("#pilule"), i = +etat.actif;
    if (!p || !dispo) return;
    const l = dispo.pil[i], x = dispo.c[i] - l / 2;
    p.style.width = l.toFixed(2) + "px";
    p.style.transform = `translateX(${x.toFixed(2)}px)`;
  }

  /* ── la réduction : la règle de production, reprise telle quelle (use-scroll-direction.ts) ── */
  const SEUIL = 6, ZONE_HAUTE = 80, ZONE_BASSE = 120;
  function deciderRetraction(e, y, hauteurMax) {
    const max = Math.max(0, hauteurMax);
    const clampe = Math.min(Math.max(y, 0), max);
    if (y !== clampe) return { retracte: false, dernierY: clampe };
    if (y < ZONE_HAUTE) return { retracte: false, dernierY: y };
    if (y > max - ZONE_BASSE) return { retracte: false, dernierY: y };
    const delta = y - e.dernierY;
    if (Math.abs(delta) < SEUIL) return e;
    return { retracte: delta > 0, dernierY: y };
  }
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ref = { retracte: false, dernierY: scrollY }, tic = false;
  function lireDefilement() {
    tic = false;
    const b = barre();
    if (etat.mode === "pwa-grande" || etat.mode === "navigateur") { b.dataset.compact = "false"; return; }
    if (etat.mode === "pwa-reduite") { b.dataset.compact = "true"; return; }
    if (reduit) { b.dataset.compact = "false"; return; }
    const max = document.documentElement.scrollHeight - innerHeight;
    ref = deciderRetraction(ref, scrollY, max);
    const v = ref.retracte ? "true" : "false";
    if (b.dataset.compact !== v) { b.dataset.compact = v; adapter(); setTimeout(adapter, 300); }
  }
  addEventListener("scroll", () => { if (!tic) { tic = true; requestAnimationFrame(lireDefilement); } }, { passive: true });

  /* ── le suivi de la barre d'outils de Safari (use-safari-bottom-bar-inset.ts), navigateur de téléphone ── */
  (function suiviSafari() {
    const vv = window.visualViewport; const el = $(".ancre");
    if (!vv || standaloneReel) return;
    const telephone = matchMedia("(max-width: 767px), (max-height: 499px)");
    let dernierFond = -1, dernierY = -1, raf = 0;
    const appliquer = () => {
      raf = 0;
      if (!telephone.matches || etat.mode !== "navigateur") { if (dernierY !== -1) { el.style.transform = ""; el.style.top = ""; el.style.bottom = ""; dernierY = -1; } dernierFond = -1; return; }
      const fond = Math.round(vv.offsetTop + vv.height);
      if (fond === dernierFond) return; dernierFond = fond;
      const hb = el.offsetHeight; if (!hb) return;
      const y = Math.max(0, fond - hb); if (y === dernierY) return; dernierY = y;
      el.style.top = "0"; el.style.bottom = "auto"; el.style.transform = `translate3d(0, ${y}px, 0)`;
    };
    const tick = () => { if (!raf) raf = requestAnimationFrame(appliquer); };
    const force = () => { dernierFond = -1; tick(); };
    vv.addEventListener("resize", force); vv.addEventListener("scroll", tick);
    addEventListener("resize", force); addEventListener("scroll", tick, { passive: true });
    window.__forcerSuivi = force;
    appliquer();
  })();

  /* ── la mesure affichée ── */
  function lireMesure() {
    const b = barre().getBoundingClientRect(), p = $("#pilule").getBoundingClientRect();
    const corps = (+etat.e * +etat.texte) / 100;
    const fond = innerHeight - b.bottom;
    $("#mesure").innerHTML =
      `${standaloneReel ? "App installée" : "Navigateur"} · ${innerWidth} px · ×${devicePixelRatio}<br>` +
      `Capsule ${b.width.toFixed(0)} × ${b.height.toFixed(0)} · pilule ${p.width.toFixed(0)} × ${p.height.toFixed(0)}<br>` +
      `Légendes ${corps.toFixed(1)} px · adaptation ${niveau} · bas ${fond.toFixed(0)} px`;
  }

  /* ── les réglages ── */
  const REGLAGES = [
    ["gabarit", "Gabarit à comparer", [["A", "A — 62 · 10 px · 24"], ["B", "B — 66 · 11 px · 28"]]],
    ["mode", "Contexte", [["navigateur", "Navigateur"], ["pwa", "PWA, réduction au défilement"], ["pwa-grande", "PWA grande"], ["pwa-reduite", "PWA réduite"]]],
    ["s", "Mon Werup", [...Object.entries(PERSONNAGES), ["coeur", "Cœur simple (comparaison)"], ["coeur-pulse", "Signe actuel"]]],
    ["av", "Taille de la pastille", [["24", "24 px"], ["28", "28 px"]]],
    ["actif", "Onglet actif", ONGLETS.map((o, i) => [String(i), o.nom])],
    ["h", "Hauteur", [["62", "62 px"], ["66", "66 px"]]],
    ["e", "Légendes", [["10", "10 px"], ["11", "11 px"]]],
    ["texte", "Texte agrandi (futur réglage)", [["100", "100 %"], ["115", "115 %"], ["130", "130 %"], ["150", "150 %"]]],
    ["fond", "Fond", [["defile", "Les quatre, au défilé"], ["noir", "Noir"], ["blanc", "Blanc"], ["photo", "Photo"], ["vert", "Vert vif"]]],
    ["pose", "PWA : distance au bas de l'écran", [["36", "36 (actuelle)"], ["30", "30"], ["24", "24"]]],
    ["marge", "PWA : retrait latéral", [["12", "12"], ["16", "16"], ["20", "20"], ["24", "24"]]],
    ["plafond", "Largeur maximale", [["372", "372 (actuelle)"], ["420", "420"]]],
    ["matiere", "Matière", [["actuelle", "Actuelle"], ["affinee", "Affinée"]]],
    ["loupe", "Loupe", [["servie", "Servie"], ["modere", "① Ouverture modérée"], ["rentree", "② Étoile rentrée"], ["presente", "③ Étoile présente"]]],
    ["point", "Point de nouveauté", [["non", "Non"], ["oui", "Oui"]]],
  ];
  function rendreReglages() {
    $("#reglages").innerHTML = REGLAGES.map(
      ([k, titre, opts]) =>
        `<div class="reglage"><span>${titre}</span><div class="choix">${opts
          .map(([v, t]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${etat[k] === v}">${t}</button>`)
          .join("")}</div></div>`,
    ).join("");
  }
  function ecrireAdresse() {
    const q = new URLSearchParams();
    for (const k of Object.keys(DEFAUT)) if (etat[k] !== DEFAUT[k]) q.set(k, etat[k]);
    history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : ""));
  }
  function toutRendre(fonds) {
    if (fonds) rendreFonds();
    appliquerVariables();
    rendreBarre();
    rendreReglages();
    lireDefilement();
    adapter();
    if (window.__forcerSuivi) window.__forcerSuivi();
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-k]");
    if (b) {
      etat[b.dataset.k] = b.dataset.v;
      if (b.dataset.k === "gabarit") Object.assign(etat, b.dataset.v === "A" ? { h: "62", e: "10", av: "24" } : { h: "66", e: "11", av: "28" });
      ecrireAdresse(); toutRendre(b.dataset.k === "fond"); return;
    }
    const c = ev.target.closest(".cible");
    if (c) { ev.preventDefault(); etat.actif = c.dataset.i; ecrireAdresse(); rendreBarre(); adapter(); return; }
  });
  $("#ouvrir").addEventListener("click", () => { $("#tiroir").dataset.ouvert = "oui"; });
  $("#fermer").addEventListener("click", () => { $("#tiroir").dataset.ouvert = "non"; });
  addEventListener("resize", () => adapter());
  /* la pilule suit la capsule pendant ses transitions (largeur, réduction) : sans ce suivi, elle se
     plaçait sur la largeur d'AVANT et débordait de 1,9 px à droite au chargement (mesuré) */
  if (window.ResizeObserver) new ResizeObserver(() => adapter()).observe($("#barre"));
  racine.classList.add("sans-anim");
  requestAnimationFrame(() => requestAnimationFrame(() => racine.classList.remove("sans-anim")));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => adapter());
  toutRendre(true);
  window.__etat = etat; window.__adapter = adapter;
})();
