var BABYLON = BABYLON || {};

(function () {
	BABYLON.StandardMaterial = function (name, scene) {
		this.name = name;
		this.id = name;

		this._scene = scene;
		scene.materials.push(this);

		this.ambientColor = new BABYLON.Color3(0, 0, 0);
		this.diffuseColor = new BABYLON.Color3(0, 0, 0);
		this.specularColor = new BABYLON.Color3(0, 0, 0);
		this.specularPower = 64;
		this.emissiveColor = new BABYLON.Color3(0, 0, 0);

		this._cachedDefines = null;
	};

	BABYLON.StandardMaterial.prototype = Object.create(BABYLON.Material.prototype);

	BABYLON.StandardMaterial.prototype.isReady = function (mesh){
		var engine = this._scene.getEngine();

		var defines = [];

		var attribs = ['position', 'normal'];

		if( mesh ){
			switch( mesh.uvCount ){
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

		var join = defines.join("\n");
		if( this._cachedDefines !== join ){
			this._cachedDefines = join;

			var shaderName = "default";

			this._effect = this._scene.getEngine().createEffect(
				shaderName, attribs,
				["world", "view", "worldViewProjection", "vEyePosition", "vLightsType", "vAmbientColor", "vDiffuseColor", "vSpecularColor", "vEmissiveColor",
	        "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0",
	        "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1",
	        "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2",
	        "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3",
	        "vFogInfos", "vFogColor",
	        "vDiffuseInfos", "vAmbientInfos", "vOpacityInfos", "vReflectionInfos", "vEmissiveInfos", "vSpecularInfos", "vBumpInfos",
	        "vClipPlane", "diffuseMatrix", "ambientMatrix", "opacityMatrix", "reflectionMatrix", "emissiveMatrix", "specularMatrix", "bumpMatrix"],
        ["diffuseSampler", "ambientSampler", "opacitySampler", "reflectionCubeSampler", "reflection2DSampler", "emissiveSampler", "specularSampler", "bumpSampler"],
        join
			);
		}

		if( !this._effect.isReady() ){
			return false;
		}

		return true;
	}

	BABYLON.StandardMaterial.prototype.bind = function (world, mesh){
		var baseColor = this.diffuseColor;

		this._effect.setMatrix("world", world);
		this._effect.setMatrix("worldViewProjection", world.multiply(this._scene.getTransformMatrix()));
		this._effect.setVector3("vEyePosition", this._scene.activeCamera.position);
		this._effect.setColor3("vAmbientColor", this._scene.ambientColor.multiply(this.ambientColor));
		this._effect.setColor4("vDiffuseColor", baseColor, this.alpha * mesh.visibility);
		this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
		this._effect.setColor3("vEmissiveColor", this.emissiveColor);
	}



})();