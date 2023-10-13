var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Vector2 //////////////////////////////////

	BABYLON.Vector2 = function (initialX, initialY) {
		this.x = initialX;
		this.y = initialY;
	};

	BABYLON.Vector2.prototype.toString = function () {
		return "{X: " + this.x + " Y:" + this.y + "}";
	};

	// Operators
	BABYLON.Vector2.prototype.add = function (otherVector) {
		return new BABYLON.Vector2(this.x + otherVector.x, this.y + otherVector.y);
	};

	BABYLON.Vector2.prototype.subtract = function (otherVector) {
		return new BABYLON.Vector2(this.x - otherVector.x, this.y - otherVector.y);
	};

	BABYLON.Vector2.prototype.negate = function () {
		return new BABYLON.Vector2(-this.x, -this.y);
	};

	BABYLON.Vector2.prototype.scale = function (scale) {
		return new BABYLON.Vector2(this.x * scale, this.y * scale);
	};

	BABYLON.Vector2.prototype.equals = function (otherVector) {
		return this.x === otherVector.x && this.y === otherVector.y;
	};

	// Properties
	BABYLON.Vector2.prototype.length = function () {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	};

	BABYLON.Vector2.prototype.lengthSquared = function () {
		return (this.x * this.x + this.y * this.y);
	};

	// Methods
	BABYLON.Vector2.prototype.normalize = function () {
		var len = this.length();

		if (len === 0)
			return;

		var num = 1.0 / len;

		this.x *= num;
		this.y *= num;
	};

	BABYLON.Vector2.prototype.clone = function () {
		return new BABYLON.Vector2(this.x, this.y);
	};

	// Statics
	BABYLON.Vector2.Zero = function () {
		return new BABYLON.Vector2(0, 0);
	};

	BABYLON.Vector2.CatmullRom = function (value1, value2, value3, value4, amount) {
		var squared = amount * amount;
		var cubed = amount * squared;

		var x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
				(((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
			((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

		var y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
				(((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
			((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Clamp = function (value, min, max) {
		var x = value.x;
		x = (x > max.x) ? max.x : x;
		x = (x < min.x) ? min.x : x;

		var y = value.y;
		y = (y > max.y) ? max.y : y;
		y = (y < min.y) ? min.y : y;

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Hermite = function (value1, tangent1, value2, tangent2, amount) {
		var squared = amount * amount;
		var cubed = amount * squared;
		var part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
		var part2 = (-2.0 * cubed) + (3.0 * squared);
		var part3 = (cubed - (2.0 * squared)) + amount;
		var part4 = cubed - squared;

		var x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
		var y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Lerp = function (start, end, amount) {
		var x = start.x + ((end.x - start.x) * amount);
		var y = start.y + ((end.y - start.y) * amount);

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Dot = function (left, right) {
		return left.x * right.x + left.y * right.y;
	};

	BABYLON.Vector2.Normalize = function (vector) {
		var newVector = vector.clone();
		newVector.normalize();
		return newVector;
	};

	BABYLON.Vector2.Minimize = function (left, right) {
		var x = (left.x < right.x) ? left.x : right.x;
		var y = (left.y < right.y) ? left.y : right.y;

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Maximize = function (left, right) {
		var x = (left.x > right.x) ? left.x : right.x;
		var y = (left.y > right.y) ? left.y : right.y;

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Transform = function (vector, transformation) {
		var x = (vector.x * transformation.m[0]) + (vector.y * transformation.m[4]);
		var y = (vector.x * transformation.m[1]) + (vector.y * transformation.m[5]);

		return new BABYLON.Vector2(x, y);
	};

	BABYLON.Vector2.Distance = function (value1, value2) {
		return Math.sqrt(BABYLON.Vector2.DistanceSquared(value1, value2));
	};

	BABYLON.Vector2.DistanceSquared = function (value1, value2) {
		var x = value1.x - value2.x;
		var y = value1.y - value2.y;

		return (x * x) + (y * y);
	};

})();