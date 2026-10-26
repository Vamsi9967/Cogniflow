# CogniFlow Chrome extension prototype

CogniFlow is a local-first workflow-continuity prototype. It keeps a small browser-tab memory so someone can return to work after an interruption.

## What works

- Chrome Manifest V3 side panel with **Recent Work**, **Related**, and **Settings** views.
- Explicit onboarding consent and an optional Chrome `tabs` permission request before capture begins.
- Quiet capture of tab titles, URLs, hostnames, active-tab state, and timestamps when tabs change or the browser window regains focus.
- Excluded-domain controls, pause/resume, per-workflow deletion, and delete-all controls.
- Optional return alerts after 5, 10, or 15 minutes of system-wide idle, with a test notification, toolbar badge, highlighted last tab, and click-to-open behavior.
- Open any saved tab individually from the Related view, or resume a whole workflow by reopening its saved URLs and activating the last active tab.
- Local persistence in `chrome.storage.local`; no account, server, analytics, page-content script, screenshots, message capture, or keystroke capture.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Open the CogniFlow side panel from the extension toolbar button.
5. Review the data explanation, check the consent box, and choose **Enable local memory**. Chrome then asks for optional tab access.
6. In **Settings**, enable **Idle reminder** and allow its separate idle and notification permissions. Choose a delay and use **Send a test reminder** to confirm notification delivery. After that period with no device input, the next input that returns the system to active state triggers the notification.

The extension requests tab access only after the user's action. Idle and notification permissions are requested separately when reminders are enabled. If a permission is declined or revoked, that feature turns off. The idle signal is system-wide, so it measures inactivity across the device rather than only in Chrome. On return, CogniFlow shows a system notification, a toolbar badge, and a highlighted in-panel reminder with a **Go to tab** action; it does not steal focus automatically. The implementation stores full URLs so it can reopen tabs; users should exclude sensitive domains or pause memory when needed.

## Prototype boundary

This is a working concept prototype, not a published or security-audited extension. Workflow grouping currently uses a simple 20-minute active-window session heuristic. It does not infer intent or summarize page contents. The case-study targets (including under 30 seconds to resume and a 50% reduction in reconstruction time) are hypotheses and have not been measured by this code.

## Technical references

- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
