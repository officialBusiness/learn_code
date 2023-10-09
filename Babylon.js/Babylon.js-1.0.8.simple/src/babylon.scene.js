var BABYLON = BABYLON || {};

(function () {

	BABYLON.Engine = function (canvas, antialias) {
	    this._renderingCanvas = canvas;

	    // GL
	    try {
	        this._gl = canvas.getContext("webgl", { antialias: antialias }) || canvas.getContext("experimental-webgl", { antialias: antialias });
	    } catch (e) {
	        throw new Error("WebGL not supported");
	    }

	    if (this._gl === undefined) {
	        throw new Error("WebGL not supported");
	    }

	    // Options
	    this.forceWireframe = false;
	    this.cullBackFaces = true;

	    // Scenes
	    this.scenes = [];

	    // Textures
	    this._workingCanvas = document.createElement("canvas");
	    this._workingContext = this._workingCanvas.getContext("2d");

	    // Viewport
	    this._hardwareScalingLevel = 1.0 / window.devicePixelRatio || 1.0;
	    this.resize();

	    // Caps
	    this._caps = {};
	    this._caps.maxTexturesImageUnits = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
	    this._caps.maxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
	    this._caps.maxCubemapTextureSize = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
	    this._caps.maxRenderTextureSize = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);

	    // Extensions
	    var derivatives = this._gl.getExtension('OES_standard_derivatives');
	    this._caps.standardDerivatives = (derivatives !== undefined);

	    // Cache
	    this._loadedTexturesCache = [];
	    this._activeTexturesCache = [];
	    this._buffersCache = {
	        vertexBuffer: null,
	        indexBuffer: null
	    };
	    this._currentEffect = null;
	    this._currentState = {
	        culling: null
	    };

	    this._compiledEffects = {};

	    this._gl.enable(this._gl.DEPTH_TEST);
	    this._gl.depthFunc(this._gl.LEQUAL);

	    // Fullscreen
	    this.isFullscreen = false;
	    var that = this;
	    document.addEventListener("fullscreenchange", function () {
	        that.isFullscreen = document.fullscreen;
	    }, false);

	    document.addEventListener("mozfullscreenchange", function () {
	        that.isFullscreen = document.mozFullScreen;
	    }, false);

	    document.addEventListener("webkitfullscreenchange", function () {
	        that.isFullscreen = document.webkitIsFullScreen;
	    }, false);

	    document.addEventListener("msfullscreenchange", function () {
	        that.isFullscreen = document.msIsFullScreen;
	    }, false);
	};

	BABYLON.Engine.prototype.runRenderLoop = function (renderFunction) {
	    this._runningLoop = true;
	    var that = this;

	    var loop = function () {
	        // Start new frame
	        that.beginFrame();

	        renderFunction();

	        // Present
	        that.endFrame();

	        if (that._runningLoop) {
	            // Register new frame
	            BABYLON.Tools.QueueNewFrame(loop);
	        }
	    };

	    BABYLON.Tools.QueueNewFrame(loop);
	};
	
    BABYLON.Engine.prototype.resize = function () {
        this._renderingCanvas.width = this._renderingCanvas.clientWidth / this._hardwareScalingLevel;
        this._renderingCanvas.height = this._renderingCanvas.clientHeight / this._hardwareScalingLevel;
        this._aspectRatio = this._renderingCanvas.width / this._renderingCanvas.height;
    };
})();