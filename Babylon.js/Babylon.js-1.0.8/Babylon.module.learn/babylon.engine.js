import Tools from './Tools/babylon.tools.js';
import Effect from './Materials/babylon.effect.js';

export default function Engine(canvas, antialias) {
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

	// Cache
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

};

// Properties
Engine.prototype.getAspectRatio = function () {
	return this._aspectRatio;
};

Engine.prototype.getRenderWidth = function () {
	return this._renderingCanvas.width;
};

Engine.prototype.getRenderHeight = function () {
	return this._renderingCanvas.height;
};

Engine.prototype.getRenderingCanvas = function () {
	return this._renderingCanvas;
};

Engine.prototype.setHardwareScalingLevel = function (level) {
	this._hardwareScalingLevel = level;
	this.resize();
};

Engine.prototype.getHardwareScalingLevel = function () {
	return this._hardwareScalingLevel;
};

Engine.prototype.getCaps = function () {
	return this._caps;
};

// Methods
Engine.prototype.stopRenderLoop = function () {
	this._runningLoop = false;
};

Engine.prototype.runRenderLoop = function (renderFunction) {
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
			Tools.QueueNewFrame(loop);
		}
	};

	Tools.QueueNewFrame(loop);
};

Engine.prototype.clear = function (color, backBuffer, depthStencil) {
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

Engine.prototype.beginFrame = function () {
	// Tools._MeasureFps();

	this._gl.viewport(0, 0, this._renderingCanvas.width, this._renderingCanvas.height);
};

Engine.prototype.endFrame = function () {
	this.flushFramebuffer();
};

Engine.prototype.resize = function () {
	this._renderingCanvas.width = this._renderingCanvas.clientWidth / this._hardwareScalingLevel;
	this._renderingCanvas.height = this._renderingCanvas.clientHeight / this._hardwareScalingLevel;
	this._aspectRatio = this._renderingCanvas.width / this._renderingCanvas.height;
};

Engine.prototype.flushFramebuffer = function () {
	this._gl.flush();
};

// VBOs
Engine.prototype.createVertexBuffer = function (vertices) {
	var vbo = this._gl.createBuffer();
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
	this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
	this._buffersCache.vertexBuffer = null;
	vbo.references = 1;
	return vbo;
};

Engine.prototype.createDynamicVertexBuffer = function (capacity) {
	var vbo = this._gl.createBuffer();
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
	this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
	this._buffersCache.vertexBuffer = null;
	vbo.references = 1;
	return vbo;
};

Engine.prototype.updateDynamicVertexBuffer = function (vertexBuffer, vertices) {
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
	this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
	this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
};

Engine.prototype.createIndexBuffer = function (indices, is32Bits) {
	var vbo = this._gl.createBuffer();
	this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, vbo);
	this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this._gl.STATIC_DRAW);
	this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
	this._buffersCache.indexBuffer = null;
	vbo.references = 1;
	vbo.is32Bits = is32Bits;
	return vbo;
};

Engine.prototype.bindBuffers = function (vertexBuffer, indexBuffer, vertexDeclaration, vertexStrideSize, effect) {
	if (this._buffersCache.vertexBuffer != vertexBuffer) {
		this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
		this._buffersCache.vertexBuffer = vertexBuffer;

		var offset = 0;
		for (var index = 0; index < vertexDeclaration.length; index++) {
			var order = effect.getAttribute(index);

			if (order >= 0) {
				this._gl.vertexAttribPointer(order, vertexDeclaration[index], this._gl.FLOAT, false, vertexStrideSize, offset);
			}
			offset += vertexDeclaration[index] * 4;
		}
	}

	if (this._buffersCache.indexBuffer != indexBuffer) {
		this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		this._buffersCache.indexBuffer = indexBuffer;
	}
};

Engine.prototype._releaseBuffer = function (buffer) {
	buffer.references--;

	if (buffer.references === 0) {
		this._gl.deleteBuffer(buffer);
	}
};

Engine.prototype.draw = function (useTriangles, indexStart, indexCount) {
	this._gl.drawElements(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, this._gl.UNSIGNED_SHORT, indexStart * 2);
};

// Shaders
Engine.prototype.createEffect = function (baseName, attributesNames, uniformsNames, samplers, defines) {
	var name = baseName + "@" + defines;
	if (this._compiledEffects[name]) {
		return this._compiledEffects[name];
	}

	var effect = new Effect(baseName, attributesNames, uniformsNames, samplers, this, defines);
	this._compiledEffects[name] = effect;

	return effect;
};

var compileShader = function (gl, source, type, defines) {
	var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

	gl.shaderSource(shader, (defines ? defines + "\n" : "") + source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(gl.getShaderInfoLog(shader));
	}
	return shader;
};

