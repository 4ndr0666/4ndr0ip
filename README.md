# 4ndr0ip: Adaptive Threat Neutralization

<p align="center">
  <img src="https://raw.githubusercontent.com/4ndr0666/4ndr0ip/refs/heads/main/4ndr0ip.png" alt="4ndr0ip Banner" width="600">
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-3.0-blue.svg" alt="Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-Chrome-brightgreen.svg" alt="Platform"></a>
  <a href="https://github.com/TMAFE/anti-grabify/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-lightgrey.svg" alt="License"></a>
</p>

**4ndr0ip** is a browser extension engineered to provide a dynamic, resilient defense against IP logging services and other malicious trackers. Unlike static blockers that rely on outdated, bundled lists, 4ndr0ip functions as a living immune system, perpetually updating its intelligence to neutralize threats as they emerge.

## Core Philosophy

Static defenses are obsolete. In the fluid landscape of web-based threats, a hardcoded blocklist is a digital Maginot Line—a relic that provides only the illusion of security.

4ndr0ip is built on the principle of **adaptive defense**. It assumes the threat landscape is constantly evolving and is architected to evolve with it, ensuring that protection is not a snapshot in time but a continuous, automated process.

## Key Features

-   **Dynamic Threat Intelligence:** Automatically fetches and applies the latest blocklists from trusted remote sources every 24 hours. Your defenses are always current without requiring manual extension updates.
-   **High-Performance Filtering:** Leverages Chrome's native `declarativeNetRequest` API to block malicious requests at the network level, before they are processed. This ensures maximum performance with zero impact on browsing speed.
-   **Zero-Intervention Operation:** Once installed, 4ndr0ip operates silently and autonomously in the background. There are no settings to configure and no interruptions to your workflow.
-   **Resilient by Design:** Built with robust error handling and a data sanitization protocol. The system is hardened against network failures or malformed data from its intelligence feed, ensuring stable and consistent operation.

## Architectural Overview

4ndr0ip is a Manifest V3 Chrome extension built for the modern web. Its core logic resides in a lean, efficient service worker (`background.js`).

1.  **Initialization:** Upon installation, the extension immediately fetches the latest rule sets and creates a persistent alarm to re-initiate the update process every 24 hours.
2.  **Data Acquisition:** The service worker uses `Promise.all` to fetch multiple blocklist sources in parallel for maximum efficiency.
3.  **Sanitization & Ingestion:** All incoming rules are programmatically sanitized. The system explicitly reconstructs each rule to match the strict `declarativeNetRequest` schema, discarding any extraneous or invalid data. This critical step guarantees compatibility and prevents API-level errors from contaminated data streams.
4.  **Atomic Update:** The new, sanitized rule set is applied atomically. The entire collection of previous dynamic rules is purged and replaced in a single operation, preventing any state of inconsistent or partial protection.

## Installation

1.  Download this repository as a `.zip` file and extract it to a permanent location on your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle in the top-right corner.
4.  Click on the "Load unpacked" button that appears.
5.  Select the extracted directory containing `manifest.json`.

The 4ndr0ip icon will appear in your extension toolbar, and it will begin its first threat intelligence update immediately.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
