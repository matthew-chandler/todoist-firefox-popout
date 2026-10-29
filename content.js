// Content script for app.todoist.com.
// Adds a "Pop out" button next to "Add sub-task" while a task is open,
// and manages the always-on-top Document Picture-in-Picture window.

(() => {
  "use strict";

  const PIP_WIDTH = 360;
  const PIP_MIN_HEIGHT = 72;
  const PIP_MAX_HEIGHT = 480;
  const FLOAT_FALLBACK_DELAY = 1000; // ms to wait for "Add sub-task" before floating the button

  // ---------- Finding the open task ----------

  // Task URLs look like /app/task/buy-milk-6X7rM8997g3RQmvh (the ID is the
  // last hyphen-separated part). Views can prefix it, e.g. /app/today/task/...
  function taskIdFromUrl(href = location.href) {
    const url = new URL(href);
    const match = url.pathname.match(/\/task\/([^/?#]+)/);
    if (!match) return null;
    const slug = decodeURIComponent(match[1]);
    const id = slug.split("-").pop();
    return /^[A-Za-z0-9]+$/.test(id) ? id : null;
  }

  // ---------- Keyboard shortcut: Shift+P ----------
  // Firefox doesn't count Alt/Ctrl key combos as a user gesture, so they
  // can't open a picture-in-picture window. Shift+P can.
  // Registered at document_start on window (capture) so it runs before
  // Todoist's own key handlers.

  function isTyping(target) {
    const el = target instanceof Element ? target : null;
    if (!el) return false;
    if (el.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='textbox']")) return true;
    return !!el.isContentEditable;
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.repeat || !e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code !== "KeyP" && e.key !== "P") return;
      if (isTyping(e.target) || isTyping(document.activeElement)) return;
      const id = taskIdFromUrl();
      if (!id) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      popOut(id);
    },
    true
  );

  // ---------- "Pop out" button ----------

  const button = document.createElement("button");
  button.type = "button";
  button.className = "tdpo-button";
  button.title = "Pop this task out into an always-on-top window (Shift+P)";
  const label = document.createElement("span");
  label.textContent = "Pop out";
  button.append(
    svgIcon(
      document,
      "0 0 16 16",
      "M9 2h5v5M14 2 7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5",
      1.6,
      14
    ),
    label
  );
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = taskIdFromUrl();
    if (id) popOut(id);
  });

  // Find Todoist's "Add sub-task" button in the open task view.
  function findAddSubtask() {
    for (const el of document.querySelectorAll("button, [role='button']")) {
      if (el === button || button.contains(el)) continue;
      const text = (el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
      if (text.length < 40 && /^\+?\s*add sub-?task$/i.test(text)) return el;
    }
    return null;
  }

  let taskSeenAt = 0;
  let anchor = null;

  function placeButton() {
    if (!document.body) return;
    const id = taskIdFromUrl();

    if (!id) {
      taskSeenAt = 0;
      anchor = null;
      button.remove();
      return;
    }
    if (!taskSeenAt) taskSeenAt = Date.now();

    // Already sitting next to a live "Add sub-task" button.
    if (anchor && anchor.isConnected && button.previousElementSibling === anchor) return;

    anchor = findAddSubtask();
    if (anchor) {
      button.classList.add("tdpo-inline");
      button.classList.remove("tdpo-floating");
      anchor.after(button);
      return;
    }

    // No "Add sub-task" button found (layout changed, other language, etc.):
    // fall back to a floating button in the corner.
    if (Date.now() - taskSeenAt >= FLOAT_FALLBACK_DELAY && button.parentNode !== document.body) {
      button.classList.add("tdpo-floating");
      button.classList.remove("tdpo-inline");
      document.body.appendChild(button);
    }
  }

  let scheduled = false;
  function schedulePlace() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      placeButton();
    }, 120);
  }

  function startWatching() {
    new MutationObserver(schedulePlace).observe(document.body, { childList: true, subtree: true });
    setInterval(placeButton, 500); // catches URL changes in Todoist's single-page app
    window.addEventListener("popstate", schedulePlace);
    placeButton();
  }

  if (document.body) startWatching();
  else document.addEventListener("DOMContentLoaded", startWatching, { once: true });

  // ---------- The pop-out window ----------

  // Only one Document PiP window can exist per browser, so every popped-out
  // task goes into the same window as its own row.
  let pip = null;
  const rows = new Map(); // task id -> row element

  async function popOut(id) {
    if (!("documentPictureInPicture" in window)) {
      alert("Pop Out for Todoist needs Firefox 151 or newer (Document Picture-in-Picture).");
      return;
    }

    // Window already open: add (or highlight) the task there.
    if (pip && !pip.closed) {
      if (rows.has(id)) {
        flash(rows.get(id));
        return;
      }
      const row = addRow(pip.document, id);
      applyResult(row, await send({ type: "getTask", id }));
      return;
    }

    // New window: fetch the task briefly first so the window can open at a
    // height that fits it. Capped so the click still counts as a user gesture.
    const pending = send({ type: "getTask", id });
    const early = await Promise.race([pending, sleep(1200).then(() => null)]);
    const height = early && early.ok ? measureHeight(early.data) : 110;

    try {
      pip = await documentPictureInPicture.requestWindow({ width: PIP_WIDTH, height });
    } catch (e) {
      alert("Couldn't open the pop-out window: " + e.message);
      return;
    }
    setUpWindow(pip);

    const row = addRow(pip.document, id);
    applyResult(row, early || (await pending));
  }

  function setUpWindow(win) {
    const doc = win.document;
    doc.title = "Todoist task";

    const meta = doc.createElement("meta");
    meta.setAttribute("name", "color-scheme");
    meta.setAttribute("content", "light dark");
    doc.head.appendChild(meta);

    const style = doc.createElement("style");
    style.textContent = PIP_CSS;
    doc.head.appendChild(style);

    const list = doc.createElement("ul");
    list.className = "list";
    doc.body.appendChild(list);

    win.addEventListener("pagehide", () => {
      rows.clear();
      if (pip === win) pip = null;
    });
  }

  // Render the task offscreen with the window's styles to find its height.
  function measureHeight(task) {
    const host = document.createElement("div");
    host.style.cssText = `position:fixed;left:-10000px;top:0;width:${PIP_WIDTH}px;visibility:hidden;pointer-events:none;`;
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = PIP_CSS;
    const list = document.createElement("ul");
    list.className = "list";
    shadow.append(style, list);
    const row = buildRow(document, "measure");
    list.appendChild(row);
    fillRow(row, task);
    document.documentElement.appendChild(host);
    const h = Math.ceil(list.getBoundingClientRect().height);
    host.remove();
    return Math.min(PIP_MAX_HEIGHT, Math.max(PIP_MIN_HEIGHT, h));
  }

  function buildRow(doc, id) {
    const row = doc.createElement("li");
    row.className = "row loading";
    row.dataset.id = id;

    const check = doc.createElement("button");
    check.type = "button";
    check.className = "check";
    check.title = "Complete task";
    check.disabled = true;
    check.appendChild(svgIcon(doc, "0 0 24 24", "M7 12.5l3.2 3.2L17 9", 2.2));

    const body = doc.createElement("div");
    body.className = "body";
    const title = doc.createElement("div");
    title.className = "title";
    title.textContent = "Loading task…";
    const due = doc.createElement("div");
    due.className = "due";
    const desc = doc.createElement("div");
    desc.className = "desc";
    body.append(title, due, desc);

    const dismiss = doc.createElement("button");
    dismiss.type = "button";
    dismiss.className = "dismiss";
    dismiss.title = "Remove from this window (doesn't complete it)";
    dismiss.textContent = "×";

    row.append(check, body, dismiss);
    return row;
  }

  function addRow(doc, id) {
    const row = buildRow(doc, id);
    row.querySelector(".check").addEventListener("click", () => completeRow(row));
    row.querySelector(".dismiss").addEventListener("click", () => removeRow(row));
    doc.querySelector(".list").appendChild(row);
    rows.set(id, row);
    return row;
  }

  function applyResult(row, res) {
    if (!rows.has(row.dataset.id)) return; // removed while loading
    if (!res.ok) return showRowError(row, res);
    if (res.data.checked) return showRowError(row, { error: "This task is already completed." });
    fillRow(row, res.data);
  }

  function fillRow(row, task) {
    row.classList.remove("loading");
    row.classList.add("p" + (5 - (task.priority || 1))); // p1..p4 like Todoist
    row.querySelector(".title").textContent = plainText(task.content);
    row.querySelector(".due").textContent = task.due
      ? (task.due.is_recurring ? "↻ " : "") + (task.due.string || task.due.date)
      : "";
    row.querySelector(".desc").textContent = plainText(task.description);
    row.querySelector(".check").disabled = false;
  }

  function showRowError(row, res) {
    row.classList.remove("loading");
    row.classList.add("error");
    row.querySelector(".title").textContent = res.error || "Something went wrong.";
    row.querySelector(".due").textContent = "";
    const desc = row.querySelector(".desc");
    desc.textContent = "";
    if (res.code === "NO_TOKEN" || res.code === "BAD_TOKEN") {
      const link = row.ownerDocument.createElement("button");
      link.type = "button";
      link.className = "link";
      link.textContent = "Open settings";
      link.addEventListener("click", () => send({ type: "openOptions" }));
      desc.appendChild(link);
    }
  }

  async function completeRow(row) {
    const id = row.dataset.id;
    const check = row.querySelector(".check");
    const err = row.querySelector(".err-msg");
    if (err) err.remove();
    check.disabled = true;
    row.classList.add("completing");

    const res = await send({ type: "closeTask", id });
    if (!res.ok) {
      row.classList.remove("completing");
      check.disabled = false;
      const msg = row.ownerDocument.createElement("div");
      msg.className = "err-msg";
      msg.textContent = res.error;
      row.querySelector(".body").appendChild(msg);
      return;
    }

    row.classList.add("done");
    setTimeout(() => removeRow(row), 650);
  }

  function removeRow(row) {
    rows.delete(row.dataset.id);
    row.remove();
    if (pip && rows.size === 0) pip.close();
  }

  function flash(row) {
    row.classList.remove("flash");
    void row.offsetWidth; // restart the animation
    row.classList.add("flash");
  }

  // ---------- Helpers ----------

  // A single-path stroked icon, built with DOM calls instead of innerHTML.
  function svgIcon(doc, viewBox, d, strokeWidth, size) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = doc.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("aria-hidden", "true");
    if (size) {
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
    }
    const path = doc.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", strokeWidth);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function send(message) {
    return browser.runtime.sendMessage(message).catch((e) => ({
      ok: false,
      error: "The extension couldn't respond (" + e.message + "). Try reloading Todoist.",
    }));
  }

  // Task titles and descriptions are Markdown; show them as plain text.
  function plainText(md) {
    return String(md || "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url)
      .replace(/(\*\*|__|\*|_|~~|`)(.+?)\1/g, "$2") // **bold**, _italic_, `code`
      .replace(/^#{1,6}\s+/gm, "") // headings
      .trim();
  }

  const PIP_CSS = `
    :root, :host {
      --bg: #ffffff; --fg: #202020; --muted: #707070; --line: #e6e6e6;
      --hover: #f3f3f3; --done: #058527; --err: #c53727;
      --p1: #d1453b; --p2: #eb8909; --p3: #246fe0; --p4: #8f8f8f;
    }
    @media (prefers-color-scheme: dark) {
      :root, :host {
        --bg: #1f1f1f; --fg: #ececec; --muted: #a0a0a0; --line: #333333;
        --hover: #2a2a2a; --done: #3bb75e; --err: #ff7b6e;
        --p1: #ff7066; --p2: #ff9a14; --p3: #5297ff; --p4: #8f8f8f;
      }
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body { background: var(--bg); color: var(--fg); overflow-y: auto; }
    .list {
      list-style: none; margin: 0; padding: 2px 0;
      font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
      color: var(--fg);
    }
    .row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 8px 10px 12px; border-bottom: 1px solid var(--line);
      --ring: var(--p4);
      transition: opacity .4s ease, transform .4s ease;
    }
    .row:last-child { border-bottom: none; }
    .row.p1 { --ring: var(--p1); }
    .row.p2 { --ring: var(--p2); }
    .row.p3 { --ring: var(--p3); }
    .check {
      flex: none; width: 22px; height: 22px; margin-top: 0; padding: 0;
      border-radius: 50%; border: 2px solid var(--ring);
      background: color-mix(in srgb, var(--ring) 8%, transparent);
      color: transparent; cursor: pointer; display: grid; place-items: center;
      transition: background .15s, color .15s;
    }
    .check svg { width: 16px; height: 16px; }
    .check:hover:not(:disabled) { color: var(--ring); }
    .check:disabled { cursor: default; opacity: .5; }
    .completing .check, .done .check {
      background: var(--done); border-color: var(--done); color: #fff; opacity: 1;
    }
    .body { flex: 1; min-width: 0; }
    .title, .desc, .err-msg { overflow-wrap: anywhere; }
    .due { color: var(--muted); font-size: 12px; margin-top: 2px; }
    .desc {
      color: var(--muted); font-size: 12.5px; margin-top: 3px;
      white-space: pre-wrap;
    }
    .due:empty, .desc:empty { display: none; }
    .err-msg { color: var(--err); font-size: 12px; margin-top: 4px; }
    .error .title { color: var(--err); }
    .loading .title { color: var(--muted); }
    .done { opacity: 0; transform: translateX(12px); }
    .done .title { text-decoration: line-through; color: var(--muted); }
    .dismiss {
      flex: none; border: none; background: none; color: var(--muted);
      font-size: 18px; line-height: 1; padding: 2px 5px; border-radius: 4px; cursor: pointer;
      opacity: 0; transition: opacity .15s;
    }
    .row:hover .dismiss, .dismiss:focus-visible { opacity: 1; }
    .dismiss:hover { background: var(--hover); color: var(--fg); }
    .link {
      border: none; background: none; padding: 0; font: inherit;
      color: var(--p3); text-decoration: underline; cursor: pointer;
    }
    .flash { animation: flash .6s ease; }
    @keyframes flash { 0%, 100% { background: transparent; } 30% { background: var(--hover); } }
  `;
})();
