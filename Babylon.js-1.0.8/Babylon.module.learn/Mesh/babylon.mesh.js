import { Vector3, Matrix } from '../Tools/babylon.math.js';
import Tools from '../Tools/babylon.tools.js';
import BoundingInfo from '../Culling/babylon.boundingInfo.js';
import SubMesh from './babylon.subMesh.js';
import Engine from '../babylon.engine.js';

export default function Mesh(name, vertexDeclaration, scene) {
	this.name = name;
	this.id = name;
	this._scene = scene;
	this._vertexDeclaration = vertexDeclaration;

	this._vertexStrideSize = 0;
	for (var index = 0; index < vertexDeclaration.length; index++) {
		this._vertexStrideSize += vertexDeclaration[index];
	}

	this._vertexStrideSize *= 4; // sizeof(float)

	this._totalVertices = 0;
	this._worldMatrix = Matrix.Identity();

	scene.meshes.push(this);

	this.position = new Vector3(0, 0, 0);
	this.rotation = new Vector3(0, 0, 0);
	this.scaling = new Vector3(1, 1, 1);

	this._vertices = [];
	this._indices = [];
	this.subMeshes = [];

	// Animations
	this.animations = [];

	// Cache
	this._positions = null;
	this._cache = {
		position: null,
		scaling: null,
		rotation: null
	};

	this._childrenFlag = false;
};

// Constants
Mesh.BILLBOARDMODE_NONE = 0;
Mesh.BILLBOARDMODE_X = 1;
Mesh.BILLBOARDMODE_Y = 2;
Mesh.BILLBOARDMODE_Z = 4;
Mesh.BILLBOARDMODE_ALL = 7;

// Members    
Mesh.prototype.material = null;
Mesh.prototype.parent = null;
Mesh.prototype._isReady = true;
Mesh.prototype._isEnabled = true;
Mesh.prototype.isVisible = true;
Mesh.prototype.isPickable = true;
Mesh.prototype.visibility = 1.0;
Mesh.prototype.billboardMode = Mesh.BILLBOARDMODE_NONE;
Mesh.prototype.checkCollisions = false;

Mesh.prototype.onDispose = false;

// Properties

Mesh.prototype.getBoundingInfo = function () {
	return this._boundingInfo;
};

Mesh.prototype.getScene = function () {
	return this._scene;
};

Mesh.prototype.getWorldMatrix = function () {
	return this._worldMatrix;
};

Mesh.prototype.getTotalVertices = function () {
	return this._totalVertices;
};

Mesh.prototype.getVertices = function () {
	return this._vertices;
};

Mesh.prototype.getTotalIndices = function () {
	return this._indices.length;
};

Mesh.prototype.getIndices = function () {
	return this._indices;
};

Mesh.prototype.getVertexStrideSize = function () {
	return this._vertexStrideSize;
};

Mesh.prototype.getFloatVertexStrideSize = function () {
	return this._vertexStrideSize / 4;
};

Mesh.prototype._needToSynchonizeChildren = function () {
	return this._childrenFlag;
};

Mesh.prototype.isSynchronized = function () {
	if (this.billboardMode !== Mesh.BILLBOARDMODE_NONE)
		return false;

	if (!this._cache.position || !this._cache.rotation || !this._cache.scaling) {
		return false;
	}

	if (!this._cache.position.equals(this.position))
		return false;

	if (!this._cache.rotation.equals(this.rotation))
		return false;

	if (!this._cache.scaling.equals(this.scaling))
		return false;

	if (this.parent)
		return !this.parent._needToSynchonizeChildren();

	return true;
};

Mesh.prototype.isReady = function () {
	return this._isReady;
};

Mesh.prototype.isEnabled = function () {
	if (!this.isReady ()|| !this._isEnabled) {
		return false;
	}

	if (this.parent) {
		return this.parent.isEnabled();
	}

	return true;
};

Mesh.prototype.setEnabled = function (value) {
	this._isEnabled = value;
};

Mesh.prototype.isAnimated = function () {
	return this._animationStarted;
};