Engine.prototype.createShaderProgram = function (vertexCode, fragmentCode, defines) {
	var vertexShader = compileShader(this._gl, vertexCode, "vertex", defines);
	var fragmentShader = compileShader(this._gl, fragmentCode, "fragment", defines);

	var shaderProgram = this._gl.createProgram();
	this._gl.attachShader(shaderProgram, vertexShader);
	this._gl.attachShader(shaderProgram, fragmentShader);

	this._gl.linkProgram(shaderProgram);

	this._gl.deleteShader(vertexShader);
	this._gl.deleteShader(fragmentShader);

	return shaderProgram;
};

Engine.prototype.getUniforms = function (shaderProgram, uniformsNames) {
	var results = [];

	for (var index = 0; index < uniformsNames.length; index++) {
		results.push(this._gl.getUniformLocation(shaderProgram, uniformsNames[index]));
	}

	return results;
};

Engine.prototype.getAttributes = function (shaderProgram, attributesNames) {
	var results = [];

	for (var index = 0; index < attributesNames.length; index++) {
		try {
			results.push(this._gl.getAttribLocation(shaderProgram, attributesNames[index]));
		} catch (e) {
			results.push(-1);
		}
	}

	return results;
};

Engine.prototype.enableEffect = function (effect) {
	if (!effect || !effect.getAttributesCount() || this._currentEffect === effect) {
		return;
	}
	this._buffersCache.vertexBuffer = null;

	// Use program
	this._gl.useProgram(effect.getProgram());

	for (var index = 0; index < effect.getAttributesCount() ; index++) {
		// Attributes
		var order = effect.getAttribute(index);

		if (order >= 0) {
			this._gl.enableVertexAttribArray(effect.getAttribute(index));
		}
	}

	this._currentEffect = effect;
};

Engine.prototype.setMatrix = function (uniform, matrix) {
	if (!uniform){
		return;
	}

	this._gl.uniformMatrix4fv(uniform, false, matrix.toArray());
};

Engine.prototype.setVector2 = function (uniform, x, y) {
	if (!uniform){
		return;
	}

	this._gl.uniform2f(uniform, x, y);
};

Engine.prototype.setVector3 = function (uniform, vector3) {
	if (!uniform){
		return;
	}

	this._gl.uniform3f(uniform, vector3.x, vector3.y, vector3.z);
};

Engine.prototype.setFloat2 = function (uniform, x, y) {
	if (!uniform){
		return;
	}

	this._gl.uniform2f(uniform, x, y);
};

Engine.prototype.setFloat3 = function (uniform, x, y, z) {
	if (!uniform){
		return;
	}

	this._gl.uniform3f(uniform, x, y, z);
};

Engine.prototype.setBool = function (uniform, bool) {
	if (!uniform){
		return;
	}

	this._gl.uniform1i(uniform, bool);
};

Engine.prototype.setFloat4 = function (uniform, x, y, z, w) {
	if (!uniform){
		return;
	}

	this._gl.uniform4f(uniform, x, y, z, w);
};

Engine.prototype.setColor3 = function (uniform, color3) {
	if (!uniform){
		return;
	}

	this._gl.uniform3f(uniform, color3.r, color3.g, color3.b);
};

Engine.prototype.setColor4 = function (uniform, color3, alpha) {
	if (!uniform){
		return;
	}

	this._gl.uniform4f(uniform, color3.r, color3.g, color3.b, alpha);
};

// States
Engine.prototype.setState = function (culling) {
	// Culling        
	if (this._currentState.culling !== culling) {
		if (culling) {
			this._gl.cullFace(this.cullBackFaces ? this._gl.BACK : this._gl.FRONT);
			this._gl.enable(this._gl.CULL_FACE);
		} else {
			this._gl.disable(this._gl.CULL_FACE);
		}

		this._currentState.culling = culling;
	}
};

Engine.prototype.setDepthBuffer = function (enable) {
	if (enable) {
		this._gl.enable(this._gl.DEPTH_TEST);
	} else {
		this._gl.disable(this._gl.DEPTH_TEST);
	}
};

Engine.prototype.setDepthWrite = function (enable) {
	this._gl.depthMask(enable);
};

Engine.prototype.setAlphaTesting = function (enable) {
	this._alphaTest = enable;
};

Engine.prototype.getAlphaTesting = function () {
	return this._alphaTest;
};

// Engine.prototype.bindSamplers = function (effect) {
// 	this._gl.useProgram(effect.getProgram());
// 	var samplers = effect.getSamplers();
// 	for (var index = 0; index < samplers.length; index++) {
// 		var uniform = effect.getUniform(samplers[index]);
// 		this._gl.uniform1i(uniform, index);
// 	}
// 	this._currentEffect = null;
// };

// Dispose
Engine.prototype.dispose = function () {
	// Release scenes
	while (this.scenes.length) {
		this.scenes[0].dispose();
	}

	// Release effects
	for (var name in this._compiledEffects.length) {
		this._gl.deleteProgram(this._compiledEffects[name]._program);
	}
};

// Statics
Engine.ShadersRepository = "Babylon/Shaders/";

Engine.ALPHA_DISABLE = 0;
Engine.ALPHA_ADD = 1;
Engine.ALPHA_COMBINE = 2;

Engine.epsilon = 0.001;
Engine.collisionsEpsilon = 0.001;
