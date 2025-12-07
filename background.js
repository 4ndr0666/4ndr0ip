// 4ndr0ip Background – MV3 Pure v3.2
// No webRequest. No errors. Full power.

let leakLog = {}; // domain -> { ips: Set, count: number, ts: number }

// Log leaks from content script
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== 'logLeak') return;

  const domain = sender.tab?.url ? new URL(sender.tab.url).hostname : 'unknown';
  if (!leakLog[domain]) {
    leakLog[domain] = { ips: new Set(), count: 0, ts: Date.now() };
  }
  msg.ips?.forEach(ip => leakLog[domain].ips.add(ip));
  leakLog[domain].count++;
  chrome.storage.local.set({ leakLog });
});

// Manual scan trigger from popup
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

// Load DNR rules on startup/install
chrome.runtime.onInstalled.addListener(() => {
  console.log('4ndr0ip: Extension installed/updated – DNR rules loaded');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('4ndr0ip: Browser started – ready');
});

// Optional: Export logs on demand
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getLogs') {
    chrome.storage.local.get(['leakLog'], (result) => {
      sendResponse({ leakLog: result.leakLog || {} });
    });
    return true; // async response
  }
  if (msg.action === 'clearLogs') {
    leakLog = {};
    chrome.storage.local.clear();
    sendResponse({ status: 'cleared' });
    return true;
  }
});
