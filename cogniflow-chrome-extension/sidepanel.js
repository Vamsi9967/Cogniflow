const app = document.getElementById("app");
const DEFAULTS = { onboardingComplete: false, trackingEnabled: false, idleRemindersEnabled: false, reminderMinutes: 10, showTabTitleInReturnAlert: true, pendingReturn: null, lastReminderWindowId: null, workflows: [], excludedDomains: [] };
let state = { ...DEFAULTS };
let activeView = "recent";
let selectedWorkflowId = null;
let searchTerm = "";
let toastTimer;
let stateLoadRevision = 0;

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const timeLabel = time => {
  const timestamp = Number.isFinite(time) ? time : Date.now();
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60_000) return "just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
};

async function loadState() {
  const revision = ++stateLoadRevision;
  const persisted = await chrome.storage.local.get(DEFAULTS);
  if (revision !== stateLoadRevision) return;
  state = { ...DEFAULTS, ...persisted };
  state.workflows = Array.isArray(state.workflows)
    ? state.workflows.filter(workflow => workflow && typeof workflow.id === "string" && Array.isArray(workflow.tabs)).map(workflow => ({ ...workflow, tabs: workflow.tabs.filter(tab => tab && typeof tab === "object") }))
    : [];
  if (!Array.isArray(state.excludedDomains)) state.excludedDomains = [];
  render();
}

function render() {
  const currentWorkflow = state.workflows.find(item => item.id === selectedWorkflowId);
  app.innerHTML = `
    <header class="topbar">
      <div class="brand-lockup"><div class="brand-mark" aria-hidden="true">CF</div><div><p class="brand-name">CogniFlow</p><p class="brand-tagline">Return to your flow</p></div></div>
      <div class="status-pill ${state.trackingEnabled ? "is-on" : ""}" aria-live="polite"><span class="status-dot"></span>${state.trackingEnabled ? "Remembering" : "Paused"}</div>
    </header>
    ${state.onboardingComplete ? `
      <nav class="tabs" role="tablist" aria-label="CogniFlow sections">
        ${tabButton("recent", "Recent Work")}${tabButton("related", "Related")}${tabButton("settings", "Settings")}
      </nav>
      ${returnBanner()}
      <main class="content">${activeView === "settings" ? settingsView() : activeView === "related" ? relatedView(currentWorkflow) : recentView(currentWorkflow)}</main>
    ` : onboardingView()}
  `;
  bindEvents();
}

function tabButton(view, label) {
  return `<button class="tab" role="tab" aria-selected="${activeView === view}" data-view="${view}">${label}</button>`;
}

function onboardingView() {
  return `<main class="content">
    <section class="card welcome">
      <div class="welcome-illustration" aria-hidden="true">${lockIcon()}</div>
      <h1>Start with trust.</h1>
      <p>CogniFlow keeps a small, local memory of your browser work so you can return after a distraction.</p>
      <div class="privacy-note">${lockIcon()}<span>With your permission, it saves tab titles and URLs on this device. It does not read page contents, messages, or keystrokes. Nothing is sent to a server.</span></div>
      <label class="consent"><input id="consent" type="checkbox" /><span>I understand what CogniFlow will save and can pause or delete it in Settings.</span></label>
      <button class="button" id="start" style="margin-top:15px" disabled>Enable local memory</button>
      <p class="small-help">Chrome will ask for access to your tabs. You can decline or turn it off later.</p>
    </section>
    <p class="small-help" style="text-align:center;margin-top:14px">Prototype · metadata only · stored using Chrome local extension storage</p>
  </main>`;
}

function recentView(current) {
  const matches = filteredWorkflows();
  return `<h1 class="page-title">Recent Work</h1><p class="page-subtitle">What you were doing — and where to pick up.</p>
    ${state.trackingEnabled ? "" : `<div class="alert">Memory is paused. Turn it on in Settings to save tab context as you work.</div>`}
    ${matches.length ? `<input class="search" id="search" type="search" value="${escapeHtml(searchTerm)}" placeholder="Find a workflow" aria-label="Find a workflow" /><div class="workflow-list">${matches.map(item => workflowCard(item,current?.id)).join("")}</div>` : emptyState()}
    ${current ? `<div class="actions"><button class="button" data-action="continue" data-id="${escapeHtml(current.id)}">Continue Work <span aria-hidden="true">→</span></button></div>` : ""}
    ${state.trackingEnabled ? `<button class="button secondary" style="margin-top:11px" data-action="capture">Save this window now</button>` : ""}`;
}

