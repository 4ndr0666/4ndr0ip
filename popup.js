// 4ndr0ip Popup v1.1.0
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scan-btn');
  const statusDiv = document.getElementById('status');
  const ipv6Check = document.getElementById('ipv6-check');
  const exportBtn = document.getElementById('export-btn');
  const logBtn = document.getElementById('toggle-log');
  const logPanel = document.getElementById('log-panel');
  const logList = document.getElementById('log-list');

  // Scan trigger
  scanBtn.onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.runtime.sendMessage({ action: 'scan', url: tabs[0].url });
      statusDiv.textContent = 'Scanning...';
      statusDiv.className = 'status';
    });
  };

  // IPv6 toggle (store for content.js)
  ipv6Check.onchange = () => {
    chrome.storage.sync.set({ ipv6Enabled: ipv6Check.checked });
  };

  // Export logs
  exportBtn.onclick = () => {
    chrome.runtime.sendMessage({ action: 'exportLogs' });
  };

  // Toggle logs
  logBtn.onclick = () => {
    logPanel.style.display = logPanel.style.display === 'none' ? 'block' : 'none';
    if (logPanel.style.display === 'block') loadLogs();
  };

  async function loadLogs() {
    const response = await chrome.runtime.sendMessage({ action: 'getLogs' });
    logList.innerHTML = Object.entries(response.logs).map(([url, data]) => 
      `<li>${url}: ${data.ips.join(', ')} (${data.type})</li>`
    ).join('') || '<li>No leaks logged</li>';
  }

  // Init
  chrome.storage.sync.get(['ipv6Enabled'], (result) => {
    ipv6Check.checked = result.ipv6Enabled !== false;
  });
  // Listen for scan updates
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'scanDone') {
      statusDiv.textContent = msg.leaks ? `Found ${msg.leaks.length} leaks` : 'Clean';
      statusDiv.className = msg.leaks ? 'status disabled' : 'status enabled';
    }
  });
});
