import { Color3, Vector3 } from '../Tools/babylon.math.js';
import Material from './babylon.material.js';
import Scene from '../babylon.scene.js';
import SpotLight from '../Light/babylon.spotLight.js';
import HemisphericLight from '../Light/babylon.hemisphericLight.js';
import PointLight from '../Light/babylon.pointLight.js';
import DirectionalLight from '../Light/babylon.directionalLight.js';

export default function StandardMaterial(name, scene) {
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

	this.ambientColor = new Color3(0, 0, 0);
	this.diffuseColor = new Color3(1, 1, 1);
	this.specularColor = new Color3(1, 1, 1);
	this.specularPower = 64;
	this.emissiveColor = new Color3(0, 0, 0);

	this._cachedDefines = null;
};

StandardMaterial.prototype = Object.create(Material.prototype);

// Properties   
StandardMaterial.prototype.needAlphaBlending = function () {
	return (this.alpha < 1.0) || (this.opacityTexture != null);
};

StandardMaterial.prototype.needAlphaTesting = function () {
	return this.diffuseTexture != null && this.diffuseTexture.hasAlpha;
};

// Methods   
StandardMaterial.prototype.isReady = function (mesh) {
	var engine = this._scene.getEngine();

	// Effect
	var defines = [];
	// if (this.diffuseTexture) {
	// 	defines.push("#define DIFFUSE");
	// }

	// if (this.ambientTexture) {
	// 	defines.push("#define AMBIENT");
	// }

	// if (this.opacityTexture) {
	// 	defines.push("#define OPACITY");
	// }

	// if (this.reflectionTexture) {
	// 	defines.push("#define REFLECTION");
	// }

	// if (this.emissiveTexture) {
	// 	defines.push("#define EMISSIVE");
	// }

	// if (this.specularTexture) {
	// 	defines.push("#define SPECULAR");
	// }
	
	// if (this.bumpTexture && this._scene.getEngine().getCaps().standardDerivatives) {
	// 	defines.push("#define BUMP");
	// }

	// if (BABYLON.clipPlane) {
	// 	defines.push("#define CLIPPLANE");
	// }

	if (engine.getAlphaTesting()) {
		defines.push("#define ALPHATEST");
	}
	
	// Fog
	if (this._scene.fogMode !== Scene.FOGMODE_NONE) {
		defines.push("#define FOG");
	}
	
	var lightIndex = 0;
	for (var index = 0; index < this._scene.lights.length; index++) {
		var light = this._scene.lights[index];

		if (!light.isEnabled) {
			continue;
		}

		defines.push("#define LIGHT" + lightIndex);
		
		if (light instanceof SpotLight) {
			defines.push("#define SPOTLIGHT" + lightIndex);
		} else if (light instanceof HemisphericLight) {
			defines.push("#define HEMILIGHT" + lightIndex);
		} else {
			defines.push("#define POINTDIRLIGHT" + lightIndex);
		}

		lightIndex++;
		if (lightIndex == 4)
			break;
	}

	var attribs = ["position", "normal"];
	if (mesh) {
		switch (mesh._uvCount) {
			case 1:
				attribs = ["position", "normal", "uv"];
				defines.push("#define UV1");
				break;
			case 2:
				attribs = ["position", "normal", "uv", "uv2"];
				defines.push("#define UV1");
				defines.push("#define UV2");
				break;
		}
	}

	// Get correct effect      
	var join = defines.join("\n");
	if (this._cachedDefines != join) {
		this._cachedDefines = join;
		
		// IE patch
		var shaderName = "default";
		if (window.ActiveXObject !== undefined) {
			shaderName = "iedefault";
		}

		this._effect = this._scene.getEngine().createEffect(shaderName,
			attribs,
			[
				"world", "view", "worldViewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
				"vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0",
				"vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1",
				"vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2",
				"vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3",
				"vFogInfos", "vFogColor",
				"vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
				"vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix"
			],
			["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler"],
			join);
	}

	if (!this._effect.isReady()) {
		return false;
	}

	return true;
};

StandardMaterial.prototype.unbind = function () {
	if (this.reflectionTexture && this.reflectionTexture.isRenderTarget) {
		this._effect.setTexture("reflection2DSampler", null);
	}
};

StandardMaterial.prototype.bind = function (world, mesh) {
	var baseColor = this.diffuseColor;

	this._effect.setMatrix("world", world);
	this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
	this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
	this._effect.setColor3("vAmbientColor", this._scene.ambientColor.multiply(this.ambientColor));
	this._effect.setColor4("vDiffuseColor", baseColor, this.alpha * mesh.visibility);
	this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
	this._effect.setColor3("vEmissiveColor", this.emissiveColor);

	var lightIndex = 0;
	for (var index = 0; index < this._scene.lights.length; index++) {
		var light = this._scene.lights[index];

		if (!light.isEnabled) {
			continue;
		}
					
		if (light instanceof PointLight) {
			// Point Light
			this._effect.setFloat4("vLightData" + lightIndex, light.position.x, light.position.y, light.position.z, 0);
		} else if (light instanceof DirectionalLight) {
			// Directional Light
			this._effect.setFloat4("vLightData" + lightIndex, light.direction.x, light.direction.y, light.direction.z, 1);
		} else if (light instanceof SpotLight) {
			// Spot Light
			this._effect.setFloat4("vLightData" + lightIndex, light.position.x, light.position.y, light.position.z, light.exponent);
			var normalizeDirection = Vector3.Normalize(light.direction);
			this._effect.setFloat4("vLightDirection" + lightIndex, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(light.angle * 0.5));
		} else if (light instanceof HemisphericLight) {
			// Hemispheric Light
			var normalizeDirection = Vector3.Normalize(light.direction);
			this._effect.setFloat4("vLightData" + lightIndex, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0);
			this._effect.setColor3("vLightGround" + lightIndex, light.groundColor.scale(light.intensity));
		}
		this._effect.setColor3("vLightDiffuse" + lightIndex, light.diffuse.scale(light.intensity));
		this._effect.setColor3("vLightSpecular" + lightIndex, light.specular.scale(light.intensity));

		lightIndex++;

		if (lightIndex == 4)
			break;
	}

	// if (BABYLON.clipPlane) {
	// 	this._effect.setFloat4("vClipPlane", BABYLON.clipPlane.normal.x, BABYLON.clipPlane.normal.y, BABYLON.clipPlane.normal.z, BABYLON.clipPlane.d);
	// }
	
	// View
	if (this._scene.fogMode !== Scene.FOGMODE_NONE || this.reflectionTexture) {
		this._effect.setMatrix("view", this._scene.getViewMatrix());
	}

	// Fog
	if (this._scene.fogMode !== Scene.FOGMODE_NONE) {
		this._effect.setFloat4("vFogInfos", this._scene.fogMode, this._scene.fogStart, this._scene.fogEnd, this._scene.fogDensity);
		this._effect.setColor3("vFogColor", this._scene.fogColor);
	}
};

StandardMaterial.prototype.dispose = function () {
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
};