function relatedView(current) {
  if (!current) return `<h1 class="page-title">Related</h1><p class="page-subtitle">Tabs saved together in a workflow.</p>${emptyState("No workflow selected", "Choose a workflow in Recent Work to see its related browser tabs.")}`;
  return `<div class="detail-head"><button class="back" aria-label="Back to recent work" data-action="back">←</button><h1 class="page-title">${escapeHtml(current.title)}</h1></div>
    <div class="summary"><p class="summary-label">Activity summary</p><p>${escapeHtml(summaryText(current))}</p></div>
    <div class="workflow-meta" style="margin:0 2px 7px"><span>${(current.tabs || []).length} saved tabs</span><span>Updated ${timeLabel(current.lastActive)}</span></div>
    <div class="card" style="padding:4px 11px"><div class="tab-list">${(current.tabs || []).map(tab => savedTab(tab,current.activeUrl)).join("")}</div></div>
    <p class="small-help">Related tabs are grouped from browser metadata only. CogniFlow does not read page content.</p>
    <div class="actions"><button class="button" data-action="continue" data-id="${escapeHtml(current.id)}">Continue Work <span aria-hidden="true">→</span></button><button class="button ghost" data-action="delete-workflow" data-id="${escapeHtml(current.id)}">Remove this workflow</button></div>`;
}

function settingsView() {
  const domains = state.excludedDomains || [];
  return `<h1 class="page-title">Settings</h1><p class="page-subtitle">Your data and capture boundaries.</p>
    <section class="card settings-card"><div class="setting-row"><div><h2>${state.trackingEnabled ? "Pause memory" : "Resume memory"}</h2><p>${state.trackingEnabled ? "CogniFlow is saving tab titles and URLs locally." : "Memory is paused. No new browser activity is saved."}</p></div><button class="switch" role="switch" aria-checked="${state.trackingEnabled}" aria-label="${state.trackingEnabled ? "Pause memory" : "Resume memory"}" data-action="toggle-memory"></button></div></section>
    <section class="card settings-card"><div class="setting-row"><div><h2>Idle reminder</h2><p>Notify after Chrome reports no device input. This signal is system-wide, not just Chrome activity.</p></div><button class="switch" role="switch" aria-checked="${state.idleRemindersEnabled}" aria-label="${state.idleRemindersEnabled ? "Turn off idle reminders" : "Turn on idle reminders"}" data-action="toggle-reminders"></button></div><label class="small-help" for="reminder-minutes" style="display:block;margin-top:12px">Remind me after</label><select class="search" id="reminder-minutes" style="margin:6px 0 0;height:34px"><option value="5" ${Number(state.reminderMinutes) === 5 ? "selected" : ""}>5 minutes</option><option value="10" ${Number(state.reminderMinutes) === 10 ? "selected" : ""}>10 minutes</option><option value="15" ${Number(state.reminderMinutes) === 15 ? "selected" : ""}>15 minutes</option></select><button class="button secondary" data-action="test-reminder" ${state.idleRemindersEnabled ? "" : "disabled"}>Send a test reminder</button></section>
    <label class="consent" style="margin:0 2px 12px"><input id="show-tab-title" type="checkbox" ${state.showTabTitleInReturnAlert ? "checked" : ""}/><span>Show the last tab title in return notifications. Notifications may be visible on your screen.</span></label>
    <section class="card settings-card"><h2>Private sites</h2><p>Tabs on these domains are excluded from saved workflows, including their subdomains.</p><form class="domain-form" id="domain-form"><input class="domain-input" id="domain-input" placeholder="example.com" aria-label="Website domain" autocomplete="off"/><button class="button domain-add" type="submit">Add</button></form><div class="domain-list">${domains.length ? domains.map(domain => `<div class="domain-item"><span>${escapeHtml(domain)}</span><button class="domain-remove" data-action="remove-domain" data-domain="${escapeHtml(domain)}" aria-label="Remove ${escapeHtml(domain)}">×</button></div>`).join("") : `<span class="small-help">No excluded sites yet.</span>`}</div></section>
    <section class="card settings-card"><h2>What CogniFlow stores</h2><div class="privacy-list"><span>Tab titles and URLs, on this device</span><span>Activity timestamps and active-tab state</span><span>No page text, screenshots, messages, or keystrokes</span><span>No server upload or account sync</span></div></section>
    <section class="card settings-card"><h2>Delete saved activity</h2><p>Remove all workflows and their saved tab metadata from this browser profile.</p><button class="button danger" style="margin-top:11px" data-action="clear-data">Delete all saved work</button></section>
    <p class="small-help">CogniFlow is a prototype. Memory runs only after the tab-access permission and consent are enabled.</p>`;
}

