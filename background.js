// 4ndr0ip Background – Leak Sentinel v3.1 (MV3 Pure)
// No webRequest, no blocking, no errors — uses DNR + scripting

const IP_REGEX = /(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|fe80:(?::[0-9a-fA-F]{1,4}){0,4}%[0-9a-zA-Z]+|fc00:(?::[0-9a-fA-F]{1,4}){0,6}/g;

let leakLog = {};

// Log leak from content script
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'logLeak') {
    const domain = sender.tab?.url ? new URL(sender.tab.url).hostname : 'unknown';
    if (!leakLog[domain]) leakLog[domain] = { ips: new Set(), count: 0 };
    msg.ips.forEach(ip => leakLog[domain].ips.add(ip));
    leakLog[domain].count++;
    chrome.storage.local.set({ leakLog });
  }
});

// Optional: Trigger scan on popup button
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

// Load DNR rules on startup
chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 100, 101, 102, 103, 104],
    addRules: [] // Let rules.json handle it
  });
});
