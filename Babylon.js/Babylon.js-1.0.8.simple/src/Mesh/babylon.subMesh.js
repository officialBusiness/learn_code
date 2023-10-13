var BABYLON = BABYLON || {};

(function(){
	BABYLON.SubMesh = function (
		materialIndex,
		verticesStart,
		verticesCount,
		indexStart,
		indexCount,
		mesh
	) {
		this._mesh = mesh;
		mesh.subMeshes.push(this);
		this.materialIndex = materialIndex;
		this.verticesStart = verticesStart;
		this.verticesCount = verticesCount;
		this.indexStart = indexStart;
		this.indexCount = indexCount;

		// var stride = this._mesh.getFloatVertexStrideSize();
		// this._boundingInfo = new BABYLON.BoundingInfo(
		// 	this._mesh.getVertices(), stride,
		// 	verticesStart * stride, verticesCount * stride
		// );


	}

  BABYLON.SubMesh.prototype.getMaterial = function () {
  	var rootMaterial = this._mesh.material;

		if (!rootMaterial) {
			return this._mesh._scene.defaultMaterial;
		}

    return rootMaterial;
	}

	BABYLON.SubMesh.prototype.render = function() {
		this._mesh.render(this);
	};
})();