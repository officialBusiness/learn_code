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

		for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
			var subMesh = this.subMeshes[subIndex];

			subMesh.updateBoundingInfo(localWorld, this._scaleFactor);
		}
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

Mesh.prototype.updateVertices = function(vertices) {
	var engine = this._scene.getEngine();
	engine.updateDynamicVertexBuffer(this._vertexBuffer, vertices);
	this._vertices = vertices;
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

Mesh.prototype.isDescendantOf = function (ancestor) {
	if (this.parent) {
		if (this.parent === ancestor) {
			return true;
		}

		return this.parent.isDescendantOf(ancestor);
	}
	return false;
};

Mesh.prototype.getDescendants = function () {
	var results = [];
	for (var index = 0; index < this._scene.meshes.length; index++) {
		var mesh = this._scene.meshes[index];
		if (mesh.isDescendantOf(this)) {
			results.push(mesh);
		}
	}

	return results;
};

Mesh.prototype.getEmittedParticleSystems = function () {
	var results = [];
	for (var index = 0; index < this._scene.particleSystems.length; index++) {
		var particleSystem = this._scene.particleSystems[index];
		if (particleSystem.emitter === this) {
			results.push(particleSystem);
		}
	}

	return results;
};

Mesh.prototype.getHierarchyEmittedParticleSystems = function () {
	var results = [];
	var descendants = this.getDescendants();
	descendants.push(this);

	for (var index = 0; index < this._scene.particleSystems.length; index++) {
		var particleSystem = this._scene.particleSystems[index];
		if (descendants.indexOf(particleSystem.emitter) !== -1) {
			results.push(particleSystem);
		}
	}

	return results;
};

Mesh.prototype.getChildren = function () {
	var results = [];
	for (var index = 0; index < this._scene.meshes.length; index++) {
		var mesh = this._scene.meshes[index];
		if (mesh.parent == this) {
			results.push(mesh);
		}
	}

	return results;
};

Mesh.prototype.isInFrustrum = function (frustumPlanes) {
	return this._boundingInfo.isInFrustrum(frustumPlanes);
};

Mesh.prototype.setMaterialByID = function (id) {
	var materials = this._scene.materials;
	for (var index = 0; index < materials.length; index++) {
		if (materials[index].id == id) {
			this.material = materials[index];
			return;
		}
	}

	// Multi
	var multiMaterials = this._scene.multiMaterials;
	for (var index = 0; index < multiMaterials.length; index++) {
		if (multiMaterials[index].id == id) {
			this.material = multiMaterials[index];
			return;
		}
	}
};

Mesh.prototype.getAnimatables = function () {
	var results = [];

	if (this.material) {
		results.push(this.material);
	}

	return results;
};

// Cache
Mesh.prototype._generatePointsArray = function () {
	if (this._positions)
		return;

	this._positions = [];

	var stride = this.getFloatVertexStrideSize();

	for (var index = 0; index < this._vertices.length; index += stride) {
		this._positions.push(Vector3.FromArray(this._vertices, index));
	}
};

// Collisions
Mesh.prototype._collideForSubMesh = function (subMesh, transformMatrix, collider) {
	this._generatePointsArray();
	// Transformation
	if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix.equals(transformMatrix)) {
		subMesh._lastColliderTransformMatrix = transformMatrix;
		subMesh._lastColliderWorldVertices = [];
		var start = subMesh.verticesStart;
		var end = (subMesh.verticesStart + subMesh.verticesCount);
		for (var i = start; i < end; i++) {
			subMesh._lastColliderWorldVertices.push(Vector3.TransformCoordinates(this._positions[i], transformMatrix));
		}
	}
	// Collide
	collider._collide(subMesh, subMesh._lastColliderWorldVertices, this._indices, subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
};

Mesh.prototype._processCollisionsForSubModels = function (collider, transformMatrix) {
	for (var index = 0; index < this.subMeshes.length; index++) {
		var subMesh = this.subMeshes[index];

		// Bounding test
		if (this.subMeshes.length > 1 && !subMesh._checkCollision(collider))
			continue;

		this._collideForSubMesh(subMesh, transformMatrix, collider);
	}
};

Mesh.prototype._checkCollision = function (collider) {
	// Bounding box test
	if (!this._boundingInfo._checkCollision(collider))
		return;

	// Transformation matrix
	var transformMatrix = this._worldMatrix.multiply(Matrix.Scaling(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z));

	this._processCollisionsForSubModels(collider, transformMatrix);
};

Mesh.prototype.intersectsMesh = function (mesh, precise) {
	if (!this._boundingInfo || !mesh._boundingInfo) {
		return false;
	}

	return this._boundingInfo.intersects(mesh._boundingInfo, precise);
};

Mesh.prototype.intersectsPoint = function (point) {
	if (!this._boundingInfo) {
		return false;
	}

	return this._boundingInfo.intersectsPoint(point);
};

// Picking
Mesh.prototype.intersects = function (ray) {
	if (!this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere)) {
		return { hit: false, distance: 0 };
	}

	this._generatePointsArray();

	var distance = Number.MAX_VALUE;

	for (var index = 0; index < this.subMeshes.length; index++) {
		var subMesh = this.subMeshes[index];

		// Bounding test
		if (this.subMeshes.length > 1 && !subMesh.canIntersects(ray))
			continue;

		var result = subMesh.intersects(ray, this._positions, this._indices);

		if (result.hit) {
			if (result.distance < distance && result.distance >= 0) {
				distance = result.distance;
			}
		}
	}

	if (distance >= 0)
		return { hit: true, distance: distance };

	return { hit: false, distance: 0 };
};

