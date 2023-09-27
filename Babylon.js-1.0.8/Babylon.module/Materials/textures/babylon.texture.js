import { Matrix, Vector3 } from '../../Tools/babylon.math.js';
import BaseTexture from './babylon.baseTexture.js';

export default function Texture(url, scene, noMipmap, invertY) {
	this._scene = scene;
	this._scene.textures.push(this);

	this.name = url;

	this._texture = this._getFromCache(url, noMipmap);

	if (!this._texture) {
		this._texture = scene.getEngine().createTexture(url, noMipmap, invertY, scene);
	}

	// Animations
	this.animations = [];
};

Texture.prototype = Object.create(BaseTexture.prototype);

// Constants
Texture.EXPLICIT_MODE = 0;
Texture.SPHERICAL_MODE = 1;
Texture.PLANAR_MODE = 2;
Texture.CUBIC_MODE = 3;
Texture.PROJECTION_MODE = 4;
Texture.SKYBOX_MODE = 5;

Texture.CLAMP_ADDRESSMODE = 0;
Texture.WRAP_ADDRESSMODE = 1;
Texture.MIRROR_ADDRESSMODE = 2;

// Members
Texture.prototype.uOffset = 0;
Texture.prototype.vOffset = 0;
Texture.prototype.uScale = 1.0;
Texture.prototype.vScale = 1.0;
Texture.prototype.uAng = 0;
Texture.prototype.vAng = 0;
Texture.prototype.wAng = 0;
Texture.prototype.wrapU = Texture.WRAP_ADDRESSMODE;
Texture.prototype.wrapV = Texture.WRAP_ADDRESSMODE;
Texture.prototype.coordinatesIndex = 0;
Texture.prototype.coordinatesMode = Texture.EXPLICIT_MODE;

// Methods    
Texture.prototype._prepareRowForTextureGeneration = function (t) {
	var matRot = Matrix.RotationYawPitchRoll(this.vAng, this.uAng, this.wAng);

	t.x -= this.uOffset + 0.5;
	t.y -= this.vOffset + 0.5;
	t.z -= 0.5;

	t = Vector3.TransformCoordinates(t, matRot);

	t.x *= this.uScale;
	t.y *= this.vScale;

	t.x += 0.5;
	t.y += 0.5;
	t.z += 0.5;

	return t;
};

Texture.prototype._computeTextureMatrix = function () {
	if (
		this.uOffset === this._cachedUOffset &&
		this.vOffset === this._cachedVOffset &&
		this.uScale === this._cachedUScale &&
		this.vScale === this._cachedVScale &&
		this.uAng === this._cachedUAng &&
		this.vAng === this._cachedVAng &&
		this.wAng === this._cachedWAng) {
			return this._cachedTextureMatrix;
	}

	this._cachedUOffset = this.uOffset;
	this._cachedVOffset = this.vOffset;
	this._cachedUScale = this.uScale;
	this._cachedVScale = this.vScale;
	this._cachedUAng = this.uAng;
	this._cachedVAng = this.vAng;
	this._cachedWAng = this.wAng;

	var t0 = new Vector3(0, 0, 0);
	var t1 = new Vector3(1.0, 0, 0);
	var t2 = new Vector3(0, 1.0, 0);

	var matTemp = Matrix.Identity();

	t0 = this._prepareRowForTextureGeneration(t0);
	t1 = this._prepareRowForTextureGeneration(t1);
	t2 = this._prepareRowForTextureGeneration(t2);

	t1 = t1.subtract(t0);
	t2 = t2.subtract(t0);

	matTemp.m[0] = t1.x; matTemp.m[1] = t1.y; matTemp.m[2] = t1.z;
	matTemp.m[4] = t2.x; matTemp.m[5] = t2.y; matTemp.m[6] = t2.z;
	matTemp.m[8] = t0.x; matTemp.m[9] = t0.y; matTemp.m[10] = t0.z;

	this._cachedTextureMatrix = matTemp;
	return matTemp;
};

Texture.prototype._computeReflectionTextureMatrix = function () {
	if (
		this.uOffset === this._cachedUOffset &&
		this.vOffset === this._cachedVOffset &&
		this.uScale === this._cachedUScale &&
		this.vScale === this._cachedVScale &&
		this.coordinatesMode === this._cachedCoordinatesMode) {
			return this._cachedTextureMatrix;
	}

	var matrix = Matrix.Identity();

	switch (this.coordinatesMode) {
		case Texture.SPHERICAL_MODE:
			matrix.m[0] = -0.5 * this.uScale;
			matrix.m[5] = -0.5 * this.vScale;
			matrix.m[12] = 0.5 + this.uOffset;
			matrix.m[13] = 0.5 + this.vOffset;
			break;
		case Texture.PLANAR_MODE:
			matrix.m[0] = this.uScale;
			matrix.m[5] = this.vScale;
			matrix.m[12] = this.uOffset;
			matrix.m[13] = this.vOffset;
			break;
		case Texture.PROJECTION_MODE:
			matrix.m[0] = 0.5;
			matrix.m[5] = -0.5;
			matrix.m[10] = 0.0;
			matrix.m[12] = 0.5;
			matrix.m[13] = 0.5;
			matrix.m[14] = 1.0;
			matrix.m[15] = 1.0;

			matrix = this._scene.getProjectionMatrix().multiply(matrix);
			break;
	}
	this._cachedTextureMatrix = matrix;
	return matrix;
};