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

		// Viewport
		this._hardwareScalingLevel = 1.0 / window.devicePixelRatio || 1.0;
		this.resize();

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
	}

  // Properties
  BABYLON.Engine.prototype.getAspectRatio = function () {
      return this._aspectRatio;
  };

	// Methods
	BABYLON.Engine.prototype.stopRenderLoop = function () {
		this._runningLoop = false;
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

	BABYLON.Engine.prototype.clear = function (
		color, backBuffer, depthStencil
	) {
	  this._gl.clearColor(color.r, color.g, color.b, 1.0);
	  this._gl.clearDepth(1.0);
	  var mode = 0;

	  if (backBuffer || this.forceWireframe){
      mode |= this._gl.COLOR_BUFFER_BIT;
	  }

	  if (depthStencil){
      mode |= this._gl.DEPTH_BUFFER_BIT;
	  }

	  this._gl.clear(mode);
	};

	BABYLON.Engine.prototype.beginFrame = function () {
		this._gl.viewport(0, 0, this._renderingCanvas.width, this._renderingCanvas.height);
	};

	BABYLON.Engine.prototype.endFrame = function () {
		this.flushFramebuffer();
	};

	BABYLON.Engine.prototype.resize = function () {
		this._renderingCanvas.width = this._renderingCanvas.clientWidth / this._hardwareScalingLevel;
		this._renderingCanvas.height = this._renderingCanvas.clientHeight / this._hardwareScalingLevel;
		this._aspectRatio = this._renderingCanvas.width / this._renderingCanvas.height;
	};

	BABYLON.Engine.prototype.flushFramebuffer = function () {
		this._gl.flush();
	};

	// VBOs
	BABYLON.Engine.prototype.createVertexBuffer = function (vertices) {
		var vbo = this._gl.createBuffer();
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
		this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

		vbo.references = 1;
		return vbo;
	};

	BABYLON.Engine.prototype.createDynamicVertexBuffer = function (capacity) {
		var vbo = this._gl.createBuffer();
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
		this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);

		vbo.references = 1;
		return vbo;
	};

	BABYLON.Engine.prototype.updateDynamicVertexBuffer = function (vertexBuffer, vertices) {
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
		this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
	};

	BABYLON.Engine.prototype.createIndexBuffer = function (indices, is32Bits) {
		var vbo = this._gl.createBuffer();
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, vbo);
		this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this._gl.STATIC_DRAW);
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);

		vbo.references = 1;
		vbo.is32Bits = is32Bits;
		return vbo;
	};

	BABYLON.Engine.prototype.bindBuffers = function (
		vertexBuffer, indexBuffer,
		vertexDeclaration, vertexStrideSize, effect
	){

	  this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
	  // this._buffersCache.vertexBuffer = vertexBuffer;

	  var offset = 0;
	  for (var index = 0; index < vertexDeclaration.length; index++) {
      var order = effect.getAttribute(index);

      if (order >= 0) {
        this._gl.vertexAttribPointer(order, vertexDeclaration[index], this._gl.FLOAT, false, vertexStrideSize, offset);
      }
      offset += vertexDeclaration[index] * 4;
	  }

	  this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	  // this._buffersCache.indexBuffer = indexBuffer;
	}

  BABYLON.Engine.prototype.draw = function (
  	useTriangles, indexStart, indexCount
  ) {
		this._gl.drawElements(
			useTriangles ? this._gl.TRIANGLES : this._gl.LINES,
			indexCount, this._gl.UNSIGNED_SHORT, indexStart * 2
		);
  };


	//Shaders
	BABYLON.Engine.prototype.createEffect = function (
		baseName,
		attributesNames, uniformsNames,
		samplers, defines
	){
		var name = baseName + "@" + defines;
		if( this._compiledEffects[name] ){
			return this._compiledEffects[name];
		}

		var effect = new BABYLON.Effect(
			baseName,
			attributesNames, uniformsNames,
			samplers, this, defines);

		this._compiledEffects[name] = effect;

		return effect;
	}

	var compileShader = function (
		gl, source, type, defines
	){
		var shader = gl.createShader(
			type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
		);

		gl.shaderSource(shader,
			(defines ? defines + "\n" : "") + source
		);
		gl.compileShader(shader);

		if( !gl.getShaderParameter(shader, gl.COMPILE_STATUS) ){
			throw new Error(gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	BABYLON.Engine.prototype.createShaderProgram = function (
		vertexCode,fragmentCode, defines
	){
		var vertexShader = compileShader(this._gl, vertexCode, 'vertex', defines);
		var fragmentShader = compileShader(this._gl, fragmentCode, 'fragment', defines);

		var shaderProgram = this._gl.createProgram();
		this._gl.attachShader(shaderProgram, vertexShader);
		this._gl.attachShader(shaderProgram, fragmentShader);

		this._gl.linkProgram(shaderProgram);

		this._gl.deleteShader(vertexShader);
		this._gl.deleteShader(fragmentShader);

		return shaderProgram;
	}

	BABYLON.Engine.prototype.getUniforms = function (
		shaderProgram, uniformsNames
	) {
		var results = [];

		for( let index = 0; index < uniformsNames.length; index++ ){
			results.push( this._gl.getUniformLocation(shaderProgram, uniformsNames[index]) );
		}

		return results;
	}

	BABYLON.Engine.prototype.getAttributes = function (
		shaderProgram,
		attributesNames
	) {
		var results = [];

		for( var index = 0; index < attributesNames.length; index ++ ){
			try{

				results.push( this._gl.getAttribLocation(shaderProgram, attributesNames[index]) );
			}catch(e){

				results.push(-1);
			}
		}
		return results;
	}

	BABYLON.Engine.prototype.enableEffect = function (effect){

		this._gl.useProgram(effect.getProgram());

		for( var index = 0; index < effect.getAttributesCount(); index++ ){
			var order = effect.getAttribute(index);

			if (order >= 0) {
				this._gl.enableVertexAttribArray(effect.getAttribute(index));
			}
		}

		this._currentEffect = effect;
	}

	BABYLON.Engine.prototype.setMatrix = function (uniform, matrix) {
	  if (!uniform){
			return;
	  }

	  this._gl.uniformMatrix4fv(uniform, false, matrix.toArray());
	};

	BABYLON.Engine.prototype.setVector3 = function (uniform, vector3) {
	  if (!uniform){
      return;
	  }

	  this._gl.uniform3f(uniform, vector3.x, vector3.y, vector3.z);
	};

  BABYLON.Engine.prototype.setFloat4 = function (uniform, x, y, z, w) {
    if (!uniform){
      return;
    }

    this._gl.uniform4f(uniform, x, y, z, w);
  };

  BABYLON.Engine.prototype.setColor3 = function (uniform, color3) {
    if (!uniform){
      return;
    }

    this._gl.uniform3f(uniform, color3.r, color3.g, color3.b);
  };

  BABYLON.Engine.prototype.setColor4 = function (uniform, color3, alpha) {
    if (!uniform){
      return;
    }

    this._gl.uniform4f(uniform, color3.r, color3.g, color3.b, alpha);
  };



	// States
	BABYLON.Engine.prototype.setState = function(culling){

		if (this._currentState.culling !== culling) {
		  if (culling) {
	      this._gl.cullFace(this.cullBackFaces ? this._gl.BACK : this._gl.FRONT);
	      this._gl.enable(this._gl.CULL_FACE);
		  } else {
	      this._gl.disable(this._gl.CULL_FACE);
		  }

		  this._currentState.culling = culling;
		}
	}

	// Statics
	BABYLON.Engine.ShadersRepository = "Babylon/Shaders/";

  BABYLON.Engine.epsilon = 0.001;
  BABYLON.Engine.collisionsEpsilon = 0.001;


})();
