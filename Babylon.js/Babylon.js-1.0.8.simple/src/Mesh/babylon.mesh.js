var BABYLON = BABYLON || {};

(function(){
	BABYLON.Mesh = function (name, vertexDeclaration, scene) {
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
		this._worldMatrix = BABYLON.Matrix.Identity();

		scene.meshes.push(this);

		this.position = new BABYLON.Vector3(0, 0, 0);
		this.rotation = new BABYLON.Vector3(0, 0, 0);
		this.scaling = new BABYLON.Vector3(1, 1, 1);

		this._vertices = [];
		this._indices = [];
		this.subMeshes = [];

	}

  // Properties

	BABYLON.Mesh.prototype.getWorldMatrix = function () {
		return this._worldMatrix;
	};

	BABYLON.Mesh.prototype.getTotalVertices = function () {
		return this._totalVertices;
	};

	BABYLON.Mesh.prototype.getFloatVertexStrideSize = function () {
		return this._vertexStrideSize / 4;
	};

	// Methods
	BABYLON.Mesh.prototype.computeWorldMatrix = function () {
    var localWorld = BABYLON.Matrix.Scaling(this.scaling.x, this.scaling.y, this.scaling.z).multiply(
        BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z));

    // Billboarding
    var matTranslation = BABYLON.Matrix.Translation(this.position.x, this.position.y, this.position.z);

    localWorld = localWorld.multiply(matTranslation);

    this._worldMatrix = localWorld;

    return localWorld;
	};

	BABYLON.Mesh.prototype._createGlobalSubMesh = function () {
		if (!this._totalVertices || !this._indices) {
			return null;
		}

		this.subMeshes = [];
		return new BABYLON.SubMesh(
			0,
			0, this._totalVertices,
			0, this._indices.length,
			this
		);
	};

	BABYLON.Mesh.prototype.setVertices = function (
		vertices, uvCount, updatable
	) {
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

		// this._boundingInfo = new BABYLON.BoundingInfo(vertices, this.getFloatVertexStrideSize(), 0, vertices.length);

		// this._createGlobalSubMesh();
		this._positions = null;
	};

	BABYLON.Mesh.prototype.setIndices = function (indices) {
		if (this._indexBuffer) {
			this._scene.getEngine()._releaseBuffer(this._indexBuffer);
		}

		this._indexBuffer = this._scene.getEngine().createIndexBuffer(indices);
		this._indices = indices;

		this._createGlobalSubMesh();
	};

	BABYLON.Mesh.prototype.render = function (subMesh) {
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

		var indexToBind = this._indexBuffer;
		var useTriangles = true;

		// VBOs
		engine.bindBuffers(
			this._vertexBuffer, indexToBind,
			this._vertexDeclaration, this._vertexStrideSize,
			effectiveMaterial.getEffect()
		);

		// Draw order
		engine.draw(useTriangles,
			useTriangles ? subMesh.indexStart : 0,
			useTriangles ? subMesh.indexCount : subMesh.linesIndexCount
		);

		// Unbind
		// effectiveMaterial.unbind();
	}

	BABYLON.Mesh.CreateSphere = function (
		name,
		segments,
		diameter,
		scene,
		updatable
	) {
		var sphere = new BABYLON.Mesh(name, [3, 3, 2], scene);

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

				var rotationZ = BABYLON.Matrix.RotationZ(-angleZ);
				var rotationY = BABYLON.Matrix.RotationY(angleY);
				var afterRotZ = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.Up(), rotationZ);
				var complete = BABYLON.Vector3.TransformCoordinates(afterRotZ, rotationY);

				var vertex = complete.scale(radius);
				var normal = BABYLON.Vector3.Normalize(vertex);

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
	BABYLON.Mesh.CreatePlane = function (
		name,
		size,
		scene,
		updatable
	) {
		var plane = new BABYLON.Mesh(name, [3, 3, 2], scene);

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

})();