// Methods
Mesh.prototype.computeWorldMatrix = function () {
	if (this.isSynchronized()) {
		this._childrenFlag = false;
		return this._worldMatrix;
	}

	this._childrenFlag = true;
	this._cache.position = this.position.clone();
	this._cache.rotation = this.rotation.clone();
	this._cache.scaling = this.scaling.clone();

	var localWorld = Matrix.Scaling(this.scaling.x, this.scaling.y, this.scaling.z).multiply(
		Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z));

	// Billboarding
	var matTranslation = Matrix.Translation(this.position.x, this.position.y, this.position.z);
	if (this.billboardMode !== Mesh.BILLBOARDMODE_NONE) {
		var localPosition = this.position.clone();
		var zero = this._scene.activeCamera.position.clone();

		if (this.parent) {
			localPosition = localPosition.add(this.parent.position);
			matTranslation = Matrix.Translation(localPosition.x, localPosition.y, localPosition.z);
		}

		if (this.billboardMode & Mesh.BILLBOARDMODE_ALL === Mesh.BILLBOARDMODE_ALL) {
			zero = this._scene.activeCamera.position;
		} else {
			if (this.billboardMode & Mesh.BILLBOARDMODE_X)
				zero.x = localPosition.x + Engine.epsilon;
			if (this.billboardMode & Mesh.BILLBOARDMODE_Y)
				zero.y = localPosition.y + Engine.epsilon;
			if (this.billboardMode & Mesh.BILLBOARDMODE_Z)
				zero.z = localPosition.z + Engine.epsilon;
		}

		var matBillboard = Matrix.LookAtLH(localPosition, zero, Vector3.Up());
		matBillboard.m[12] = matBillboard.m[13] = matBillboard.m[14] = 0;

		matBillboard.invert();

		localWorld = Matrix.RotationY(Math.PI).multiply(localWorld.multiply(matBillboard));
	}

	localWorld = localWorld.multiply(matTranslation);

	// Parent
	if (this.parent && this.billboardMode === Mesh.BILLBOARDMODE_NONE) {
		var parentWorld = this.parent.getWorldMatrix();

		localWorld = localWorld.multiply(parentWorld);
	}

	this._worldMatrix = localWorld;

	// Bounding info
	if (this._boundingInfo) {
		this._scaleFactor = Math.max(this.scaling.x, this.scaling.y);
		this._scaleFactor = Math.max(this._scaleFactor, this.scaling.z);

		if (this.parent)
			this._scaleFactor = this._scaleFactor * this.parent._scaleFactor;

		this._boundingInfo._update(localWorld, this._scaleFactor);

		// for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
		// 	var subMesh = this.subMeshes[subIndex];

		// 	subMesh.updateBoundingInfo(localWorld, this._scaleFactor);
		// }
	}

	return localWorld;
};

Mesh.prototype._createGlobalSubMesh = function () {
	if (!this._totalVertices || !this._indices) {
		return null;
	}

	this.subMeshes = [];
	return new SubMesh(0, 0, this._totalVertices, 0, this._indices.length, this);
};


Mesh.prototype.subdivide = function(count) {
	if (count < 1) {
		return;
	}
	
	var subdivisionSize = this._indices.length / count;
	var offset = 0;
	
	this.subMeshes = [];
	for (var index = 0; index < count; index++)
	{
		SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, this._indices.length - offset), this);

		offset += subdivisionSize;
	}
};

Mesh.prototype.setVertices = function (vertices, uvCount, updatable) {
	if (this._vertexBuffer) {
		this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
	}

	this._uvCount = uvCount;
	
	if (updatable) {
		this._vertexBuffer = this._scene.getEngine().createDynamicVertexBuffer(vertices.length * 4);
		this._scene.getEngine().updateDynamicVertexBuffer(this._vertexBuffer, vertices);
	} else {
		this._vertexBuffer = this._scene.getEngine().createVertexBuffer(vertices);
	}
	
	this._vertices = vertices;

	this._totalVertices = vertices.length / this.getFloatVertexStrideSize();

	this._boundingInfo = new BoundingInfo(vertices, this.getFloatVertexStrideSize(), 0, vertices.length);

	this._createGlobalSubMesh();
	this._positions = null;
};