function workflowCard(item, selectedId) {
  const active = (item.tabs || []).find(tab => tab.url === item.activeUrl);
  const domains = [...new Set((item.tabs || []).map(tab => tab.hostname).filter(Boolean))].slice(0,4);
  return `<button class="card workflow-card ${selectedId === item.id ? "is-selected" : ""} ${state.pendingReturn?.workflowId === item.id && state.pendingReturn?.notifiedAt ? "is-returned" : ""}" style="width:100%;text-align:left" data-action="select-workflow" data-id="${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(item.title)}">
    <span class="workflow-head"><span class="workflow-source">${escapeHtml(active?.hostname || item.tabs?.[0]?.hostname || "Browser workflow")}</span><span class="workflow-time">${timeLabel(item.lastActive)}</span></span>
    <span class="workflow-title" style="display:block">${escapeHtml(item.title || "Untitled workflow")}</span>
    <span class="workflow-meta"><span class="workflow-preview">${escapeHtml(active?.title || `${item.tabCount || item.tabs?.length || 0} tabs saved`)}</span><span>${item.tabs?.length || 0} tabs</span></span>
    <span class="chips">${domains.map(domain => `<span class="chip">${escapeHtml(domain)}</span>`).join("")}</span>
  </button>`;
}

function savedTab(tab, activeUrl) {
  const title = tab.title || tab.hostname || "Untitled tab";
  let safeUrl = "";
  try {
    const parsed = new URL(tab.url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") safeUrl = parsed.href;
  } catch { /* Keep malformed or unsupported saved URLs non-clickable. */ }
  const tag = safeUrl ? "button" : "div";
  const buttonAttributes = safeUrl ? 'type="button" data-action="open-saved-tab" data-url="' + escapeHtml(safeUrl) + '" aria-label="Open ' + escapeHtml(title) + ' in a new tab"' : "";
  const className = "saved-tab" + (safeUrl ? " is-openable" : "") + (tab.url === activeUrl ? " is-last-active" : "");
  const hostLabel = (tab.hostname || "Website") + (tab.url === activeUrl ? " · Last active" : "");
  const savedLabel = (tab.url === activeUrl ? "Last active" : "Saved") + (safeUrl ? " · Open ↗" : "");
  return "<" + tag + ' class="' + className + '" ' + buttonAttributes + '><span class="saved-host">' + escapeHtml(hostLabel) + '</span><span class="saved-time">' + escapeHtml(savedLabel) + '</span><span class="saved-title">' + escapeHtml(title) + "</span></" + tag + ">";
}

function returnBanner() {
  const pending = state.pendingReturn;
  if (!pending?.notifiedAt) return "";
  const workflow = state.workflows.find(item => item.id === pending.workflowId);
  if (!workflow) return "";
  const tab = workflow.tabs?.find(item => item.url === workflow.activeUrl);
  return `<section class="return-banner" role="status"><div class="return-icon" aria-hidden="true">↩</div><div class="return-copy"><strong>Welcome back</strong><span>Your last tab: ${escapeHtml(tab?.title || workflow.activeTitle || workflow.title)}${tab?.hostname ? ` · ${escapeHtml(tab.hostname)}` : ""}</span></div><button class="button return-button" data-action="resume-return" data-id="${escapeHtml(workflow.id)}">Go to tab</button><button class="return-dismiss" data-action="dismiss-return" aria-label="Dismiss return reminder">×</button></section>`;
}

function emptyState(title = "Your work will appear here", copy = "Once memory is enabled, CogniFlow will quietly save tab context so you can resume after an interruption.") {
  return `<section class="card empty"><div class="welcome-illustration" aria-hidden="true">${lockIcon()}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p>${state.trackingEnabled ? `<button class="button secondary" data-action="capture">Save this window now</button>` : `<button class="button secondary" data-view="settings">Review privacy settings</button>`}</section>`;
}

function summaryText(workflow) {
  const count = workflow.tabs?.length || 0;
  const active = workflow.tabs?.find(tab => tab.url === workflow.activeUrl);
  return active ? `Last active in ${active.hostname}. ${count} tab${count === 1 ? "" : "s"} were open in this browser window.` : `${count} tab${count === 1 ? "" : "s"} saved in this workflow.`;
}

function filteredWorkflows() {
  const term = searchTerm.trim().toLowerCase();
  const items = [...state.workflows].sort((a,b) => (b.lastActive || 0) - (a.lastActive || 0));
  if (!term) return items;
  return items.filter(item => `${item.title} ${(item.tabs || []).map(tab => `${tab.title} ${tab.hostname}`).join(" ")}`.toLowerCase().includes(term));
}

function lockIcon() {
  return `<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="8" width="12" height="9" rx="2"/><path d="M6.5 8V5.8a3.5 3.5 0 0 1 7 0V8"/></svg>`;
}

function bindEvents() {
  app.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.view) { activeView = button.dataset.view; selectedWorkflowId = null; render(); }
  }));
  app.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => handleAction(button)));
  const consent = document.getElementById("consent");
  if (consent) consent.addEventListener("change", () => { document.getElementById("start").disabled = !consent.checked; });
  document.getElementById("start")?.addEventListener("click", startOnboarding);
  document.getElementById("search")?.addEventListener("input", event => { searchTerm = event.target.value; const cursor = event.target.selectionStart; render(); const next = document.getElementById("search"); next.focus(); next.setSelectionRange(cursor,cursor); });
  document.getElementById("domain-form")?.addEventListener("submit", addExcludedDomain);
  document.getElementById("reminder-minutes")?.addEventListener("change", saveReminderTime);
  document.getElementById("show-tab-title")?.addEventListener("change", saveTabTitlePreference);
}

