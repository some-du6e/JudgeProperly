const FLAVORTOWN_PROJECT_ID = '16326';
const FLAVORTOWN_HEADER_RULE_ID = 42001;
const FLAVORTOWN_REQUEST_TYPES = [
	'main_frame',
	'sub_frame',
	'stylesheet',
	'script',
	'image',
	'font',
	'object',
	'xmlhttprequest',
	'ping',
	'csp_report',
	'media',
	'websocket',
	'webbundle',
	'other'
];

function getFlavortownHeaderName(projectId) {
	if (!/^\d+$/.test(projectId)) {
		return null;
	}

	return `X-Flavortown-Ext-${projectId}`;
}

async function syncFlavortownRegistrationRule() {
	const projectId = FLAVORTOWN_PROJECT_ID.trim();
	const headerName = getFlavortownHeaderName(projectId);

	await chrome.declarativeNetRequest.updateDynamicRules({
		removeRuleIds: [FLAVORTOWN_HEADER_RULE_ID],
		addRules: headerName
			? [
					{
						id: FLAVORTOWN_HEADER_RULE_ID,
						priority: 1,
						action: {
							type: 'modifyHeaders',
							requestHeaders: [
								{
									header: headerName,
									operation: 'set',
									value: 'true'
								}
							]
						},
						condition: {
							urlFilter: '||flavortown.hackclub.com',
							resourceTypes: FLAVORTOWN_REQUEST_TYPES
						}
					}
				]
			: []
	});

	if (!headerName) {
		console.warn('Judge Properly: set FLAVORTOWN_PROJECT_ID in service-worker.js to enable Flavortown extension registration.');
	}
}

chrome.runtime.onInstalled.addListener(() => {
	void syncFlavortownRegistrationRule();
});

chrome.runtime.onStartup.addListener(() => {
	void syncFlavortownRegistrationRule();
});

void syncFlavortownRegistrationRule();
