// 4ndr0ip Content – Post-Handshake Leak Hunter v1.1.0
// Injected document_start MAIN – hooks RTCPeerConnection for trickle ICE

// Singleton
if (window._4ndr0ipActive) return;
window._4ndr0ipActive = true;

// Original RTCPeerConnection
const OriginalRTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
if (OriginalRTCPeerConnection) {
  window.RTCPeerConnection = function(...args) {
    const pc = new OriginalRTCPeerConnection(...args);
    pc.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        const candidate = e.candidate.candidate;
        const ips = candidate.match(IP_REGEX) || [];
        if (ips.length) {
          chrome.runtime.sendMessage({ type: 'logLeak', ips, domain: location.hostname });
        }
      }
    });
    return pc;
  };
  window.RTCPeerConnection.prototype = OriginalRTCPeerConnection.prototype;
}

// SDP parsing on setLocal/RemoteDescription
const originalSetLocal = OriginalRTCPeerConnection.prototype.setLocalDescription;
OriginalRTCPeerConnection.prototype.setLocalDescription = function(desc) {
  if (desc.type === 'offer' || desc.type === 'answer') {
    const sdp = desc.sdp || '';
    const ips = sdp.match(IP_REGEX) || [];
    if (ips.length) {
      chrome.runtime.sendMessage({ type: 'logLeak', ips, domain: location.hostname });
    }
  }
  return originalSetLocal.call(this, desc);
};
