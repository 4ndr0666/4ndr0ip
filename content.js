// content.js — Runs in MAIN world, hooks RTCPeerConnection
(() => {
  if (window._4ndr0ipActive) return;
  window._4ndr0ipActive = true;

  const IP_REGEX = /(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|fe80:(?::[0-9a-fA-F]{1,4}){0,4}%[0-9a-zA-Z]+|fc00:(?::[0-9a-fA-F]{1,4}){0,6}/g;

  const orig = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  if (!orig) return;

  window.RTCPeerConnection = function(...args) {
    const pc = new orig(...args);

    pc.addEventListener('icecandidate', (e) => {
      if (e.candidate?.candidate) {
        const ips = e.candidate.candidate.match(IP_REGEX) || [];
        if (ips.length) chrome.runtime.sendMessage({ type: 'logLeak', ips });
      }
    });

    const origSetLocal = pc.setLocalDescription;
    pc.setLocalDescription = function(desc) {
      if (desc?.sdp) {
        const ips = desc.sdp.match(IP_REGEX) || [];
        if (ips.length) chrome.runtime.sendMessage({ type: 'logLeak', ips });
      }
      return origSetLocal.apply(this, arguments);
    };

    return pc;
  };
})();
