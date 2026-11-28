// ClassGuard website settings: light, dark or follow the system, remembered on this device.
// Load in <head> (before the page draws) so there's no flash of the wrong colours.
// Pages can add their own sections: cgSettings.addSection(title, buildFn) — buildFn runs each time it opens.
(() => {
  const KEY = "cg.theme", media = matchMedia("(prefers-color-scheme: dark)");
  const choice = () => { try { return localStorage.getItem(KEY) || "system"; } catch { return "system"; } };
  const apply = () => {
    const c = choice(), dark = c === "dark" || (c === "system" && media.matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.append(meta); }
    meta.content = dark ? "#0d1411" : "#f6f7f2";
  };
  apply();
  media.addEventListener("change", () => { if (choice() === "system") apply(); });

  const icons = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  };
  const extra = [];
  window.cgSettings = { addSection(title, build) { extra.push({ title, build }); }, open: () => open() };

  let dialog;
  function open() {
    if (!dialog) {
      dialog = document.createElement("dialog"); dialog.className = "cg-settings"; dialog.setAttribute("aria-label", "Settings");
      dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });   // click outside closes
      document.body.append(dialog);
    }
    dialog.replaceChildren();
    const head = document.createElement("header");
    const h = document.createElement("h2"); h.textContent = "Settings";
    const x = document.createElement("button"); x.className = "cg-close"; x.setAttribute("aria-label", "Close"); x.textContent = "×"; x.onclick = () => dialog.close();
    head.append(h, x); dialog.append(head);

    const look = document.createElement("section"); const lh = document.createElement("h3"); lh.textContent = "Appearance"; look.append(lh);
    const seg = document.createElement("div"); seg.className = "cg-seg"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Appearance");
    for (const [id, label] of [["system", "System"], ["light", "Light"], ["dark", "Dark"]]) {
      const b = document.createElement("button"); b.type = "button"; b.innerHTML = icons[id]; b.append(label); b.setAttribute("aria-pressed", choice() === id);
      b.onclick = () => { try { localStorage.setItem(KEY, id); } catch {} apply(); for (const o of seg.children) o.setAttribute("aria-pressed", o === b); };
      seg.append(b);
    }
    look.append(seg); dialog.append(look);
    for (const s of extra) {
      const sec = document.createElement("section"); const t = document.createElement("h3"); t.textContent = s.title; sec.append(t);
      try { s.build(sec, () => dialog.close()); } catch (e) { console.error(e); }
      dialog.append(sec);
    }
    if (!dialog.open) dialog.showModal();
  }

  // A gear button: use the page's own (id="cg-gear") if it has one, else a floating one top-right.
  document.addEventListener("DOMContentLoaded", () => {
    let gear = document.getElementById("cg-gear");
    if (!gear) { gear = document.createElement("button"); gear.className = "cg-gear"; document.body.append(gear); }
    gear.innerHTML = icons.gear; gear.type = "button"; gear.setAttribute("aria-label", "Settings"); gear.title = "Settings";
    gear.onclick = open;
  });
})();

// December: the ClassGuard logo wears a Santa hat (the visitor's own date, like the apps). ?christmas previews it.
// The festive picture is placed so its green square lands exactly on the normal logo's.
(function () {
  if (new Date().getMonth() !== 11 && !/[?&]christmas\b/.test(location.search)) return;
  function dress() {
    document.querySelectorAll('img[src$="logo.png"]').forEach(function (img) {
      if (img.parentElement.classList.contains("cg-hat-wrap")) return;
      var wrap = document.createElement("span"); wrap.className = "cg-hat-wrap";
      img.parentNode.insertBefore(wrap, img); wrap.appendChild(img);
      var hat = document.createElement("img"); hat.src = "logo-christmas.png"; hat.alt = ""; hat.className = "cg-hat"; hat.setAttribute("aria-hidden", "true");
      hat.onload = function () { img.style.visibility = "hidden"; };
      wrap.appendChild(hat);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", dress); else dress();
})();
