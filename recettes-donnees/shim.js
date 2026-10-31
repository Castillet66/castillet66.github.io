/* Aperçu STATIQUE d'une branche de Pulse (pas la production) : ce script remplace le serveur.
   L'index des points est figé au moment de la capture, les fonctions serveur sont rejouées
   depuis des réponses enregistrées ; une réponse absente rend une erreur, comme un serveur
   injoignable. */
(function () {
  var F = window.fetch.bind(window);
  var R = "/recettes-donnees/";
  var index = null;
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function cle(m, u, b) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(m + " " + u + "\n" + b)).then(function (h) { return hex(h).slice(0, 32); }); }
  function rejouer(r) { return r.json().then(function (e) { return new Response(e.corps, { status: e.statut, headers: e.entetes }); }); }
  window.fetch = async function (input, init) {
    var req = typeof Request !== "undefined" && input instanceof Request ? input : null;
    var url = new URL(req ? req.url : String(input), location.href);
    if (url.origin !== location.origin) return F(input, init);
    
    if (url.pathname.indexOf("/_serverFn/") === 0) {
      var m = ((init && init.method) || (req && req.method) || "GET").toUpperCase();
      var b = init && init.body != null ? init.body : req ? await req.clone().text() : "";
      if (typeof b !== "string") b = "";
      var k = await cle(m, url.pathname + url.search, b);
      var r = await F(R + "fn/" + k + ".json");
      if (r.ok) return rejouer(r);
      /* une fonction sans paramètre propre à un lieu (l'agenda du jour, la météo) : sa dernière réponse */
      if (!index) index = await F(R + "fn/index.json").then(function (x) { return x.json(); }).catch(function () { return {}; });
      var id = url.pathname.split("/")[2];
      if (index[id]) { r = await F(R + "fn/" + index[id] + ".json"); if (r.ok) return rejouer(r); }
      return new Response(JSON.stringify({ message: "Aperçu statique : cette réponse n'a pas été enregistrée." }), { status: 503, headers: { "content-type": "application/json" } });
    }
    return F(input, init);
  };
  /* pas de service worker sur le site d'aperçus */
  if (navigator.serviceWorker) navigator.serviceWorker.register = function () { return Promise.reject(new Error("aperçu statique")); };
})();
