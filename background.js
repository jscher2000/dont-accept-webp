/* 
  Copyright 2020. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.5 - initial design
*/

let nowlistening; // used for toggling on and off
startListening(); // initialize

/**** Clean Accept Headers of Intercepted Requests ****/

function cleanAccept(details) { 
	// examine and modify the Accept header if present
	for (let header of details.requestHeaders) {
		if (header.name.toLowerCase() === 'accept'){
			let pos = header.value.toLowerCase().indexOf('image/webp');
			if (pos > -1){ // remove this content type
				header.value = header.value.slice(0, pos) + header.value.slice(pos + 10);
				pos = header.value.indexOf(',,');
				if (pos > -1){ // clean up double comma
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

/**** Handle Toolbar Button Clicks / Icon Changes ****/

// Listen for button click and turn listener on/off accordingly
browser.browserAction.onClicked.addListener((currTab) => {
	if (nowlistening) {
		// Remove listener
		stopListening();
	} else {
		// Add listener
		startListening();
	}
});

// when a window is focused, make sure it has the correct button
browser.windows.onFocusChanged.addListener((wid) => {
	setButton();
});

// Update icon image and tooltip
function setButton(){
	if (nowlistening){
		browser.browserAction.setIcon({
			path: {
				"128": "icons/dont-accept-webp.png"
			}
		});
		browser.browserAction.setTitle({title: 'Turn Don\'t accept webP OFF'});
	} else {
		browser.browserAction.setIcon({
			path: {
				"128": "icons/do-accept-webp.png"
			}
		});
		browser.browserAction.setTitle({title: 'Turn Don\'t accept webP ON'});
	}
}
