const ORIGINS = ["https://app.todoist.com/*", "https://api.todoist.com/*"];

const form = document.getElementById("token-form");
const input = document.getElementById("token");
const toggle = document.getElementById("toggle");
const tokenStatus = document.getElementById("token-status");
const grantBtn = document.getElementById("grant");
const permStatus = document.getElementById("perm-status");

function setStatus(el, text, kind) {
  el.textContent = text;
  el.className = "status" + (kind ? " " + kind : "");
}

async function refreshPermissions() {
  const granted = await browser.permissions.contains({ origins: ORIGINS });
  grantBtn.hidden = granted;
  setStatus(permStatus, granted ? "✓ Access granted" : "Not granted yet", granted ? "ok" : "warn");
  return granted;
}

toggle.addEventListener("click", () => {
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  toggle.textContent = show ? "Hide" : "Show";
  toggle.setAttribute("aria-label", show ? "Hide token" : "Show token");
});

// permissions.request must run directly inside the click handler.
grantBtn.addEventListener("click", () => {
  browser.permissions.request({ origins: ORIGINS }).then(refreshPermissions);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = input.value.trim();

  // Saving an empty field removes the stored token.
  if (!token) {
    await browser.storage.local.remove("apiToken");
    setStatus(tokenStatus, "Token removed.", "warn");
    return;
  }

  // Ask for site access in the same click if it's missing.
  const permRequest = browser.permissions.request({ origins: ORIGINS });

  await permRequest.catch(() => false);
  if (!(await refreshPermissions())) {
    setStatus(tokenStatus, "Site access is needed to test the token.", "warn");
    await browser.storage.local.set({ apiToken: token });
    return;
  }

  setStatus(tokenStatus, "Testing…");
  const res = await browser.runtime.sendMessage({ type: "testToken", token });
  if (res && res.ok) {
    await browser.storage.local.set({ apiToken: token });
    setStatus(tokenStatus, "✓ Saved. Reload any open Todoist tabs.", "ok");
  } else {
    setStatus(tokenStatus, (res && res.error) || "Couldn't verify the token.", "err");
  }
});

(async () => {
  const { apiToken } = await browser.storage.local.get("apiToken");
  if (apiToken) {
    input.value = apiToken;
    setStatus(tokenStatus, "Token saved.", "ok");
  }
  refreshPermissions();
})();
