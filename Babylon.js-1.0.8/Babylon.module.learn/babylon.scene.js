import { Color3, Vector3, Frustum, Ray, Matrix } from './Tools/babylon.math.js';
import StandardMaterial from './Materials/babylon.standardMaterial.js';
import Engine from './babylon.engine.js';

export default function Scene(engine) {
	this._engine = engine;
	this.autoClear = true;
	this.clearColor = new Color3(0.2, 0.2, 0.3);
	this.ambientColor = new Color3(0, 0, 0);

	engine.scenes.push(this);

	this._totalVertices = 0;
	this._activeVertices = 0;

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
	this.defaultMaterial = new StandardMaterial("default material", this);

	// Layers
	this.layers = [];

};

// Properties   
Scene.prototype.getEngine = function () {
	return this._engine;
};

Scene.prototype.getTotalVertices = function () {
	return this._totalVertices;
};

Scene.prototype.getActiveVertices = function () {
	return this._activeVertices;
};

// Matrix
Scene.prototype.getViewMatrix = function () {
	return this._viewMatrix;
};

Scene.prototype.getProjectionMatrix = function () {
	return this._projectionMatrix;
};

Scene.prototype.getTransformMatrix = function () {
	return this._transformMatrix;
};

Scene.prototype.setTransformMatrix = function (view, projection) {
	this._viewMatrix = view;
	this._projectionMatrix = projection;

	this._transformMatrix = this._viewMatrix.multiply(this._projectionMatrix);
};

// Methods

Scene.prototype._evaluateActiveMeshes = function () {
	this._activeMeshes = [];
	this._opaqueSubMeshes = [];
	this._transparentSubMeshes = [];
	this._alphaTestSubMeshes = [];

	var frustumPlanes = Frustum.GetPlanes(this._transformMatrix);

	this._totalVertices = 0;
	this._activeVertices = 0;

	// meshes
	for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
		var mesh = this.meshes[meshIndex];

		this._totalVertices += mesh.getTotalVertices();
		
		if (!mesh.isReady()) {
			continue;
		}

		mesh.computeWorldMatrix();

		if (mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && mesh.isInFrustrum(frustumPlanes)) {
			for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
				var subMesh = mesh.subMeshes[subIndex];

				if (mesh.subMeshes.length == 1 || subMesh.isInFrustrum(frustumPlanes)) {
					var material = subMesh.getMaterial();

					if (this._activeMeshes.indexOf(mesh) === -1) {
						this._activeMeshes.push(mesh);
					}

					if (material) {

						// Dispatch
						if (material.needAlphaBlending() || mesh.visibility < 1.0) { // Transparent
							if (material.alpha > 0 || mesh.visibility < 1.0) {
								this._transparentSubMeshes.push(subMesh); // Opaque
							}
						} else if (material.needAlphaTesting()) { // Alpha test
							this._alphaTestSubMeshes.push(subMesh);
						} else {
							this._opaqueSubMeshes.push(subMesh);
						}
					}
				}
			}
		}
	}
};

Scene.prototype._localRender = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, activeMeshes) {
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

Scene.prototype.render = function () {
	var engine = this._engine;
	
	// Camera
	if (!this.activeCamera){
		throw new Error("Active camera not set");
	}

	this.setTransformMatrix(
		this.activeCamera.getViewMatrix(),
		this.activeCamera.getProjectionMatrix()
	);

	// Meshes
	this._evaluateActiveMeshes();

	// Clear
	engine.clear(this.clearColor, this.autoClear, true);

	// Render
	this._localRender(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes);

	// Update camera
	this.activeCamera._update();

};