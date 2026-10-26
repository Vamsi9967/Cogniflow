const MAX_WORKFLOWS = 30;
const SESSION_GAP_MS = 20 * 60 * 1000;
let captureQueue = Promise.resolve();
let idleListenerRegistered = false;
let notificationListenerRegistered = false;

const DEFAULTS = {
  onboardingComplete: false,
  trackingEnabled: false,
  idleRemindersEnabled: false,
  reminderMinutes: 10,
  showTabTitleInReturnAlert: true,
  pendingReturn: null,
  lastReminderWindowId: null,
  workflows: [],
  excludedDomains: []
};

registerIdleMonitoring();
registerNotificationClicks();
void configureReminders();

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const missing = Object.fromEntries(
    Object.entries(DEFAULTS).filter(([key]) => existing[key] === undefined)
  );
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onActivated.addListener(({ windowId }) => queueCapture(windowId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab?.windowId !== undefined && (changeInfo.status === "complete" || changeInfo.title || changeInfo.url)) {
    queueCapture(tab.windowId);
  }
});
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) queueCapture(windowId);
});

chrome.permissions.onRemoved.addListener(async removed => {
  const permissions = removed.permissions || [];
  const update = {};
  if (permissions.includes("tabs")) update.trackingEnabled = false;
  if (permissions.includes("idle") || permissions.includes("notifications")) update.idleRemindersEnabled = false;
  if (Object.keys(update).length) {
    update.pendingReturn = null;
    update.lastReminderWindowId = null;
    await chrome.storage.local.set(update);
    if (chrome.action) await chrome.action.setBadgeText({ text: "" }).catch(() => undefined);
  }
});

