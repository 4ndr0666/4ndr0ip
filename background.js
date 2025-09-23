// Using const for constants to ensure they are not reassigned.
const UPDATE_ALARM_NAME = 'update-rules-alarm';
const DYNAMIC_RULESET_ID = 'dynamic_ruleset';

// This is the source of truth for the dynamic blocklist, locked to the validated URLs.
const REMOTE_RULE_LISTS = [
  'https://raw.githubusercontent.com/TMAFE/anti-grabify/refs/heads/master/chrome/other-urls.json',
  'https://raw.githubusercontent.com/TMAFE/anti-grabify/refs/heads/master/chrome/grabify-urls.json',
  'https://raw.githubusercontent.com/TMAFE/anti-grabify/refs/heads/master/chrome/iplogger-urls.json'
];

// Listener for the extension's installation or update event. This is the entry point.
chrome.runtime.onInstalled.addListener(() => {
  console.log('4ndr0ip extension installed/updated.');
  chrome.action.setTitle({ title: '4ndr0ip is active.' });
  updateRules();
  chrome.alarms.create(UPDATE_ALARM_NAME, {
    periodInMinutes: 1440 // 24 hours
  });
});

// Listener for the alarm. When it fires, trigger the rule update process.
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM_NAME) {
    console.log('Scheduled update triggered by alarm.');
    updateRules();
  }
});

// Main function to fetch, process, and apply new rules.
async function updateRules() {
  console.log('Starting rule update process...');
  try {
    const remoteRules = await getRemoteRules(REMOTE_RULE_LISTS);
    const existingRules = await getEnabledRulesets();
    const existingRuleIds = existingRules.map(rule => rule.id);
    const rulesToAdd = remoteRules;
    const ruleIdsToRemove = existingRuleIds;

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: rulesToAdd
    });

    console.log(`Successfully updated rules. Removed: ${ruleIdsToRemove.length}, Added: ${rulesToAdd.length}`);

  } catch (error) {
    console.error('Failed to update dynamic rules:', error);
  }
}

// Fetches, consolidates, AND SANITIZES rules from multiple remote JSON files.
async function getRemoteRules(urls) {
  const responses = await Promise.all(urls.map(url => fetch(url)));
  let allRules = [];
  for (const res of responses) {
    if (!res.ok) {
      throw new Error(`Failed to fetch rule list: ${res.statusText} from ${res.url}`);
    }
    const rules = await res.json();
    if (Array.isArray(rules)) {
      allRules = allRules.concat(rules);
    } else {
      console.warn(`Received non-array data from ${res.url}`);
    }
  }

  // This is the new sanitization protocol.
  // We explicitly construct a new, clean rule object, discarding any properties
  // that are not part of the valid declarativeNetRequest.Rule schema.
  // This hardens the extension against malformed or outdated remote data.
  return allRules.map((rule, index) => ({
    id: 1000 + index, // Assign a new, safe, and unique ID.
    priority: rule.priority,
    action: rule.action,
    condition: rule.condition
  }));
}

// Retrieves the currently active dynamic ruleset.
async function getEnabledRulesets() {
  try {
    return await chrome.declarativeNetRequest.getDynamicRules();
  } catch (error) {
    console.error('Could not retrieve enabled rulesets:', error);
    return [];
  }
}
