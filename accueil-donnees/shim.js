/* Aperçu STATIQUE de la branche chantier/accueil-lumiere (pas la production) : ce script remplace
   le serveur. Les fonctions serveur sont rejouées depuis des réponses enregistrées ; l'horloge est
   celle de la capture. « Photo suivante » sert une autre une réelle et avance l'horloge de 11 minutes :
   la carte relit alors la une comme au retour dans l'application, par son vrai circuit. */
(function () {
  var D = Date, base = D.parse("2026-11-02T14:05:15.218Z");
  if (!isFinite(base)) return;
  var p0 = performance.now();
  window.__apercuDecalage = 0;
  function maintenant() { return base + window.__apercuDecalage + (performance.now() - p0); }
  function DateFigee() {
    if (!(this instanceof DateFigee)) return new D(maintenant()).toString();
    if (arguments.length === 0) return new D(maintenant());
    return new (Function.prototype.bind.apply(D, [null].concat([].slice.call(arguments))))();
  }
  DateFigee.prototype = D.prototype;
  D.prototype.constructor = DateFigee;
  DateFigee.now = maintenant;
  DateFigee.parse = D.parse;
  DateFigee.UTC = D.UTC;
  window.Date = DateFigee;
})();
(function () {
  var UNES = ["pétrole, sans couleur franche", "bleu", "bleu", "émeraude", "brun rosé", "pétrole, sans couleur franche", "sarcelle", "rose", "brun rosé", "brun rosé"];
  var ID = "1a5e0fc7980e1baee3ace1f52f9aca6f3b087f87ed96cd8d999ae661ab6629d6";
  var Q = new URLSearchParams(location.search);
  var n = parseInt(Q.get("une") || "0", 10);
  window.__apercuUne = isFinite(n) && n >= 0 && n < UNES.length ? n : 0;
  var etiquette = null;
  function dire() { if (etiquette) etiquette.textContent = "Aperçu · photo " + (window.__apercuUne + 1) + "/" + UNES.length + " · " + UNES[window.__apercuUne]; }
  window.__apercuSuivante = function () {
    window.__apercuUne = (window.__apercuUne + 1) % UNES.length;
    window.__apercuDecalage += 11 * 60000;
    dire();
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  };
  function poser() {
    var b = document.createElement("div");
    b.id = "apercu-photo";
    b.style.cssText = "position:fixed;z-index:70;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 88px);display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);padding:6px 6px 6px 14px;border-radius:999px;background:rgba(10,10,12,.88);color:#fff;font:600 12.5px/1.2 -apple-system,system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 14px rgba(0,0,0,.45)";
    etiquette = document.createElement("span");
    etiquette.style.cssText = "overflow:hidden;text-overflow:ellipsis";
    var s = document.createElement("button");
    s.type = "button";
    s.textContent = "Photo suivante";
    s.style.cssText = "flex:none;border:0;border-radius:999px;padding:9px 13px;background:#fff;color:#111;font:inherit;cursor:pointer";
    s.addEventListener("click", window.__apercuSuivante);
    b.append(etiquette, s);
    document.body.append(b);
    dire();
  }
  /* après l'hydratation : le document est la racine de React */
  window.addEventListener("load", function () { setTimeout(poser, 1200); });
  var F = window.fetch.bind(window);
  var R = "/accueil-donnees/";
  var index = null;
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function cle(m, u, b) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(m + " " + u + "\n" + b)).then(function (h) { return hex(h).slice(0, 32); }); }
  function rejouer(r) { return r.json().then(function (e) { return new Response(e.corps, { status: e.statut, headers: e.entetes }); }); }
  window.fetch = async function (input, init) {
    var req = typeof Request !== "undefined" && input instanceof Request ? input : null;
    var url = new URL(req ? req.url : String(input), location.href);
    if (url.origin !== location.origin) return F(input, init);
    var fn = url.pathname.indexOf("/accueil-lumiere/_serverFn/") === 0;
    if (fn && url.pathname.split("/")[3] === ID) return rejouer(await F(R + "fn/une-" + window.__apercuUne + ".json"));
    if (fn || url.pathname.indexOf("/api/") === 0) {
      var m = ((init && init.method) || (req && req.method) || "GET").toUpperCase();
      var b = init && init.body != null ? init.body : req ? await req.clone().text() : "";
      if (typeof b !== "string") b = "";
      var k = await cle(m, url.pathname + url.search, b);
      var r = await F(R + "fn/" + k + ".json");
      if (r.ok) return rejouer(r);
      if (!index) index = await F(R + "fn/index.json").then(function (x) { return x.json(); }).catch(function () { return {}; });
      var id = fn ? url.pathname.split("/")[3] : url.pathname;
      if (index[id]) { r = await F(R + "fn/" + index[id] + ".json"); if (r.ok) return rejouer(r); }
      return new Response(JSON.stringify({ message: "Aperçu statique : cette réponse n'a pas été enregistrée." }), { status: 503, headers: { "content-type": "application/json" } });
    }
    return F(input, init);
  };
  if (navigator.serviceWorker) navigator.serviceWorker.register = function () { return Promise.reject(new Error("aperçu statique")); };
})();
