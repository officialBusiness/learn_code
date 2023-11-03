var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Color4 //////////////////////////////////

	BABYLON.Color4 = function (initialR, initialG, initialB, initialA) {
		this.r = initialR;
		this.g = initialG;
		this.b = initialB;
		this.a = initialA;
	};

	// Operators
	BABYLON.Color4.prototype.add = function (right) {
		return new BABYLON.Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
	};

	BABYLON.Color4.prototype.subtract = function (right) {
		return new BABYLON.Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
	};

	BABYLON.Color4.prototype.scale = function (scale) {
		return new BABYLON.Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
	};

	BABYLON.Color4.prototype.toString = function () {
		return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
	};

	BABYLON.Color4.prototype.clone = function () {
		return new BABYLON.Color4(this.r, this.g, this.b, this.a);
	};

	// Statics
	BABYLON.Color4.Lerp = function(left, right, amount) {
		var r = left.r + (right.r - left.r) * amount;
		var g = left.g + (right.g - left.g) * amount;
		var b = left.b + (right.b - left.b) * amount;
		var a = left.a + (right.a - left.a) * amount;

		return new BABYLON.Color4(r, g, b, a);
	};

	BABYLON.Color4.FromArray = function (array, offset) {
		if (!offset) {
			offset = 0;
		}

		return new BABYLON.Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
	};

})();