// Clone
Mesh.prototype.clone = function (name, newParent) {
	var result = new Mesh(name, this._vertexDeclaration, this._scene);

	Tools.DeepCopy(this, result, ["name", "material"], ["_uvCount", "_vertices", "_indices", "_totalVertices"]);

	// Bounding info
	result._boundingInfo = new BoundingInfo(result._vertices, result.getFloatVertexStrideSize(), 0, result._vertices.length);

	// Material
	result.material = this.material;

	// Buffers
	result._vertexBuffer = this._vertexBuffer;
	this._vertexBuffer.references++;

	result._indexBuffer = this._indexBuffer;
	this._indexBuffer.references++;

	// Parent
	if (newParent) {
		result.parent = newParent;
	}

	// Children
	for (var index = 0; index < this._scene.meshes.length; index++) {
		var mesh = this._scene.meshes[index];

		if (mesh.parent == this) {
			mesh.clone(mesh.name, result);
		}
	}

	// Particles
	for (var index = 0; index < this._scene.particleSystems.length; index++) {
		var system = this._scene.particleSystems[index];

		if (system.emitter == this) {
			system.clone(system.name, result);
		}
	}

	return result;
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

// Statics
Mesh.CreateBox = function (name, size, scene, updatable) {
	var box = new Mesh(name, [3, 3, 2], scene);

	var normals = [
		new Vector3(0, 0, 1),
		new Vector3(0, 0, -1),
		new Vector3(1, 0, 0),
		new Vector3(-1, 0, 0),
		new Vector3(0, 1, 0),
		new Vector3(0, -1, 0)
	];

	var indices = [];
	var vertices = [];

	// Create each face in turn.
	for (var index = 0; index < normals.length; index++) {
		var normal = normals[index];

		// Get two vectors perpendicular to the face normal and to each other.
		var side1 = new Vector3(normal.y, normal.z, normal.x);
		var side2 = Vector3.Cross(normal, side1);

		// Six indices (two triangles) per face.
		var verticesLength = vertices.length / 8;
		indices.push(verticesLength);
		indices.push(verticesLength + 1);
		indices.push(verticesLength + 2);

		indices.push(verticesLength);
		indices.push(verticesLength + 2);
		indices.push(verticesLength + 3);

		// Four vertices per face.
		var vertex = normal.subtract(side1).subtract(side2).scale(size / 2);
		vertices.push(vertex.x, vertex.y, vertex.z, normal.x, normal.y, normal.z, 1.0, 1.0);

		vertex = normal.subtract(side1).add(side2).scale(size / 2);
		vertices.push(vertex.x, vertex.y, vertex.z, normal.x, normal.y, normal.z, 0.0, 1.0);

		vertex = normal.add(side1).add(side2).scale(size / 2);
		vertices.push(vertex.x, vertex.y, vertex.z, normal.x, normal.y, normal.z, 0.0, 0.0);

		vertex = normal.add(side1).subtract(side2).scale(size / 2);
		vertices.push(vertex.x, vertex.y, vertex.z, normal.x, normal.y, normal.z, 1.0, 0.0);
	}

	box.setVertices(vertices, 1, updatable);
	box.setIndices(indices);

	return box;
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

// Plane
Mesh.CreatePlane = function (name, size, scene, updatable) {
	var plane = new Mesh(name, [3, 3, 2], scene);

	var indices = [];
	var vertices = [];

	// Vertices
	var halfSize = size / 2.0;
	vertices.push(-halfSize, -halfSize, 0, 0, 0, -1.0, 0.0, 0.0);
	vertices.push(halfSize, -halfSize, 0, 0, 0, -1.0, 1.0, 0.0);
	vertices.push(halfSize, halfSize, 0, 0, 0, -1.0, 1.0, 1.0);
	vertices.push(-halfSize, halfSize, 0, 0, 0, -1.0, 0.0, 1.0);

	// Indices
	indices.push(0);
	indices.push(1);
	indices.push(2);

	indices.push(0);
	indices.push(2);
	indices.push(3);

	plane.setVertices(vertices, 1, updatable);
	plane.setIndices(indices);

	return plane;
};

Mesh.CreateGround = function(name, width, height, subdivisions, scene, updatable) {
	var ground = new Mesh(name, [3, 3, 2], scene);

	var indices = [];
	var vertices = [];
	var row, col;

	for (row = 0; row <= subdivisions; row++) {
		for (col = 0; col <= subdivisions; col++) {
			var position = new Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));
			var normal = new Vector3(0, 1.0, 0);

			vertices.push(position.x, position.y, position.z,
				normal.x, normal.y, normal.z,
				col / subdivisions, row / subdivisions);
		}
	}

	for (row = 0; row < subdivisions; row++) {
		for (col = 0; col < subdivisions; col++) {
			indices.push(col + 1 + (row + 1) * (subdivisions + 1));
			indices.push(col + 1 + row * (subdivisions + 1));
			indices.push(col + row * (subdivisions + 1));

			indices.push(col + (row + 1) * (subdivisions + 1));
			indices.push(col + 1 + (row + 1) * (subdivisions + 1));
			indices.push(col + row * (subdivisions + 1));
		}
	}

	ground.setVertices(vertices, 1, updatable);
	ground.setIndices(indices);

	return ground;
};

