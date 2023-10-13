var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Color3 //////////////////////////////////

	BABYLON.Color3 = function (initialR, initialG, initialB) {
		this.r = initialR;
		this.g = initialG;
		this.b = initialB;
	};

	BABYLON.Color3.prototype.toString = function () {
		return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
	};

	// Operators
	BABYLON.Color3.prototype.multiply = function (otherColor) {
		return new BABYLON.Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
	};

	BABYLON.Color3.prototype.equals = function (otherColor) {
		return this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
	};

	BABYLON.Color3.prototype.scale = function (scale) {
		return new BABYLON.Color3(this.r * scale, this.g * scale, this.b * scale);
	};

	BABYLON.Color3.prototype.clone = function () {
		return new BABYLON.Color3(this.r, this.g, this.b);
	};

	// Statics
	BABYLON.Color3.FromArray = function (array) {
		return new BABYLON.Color3(array[0], array[1], array[2]);
	};

})();