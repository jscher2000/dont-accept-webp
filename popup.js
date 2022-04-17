/* 
  Copyright 2021. Jefferson "jscher2000" Scher. License: MPL-2.0.
  v0.7 - new menu; option to also not accept AVIF
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
