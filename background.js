// Using const for constants to ensure they are not reassigned.
// These are the foundational axioms of the script's logic.
const UPDATE_ALARM_NAME = 'update-rules-alarm';
const DYNAMIC_RULESET_ID = 'dynamic_ruleset'; // Retained for architectural clarity.

// This is the source of truth for the dynamic blocklist, locked to the validated URLs.
const REMOTE_RULE_LISTS = [
  'https://raw.githubusercontent.com/TMAFE/anti-grabify/refs/heads/master/chrome/other-urls.json',
  'https://raw.githubusercontent.com/TMAFE/anti-grabify/refs/heads/master/chrome/grabify-urls.json',
  'https://raw.githubusercontent.com/TMAFE/anti-grabify/refs/heads/master/chrome/iplogger-urls.json'
];

// Listener for the extension's installation or update event. This is the entry point.
chrome.runtime.onInstalled.addListener(() => {
  console.log('4ndr0ip extension installed/updated.');
  
  // Set the action title on installation for immediate user feedback.
  chrome.action.setTitle({ title: '4ndr0ip is active.' });

  // Schedule the first update check immediately to ensure day-one protection.
  updateRules();

  // Create a recurring alarm to check for updates daily.
  // This is the correct, resource-efficient method for a Manifest V3 service worker.
  chrome.alarms.create(UPDATE_ALARM_NAME, {
    periodInMinutes: 1440 // 1440 minutes = 24 hours
  });
});

// Listener for the alarm. When it fires, trigger the rule update process.
chrome.alarms.onAlarm.addListener((alarm) => {
  // Using strict equality '===' to prevent type coercion bugs.
  if (alarm.name === UPDATE_ALARM_NAME) {
    console.log('Scheduled update triggered by alarm.');
    updateRules();
  }
});

// Main function to fetch, process, and apply new rules.
// Implemented with async/await for clean, readable asynchronous code.
async function updateRules() {
  console.log('Starting rule update process...');
  try {
    // Fetch all remote rules concurrently for maximum performance.
    const remoteRules = await getRemoteRules(REMOTE_RULE_LISTS);
    
    // Get the currently active dynamic rules to perform an atomic replacement.
    const existingRules = await getEnabledRulesets();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // Prepare the rules for the declarativeNetRequest API.
    // The strategy is to remove all prior dynamic rules before adding the new set.
    const rulesToAdd = remoteRules;
    const ruleIdsToRemove = existingRuleIds;

    // Perform the update. This is an atomic operation, preventing inconsistent states.
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: rulesToAdd
    });

    console.log(`Successfully updated rules. Removed: ${ruleIdsToRemove.length}, Added: ${rulesToAdd.length}`);

  } catch (error) {
    // Comprehensive error handling for the entire async process ensures the extension remains stable.
    console.error('Failed to update dynamic rules:', error);
  }
}

// Fetches and consolidates rules from multiple remote JSON files.
async function getRemoteRules(urls) {
  // Using Promise.all to fetch all lists in parallel, a significant optimization.
  const responses = await Promise.all(urls.map(url => fetch(url)));

  let allRules = [];
  for (const res of responses) {
    // Check if the network request was successful.
    if (!res.ok) {
      // Throw a descriptive error if any data stream fails.
      throw new Error(`Failed to fetch rule list: ${res.statusText} from ${res.url}`);
    }
    const rules = await res.json();
    // Ensure the fetched data is an array before concatenating to prevent errors.
    if (Array.isArray(rules)) {
      allRules = allRules.concat(rules);
    } else {
      console.warn(`Received non-array data from ${res.url}`);
    }
  }
  
  // The declarativeNetRequest API requires unique IDs for each rule.
  // We re-map the IDs here programmatically to ensure there are no collisions between different lists
  // and to start them from a high number to avoid clashing with the bundled `rules.json`.
  return allRules.map((rule, index) => ({
    ...rule,
    id: 1000 + index // Start dynamic rule IDs from 1000 for safety.
  }));
}

// Retrieves the currently active dynamic ruleset.
async function getEnabledRulesets() {
  try {
    return await chrome.declarativeNetRequest.getDynamicRules();
  } catch (error) {
    console.error('Could not retrieve enabled rulesets:', error);
    // Return an empty array on failure to allow the update logic to proceed gracefully.
    return [];
  }
}
