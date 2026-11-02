/* Aperçu STATIQUE de la branche chantier/accueil-lumiere (pas la production) : ce script remplace
   le serveur. Les fonctions serveur sont rejouées depuis des réponses enregistrées ; l'horloge est
   celle de la capture. ?lumiere=34 ou 42 change l'intensité ; ?photo=claire pose une photo claire
   sur le Flash, pour juger son passage sous l'en-tête. */
(function () {
  var D = Date, base = D.parse("2026-11-02T12:40:52.669Z");
  if (!isFinite(base)) return;
  var p0 = performance.now();
  function maintenant() { return base + (performance.now() - p0); }
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
  var Q = new URLSearchParams(location.search);
  var INT = { "34": "oklch(0.34 0.03 215)", "42": "oklch(0.42 0.03 215)" }[Q.get("lumiere") || ""];
  if (INT) document.documentElement.style.setProperty("--lumiere-accueil", INT);
  if (Q.get("photo") === "claire") {
    var CLAIRE = "https://www.franceinfo.fr/pictures/vx4hIvOzhuqBTBoDDfKB9tECQiI/0x438:4198x2800/1024x576/filters:format(webp)/2025/10/01/maxstockworld466659-68dcc315cd06a633518878.jpg";
    var poser = function () {
      var im = document.querySelector('.hero-pulse img[fetchpriority="high"]');
      if (im && im.getAttribute("src") !== CLAIRE) { im.removeAttribute("srcset"); im.setAttribute("src", CLAIRE); }
    };
    new MutationObserver(poser).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }
})();
(function () {
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
