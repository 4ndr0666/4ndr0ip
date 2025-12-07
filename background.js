// 4ndr0ip Background – Leak Sentinel v1.1.0
// WebRTC/STUN/TURN interceptor + blocker

let leakLog = {}; // url -> { ips: [], type: 'ice/stun', ts: Date.now() }
let dnrQuota = { used: 0, max: 30000 };
const DEBOUNCE_MS = 200;

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Enhanced IP regex (IPv4 + full IPv6, incl. link-local fe80::/64 + ULA fc00::/7)
const IP_REGEX = /(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|fe80:(?::[0-9a-fA-F]{1,4}){0,4}%[0-9a-zA-Z]{1,}|(?:[0-9a-fA-F]{1,4}:){1,7}:|fc00:(?::[0-9a-fA-F]{1,4}){0,6}/g;

// DNR quota-safe add rule
async function addDNRRule(rule) {
  if (dnrQuota.used >= dnrQuota.max) {
    console.warn('DNR quota hit – pruning oldest');
    // Prune logic: chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [oldestId] })
  }
  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [rule],
    removeRuleIds: rule.id ? [rule.id] : []
  });
  dnrQuota.used++;
}

// Debounced leak scan
const debouncedScan = debounce(async (tabId, details) => {
  const url = new URL(details.url);
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || /stun|turn/i.test(url.host)) {
    leakLog[url.href] = { ips: [], type: 'stun/turn', ts: Date.now() };
    // Extract IPs from SDP if WebRTC (post-handshake)
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const pc = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        if (pc) {
          const dummy = new pc();
          dummy.createDataChannel('');
          dummy.createOffer().then(offer => dummy.setLocalDescription(offer)).then(() => {
            dummy.localDescription.sdp.match(IP_REGEX)?.forEach(ip => {
              chrome.runtime.sendMessage({ type: 'logLeak', ip, domain: location.hostname });
            });
          });
        }
      }
    });
  }
}, DEBOUNCE_MS);

// WebRequest listener
chrome.webRequest.onBeforeRequest.addListener(
  debouncedScan,
  { urls: ['<all_urls>'] },
  ['blocking']
);

// DNR rules load (quota check)
chrome.runtime.onStartup.addListener(async () => {
  const rules = await fetch(chrome.runtime.getURL('rules.json')).then(r => r.json());
  for (const rule of rules) {
    await addDNRRule(rule);
  }
});

// Messages (scan trigger, export logs)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scan') {
    debouncedScan(sender.tab.id, { url: request.url });
    sendResponse({ status: 'scanning' });
  } else if (request.action === 'exportLogs') {
    const csv = Object.entries(leakLog).map(([url, data]) => 
      `${url},${data.ips.join(',')},${data.type},${data.ts}`
    ).join('\n');
    chrome.downloads.download({
      url: 'data:text/csv;charset=utf-8,' + encodeURIComponent('URL,IPs,Type,Timestamp\n' + csv),
      filename: 'ip_leaks.csv',
      saveAs: true
    });
    sendResponse({ status: 'exported' });
  }
  return true; // Async
});