async function handleAction(button) {
  const { action, id, domain } = button.dataset;
  if (action === "select-workflow") { selectedWorkflowId = id; activeView = "related"; render(); }
  if (action === "open-saved-tab") await openSavedTab(button.dataset.url);
  if (action === "back") { selectedWorkflowId = null; activeView = "recent"; render(); }
  if (action === "toggle-memory") await toggleMemory();
  if (action === "toggle-reminders") await toggleReminders();
  if (action === "test-reminder") await testReminder();
  if (action === "resume-return") await goToLastTab(id);
  if (action === "dismiss-return") await dismissReturnHighlight();
  if (action === "capture") await captureNow();
  if (action === "continue") await continueWorkflow(id);
  if (action === "delete-workflow") await deleteWorkflow(id);
  if (action === "clear-data") await clearData();
  if (action === "remove-domain") await removeDomain(domain);
}

async function startOnboarding() {
  const granted = await chrome.permissions.request({ permissions: ["tabs"] });
  if (!granted) { showToast("Tab access was not granted. CogniFlow did not capture anything."); return; }
  state.onboardingComplete = true;
  state.trackingEnabled = true;
  await chrome.storage.local.set({ onboardingComplete: true, trackingEnabled: true });
  render();
  await captureNow(true);
}

async function toggleMemory() {
  if (state.trackingEnabled) {
    state.trackingEnabled = false;
    await chrome.storage.local.set({ trackingEnabled: false });
    await clearReturnState();
    showToast("Memory paused. Existing saved workflows remain on this device.");
  } else {
    const granted = await chrome.permissions.contains({ permissions: ["tabs"] }) || await chrome.permissions.request({ permissions: ["tabs"] });
    if (!granted) { showToast("Tab access is needed to save browser context."); return; }
    state.trackingEnabled = true;
    await chrome.storage.local.set({ trackingEnabled: true });
    await captureNow(true);
    showToast("Memory resumed.");
  }
  render();
}

