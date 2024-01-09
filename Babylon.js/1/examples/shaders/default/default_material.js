import { shaderName } from './default_shaders.js';


var isIE = function () {
	return window.ActiveXObject !== undefined;
};

export default class DefaultMaterial{

	alpha = 1.0;
	wireframe = false;
	backFaceCulling = true;
	_effect = null;
	onDispose = null;

	constructor(name, scene){
		this.name = name;
		this.id = name;

		this._scene = scene;
		scene.materials.push(this);

		this.diffuseTexture = null;
		this.ambientTexture = null;
		this.opacityTexture = null;
		this.reflectionTexture = null;
		this.emissiveTexture = null;
		this.specularTexture = null;
		this.bumpTexture = null;

		this.ambientColor = new BABYLON.Color3(0, 0, 0);
		this.diffuseColor = new BABYLON.Color3(1, 1, 1);
		this.specularColor = new BABYLON.Color3(1, 1, 1);
		this.specularPower = 64;
		this.emissiveColor = new BABYLON.Color3(0, 0, 0);

		this._cachedDefines = null;

		this._renderTargets = new BABYLON.Tools.SmartArray(16);

		// Internals
		this._worldViewProjectionMatrix = BABYLON.Matrix.Zero();
		this._lightMatrix = BABYLON.Matrix.Zero();
		this._globalAmbientColor = new BABYLON.Color3(0, 0, 0);
		this._baseColor = new BABYLON.Color3();
		this._scaledDiffuse = new BABYLON.Color3();
		this._scaledSpecular = new BABYLON.Color3();
	}

	getEffect(){
		return this._effect;
	}

	_preBind(){
		var engine = this._scene.getEngine();

		engine.enableEffect(this._effect);
		engine.setState(this.backFaceCulling);
	}

	baseDispose(){
		// Remove from scene
		var index = this._scene.materials.indexOf(this);
		this._scene.materials.splice(index, 1);

		// Callback
		if (this.onDispose) {
			this.onDispose();
		}
	}

	dispose(){
		this.baseDispose();
	}

	needAlphaBlending(){
		return (this.alpha < 1.0) || (this.opacityTexture != null);
	}

	needAlphaTesting(){
		return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
	}

	isReady(mesh){
		var engine = this._scene.getEngine();
		var defines = [];


		// Textures
		if (this.diffuseTexture) {

			if (!this.diffuseTexture.isReady()) {
				return false;
			} else {
				defines.push("#define DIFFUSE");
			}
		}

		if (this.emissiveTexture) {
			if (!this.emissiveTexture.isReady()) {
				return false;
			} else {
				defines.push("#define EMISSIVE");
			}
		}


		var attribs = ["position", "normal"];
		if (mesh) {
			if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
				attribs.push("uv");
				defines.push("#define UV1");
			}
			if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
				attribs.push("uv2");
				defines.push("#define UV2");
			}
			if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
				attribs.push("color");
				defines.push("#define VERTEXCOLOR");
			}
		}

		// Get correct effect
		var join = defines.join("\n");

		if (this._cachedDefines != join) {
			this._cachedDefines = join;

			this._effect = this._scene.getEngine().createEffect(shaderName,
					attribs,
			["world", "view", "worldViewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
					"vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
					"vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
					"vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
					"vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
					"vFogInfos", "vFogColor",
					 "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
					 "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix"],
					["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler",
					 "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
					],
					join);
		}
		if (!this._effect.isReady()) {
			return false;
		}

		return true;
	}

	getRenderTargetTextures(){
		this._renderTargets.reset();

		if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
			this._renderTargets.push(this.reflectionTexture);
		}

		return this._renderTargets;
	}

	unbind(){
		if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
			this._effect.setTexture("reflection2DSampler", null);
		}
	}

	bind(world, mesh){
		this._baseColor.copyFrom(this.diffuseColor);

		// Values
		if (this.diffuseTexture) {
			this._effect.setTexture("diffuseSampler", this.diffuseTexture);

			this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
			this._effect.setMatrix("diffuseMatrix", this.diffuseTexture._computeTextureMatrix());

			this._baseColor.copyFromFloats(1, 1, 1);
		}


		if (this.emissiveTexture) {
			this._effect.setTexture("emissiveSampler", this.emissiveTexture);

			this._effect.setFloat2("vEmissiveInfos", this.emissiveTexture.coordinatesIndex, this.emissiveTexture.level);
			this._effect.setMatrix("emissiveMatrix", this.emissiveTexture._computeTextureMatrix());
		}

		world.multiplyToRef(this._scene.getTransformMatrix(), this._worldViewProjectionMatrix);
		this._scene.ambientColor.multiplyToRef(this.ambientColor, this._globalAmbientColor);

		this._effect.setMatrix("world", world);
		this._effect.setMatrix("worldViewProjection", this._worldViewProjectionMatrix);
		this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
		this._effect.setColor3("vAmbientColor", this._globalAmbientColor);
		this._effect.setColor4("vDiffuseColor", this._baseColor, this.alpha * mesh.visibility);
		this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
		this._effect.setColor3("vEmissiveColor", this.emissiveColor);
	}

	getAnimatables(){
		var results = [];

		if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
			results.push(this.diffuseTexture);
		}

		if (this.ambientTexture && this.ambientTexture.animations && this.ambientTexture.animations.length > 0) {
			results.push(this.ambientTexture);
		}

		if (this.opacityTexture && this.opacityTexture.animations && this.opacityTexture.animations.length > 0) {
			results.push(this.opacityTexture);
		}

		if (this.reflectionTexture && this.reflectionTexture.animations && this.reflectionTexture.animations.length > 0) {
			results.push(this.reflectionTexture);
		}

		if (this.emissiveTexture && this.emissiveTexture.animations && this.emissiveTexture.animations.length > 0) {
			results.push(this.emissiveTexture);
		}

		if (this.specularTexture && this.specularTexture.animations && this.specularTexture.animations.length > 0) {
			results.push(this.specularTexture);
		}

		if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
			results.push(this.bumpTexture);
		}

		return results;
	}

	dispose(){
		if (this.diffuseTexture) {
			this.diffuseTexture.dispose();
		}

		if (this.ambientTexture) {
			this.ambientTexture.dispose();
		}

		if (this.opacityTexture) {
			this.opacityTexture.dispose();
		}

		if (this.reflectionTexture) {
			this.reflectionTexture.dispose();
		}

		if (this.emissiveTexture) {
			this.emissiveTexture.dispose();
		}

		if (this.specularTexture) {
			this.specularTexture.dispose();
		}

		if (this.bumpTexture) {
			this.bumpTexture.dispose();
		}

		this.baseDispose();
	}
}