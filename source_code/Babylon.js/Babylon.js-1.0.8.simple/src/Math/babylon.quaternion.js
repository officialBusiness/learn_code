var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Quaternion //////////////////////////////////

	BABYLON.Quaternion = function (initialX, initialY, initialZ, initialW) {
		this.x = initialX;
		this.y = initialY;
		this.z = initialZ;
		this.w = initialW;
	};

	BABYLON.Quaternion.prototype.toString = function () {
		return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
	};

	BABYLON.Quaternion.prototype.clone = function () {
		return new BABYLON.Quaternion(this.x, this.y, this.z, this.w);
	};

	BABYLON.Quaternion.prototype.add = function(other) {
		return new BABYLON.Quaternion(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
	};

	BABYLON.Quaternion.prototype.scale = function (value) {
		return new BABYLON.Quaternion(this.x * value, this.y * value, this.z * value, this.w * value);
	};

	BABYLON.Quaternion.prototype.toEulerAngles = function () {
		var q0 = this.x;
		var q1 = this.y;
		var q2 = this.y;
		var q3 = this.w;

		var x = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - 2 * (q1 * q1 + q2 * q2));
		var y = Math.asin(2 * (q0 * q2 - q3 * q1));
		var z = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3));

		return new BABYLON.Vector3(x, y, z);
	};

	// Statics
	BABYLON.Quaternion.FromArray = function (array, offset) {
		if (!offset) {
			offset = 0;
		}

		return new BABYLON.Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
	};

	BABYLON.Quaternion.Slerp = function(left, right, amount) {
		var num2;
		var num3;
		var num = amount;
		var num4 = (((left.x * right.x) + (left.y * right.y)) + (left.z * right.z)) + (left.w * right.w);
		var flag = false;

		if (num4 < 0)
		{
			flag = true;
			num4 = -num4;
		}

		if (num4 > 0.999999)
		{
			num3 = 1 - num;
			num2 = flag ? -num : num;
		}
		else
		{
			var num5 = Math.acos(num4);
			var num6 = (1.0 / Math.sin(num5));
			num3 = (Math.sin((1.0 - num) * num5)) * num6;
			num2 = flag ? ((-Math.sin(num * num5)) * num6) : ((Math.sin(num * num5)) * num6);
		}

		return new BABYLON.Quaternion((num3 * left.x) + (num2 * right.x), (num3 * left.y) + (num2 * right.y), (num3 * left.z) + (num2 * right.z), (num3 * left.w) + (num2 * right.w));
	};

})();