async function toggleReminders() {
  if (state.idleRemindersEnabled) {
    state.idleRemindersEnabled = false;
    await chrome.storage.local.set({ idleRemindersEnabled: false });
    await clearReturnState();
    await chrome.runtime.sendMessage({ type: "CONFIGURE_REMINDERS" }).catch(() => undefined);
    showToast("Idle reminders turned off.");
  } else {
    const granted = await chrome.permissions.request({ permissions: ["idle", "notifications"] });
    if (!granted) { showToast("Idle and notification permissions are needed for reminders."); return; }
    state.idleRemindersEnabled = true;
    await chrome.storage.local.set({ idleRemindersEnabled: true });
    await chrome.runtime.sendMessage({ type: "CONFIGURE_REMINDERS" }).catch(() => undefined);
    showToast(`Reminder enabled after ${state.reminderMinutes} minutes of device inactivity.`);
  }
  render();
}

async function saveReminderTime(event) {
  state.reminderMinutes = Number(event.target.value) || 10;
  await chrome.storage.local.set({ reminderMinutes: state.reminderMinutes });
  if (state.idleRemindersEnabled) await chrome.runtime.sendMessage({ type: "CONFIGURE_REMINDERS" }).catch(() => undefined);
  showToast(`Reminder delay set to ${state.reminderMinutes} minutes.`);
}

async function saveTabTitlePreference(event) {
  state.showTabTitleInReturnAlert = event.target.checked;
  await chrome.storage.local.set({ showTabTitleInReturnAlert: state.showTabTitleInReturnAlert });
}

async function testReminder() {
  if (window.COGNIFLOW_PREVIEW) { showToast("Preview only: a system notification would appear here."); return; }
  const result = await chrome.runtime.sendMessage({ type: "TEST_REMINDER" }).catch(() => null);
  showToast(result?.ok ? "Test reminder sent." : "Could not send a reminder. Check Chrome notification settings.");
}

async function captureNow(silent = false) {
  if (!state.trackingEnabled) { if (!silent) showToast("Resume memory in Settings first."); return; }
  const win = await chrome.windows.getLastFocused().catch(() => null);
  const response = await chrome.runtime.sendMessage({ type: "CAPTURE_NOW", windowId: win?.id });
  await loadState();
  if (!silent) showToast(response?.ok && response.result?.tabCount ? `Saved ${response.result.tabCount} tabs on this device.` : "No eligible browser tabs to save.");
}

function safeWebUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

async function openSavedTab(url) {
  const safeUrl = safeWebUrl(url);
  if (!safeUrl) { showToast("Only valid web pages can be opened from saved work."); return; }
  try {
    if (window.COGNIFLOW_PREVIEW) {
      const openedWindow = window.open(safeUrl, "_blank", "noopener,noreferrer");
      if (!openedWindow) { showToast("Allow pop-ups to open this saved tab."); return; }
    } else {
      await chrome.tabs.create({ url: safeUrl, active: true });
    }
    showToast("Opened this tab in a new browser tab.");
  } catch {
    showToast("Could not open this saved tab. Try again.");
  }
}

async function continueWorkflow(id) {
  const workflow = state.workflows.find(item => item.id === id);
  if (!workflow) return;
  const tabs = (workflow.tabs || []).map(tab => ({ ...tab, url: safeWebUrl(tab?.url) })).filter(tab => tab.url);
  if (!tabs.length) { showToast("No valid web tabs were saved in this workflow."); return; }
  const lastActive = tabs.find(tab => tab.url === safeWebUrl(workflow.activeUrl)) || tabs[0];
  const otherTabs = tabs.filter(tab => tab.url !== lastActive.url);
  let openedCount = 0;
  for (const tab of otherTabs) {
    try { await chrome.tabs.create({ url: tab.url, active: false }); openedCount += 1; } catch { /* Continue opening the remaining tabs. */ }
  }
  try { await chrome.tabs.create({ url: lastActive.url, active: true }); openedCount += 1; } catch { /* Report the number that did open. */ }
  showToast(openedCount === tabs.length ? "Reopened " + openedCount + " saved tabs." : "Opened " + openedCount + " of " + tabs.length + " saved tabs.");
}

