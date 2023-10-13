var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Plane //////////////////////////////////

	BABYLON.Plane = function (a, b, c, d) {
		this.normal = new BABYLON.Vector3(a, b, c);
		this.d = d;
	};

	// Methods
	BABYLON.Plane.prototype.normalize = function () {
		var norm = (Math.sqrt((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y) + (this.normal.z * this.normal.z)));
		var magnitude = 0;

		if (norm != 0) {
			magnitude = 1.0 / norm;
		}

		this.normal.x *= magnitude;
		this.normal.y *= magnitude;
		this.normal.z *= magnitude;

		this.d *= magnitude;
	};

	BABYLON.Plane.prototype.transform = function(transformation) {
		var transposedMatrix = BABYLON.Matrix.Transpose(transformation);
		var x = this.normal.x;
		var y = this.normal.y;
		var z = this.normal.z;
		var d = this.d;

		var normalX = (((x * transposedMatrix.m[0]) + (y * transposedMatrix.m[1])) + (z * transposedMatrix.m[2])) + (d * transposedMatrix.m[3]);
		var normalY = (((x * transposedMatrix.m[4]) + (y * transposedMatrix.m[5])) + (z * transposedMatrix.m[6])) + (d * transposedMatrix.m[7]);
		var normalZ = (((x * transposedMatrix.m[8]) + (y * transposedMatrix.m[9])) + (z * transposedMatrix.m[10])) + (d * transposedMatrix.m[11]);
		var finalD = (((x * transposedMatrix.m[12]) + (y * transposedMatrix.m[13])) + (z * transposedMatrix.m[14])) + (d * transposedMatrix.m[15]);

		return new BABYLON.Plane(normalX, normalY, normalZ, finalD);
	};


	BABYLON.Plane.prototype.dotCoordinate = function (point) {
		return ((((this.normal.x * point.x) + (this.normal.y * point.y)) + (this.normal.z * point.z)) + this.d);
	};

	// Statics
	BABYLON.Plane.FromArray = function (array) {
		return new BABYLON.Plane(array[0], array[1], array[2], array[3]);
	};

	BABYLON.Plane.FromPoints = function(point1, point2, point3) {
		var x1 = point2.x - point1.x;
		var y1 = point2.y - point1.y;
		var z1 = point2.z - point1.z;
		var x2 = point3.x - point1.x;
		var y2 = point3.y - point1.y;
		var z2 = point3.z - point1.z;
		var yz = (y1 * z2) - (z1 * y2);
		var xz = (z1 * x2) - (x1 * z2);
		var xy = (x1 * y2) - (y1 * x2);
		var pyth = (Math.sqrt((yz * yz) + (xz * xz) + (xy * xy)));
		var invPyth;

		if (pyth != 0)
			invPyth = 1.0 / pyth;
		else
			invPyth = 0;

		var normal = new BABYLON.Vector3(yz * invPyth, xz * invPyth, xy * invPyth);
		var d = -((normal.x * point1.x) + (normal.y * point1.y) + (normal.z * point1.z));
		return new BABYLON.Plane(normal.x, normal.y, normal.z, d);
	};
})();
