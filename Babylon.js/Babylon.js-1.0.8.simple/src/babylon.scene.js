var BABYLON = BABYLON || {};

(function () {
	BABYLON.Scene = function (engine) {
		this._engine = engine;
		this.autoClear = true;

		this.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
		this.ambientColor = new BABYLON.Color3(0, 0, 0);

		engine.scenes.push(this);

		// Lights
		this.lights = [];

		// Cameras
		this.cameras = [];
		this.activeCamera = null;

		// Meshes
		this.meshes = [];
		this._activeMeshes = [];

		// Materials
		this.materials = [];
		this.multiMaterials = [];
		this.defaultMaterial = new BABYLON.StandardMaterial("default material", this);

	}

	// Properties
	BABYLON.Scene.prototype.getEngine = function () {
		return this._engine;
	};

	BABYLON.Scene.prototype.getTransformMatrix = function () {
		return this._transformMatrix;
	};

	BABYLON.Scene.prototype.setTransformMatrix = function (
		view,
		projection
	) {
		this._viewMatrix = view;
		this._projectionMatrix = projection;

		this._transformMatrix = this._viewMatrix.multiply(this._projectionMatrix);
	};

	// Methods

	BABYLON.Scene.prototype._evaluateActiveMeshes = function () {
		this._activeMeshes = [];
		this._opaqueSubMeshes = [];
		this._transparentSubMeshes = [];
		this._alphaTestSubMeshes = [];
		this._processedMaterials = [];
		this._renderTargets = [];
		this._activeParticleSystems = [];

		this._totalVertices = 0;
		this._activeVertices = 0;

		// meshes
		for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
			var mesh = this.meshes[meshIndex];

			this._totalVertices += mesh.getTotalVertices();

			// if (!mesh.isReady()) {
			// 	continue;
			// }

			mesh.computeWorldMatrix();

			for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
				var subMesh = mesh.subMeshes[subIndex];

				if (mesh.subMeshes.length == 1) {
					var material = subMesh.getMaterial();

					if (this._activeMeshes.indexOf(mesh) === -1) {
						this._activeMeshes.push(mesh);
					}

					if (material) {
						// Dispatch
						// if (material.needAlphaBlending() || mesh.visibility < 1.0) { // Transparent
						// 	if (material.alpha > 0 || mesh.visibility < 1.0) {
						// 		this._transparentSubMeshes.push(subMesh); // Opaque
						// 	}
						// } else if (material.needAlphaTesting()) { // Alpha test
						// 	this._alphaTestSubMeshes.push(subMesh);
						// } else {
							this._opaqueSubMeshes.push(subMesh);
						// }
					}
				}
			}
		}
	};

  BABYLON.Scene.prototype._localRender = function (
  	opaqueSubMeshes,
  	alphaTestSubMeshes,
  	transparentSubMeshes,
  	activeMeshes
  ) {
    var engine = this._engine;
    // Opaque
    var subIndex;
    var submesh;
    for (subIndex = 0; subIndex < opaqueSubMeshes.length; subIndex++) {
      submesh = opaqueSubMeshes[subIndex];
      this._activeVertices += submesh.verticesCount;

      submesh.render();
    }
	};

	BABYLON.Scene.prototype.render = function () {
		var engine = this._engine;

		// Camera
		if (!this.activeCamera){
			throw new Error("Active camera not set");
		}

		this.setTransformMatrix(
			this.activeCamera.getViewMatrix(),
			this.activeCamera.getProjectionMatrix()
		);


		this._evaluateActiveMeshes();

		engine.clear(this.clearColor, this.autoClear, true);

		// Render
		this._localRender(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes);

    // Update camera
    this.activeCamera._update();

	}


})();