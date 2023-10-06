import BaseTexture from './babylon.baseTexture.js';
import Texture from './babylon.texture.js';
import { Matrix } from '../../Tools/babylon.math.js';

export default function CubeTexture(rootUrl, scene) {
	this._scene = scene;
	this._scene.textures.push(this);
	
	this.name = rootUrl;
	this.hasAlpha = false;
	this.coordinatesMode = Texture.CUBIC_MODE;

	this._texture = this._getFromCache(rootUrl);
	
	if (!this._texture) {
		this._texture = scene.getEngine().createCubeTexture(rootUrl, scene);
	}
	
	this.isCube = true;

	this._textureMatrix = Matrix.Identity();
};

CubeTexture.prototype = Object.create(BaseTexture.prototype);

CubeTexture.prototype._computeReflectionTextureMatrix = function () {
	return this._textureMatrix;
}