var BABYLON = BABYLON || {};

(function () {
	BABYLON.Tools = {};
	BABYLON.Tools.QueueNewFrame = function (func) {
		if (window.requestAnimationFrame)
			window.requestAnimationFrame(func);
		else if (window.msRequestAnimationFrame)
			window.msRequestAnimationFrame(func);
		else if (window.webkitRequestAnimationFrame)
			window.webkitRequestAnimationFrame(func);
		else if (window.mozRequestAnimationFrame)
			window.mozRequestAnimationFrame(func);
		else if (window.oRequestAnimationFrame)
			window.oRequestAnimationFrame(func);
		else {
			window.setTimeout(func, 16);
		}
	};

	// External files
	BABYLON.Tools.BaseUrl = "";

	BABYLON.Tools.LoadFile = function (
		url, callback, progressCallback
	){
		var request = new XMLHttpRequest();
		var loadUrl = BABYLON.Tools.BaseUrl + url;

		request.open('GET', loadUrl, true);

		request.onprogress = progressCallback;

		request.onreadystatechange = function (){
			if( request.readyState === 4 ){
				if( request.status === 200 ){
					callback(request.responseText);
				}else{
					throw new Error(request.status, "Unable to load" + loadUrl);
				}
			}
		}

		request.send(null);
	};


})();