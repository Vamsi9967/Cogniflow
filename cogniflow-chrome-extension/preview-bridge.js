// Lightweight Chrome API mock for the browser-only prototype preview.
(() => {
  const time = Date.now();
  let store = {
    onboardingComplete: true,
    trackingEnabled: true,
    idleRemindersEnabled: false,
    reminderMinutes: 10,
    showTabTitleInReturnAlert: true,
    pendingReturn: { workflowId: "preview-planning", windowId: 1, idleStartedAt: time - 11 * 60_000, notifiedAt: time - 3_000 },
    excludedDomains: ["hr.company.com"],
    workflows: [
      {
        id: "preview-planning",
        title: "Quarterly Planning",
        createdAt: time - 11 * 60_000,
        lastActive: time - 2 * 60_000,
        tabCount: 5,
        windowId: 1,
        activeUrl: "https://docs.google.com/document/d/quarterly-planning",
        activeTitle: "Quarterly Planning Document",
        tabs: [
          { url: "https://docs.google.com/document/d/quarterly-planning", title: "Quarterly Planning Document", hostname: "docs.google.com", active: true, lastSeen: time - 2 * 60_000 },
          { url: "https://app.slack.com/client/planning", title: "#planning — Slack", hostname: "app.slack.com", active: false, lastSeen: time - 4 * 60_000 },
          { url: "https://app.asana.com/0/quarterly", title: "Quarterly priorities — Asana", hostname: "app.asana.com", active: false, lastSeen: time - 6 * 60_000 },
          { url: "https://miro.com/app/board/roadmap", title: "Roadmap Board — Miro", hostname: "miro.com", active: false, lastSeen: time - 8 * 60_000 },
          { url: "https://www.notion.so/team/decisions", title: "Planning decisions — Notion", hostname: "www.notion.so", active: false, lastSeen: time - 9 * 60_000 }
        ]
      },
      {
        id: "preview-retro",
        title: "Sprint Retro",
        createdAt: time - 3 * 60 * 60_000,
        lastActive: time - 48 * 60_000,
        tabCount: 3,
        windowId: 1,
        activeUrl: "https://miro.com/app/board/sprint-retro",
        activeTitle: "Sprint Retro — Miro",
        tabs: [
          { url: "https://miro.com/app/board/sprint-retro", title: "Sprint Retro — Miro", hostname: "miro.com", active: true, lastSeen: time - 48 * 60_000 },
          { url: "https://linear.app/team/issue/CF-24", title: "CF-24 workflow issue — Linear", hostname: "linear.app", active: false, lastSeen: time - 52 * 60_000 },
          { url: "https://docs.google.com/document/d/sprint-notes", title: "Sprint notes — Google Docs", hostname: "docs.google.com", active: false, lastSeen: time - 54 * 60_000 }
        ]
      }
    ]
  };
  const listeners = [];

  const normalizeKeys = keys => {
    if (keys == null) return Object.keys(store);
    if (Array.isArray(keys)) return keys;
    if (typeof keys === "string") return [keys];
    if (typeof keys === "object") return Object.keys(keys);
    return [];
  };

  window.chrome = {
    storage: {
      local: {
        async get(keys) {
          const result = {};
          for (const key of normalizeKeys(keys)) result[key] = store[key] ?? (typeof keys === "object" && !Array.isArray(keys) ? keys[key] : undefined);
          return result;
        },
        async set(values) {
          const changes = {};
          for (const [key, value] of Object.entries(values)) {
            changes[key] = { oldValue: store[key], newValue: value };
            store[key] = value;
          }
          listeners.forEach(listener => listener(changes, "local"));
        }
      },
      onChanged: { addListener(listener) { listeners.push(listener); } }
    },
    permissions: {
      async request() { return true; },
      async contains() { return true; },
      onRemoved: { addListener() {} }
    },
    runtime: {
      async sendMessage(message) {
        if (message?.type === "CAPTURE_NOW") return { ok: true, result: { tabCount: 5, workflowId: "preview-planning" } };
        return { ok: true };
      }
    },
    windows: { async getLastFocused() { return { id: 1 }; }, async update() { return { id: 1 }; } },
    tabs: {
      async create() { return { id: Math.floor(Math.random() * 10000) }; },
      async query() { return [{ id: 1, windowId: 1 }]; },
      async update() { return { id: 1 }; }
    },
    action: { async setBadgeText() {} }
  };
  window.COGNIFLOW_PREVIEW = true;
})();
