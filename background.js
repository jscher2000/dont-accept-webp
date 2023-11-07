/* 
  Copyright 2023. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.5 - initial design
  v0.5.1 - updated icons
  v0.6 - pesky commas...
  v0.7 - new menu; option to also not accept AVIF
  v0.8 - ability to exempt a site and embedded/linked files
  v0.8.1, v0.8.2 - bug fix
  v0.9 - automatic deconfliction
*/

let nowlistening; // used for toggling listener

/**** Initialize Preferences ****/

// Default starting values
var oPrefs = {
	toBlock: [
		"image/webp"
	],
	exemptSites: [
		"www.patreon.com", 
		"patreon.com"
	]
}

// Update oPrefs from storage
browser.storage.local.get("prefs").then( (results) => {
	if (results.prefs != undefined){
		if (JSON.stringify(results.prefs) != '{}'){
			var arrSavedPrefs = Object.keys(results.prefs);
			for (var j=0; j<arrSavedPrefs.length; j++){
				oPrefs[arrSavedPrefs[j]] = results.prefs[arrSavedPrefs[j]];
			}
		}
	}
	// initialize
	if (oPrefs.toBlock.length > 0) startListening();
}).catch((err) => {console.log('Error retrieving "prefs" from storage: '+err.message);});

// Build deconfliction list and set up related extension management events (version 0.9)
deconExtList = [
	{
		id: "{4c421bb7-c1de-4dc6-80c7-ce8625e34d24}",
		name: "Load Reddit Images Directly",
		hosts: ["i.redd.it", "external-preview.redd.it", "preview.redd.it"]
	}
];
deconActive = [];
function deconChecker(extInfo){
	var dPat = deconExtList.find(objExt => objExt.id === extInfo.id);
	if (dPat == undefined) return;
	var indx = deconActive.indexOf(dPat.id);
	if (extInfo.enabled == true && indx > -1) return; // no action needed
	if (extInfo.enabled != true && indx <= -1) return; // no action needed
	if (extInfo.enabled == true && indx <= -1) deconActive.push(dPat.id); // add to active list
	if (extInfo.enabled != true && indx > -1) deconActive.splice(indx, 1); // remove from active list
}
browser.management.getAll().then((arrExtInfo) => {
	for (var j=0; j<arrExtInfo.length; j++){
		deconChecker(arrExtInfo[j]);
	}
});
browser.management.onInstalled.addListener(deconChecker);
browser.management.onEnabled.addListener(deconChecker);
browser.management.onDisabled.addListener(deconChecker);
browser.management.onUninstalled.addListener(deconChecker);

/**** Clean Accept Headers of Intercepted Requests ****/

function cleanAccept(details) { 
	// v0.8 exit for hostnames on the exemptSites list [FUTURE VERSION: allow partial matches?]
	var reqUrl = new URL(details.url);
	if (oPrefs.exemptSites.length > 0){
		if (oPrefs.exemptSites.includes(reqUrl.hostname)) return { requestHeaders: details.requestHeaders };
		if (details.documentUrl != null && details.documentUrl != undefined){
			var docUrl = new URL(details.documentUrl);
			if (oPrefs.exemptSites.includes(docUrl.hostname)) return { requestHeaders: details.requestHeaders };
		} 
		if (details.originUrl != null && details.originUrl != undefined){
			var origUrl = new URL(details.originUrl);
			if (oPrefs.exemptSites.includes(origUrl.hostname)) return { requestHeaders: details.requestHeaders };
		}
	}

	// v0.9 exit for hostnames on the deconfliction list
	for (var i=0; i<deconActive.length; i++){
		var deconObj = deconExtList.find(objExt => objExt.id === deconActive[i]);
		var deconHosts = deconObj.hosts;
		if (deconHosts.includes(reqUrl.hostname)){
			console.log('Deconfliction in effect for ' + reqUrl.hostname + '; SKIPPING!');
			return { requestHeaders: details.requestHeaders };
		}
	}

	// examine and modify the Accept header if present
	for (let header of details.requestHeaders) {
		if (header.name.toLowerCase() === 'accept'){
			for (var i=0; i<oPrefs.toBlock.length; i++){
				let pos = header.value.toLowerCase().indexOf(oPrefs.toBlock[i] + ',');
				if (pos > -1){ // remove this content type with trailing comma
					header.value = header.value.slice(0, pos) + header.value.slice(pos + 11);
				}
				pos = header.value.toLowerCase().indexOf(oPrefs.toBlock[i]);
				if (pos > -1){ // remove this content type
					header.value = header.value.slice(0, pos) + header.value.slice(pos + 10);
				}
				pos = header.value.indexOf(',,');
				if (pos > -1){ // clean up any double comma
					header.value = header.value.slice(0, pos) + header.value.slice(pos + 1);
				}
			}
			break;
		}
	}
	// dispatch headers, we're done
	return { requestHeaders: details.requestHeaders };
}

/**** Set up and Tear Down webRequest listener ****/

function startListening(){
	browser.webRequest.onBeforeSendHeaders.addListener(
		cleanAccept,
		{ urls: ["<all_urls>"] },
		["blocking", "requestHeaders"]
	);		
	nowlistening = true;
	// Update toolbar button
	setButton();
}

function stopListening(){
	browser.webRequest.onBeforeSendHeaders.removeListener(cleanAccept);
	nowlistening = false;
	// Update toolbar button
	setButton();
}

/**** Handle Icon Changes ****/

// when a window is focused, make sure it has the correct button
browser.windows.onFocusChanged.addListener((wid) => {
	setButton();
});

// Update icon image and tooltip
function setButton(){
	if (nowlistening){
		browser.browserAction.setIcon({
			path: {
				"128": "icons/dont-accept-webp2.png"
			}
		});
	} else {
		browser.browserAction.setIcon({
			path: {
				"128": "icons/do-accept-webp2.png"
			}
		});
	}
}

/**** MESSAGE HANDLER ****/

// Handle Popup menu actions 
function handleMessage(request, sender, sendResponse) {
	if ('prefs' in request) {
		// Return oPrefs to popup
		sendResponse({
			prefs: oPrefs
		});
		return true;
	} else if ('prefupdate' in request){
		// Take what the popup sends us, assume it's valid
		oPrefs = request.prefupdate;
		// Update storage (async is fine)
		browser.storage.local.set({prefs: oPrefs})
			.catch((err) => {console.log('Error on browser.storage.local.set(): '+err.message);});
		// Update listener if needed
		if (nowlistening == true && oPrefs.toBlock.length === 0) { // Stop listening
			stopListening();
		} else if (nowlistening == false && oPrefs.toBlock.length > 0) { // Start listening
			startListening();
		}
	}
}
browser.runtime.onMessage.addListener(handleMessage);