Mesh.prototype.setIndices = function (indices) {
	if (this._indexBuffer) {
		this._scene.getEngine()._releaseBuffer(this._indexBuffer);
	}

	this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
	this._indices = indices;

	this._createGlobalSubMesh();
};

Mesh.prototype.render = function (subMesh) {
	if (!this._vertexBuffer || !this._indexBuffer) {
		return;
	}

	var engine = this._scene.getEngine();

	// World
	var world = this.getWorldMatrix();

	// Material
	var effectiveMaterial = subMesh.getMaterial();

	if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
		return;
	}

	effectiveMaterial._preBind();
	effectiveMaterial.bind(world, this);

	// Wireframe
	var indexToBind = this._indexBuffer;
	var useTriangles = true;

	if (engine.forceWireframe || effectiveMaterial.wireframe) {
		indexToBind = subMesh.getLinesIndexBuffer(this._indices, engine);
		useTriangles = false;
	}

	// VBOs
	engine.bindBuffers(this._vertexBuffer, indexToBind, this._vertexDeclaration, this._vertexStrideSize, effectiveMaterial.getEffect());

	// Draw order
	engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);

	// Unbind
	effectiveMaterial.unbind();
};

Mesh.prototype.isInFrustrum = function (frustumPlanes) {
	return this._boundingInfo.isInFrustrum(frustumPlanes);
};

// Dispose
Mesh.prototype.dispose = function (doNotRecurse) {
	if (this._vertexBuffer) {
		//this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
		this._vertexBuffer = null;
	}

	if (this._indexBuffer) {
		this._scene.getEngine()._releaseBuffer(this._indexBuffer);
		this._indexBuffer = null;
	}

	// Remove from scene
	var index = this._scene.meshes.indexOf(this);
	this._scene.meshes.splice(index, 1);

	if (doNotRecurse) {
		return;
	}

	// Particles
	for (var index = 0; index < this._scene.particleSystems.length; index++) {
		if (this._scene.particleSystems[index].emitter == this) {
			this._scene.particleSystems[index].dispose();
			index--;
		}
	}

	// Children
	var objects = this._scene.meshes.slice(0);
	for (var index = 0; index < objects.length; index++) {
		if (objects[index].parent == this) {
			objects[index].dispose();
		}
	}

	// Callback
	if (this.onDispose) {
		this.onDispose();
	}
};

Mesh.CreateSphere = function (name, segments, diameter, scene, updatable) {
	var sphere = new Mesh(name, [3, 3, 2], scene);

	var radius = diameter / 2;

	var totalZRotationSteps = 2 + segments;
	var totalYRotationSteps = 2 * totalZRotationSteps;

	var indices = [];
	var vertices = [];

	for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
		var normalizedZ = zRotationStep / totalZRotationSteps;
		var angleZ = (normalizedZ * Math.PI);

		for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
			var normalizedY = yRotationStep / totalYRotationSteps;

			var angleY = normalizedY * Math.PI * 2;

			var rotationZ = Matrix.RotationZ(-angleZ);
			var rotationY = Matrix.RotationY(angleY);
			var afterRotZ = Vector3.TransformCoordinates(Vector3.Up(), rotationZ);
			var complete = Vector3.TransformCoordinates(afterRotZ, rotationY);

			var vertex = complete.scale(radius);
			var normal = Vector3.Normalize(vertex);

			vertices.push(vertex.x, vertex.y, vertex.z, normal.x, normal.y, normal.z, normalizedZ, normalizedY);
		}

		if (zRotationStep > 0) {
			var verticesCount = vertices.length / 8;
			for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1) ; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
				indices.push((firstIndex));
				indices.push((firstIndex + 1));
				indices.push(firstIndex + totalYRotationSteps + 1);

				indices.push((firstIndex + totalYRotationSteps + 1));
				indices.push((firstIndex + 1));
				indices.push((firstIndex + totalYRotationSteps + 2));
			}
		}
	}

	sphere.setVertices(vertices, 1, updatable);
	sphere.setIndices(indices);

	return sphere;
};