async function goToLastTab(id) {
  const workflow = state.workflows.find(item => item.id === id);
  if (!workflow) return;
  const targetUrl = safeWebUrl(workflow.activeUrl) || safeWebUrl(workflow.tabs?.[0]?.url);
  if (!targetUrl) return;
  const matchingTabs = await chrome.tabs.query({ url: targetUrl }).catch(() => []);
  const existing = matchingTabs[0];
  let opened = false;
  if (existing?.id) {
    try {
      await chrome.tabs.update(existing.id, { active: true });
      await chrome.windows.update(existing.windowId, { focused: true }).catch(() => undefined);
      opened = true;
    } catch { /* The tab may have closed after the query; create a replacement below. */ }
  }
  if (!opened) {
    try { await chrome.tabs.create({ url: targetUrl, active: true }); }
    catch { showToast("Could not reopen this tab. Try again."); return; }
  }
  await dismissReturnHighlight();
  showToast("Returned to the last active tab.");
}

async function clearReturnState() {
  state.pendingReturn = null;
  await chrome.storage.local.set({ pendingReturn: null, lastReminderWindowId: null });
  if (chrome.action) await chrome.action.setBadgeText({ text: "" }).catch(() => undefined);
}

async function dismissReturnHighlight() {
  await clearReturnState();
  render();
}

async function deleteWorkflow(id) {
  state.workflows = state.workflows.filter(item => item.id !== id);
  selectedWorkflowId = null; activeView = "recent";
  const clearReturn = state.pendingReturn?.workflowId === id;
  await chrome.storage.local.set({ workflows: state.workflows });
  if (clearReturn) await clearReturnState();
  render(); showToast("Workflow removed from this device.");
}

async function clearData() {
  if (!confirm("Delete every saved workflow from this device? This cannot be undone.")) return;
  state.workflows = [];
  selectedWorkflowId = null; activeView = "recent";
  await clearReturnState();
  await chrome.storage.local.set({ workflows: [] });
  render(); showToast("All saved work was deleted.");
}

async function addExcludedDomain(event) {
  event.preventDefault();
  const input = document.getElementById("domain-input");
  let domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").split(/[/:?#]/)[0];
  if (domain.startsWith("www.")) domain = domain.slice(4);
  if (!domain || !/^(?=.{1,253}$)([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(domain)) { showToast("Enter a valid domain, such as example.com."); return; }
  if (!state.excludedDomains.includes(domain)) state.excludedDomains = [...state.excludedDomains, domain].sort();
  state.workflows = state.workflows.map(workflow => {
    const tabs = (workflow.tabs || []).filter(tab => tab.hostname !== domain && !tab.hostname?.endsWith(`.${domain}`));
    const activeStillIncluded = tabs.some(tab => tab.url === workflow.activeUrl);
    return { ...workflow, title: activeStillIncluded ? workflow.title : tabs[0]?.title || workflow.title, tabs, tabCount: tabs.length, activeUrl: activeStillIncluded ? workflow.activeUrl : tabs[0]?.url || "", activeTitle: activeStillIncluded ? workflow.activeTitle : tabs[0]?.title || "" };
  }).filter(workflow => workflow.tabs.length);
  if (state.pendingReturn?.workflowId && !state.workflows.some(workflow => workflow.id === state.pendingReturn.workflowId)) await clearReturnState();
  await chrome.storage.local.set({ excludedDomains: state.excludedDomains, workflows: state.workflows });
  render(); showToast(`${domain} added to private sites.`);
}

async function removeDomain(domain) {
  state.excludedDomains = state.excludedDomains.filter(item => item !== domain);
  await chrome.storage.local.set({ excludedDomains: state.excludedDomains });
  render();
}

function showToast(message) {
  clearTimeout(toastTimer);
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast"; toast.setAttribute("role","status"); toast.textContent = message;
  document.body.append(toast);
  toastTimer = setTimeout(() => toast.remove(), 2600);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.onboardingComplete || changes.workflows || changes.trackingEnabled || changes.idleRemindersEnabled || changes.reminderMinutes || changes.showTabTitleInReturnAlert || changes.excludedDomains || changes.pendingReturn)) loadState();
});

loadState();
