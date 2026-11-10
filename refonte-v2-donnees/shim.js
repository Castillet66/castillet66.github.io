/* Aperçu STATIQUE de la branche chantier/refonte-v2 (pas la production) : ce script remplace le serveur. Les
   fonctions serveur sont rejouées depuis des réponses enregistrées ; l'horloge est celle de la capture. */
(function () {
  var D = Date, base = D.parse("2026-11-10T03:15:41.266Z");
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
  var F = window.fetch.bind(window), R = "/refonte-v2-donnees/fn/", P = "/refonte-v2", index = null;
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function cle(m, u, b) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(m + " " + u + "\n" + b)).then(function (h) { return hex(h).slice(0, 32); }); }
  function rejouer(r) { return r.json().then(function (e) { return new Response(e.corps, { status: e.statut, headers: e.entetes }); }); }
  window.fetch = async function (input, init) {
    var u = new URL(typeof input === "string" ? input : input.url || String(input), location.href);
    if (u.origin !== location.origin) return F(input, init);
    var fnServeur = u.pathname.indexOf(P + "/_serverFn/") === 0, api = u.pathname.indexOf("/api/") === 0 || u.pathname.indexOf(P + "/api/") === 0;
    if (!fnServeur && !api) return F(input, init);
    var m = (init && init.method) || (input.method) || "GET";
    var corps = "";
    try { if (init && typeof init.body === "string") corps = init.body; else if (input && input.clone) corps = await input.clone().text(); } catch (e) {}
    var k = await cle(m, u.pathname + u.search, corps);
    var r = await F(R + k + ".json");
    if (r.ok) return rejouer(r);
    if (fnServeur || api) {
      if (!index) { var ri = await F(R + "index.json"); index = ri.ok ? await ri.json() : {}; }
      var id = fnServeur ? u.pathname.split("/")[3] : u.pathname;
      if (index[id]) { var r2 = await F(R + index[id] + ".json"); if (r2.ok) return rejouer(r2); }
    }
    return new Response("{}", { status: 503, headers: { "content-type": "application/json" } });
  };
  /* le bandeau : dire que c'est un aperçu */
  window.addEventListener("load", function () { setTimeout(function () {
    var b = document.createElement("div");
    b.textContent = "Aperçu 05eb5cdbf · données figées, rien n'est publié";
    b.setAttribute("aria-hidden", "true");
    b.style.cssText = "position:fixed;z-index:9;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 2px);padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.55);color:rgba(255,255,255,.7);font:500 10px/15px -apple-system,system-ui,sans-serif;pointer-events:none;white-space:nowrap";
    document.body.append(b);
  }, 1500); });
})();
