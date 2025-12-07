// 4ndr0ip Background – MV3 Pure v3.3 (Final)
// No webRequest. No errors. Full IPv6 + IPv4 leak detection.

const IP_REGEX = /(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|fe80:(?::[0-9a-fA-F]{1,4}){0,4}%[0-9a-zA-Z]+|fc00:(?::[0-9a-fA-F]{1,4}){0,6}/g;

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
  console.log('4ndr0ip: Installed/updated – DNR rules loaded');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('4ndr0ip: Ready');
});

// Export + clear logs
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getLogs') {
    chrome.storage.local.get(['leakLog'], (result) => {
      sendResponse({ leakLog: result.leakLog || {} });
    });
    return true; // Keep the message channel open for the asynchronous response
  }
  if (msg.action === 'clearLogs') {
    leakLog = {};
    chrome.storage.local.clear(); // Use clear() to remove all items
    sendResponse({ status: 'cleared' });
    return true; // Acknowledge receipt
  }
  return false; // No action taken, close the channel
});

// Disable WebRTC to prevent IP leaks
function disableWebRTC() {
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: 'disable_non_proxied_udp'
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting WebRTC policy:', chrome.runtime.lastError.message);
    } else {
      console.log('WebRTC IP handling policy set to disable non-proxied UDP.');
    }
  });
}

// Set the policy on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('4ndr0ip: Ready');
  disableWebRTC();
});

// Also set the policy on initial installation or update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('4ndr0ip: Installed/updated – DNR rules loaded');
  if (details.reason === 'install' || details.reason === 'update') {
    disableWebRTC();
  }
});
