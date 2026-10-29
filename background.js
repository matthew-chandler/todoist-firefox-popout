// Background script: the only place the API token is used.
// Content scripts and the options page ask it to talk to Todoist.

const API_BASE = "https://api.todoist.com/api/v1";

async function getToken() {
  const { apiToken } = await browser.storage.local.get("apiToken");
  return (apiToken || "").trim();
}

async function todoist(path, { method = "GET", token } = {}) {
  token = token || (await getToken());
  if (!token) {
    const err = new Error("No API token set. Open the extension settings and paste your Todoist API token.");
    err.code = "NO_TOKEN";
    throw err;
  }

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: { Authorization: "Bearer " + token },
    });
  } catch (e) {
    const err = new Error("Couldn't reach Todoist. Check your connection.");
    err.code = "NETWORK";
    throw err;
  }

  if (!res.ok) {
    const messages = {
      401: "Todoist rejected the API token. Check it in the extension settings.",
      403: "You don't have access to this task.",
      404: "Task not found. It may already be completed or deleted.",
      429: "Todoist is rate-limiting requests. Try again in a minute.",
    };
    const err = new Error(messages[res.status] || "Todoist returned an error (" + res.status + ").");
    err.code = res.status === 401 ? "BAD_TOKEN" : "HTTP_" + res.status;
    throw err;
  }

  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const handlers = {
  async getTask({ id }) {
    const task = await todoist("/tasks/" + encodeURIComponent(id));
    return {
      id: task.id,
      content: task.content,
      description: task.description || "",
      priority: task.priority, // 4 = p1 (urgent) ... 1 = p4 (none)
      due: task.due || null,
      checked: !!task.checked,
    };
  },

  async closeTask({ id }) {
    await todoist("/tasks/" + encodeURIComponent(id) + "/close", { method: "POST" });
    return true;
  },

  async testToken({ token }) {
    await todoist("/tasks?limit=1", { token });
    return true;
  },

  async openOptions() {
    await browser.runtime.openOptionsPage();
    return true;
  },
};

browser.runtime.onMessage.addListener((msg) => {
  const handler = msg && handlers[msg.type];
  if (!handler) return undefined;
  return handler(msg)
    .then((data) => ({ ok: true, data }))
    .catch((e) => ({ ok: false, error: e.message, code: e.code || "UNKNOWN" }));
});

// Toolbar button opens settings.
browser.action.onClicked.addListener(() => browser.runtime.openOptionsPage());

// First install: open settings so the token can be added right away.
browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") browser.runtime.openOptionsPage();
});