chrome.permissions.onAdded.addListener(async added => {
  registerIdleMonitoring();
  registerNotificationClicks();
  if ((added.permissions || []).some(permission => ["idle", "notifications"].includes(permission))) await configureReminders();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CAPTURE_NOW") {
    captureWindow(message.windowId)
      .then(result => sendResponse({ ok: true, result }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "CONFIGURE_REMINDERS") {
    registerIdleMonitoring();
    registerNotificationClicks();
    configureReminders().then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "TEST_REMINDER") {
    sendNotification(true).then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === "CLEAR_RETURN_HIGHLIGHT") {
    clearPendingReturn()
      .then(() => sendResponse({ ok: true }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

chrome.runtime.onStartup.addListener(() => configureReminders());

async function clearPendingReturn() {
  await chrome.storage.local.set({ pendingReturn: null, lastReminderWindowId: null });
  if (chrome.action) await chrome.action.setBadgeText({ text: "" }).catch(() => undefined);
}

function registerIdleMonitoring() {
  if (idleListenerRegistered || !chrome.idle?.onStateChanged) return;
  chrome.idle.onStateChanged.addListener(newState => {
    if (newState === "idle") void rememberIdleContext();
    if (newState === "active") void notifyOnReturn();
  });
  idleListenerRegistered = true;
}

function registerNotificationClicks() {
  if (notificationListenerRegistered || !chrome.notifications?.onClicked) return;
  chrome.notifications.onClicked.addListener(async notificationId => {
    if (notificationId !== "cogniflow-idle-reminder") return;
    const { lastReminderWindowId } = await chrome.storage.local.get("lastReminderWindowId");
    const windowId = Number.isInteger(lastReminderWindowId)
      ? lastReminderWindowId
      : (await chrome.windows.getLastFocused().catch(() => null))?.id;
    if (windowId) await chrome.sidePanel.open({ windowId }).catch(() => undefined);
    await chrome.notifications.clear(notificationId).catch(() => undefined);
  });
  notificationListenerRegistered = true;
}

async function configureReminders() {
  const state = await chrome.storage.local.get(DEFAULTS);
  if (!state.idleRemindersEnabled || !chrome.idle) return;
  const granted = await chrome.permissions.contains({ permissions: ["idle", "notifications"] });
  if (!granted) return;
  const minutes = Math.max(5, Math.min(15, Number(state.reminderMinutes) || 10));
  chrome.idle.setDetectionInterval(minutes * 60);
  registerIdleMonitoring();
  registerNotificationClicks();
}

async function rememberIdleContext() {
  const state = await chrome.storage.local.get(DEFAULTS);
  const workflows = Array.isArray(state.workflows) ? state.workflows.filter(item => item && typeof item.id === "string" && Number.isFinite(item.lastActive)) : [];
  if (!state.trackingEnabled || !state.idleRemindersEnabled || !workflows.length) return;
  if (!await chrome.permissions.contains({ permissions: ["idle", "notifications"] })) return;
  const now = Date.now();
  const workflow = [...workflows].sort((a, b) => b.lastActive - a.lastActive)[0];
  if (!workflow?.lastActive || now - workflow.lastActive > 3 * 60 * 60 * 1000) return;
  await chrome.storage.local.set({
    pendingReturn: {
      workflowId: workflow.id,
      windowId: workflow.windowId,
      idleStartedAt: now,
      notifiedAt: null
    }
  });
}

async function notifyOnReturn() {
  const state = await chrome.storage.local.get({ ...DEFAULTS, pendingReturn: null });
  const pending = state.pendingReturn;
  if (!state.trackingEnabled || !state.idleRemindersEnabled || !pending || pending.notifiedAt) return;
  if (!await chrome.permissions.contains({ permissions: ["idle", "notifications"] })) return;
  const workflows = Array.isArray(state.workflows) ? state.workflows : [];
  const workflow = workflows.find(item => item?.id === pending.workflowId);
  if (!workflow) {
    await chrome.storage.local.set({ pendingReturn: null, lastReminderWindowId: null });
    return;
  }
  const notifiedAt = Date.now();
  await chrome.storage.local.set({ pendingReturn: { ...pending, notifiedAt }, lastReminderWindowId: pending.windowId ?? null });
  if (chrome.action) {
    await chrome.action.setBadgeBackgroundColor({ color: "#2563eb" }).catch(() => undefined);
    await chrome.action.setBadgeText({ text: "1" }).catch(() => undefined);
  }
  try {
    await sendNotification(false, workflow, state.showTabTitleInReturnAlert);
  } catch (error) {
    console.warn("CogniFlow could not display the return notification.", error);
  }
}

async function sendNotification(isTest, workflow, includeTitle = true) {
  if (!chrome.notifications) throw new Error("Notification permission is not available.");
  const activeTab = workflow?.tabs?.find(tab => tab.url === workflow.activeUrl);
  const lastTab = includeTitle && (workflow?.activeTitle || activeTab?.title)
    ? `You paused in “${workflow.activeTitle || activeTab.title}”${activeTab?.hostname ? ` on ${activeTab.hostname}` : ""}. `
    : "Your last browser work is saved on this device. ";
  await chrome.notifications.create("cogniflow-idle-reminder", {
    type: "basic",
    iconUrl: chrome.runtime.getURL("cogniflow-icon.svg"),
    title: isTest ? "CogniFlow reminder is on" : "Welcome back",
    message: isTest
      ? "This is a test reminder. CogniFlow will notify you when you return after your chosen idle period."
      : `${lastTab}Open CogniFlow to continue.`,
    silent: true,
    priority: 0
  });
}

function queueCapture(windowId) {
  captureQueue = captureQueue
    .catch(() => undefined)
    .then(() => captureWindow(windowId))
    .catch(() => undefined);
}

async function captureWindow(windowId) {
  const state = await chrome.storage.local.get(DEFAULTS);
  if (!state.trackingEnabled || !state.onboardingComplete) return { skipped: "paused" };

  const hasTabsPermission = await chrome.permissions.contains({ permissions: ["tabs"] });
  if (!hasTabsPermission) return { skipped: "permission-revoked" };

  const win = Number.isInteger(windowId) && windowId !== chrome.windows.WINDOW_ID_NONE
    ? await chrome.windows.get(windowId).catch(() => null)
    : await chrome.windows.getLastFocused().catch(() => null);
  if (!win?.id || win.type !== "normal") return { skipped: "no-window" };

  const tabs = await chrome.tabs.query({ windowId: win.id });
  const excluded = (state.excludedDomains || []).map(normalizeDomain).filter(Boolean);
  const safeTabs = tabs
    .filter(tab => tab.url && /^https?:\/\//i.test(tab.url))
    .map(tab => {
      let parsed;
      try { parsed = new URL(tab.url); } catch { return null; }
      const hostname = normalizeDomain(parsed.hostname);
      if (excluded.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) return null;
      return {
        url: tab.url,
        title: (tab.title || hostname).slice(0, 180),
        hostname,
        active: Boolean(tab.active),
        lastSeen: Date.now()
      };
    })
    .filter(Boolean);
  if (!safeTabs.length) return { skipped: "no-eligible-tabs" };

  const active = safeTabs.find(tab => tab.active) || safeTabs[0];
  const title = cleanTitle(active.title, active.hostname);
  const now = Date.now();
  const workflows = Array.isArray(state.workflows) ? state.workflows.filter(item => item && typeof item.id === "string" && Array.isArray(item.tabs)) : [];
  const current = workflows.find(item => item.windowId === win.id && Number.isFinite(item.lastActive) && now - item.lastActive < SESSION_GAP_MS);
  const workflow = current || {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    tabs: [],
    windowId: win.id
  };

  const previousTabs = new Map((workflow.tabs || []).filter(tab => tab && typeof tab.url === "string").map(tab => [tab.url, tab]));
  workflow.title = title || workflow.title;
  workflow.tabs = safeTabs.map(tab => ({ ...previousTabs.get(tab.url), ...tab }));
  workflow.lastActive = now;
  workflow.activeUrl = active.url;
  workflow.activeTitle = active.title;
  workflow.tabCount = safeTabs.length;

  const index = workflows.findIndex(item => item.id === workflow.id);
  if (index >= 0) workflows.splice(index, 1);
  workflows.unshift(workflow);
  await chrome.storage.local.set({ workflows: workflows.slice(0, MAX_WORKFLOWS) });
  return { workflowId: workflow.id, tabCount: safeTabs.length };
}

function cleanTitle(title, fallback) {
  return (title || fallback || "Current work")
    .replace(/\s+[—|·-]\s+(Google Chrome|Mozilla Firefox|Microsoft Edge)$/i, "")
    .slice(0, 80);
}

function normalizeDomain(value) {
  return String(value || "").trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/:?#]/)[0];
}
