var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Vector3 //////////////////////////////////

	BABYLON.Vector3 = function (initialX, initialY, initialZ) {
		this.x = initialX;
		this.y = initialY;
		this.z = initialZ;
	};

	BABYLON.Vector3.prototype.toString = function () {
		return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + "}";
	};

	// Operators
	BABYLON.Vector3.prototype.add = function (otherVector) {
		return new BABYLON.Vector3(this.x + otherVector.x, this.y + otherVector.y, this.z + otherVector.z);
	};

	BABYLON.Vector3.prototype.subtract = function (otherVector) {
		return new BABYLON.Vector3(this.x - otherVector.x, this.y - otherVector.y, this.z - otherVector.z);
	};

	BABYLON.Vector3.prototype.negate = function () {
		return new BABYLON.Vector3(-this.x, -this.y, -this.z);
	};

	BABYLON.Vector3.prototype.scale = function (scale) {
		return new BABYLON.Vector3(this.x * scale, this.y * scale, this.z * scale);
	};

	BABYLON.Vector3.prototype.equals = function (otherVector) {
		return this.x === otherVector.x && this.y === otherVector.y && this.z === otherVector.z;
	};

	BABYLON.Vector3.prototype.multiply = function (otherVector) {
		return new BABYLON.Vector3(this.x * otherVector.x, this.y * otherVector.y, this.z * otherVector.z);
	};

	BABYLON.Vector3.prototype.divide = function (otherVector) {
		return new BABYLON.Vector3(this.x / otherVector.x, this.y / otherVector.y, this.z / otherVector.z);
	};

	// Properties
	BABYLON.Vector3.prototype.length = function () {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	};

	BABYLON.Vector3.prototype.lengthSquared = function () {
		return (this.x * this.x + this.y * this.y + this.z * this.z);
	};

	// Methods
	BABYLON.Vector3.prototype.normalize = function () {
		var len = this.length();

		if (len === 0)
			return;

		var num = 1.0 / len;

		this.x *= num;
		this.y *= num;
		this.z *= num;
	};

	BABYLON.Vector3.prototype.clone = function () {
		return new BABYLON.Vector3(this.x, this.y, this.z);
	};

	// Statics
	BABYLON.Vector3.FromArray = function (array, offset) {
		if (!offset) {
			offset = 0;
		}

		return new BABYLON.Vector3(array[offset], array[offset + 1], array[offset + 2]);
	};

	BABYLON.Vector3.Zero = function () {
		return new BABYLON.Vector3(0, 0, 0);
	};

	BABYLON.Vector3.Up = function () {
		return new BABYLON.Vector3(0, 1.0, 0);
	};

	BABYLON.Vector3.TransformCoordinates = function (vector, transformation) {
		var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]) + transformation.m[12];
		var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]) + transformation.m[13];
		var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]) + transformation.m[14];
		var w = (vector.x * transformation.m[3]) + (vector.y * transformation.m[7]) + (vector.z * transformation.m[11]) + transformation.m[15];

		return new BABYLON.Vector3(x / w, y / w, z / w);
	};

	BABYLON.Vector3.TransformNormal = function (vector, transformation) {
		var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]) + (vector.z * transformation.m[8]);
		var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]) + (vector.z * transformation.m[9]);
		var z = (vector.x * transformation.m[2]) + (vector.y * transformation.m[6]) + (vector.z * transformation.m[10]);

		return new BABYLON.Vector3(x, y, z);
	};


	BABYLON.Vector3.CatmullRom = function (value1, value2, value3, value4, amount) {
		var squared = amount * amount;
		var cubed = amount * squared;

		var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
				(((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
			((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

		var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
				(((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
			((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

		var z = 0.5 * ((((2.0 * value2.z) + ((-value1.z + value3.z) * amount)) +
				(((((2.0 * value1.z) - (5.0 * value2.z)) + (4.0 * value3.z)) - value4.z) * squared)) +
			((((-value1.z + (3.0 * value2.z)) - (3.0 * value3.z)) + value4.z) * cubed));

		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Clamp = function (value, min, max) {
		var x = value.x;
		x = (x > max.x) ? max.x : x;
		x = (x < min.x) ? min.x : x;

		var y = value.y;
		y = (y > max.y) ? max.y : y;
		y = (y < min.y) ? min.y : y;

		var z = value.z;
		z = (z > max.z) ? max.z : z;
		z = (z < min.z) ? min.z : z;

		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Hermite = function (value1, tangent1, value2, tangent2, amount) {
		var squared = amount * amount;
		var cubed = amount * squared;
		var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
		var part2 = (-2.0 * cubed) + (3.0 * squared);
		var part3 = (cubed - (2.0 * squared)) + amount;
		var part4 = cubed - squared;

		var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
		var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);
		var z = (((value1.z * part1) + (value2.z * part2)) + (tangent1.z * part3)) + (tangent2.z * part4);

		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Lerp = function (start, end, amount) {
		var x = start.x + ((end.x - start.x) * amount);
		var y = start.y + ((end.y - start.y) * amount);
		var z = start.z + ((end.z - start.z) * amount);

		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Dot = function (left, right) {
		return (left.x * right.x + left.y * right.y + left.z * right.z);
	};

	BABYLON.Vector3.Cross = function (left, right) {
		var x = left.y * right.z - left.z * right.y;
		var y = left.z * right.x - left.x * right.z;
		var z = left.x * right.y - left.y * right.x;

		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Normalize = function (vector) {
		var newVector = vector.clone();
		newVector.normalize();
		return newVector;
	};

	BABYLON.Vector3.Unproject = function (source, viewportWidth, viewportHeight, world, view, projection) {
		var matrix = world.multiply(view).multiply(projection);
		matrix.invert();
		source.x = source.x / viewportWidth * 2 - 1;
		source.y = -(source.y / viewportHeight * 2 - 1);
		var vector = BABYLON.Vector3.TransformCoordinates(source, matrix);
		var num = source.x * matrix.m[3] + source.y * matrix.m[7] + source.z * matrix.m[11] + matrix.m[15];

		if (BABYLON.Tools.WithinEpsilon(num, 1.0)) {
			vector = vector.scale(1.0 / num);
		}

		return vector;
	};

	BABYLON.Vector3.Minimize = function (left, right) {
		var x = (left.x < right.x) ? left.x : right.x;
		var y = (left.y < right.y) ? left.y : right.y;
		var z = (left.z < right.z) ? left.z : right.z;
		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Maximize = function (left, right) {
		var x = (left.x > right.x) ? left.x : right.x;
		var y = (left.y > right.y) ? left.y : right.y;
		var z = (left.z > right.z) ? left.z : right.z;
		return new BABYLON.Vector3(x, y, z);
	};

	BABYLON.Vector3.Distance = function (value1, value2) {
		return Math.sqrt(BABYLON.Vector3.DistanceSquared(value1, value2));
	};

	BABYLON.Vector3.DistanceSquared = function (value1, value2) {
		var x = value1.x - value2.x;
		var y = value1.y - value2.y;
		var z = value1.z - value2.z;

		return (x * x) + (y * y) + (z * z);
	};

})();