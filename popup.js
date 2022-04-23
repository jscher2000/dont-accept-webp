/* 
  Copyright 2022. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.7 - new menu; option to also not accept AVIF
  v0.8 - ability to exempt a site and embedded/linked media
*/

/**** Menu Setup ****/

let oPrefs = {};

// Update oPrefs from background
browser.runtime.sendMessage({
	prefs: true
}).then((oBGprefs) => {
	oPrefs = oBGprefs.prefs;
	// initialize menu items
	if (oPrefs.toBlock.includes('image/webp')) document.querySelector('#webp > span').textContent = '☑';
	if (oPrefs.toBlock.includes('image/avif')) document.querySelector('#avif > span').textContent = '☑';
	// v0.8 exempt site item
	browser.tabs.query({active:true,currentWindow:true}).then(function(tabs){
		var hostname = new URL(tabs[0].url).hostname;
		if (hostname){
			document.getElementById('hostname').textContent = hostname;
			if (oPrefs.exemptSites.includes(hostname)) document.querySelector('#site > span').textContent = '☑';
		} else {
			document.getElementById('site').style.display = 'none';
		}
	});
}).catch((err) => {
	console.log('Problem getting oPrefs: ' + err.message);
});

/**** Event handlers ****/

function menuClick(evt){
	var tgt = evt.target;
	if (tgt.id == 'webp' || tgt.parentNode.id == 'webp'){
		// Update oPrefs and display of menus
		var indx = oPrefs.toBlock.indexOf('image/webp');
		if (indx > -1){ //remove image/webp
			oPrefs.toBlock.splice(indx, 1);
			document.querySelector('#webp > span').textContent = '☐';
		} else {
			oPrefs.toBlock.push('image/webp');
			document.querySelector('#webp > span').textContent = '☑';
		}
		// Send new oPrefs off to the background script
		updatePref();
		return;
	}
	if (tgt.id == 'avif' || tgt.parentNode.id == 'avif'){
		// Update oPrefs and display of menus
		var indx = oPrefs.toBlock.indexOf('image/avif');
		if (indx > -1){ //remove image/avif
			oPrefs.toBlock.splice(indx, 1);
			document.querySelector('#avif > span').textContent = '☐';
		} else {
			oPrefs.toBlock.push('image/avif');
			document.querySelector('#avif > span').textContent = '☑';
		}
		// Send new oPrefs off to the background script
		updatePref();
		return;
	}
	// v0.8 exemptSites
	if (tgt.id == 'site' || tgt.parentNode.id == 'site'){
		var hostname = document.getElementById('hostname').textContent;
		// Update oPrefs and display of menus
		var indx = oPrefs.exemptSites.indexOf(hostname);
		if (indx > -1){ //remove hostname
			oPrefs.exemptSites.splice(indx, 1);
			document.querySelector('#site > span').textContent = '☐';
		} else {
			oPrefs.exemptSites.push(hostname);
			document.querySelector('#site > span').textContent = '☑';
		}
		// Send new oPrefs off to the background script
		updatePref();
		return;
	}
}
document.querySelector('#stripitems').addEventListener('click', menuClick, false);

function updatePref(){
	// Send oPrefs in an update
	browser.runtime.sendMessage({
		prefupdate: oPrefs
	}).catch((err) => {
		console.log('Problem sending update: ' + err.message);
	});
}
