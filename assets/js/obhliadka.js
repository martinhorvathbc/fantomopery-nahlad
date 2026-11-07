/* Formulár obhliadky: bez servera. Po odoslaní pripraví e-mail pre Williama Zelmanoviča s vyplnenými údajmi (mailto). */
(function () {
  var f = document.getElementById("obForm");
  if (!f) return;
  var msg = document.getElementById("obMsg");
  var TO = "william@brandconsulting.sk";
  var SUBJ = "Fantóm opery na Zámku – obhliadka priestoru";
  var base = msg ? msg.textContent : "";
  function val(id) { var e = document.getElementById(id); return e ? e.value.replace(/\s+/g, " ").trim() : ""; }
  f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ids = ["obName", "obPlace", "obContact"], ok = true, first = null;
    ids.forEach(function (id) {
      var e = document.getElementById(id), bad = !val(id);
      e.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) { ok = false; if (!first) first = e; }
    });
    if (!ok) {
      if (msg) { msg.textContent = "Doplňte prosím meno, priestor aj kontakt."; msg.className = "ob-n err"; }
      if (first) first.focus();
      return;
    }
    var body = "Dobrý deň,\n\nzaujíma nás obhliadka priestoru pre Fantóma opery na Zámku.\n\n" +
      "Meno: " + val("obName") + "\nPriestor: " + val("obPlace") + "\nKontakt: " + val("obContact") + "\n\nĎakujem.";
    var url = "mailto:" + TO + "?subject=" + encodeURIComponent(SUBJ) + "&body=" + encodeURIComponent(body);
    if (msg) { msg.className = "ob-n"; msg.textContent = "Otvárame vašu poštu s pripravenou správou pre Williama Zelmanoviča. Ak sa neotvorila, napíšte na " + TO + "."; }
    window.location.href = url;
  });
  f.addEventListener("input", function () {
    if (msg && msg.className.indexOf("err") > -1) { msg.className = "ob-n"; msg.textContent = base; }
  });
})();
