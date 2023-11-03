var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Ray //////////////////////////////////

	BABYLON.Ray = function (origin, direction) {
		this.origin = origin;
		this.direction = direction;
	};

	// Methods
	BABYLON.Ray.prototype.intersectsBox = function (box) {
		var d = 0.0;
		var maxValue = Number.MAX_VALUE;

		if (Math.abs(this.direction.x) < 0.0000001)
		{
			if (this.origin.x < box.minimum.x || this.origin.x > box.maximum.x)
			{
				return false;
			}
		}
		else
		{
			var inv = 1.0 / this.direction.x;
			var min = (box.minimum.x - this.origin.x) * inv;
			var max = (box.maximum.x - this.origin.x) * inv;

			if (min > max)
			{
				var temp = min;
				min = max;
				max = temp;
			}

			d = Math.max(min, d);
			maxValue = Math.min(max, maxValue);

			if (d > maxValue)
			{
				return false;
			}
		}

		if (Math.abs(this.direction.y) < 0.0000001)
		{
			if (this.origin.y < box.minimum.y || this.origin.y > box.maximum.y)
			{
				return false;
			}
		}
		else
		{
			var inv = 1.0 / this.direction.y;
			var min = (box.minimum.y - this.origin.y) * inv;
			var max = (box.maximum.y - this.origin.y) * inv;

			if (min > max)
			{
				var temp = min;
				min = max;
				max = temp;
			}

			d = Math.max(min, d);
			maxValue = Math.min(max, maxValue);

			if (d > maxValue)
			{
				return false;
			}
		}

		if (Math.abs(this.direction.z) < 0.0000001)
		{
			if (this.origin.z < box.minimum.z || this.origin.z > box.maximum.z)
			{
				return false;
			}
		}
		else
		{
			var inv = 1.0 / this.direction.z;
			var min = (box.minimum.z - this.origin.z) * inv;
			var max = (box.maximum.z - this.origin.z) * inv;

			if (min > max)
			{
				var temp = min;
				min = max;
				max = temp;
			}

			d = Math.max(min, d);
			maxValue = Math.min(max, maxValue);

			if (d > maxValue)
			{
				return false;
			}
		}
		return true;
	};

	BABYLON.Ray.prototype.intersectsSphere = function (sphere) {
		var x = sphere.center.x - this.origin.x;
		var y = sphere.center.y - this.origin.y;
		var z = sphere.center.z - this.origin.z;
		var pyth = (x * x) + (y * y) + (z * z);
		var rr = sphere.radius * sphere.radius;

		if (pyth <= rr) {
			return true;
		}

		var dot = (x * this.direction.x) + (y * this.direction.y) + (z * this.direction.z);
		if (dot < 0.0) {
			return false;
		}

		var temp = pyth - (dot * dot);

		return temp <= rr;
	};

	BABYLON.Ray.prototype.intersectsTriangle = function (vertex0, vertex1, vertex2) {
		var edge1 = vertex1.subtract(vertex0);
		var edge2 = vertex2.subtract(vertex0);
		var pvec = BABYLON.Vector3.Cross(this.direction, edge2);
		var det = BABYLON.Vector3.Dot(edge1, pvec);

		if (det === 0) {
			return {
				hit: false,
				distance: 0,
				bu: 0,
				bv: 0
			};
		}

		var invdet = 1 / det;

		var tvec = this.origin.subtract(vertex0);

		var bu = BABYLON.Vector3.Dot(tvec, pvec) * invdet;

		if (bu < 0 || bu > 1.0) {
			return {
				hit: false,
				distance: 0,
				bu: bu,
				bv: 0
			};
		}

		var qvec = BABYLON.Vector3.Cross(tvec, edge1);

		bv = BABYLON.Vector3.Dot(this.direction, qvec) * invdet;

		if (bv < 0 || bu + bv > 1.0) {
			return {
				hit: false,
				distance: 0,
				bu: bu,
				bv: bv
			};
		}

		distance = BABYLON.Vector3.Dot(edge2, qvec) * invdet;

		return {
			hit: true,
			distance: distance,
			bu: bu,
			bv: bv
		};
	};

	// Statics
	BABYLON.Ray.CreateNew = function (x, y, viewportWidth, viewportHeight, world, view, projection) {
		var start = BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, 0), viewportWidth, viewportHeight, world, view, projection);
		var end = BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, 1), viewportWidth, viewportHeight, world, view, projection);

		var direction = end.subtract(start);
		direction.normalize();

		return new BABYLON.Ray(start, direction);
	};

})();