Mesh.CreateGroundFromHeightMap = function(name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable) {
	var ground = new Mesh(name, [3, 3, 2], scene);

	var img = new Image();
	img.onload = function() {
		var indices = [];
		var vertices = [];
		var row, col;

		// Getting height map data
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
		var heightMapWidth = img.width;
		var heightMapHeight = img.height;
		canvas.width = heightMapWidth;
		canvas.height = heightMapHeight;

		context.drawImage(img, 0, 0);

		var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;

		// Vertices
		for (row = 0; row <= subdivisions; row++) {
			for (col = 0; col <= subdivisions; col++) {
				var position = new Vector3((col * width) / subdivisions - (width / 2.0), 0, ((subdivisions - row) * height) / subdivisions - (height / 2.0));

				// Compute height
				var heightMapX = (((position.x + width / 2) / width) * (heightMapWidth - 1)) | 0;
				var heightMapY = (((position.z + height / 2) / height) * (heightMapHeight - 1)) | 0;

				var pos = (heightMapX + heightMapY * heightMapWidth) * 4;
				var r = buffer[pos] / 255.0;
				var g = buffer[pos + 1] / 255.0;
				var b = buffer[pos + 2] / 255.0;

				var gradient = r * 0.3 + g * 0.59 + b * 0.11;

				position.y = minHeight + (maxHeight - minHeight) * gradient;

				// Add  vertex
				vertices.push(position.x, position.y, position.z,
					0, 0, 0,
					col / subdivisions, row / subdivisions);
			}
		}

		// Indices
		for (row = 0; row < subdivisions; row++) {
			for (col = 0; col < subdivisions; col++) {
				indices.push(col + 1 + (row + 1) * (subdivisions + 1));
				indices.push(col + 1 + row * (subdivisions + 1));
				indices.push(col + row * (subdivisions + 1));

				indices.push(col + (row + 1) * (subdivisions + 1));
				indices.push(col + 1 + (row + 1) * (subdivisions + 1));
				indices.push(col + row * (subdivisions + 1));
			}
		}

		// Normals
		Mesh.ComputeNormal(vertices, indices, ground.getFloatVertexStrideSize());

		// Transfer
		ground.setVertices(vertices, 1, updatable);
		ground.setIndices(indices);

		ground._isReady = true;
	};

	img.src = url;

	ground._isReady = false;

	return ground;
};

// Tools
Mesh.ComputeNormal = function(vertices, indices, stride, normalOffset) {
	var positions = [];
	var facesOfVertices = [];
	var index;

	if (normalOffset === undefined) {
		normalOffset = 3;
	}

	for (index = 0; index < vertices.length; index += stride) {
		var position = new Vector3(vertices[index], vertices[index + 1], vertices[index + 2]);
		positions.push(position);
		facesOfVertices.push([]);
	}
	// Compute normals
	var facesNormals = [];
	for (index = 0; index < indices.length / 3; index++) {
		var i1 = indices[index * 3];
		var i2 = indices[index * 3 + 1];
		var i3 = indices[index * 3 + 2];

		var p1 = positions[i1];
		var p2 = positions[i2];
		var p3 = positions[i3];

		var p1p2 = p1.subtract(p2);
		var p3p2 = p3.subtract(p2);

		facesNormals[index] = Vector3.Normalize(Vector3.Cross(p1p2, p3p2));
		facesOfVertices[i1].push(index);
		facesOfVertices[i2].push(index);
		facesOfVertices[i3].push(index);
	}

	for (index = 0; index < positions.length; index++) {
		var faces = facesOfVertices[index];

		var normal = Vector3.Zero();
		for (var faceIndex = 0; faceIndex < faces.length; faceIndex++) {
			normal = normal.add(facesNormals[faces[faceIndex]]);
		}

		normal = Vector3.Normalize(normal.scale(1.0 / faces.length));

		vertices[index * stride + normalOffset] = normal.x;
		vertices[index * stride + normalOffset + 1] = normal.y;
		vertices[index * stride + normalOffset + 2] = normal.z;
	}
};