var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Matrix //////////////////////////////////

	BABYLON.Matrix = function () {
		this.m = new Array(16);
	};

	// Properties
	BABYLON.Matrix.prototype.isIdentity = function () {
		if (this.m[0] != 1.0 || this.m[5] != 1.0 || this.m[10] != 1.0 || this.m[15] != 1.0)
			return false;

		if (this.m[1] != 0.0 || this.m[2] != 0.0 || this.m[3] != 0.0 ||
			this.m[4] != 0.0 || this.m[6] != 0.0 || this.m[7] != 0.0 ||
			this.m[8] != 0.0 || this.m[9] != 0.0 || this.m[11] != 0.0 ||
			this.m[12] != 0.0 || this.m[13] != 0.0 || this.m[14] != 0.0)
			return false;

		return true;
	};

	BABYLON.Matrix.prototype.determinant = function () {
		var temp1 = (this.m[10] * this.m[15]) - (this.m[11] * this.m[14]);
		var temp2 = (this.m[9] * this.m[15]) - (this.m[11] * this.m[13]);
		var temp3 = (this.m[9] * this.m[14]) - (this.m[10] * this.m[13]);
		var temp4 = (this.m[8] * this.m[15]) - (this.m[11] * this.m[12]);
		var temp5 = (this.m[8] * this.m[14]) - (this.m[10] * this.m[12]);
		var temp6 = (this.m[8] * this.m[13]) - (this.m[9] * this.m[12]);

		return ((((this.m[0] * (((this.m[5] * temp1) - (this.m[6] * temp2)) + (this.m[7] * temp3))) - (this.m[1] * (((this.m[4] * temp1) -
				(this.m[6] * temp4)) + (this.m[7] * temp5)))) + (this.m[2] * (((this.m[4] * temp2) - (this.m[5] * temp4)) + (this.m[7] * temp6)))) -
			(this.m[3] * (((this.m[4] * temp3) - (this.m[5] * temp5)) + (this.m[6] * temp6))));
	};

	// Methods
	BABYLON.Matrix.prototype.toArray = function () {
		return this.m;
	};

	BABYLON.Matrix.prototype.invert = function () {
		var l1 = this.m[0];
		var l2 = this.m[1];
		var l3 = this.m[2];
		var l4 = this.m[3];
		var l5 = this.m[4];
		var l6 = this.m[5];
		var l7 = this.m[6];
		var l8 = this.m[7];
		var l9 = this.m[8];
		var l10 = this.m[9];
		var l11 = this.m[10];
		var l12 = this.m[11];
		var l13 = this.m[12];
		var l14 = this.m[13];
		var l15 = this.m[14];
		var l16 = this.m[15];
		var l17 = (l11 * l16) - (l12 * l15);
		var l18 = (l10 * l16) - (l12 * l14);
		var l19 = (l10 * l15) - (l11 * l14);
		var l20 = (l9 * l16) - (l12 * l13);
		var l21 = (l9 * l15) - (l11 * l13);
		var l22 = (l9 * l14) - (l10 * l13);
		var l23 = ((l6 * l17) - (l7 * l18)) + (l8 * l19);
		var l24 = -(((l5 * l17) - (l7 * l20)) + (l8 * l21));
		var l25 = ((l5 * l18) - (l6 * l20)) + (l8 * l22);
		var l26 = -(((l5 * l19) - (l6 * l21)) + (l7 * l22));
		var l27 = 1.0 / ((((l1 * l23) + (l2 * l24)) + (l3 * l25)) + (l4 * l26));
		var l28 = (l7 * l16) - (l8 * l15);
		var l29 = (l6 * l16) - (l8 * l14);
		var l30 = (l6 * l15) - (l7 * l14);
		var l31 = (l5 * l16) - (l8 * l13);
		var l32 = (l5 * l15) - (l7 * l13);
		var l33 = (l5 * l14) - (l6 * l13);
		var l34 = (l7 * l12) - (l8 * l11);
		var l35 = (l6 * l12) - (l8 * l10);
		var l36 = (l6 * l11) - (l7 * l10);
		var l37 = (l5 * l12) - (l8 * l9);
		var l38 = (l5 * l11) - (l7 * l9);
		var l39 = (l5 * l10) - (l6 * l9);

		this.m[0] = l23 * l27;
		this.m[4] = l24 * l27;
		this.m[8] = l25 * l27;
		this.m[12] = l26 * l27;
		this.m[1] = -(((l2 * l17) - (l3 * l18)) + (l4 * l19)) * l27;
		this.m[5] = (((l1 * l17) - (l3 * l20)) + (l4 * l21)) * l27;
		this.m[9] = -(((l1 * l18) - (l2 * l20)) + (l4 * l22)) * l27;
		this.m[13] = (((l1 * l19) - (l2 * l21)) + (l3 * l22)) * l27;
		this.m[2] = (((l2 * l28) - (l3 * l29)) + (l4 * l30)) * l27;
		this.m[6] = -(((l1 * l28) - (l3 * l31)) + (l4 * l32)) * l27;
		this.m[10] = (((l1 * l29) - (l2 * l31)) + (l4 * l33)) * l27;
		this.m[14] = -(((l1 * l30) - (l2 * l32)) + (l3 * l33)) * l27;
		this.m[3] = -(((l2 * l34) - (l3 * l35)) + (l4 * l36)) * l27;
		this.m[7] = (((l1 * l34) - (l3 * l37)) + (l4 * l38)) * l27;
		this.m[11] = -(((l1 * l35) - (l2 * l37)) + (l4 * l39)) * l27;
		this.m[15] = (((l1 * l36) - (l2 * l38)) + (l3 * l39)) * l27;
	};

	BABYLON.Matrix.prototype.multiply = function (other) {
		var result = new BABYLON.Matrix();

		result.m[0] = this.m[0] * other.m[0] + this.m[1] * other.m[4] + this.m[2] * other.m[8] + this.m[3] * other.m[12];
		result.m[1] = this.m[0] * other.m[1] + this.m[1] * other.m[5] + this.m[2] * other.m[9] + this.m[3] * other.m[13];
		result.m[2] = this.m[0] * other.m[2] + this.m[1] * other.m[6] + this.m[2] * other.m[10] + this.m[3] * other.m[14];
		result.m[3] = this.m[0] * other.m[3] + this.m[1] * other.m[7] + this.m[2] * other.m[11] + this.m[3] * other.m[15];

		result.m[4] = this.m[4] * other.m[0] + this.m[5] * other.m[4] + this.m[6] * other.m[8] + this.m[7] * other.m[12];
		result.m[5] = this.m[4] * other.m[1] + this.m[5] * other.m[5] + this.m[6] * other.m[9] + this.m[7] * other.m[13];
		result.m[6] = this.m[4] * other.m[2] + this.m[5] * other.m[6] + this.m[6] * other.m[10] + this.m[7] * other.m[14];
		result.m[7] = this.m[4] * other.m[3] + this.m[5] * other.m[7] + this.m[6] * other.m[11] + this.m[7] * other.m[15];

		result.m[8] = this.m[8] * other.m[0] + this.m[9] * other.m[4] + this.m[10] * other.m[8] + this.m[11] * other.m[12];
		result.m[9] = this.m[8] * other.m[1] + this.m[9] * other.m[5] + this.m[10] * other.m[9] + this.m[11] * other.m[13];
		result.m[10] = this.m[8] * other.m[2] + this.m[9] * other.m[6] + this.m[10] * other.m[10] + this.m[11] * other.m[14];
		result.m[11] = this.m[8] * other.m[3] + this.m[9] * other.m[7] + this.m[10] * other.m[11] + this.m[11] * other.m[15];

		result.m[12] = this.m[12] * other.m[0] + this.m[13] * other.m[4] + this.m[14] * other.m[8] + this.m[15] * other.m[12];
		result.m[13] = this.m[12] * other.m[1] + this.m[13] * other.m[5] + this.m[14] * other.m[9] + this.m[15] * other.m[13];
		result.m[14] = this.m[12] * other.m[2] + this.m[13] * other.m[6] + this.m[14] * other.m[10] + this.m[15] * other.m[14];
		result.m[15] = this.m[12] * other.m[3] + this.m[13] * other.m[7] + this.m[14] * other.m[11] + this.m[15] * other.m[15];

		return result;
	};

	BABYLON.Matrix.prototype.equals = function (value) {
		return (this.m[0] === value.m[0] && this.m[1] === value.m[1] && this.m[2] === value.m[2] && this.m[3] === value.m[3] &&
				this.m[4] === value.m[4] && this.m[5] === value.m[5] && this.m[6] === value.m[6] && this.m[7] === value.m[7] &&
				this.m[8] === value.m[8] && this.m[9] === value.m[9] && this.m[10] === value.m[10] && this.m[11] === value.m[11] &&
				this.m[12] === value.m[12] && this.m[13] === value.m[13] && this.m[14] === value.m[14] && this.m[15] === value.m[15]);
	};

	BABYLON.Matrix.prototype.clone = function () {
		return BABYLON.Matrix.FromValues(this.m[0], this.m[1], this.m[2], this.m[3],
			this.m[4], this.m[5], this.m[6], this.m[7],
			this.m[8], this.m[9], this.m[10], this.m[11],
			this.m[12], this.m[13], this.m[14], this.m[15]);
	};

	// Statics
	BABYLON.Matrix.FromValues = function (initialM11, initialM12, initialM13, initialM14,
		initialM21, initialM22, initialM23, initialM24,
		initialM31, initialM32, initialM33, initialM34,
		initialM41, initialM42, initialM43, initialM44) {

		var result = new BABYLON.Matrix();

		result.m[0] = initialM11;
		result.m[1] = initialM12;
		result.m[2] = initialM13;
		result.m[3] = initialM14;
		result.m[4] = initialM21;
		result.m[5] = initialM22;
		result.m[6] = initialM23;
		result.m[7] = initialM24;
		result.m[8] = initialM31;
		result.m[9] = initialM32;
		result.m[10] = initialM33;
		result.m[11] = initialM34;
		result.m[12] = initialM41;
		result.m[13] = initialM42;
		result.m[14] = initialM43;
		result.m[15] = initialM44;

		return result;
	};

	BABYLON.Matrix.Identity = function () {
		return BABYLON.Matrix.FromValues(1.0, 0, 0, 0,
			0, 1.0, 0, 0,
			0, 0, 1.0, 0,
			0, 0, 0, 1.0);
	};

	BABYLON.Matrix.Zero = function () {
		return BABYLON.Matrix.FromValues(0, 0, 0, 0,
			0, 0, 0, 0,
			0, 0, 0, 0,
			0, 0, 0, 0);
	};

	BABYLON.Matrix.RotationX = function (angle) {
		var result = BABYLON.Matrix.Zero();
		var s = Math.sin(angle);
		var c = Math.cos(angle);

		result.m[0] = 1.0;
		result.m[15] = 1.0;

		result.m[5] = c;
		result.m[10] = c;
		result.m[9] = -s;
		result.m[6] = s;

		return result;
	};

	BABYLON.Matrix.RotationY = function (angle) {
		var result = BABYLON.Matrix.Zero();
		var s = Math.sin(angle);
		var c = Math.cos(angle);

		result.m[5] = 1.0;
		result.m[15] = 1.0;

		result.m[0] = c;
		result.m[2] = -s;
		result.m[8] = s;
		result.m[10] = c;

		return result;
	};

	BABYLON.Matrix.RotationZ = function (angle) {
		var result = BABYLON.Matrix.Zero();
		var s = Math.sin(angle);
		var c = Math.cos(angle);

		result.m[10] = 1.0;
		result.m[15] = 1.0;

		result.m[0] = c;
		result.m[1] = s;
		result.m[4] = -s;
		result.m[5] = c;

		return result;
	};

	BABYLON.Matrix.RotationAxis = function (axis, angle) {
		var s = Math.sin(-angle);
		var c = Math.cos(-angle);
		var c1 = 1 - c;

		axis.normalize();
		var result = BABYLON.Matrix.Zero();

		result.m[0] = (axis.x * axis.x) * c1 + c;
		result.m[1] = (axis.x * axis.y) * c1 - (axis.z * s);
		result.m[2] = (axis.x * axis.z) * c1 + (axis.y * s);
		result.m[3] = 0.0;

		result.m[4] = (axis.y * axis.x) * c1 + (axis.z * s);
		result.m[5] = (axis.y * axis.y) * c1 + c;
		result.m[6] = (axis.y * axis.z) * c1 - (axis.x * s);
		result.m[7] = 0.0;

		result.m[8] = (axis.z * axis.x) * c1 - (axis.y * s);
		result.m[9] = (axis.z * axis.y) * c1 + (axis.x * s);
		result.m[10] = (axis.z * axis.z) * c1 + c;
		result.m[11] = 0.0;

		result.m[15] = 1.0;

		return result;
	};

	BABYLON.Matrix.RotationYawPitchRoll = function (yaw, pitch, roll) {
		return BABYLON.Matrix.RotationZ(roll).multiply(BABYLON.Matrix.RotationX(pitch)).multiply(BABYLON.Matrix.RotationY(yaw));
	};

	BABYLON.Matrix.Scaling = function (x, y, z) {
		var result = BABYLON.Matrix.Zero();

		result.m[0] = x;
		result.m[5] = y;
		result.m[10] = z;
		result.m[15] = 1.0;

		return result;
	};

	BABYLON.Matrix.Translation = function (x, y, z) {
		var result = BABYLON.Matrix.Identity();

		result.m[12] = x;
		result.m[13] = y;
		result.m[14] = z;

		return result;
	};

	BABYLON.Matrix.LookAtLH = function (eye, target, up) {
		// Z axis
		var zAxis = target.subtract(eye);
		zAxis.normalize();

		// X axis
		var xAxis = BABYLON.Vector3.Cross(up, zAxis);
		xAxis.normalize();

		// Y axis
		var yAxis = BABYLON.Vector3.Cross(zAxis, xAxis);
		yAxis.normalize();

		// Eye angles
		var ex = -BABYLON.Vector3.Dot(xAxis, eye);
		var ey = -BABYLON.Vector3.Dot(yAxis, eye);
		var ez = -BABYLON.Vector3.Dot(zAxis, eye);

		return BABYLON.Matrix.FromValues(xAxis.x, yAxis.x, zAxis.x, 0,
			xAxis.y, yAxis.y, zAxis.y, 0,
			xAxis.z, yAxis.z, zAxis.z, 0,
			ex, ey, ez, 1);
	};

	BABYLON.Matrix.OrthoLH = function (width, height, znear, zfar) {
		var hw = 2.0 / width;
		var hh = 2.0 / height;
		var id = 1.0 / (zfar - znear);
		var nid = znear / (znear - zfar);

		return BABYLON.Matrix.FromValues(hw, 0, 0, 0,
			0, hh, 0, 0,
			0, 0, id, 0,
			0, 0, nid, 1);
	};

	BABYLON.Matrix.OrthoOffCenterLH = function (left, right, bottom, top, znear, zfar) {
		var matrix = BABYLON.Matrix.Zero();

		matrix.m[0] = 2.0 / (right - left);
		matrix.m[1] = matrix.m[2] = matrix.m[3] = 0;
		matrix.m[5] = 2.0 / (top - bottom);
		matrix.m[4] = matrix.m[6] = matrix.m[7] = 0;
		matrix.m[10] = -1.0 / (znear - zfar);
		matrix.m[8] = matrix.m[9] = matrix.m[11] = 0;
		matrix.m[12] = (left + right) / (left - right);
		matrix.m[13] = (top + bottom) / (bottom - top);
		matrix.m[14] = znear / (znear - zfar);
		matrix.m[15] = 1.0;

		return matrix;
	};

	BABYLON.Matrix.PerspectiveLH = function (width, height, znear, zfar) {
		var matrix = BABYLON.Matrix.Zero();

		matrix.m[0] = (2.0 * znear) / width;
		matrix.m[1] = matrix.m[2] = matrix.m[3] = 0.0;
		matrix.m[5] = (2.0 * znear) / height;
		matrix.m[4] = matrix.m[6] = matrix.m[7] = 0.0;
		matrix.m[10] = -zfar / (znear - zfar);
		matrix.m[8] = matrix.m[9] = 0.0;
		matrix.m[11] = 1.0;
		matrix.m[12] = matrix.m[13] = matrix.m[15] = 0.0;
		matrix.m[14] = (znear * zfar) / (znear - zfar);

		return matrix;
	};

	BABYLON.Matrix.PerspectiveFovLH = function (fov, aspect, znear, zfar) {
		var matrix = BABYLON.Matrix.Zero();

		var tan = 1.0 / (Math.tan(fov * 0.5));

		matrix.m[0] = tan / aspect;
		matrix.m[1] = matrix.m[2] = matrix.m[3] = 0.0;
		matrix.m[5] = tan;
		matrix.m[4] = matrix.m[6] = matrix.m[7] = 0.0;
		matrix.m[8] = matrix.m[9] = 0.0;
		matrix.m[10] = -zfar / (znear - zfar);
		matrix.m[11] = 1.0;
		matrix.m[12] = matrix.m[13] = matrix.m[15] = 0.0;
		matrix.m[14] = (znear * zfar) / (znear - zfar);

		return matrix;
	};

	BABYLON.Matrix.AffineTransformation = function (scaling, rotationCenter, rotation, translation) {
		return BABYLON.Matrix.Scaling(scaling, scaling, scaling) * BABYLON.Matrix.Translation(-rotationCenter) *
			BABYLON.Matrix.RotationQuaternion(rotation) * BABYLON.Matrix.Translation(rotationCenter) * BABYLON.Matrix.Translation(translation);
	};

	BABYLON.Matrix.GetFinalMatrix = function (viewport, world, view, projection) {
		var cw = viewport.width;
		var ch = viewport.height;
		var cx = viewport.x;
		var cy = viewport.y;
		var zmin = viewport.minZ;
		var zmax = viewport.maxZ;

		var viewportMatrix = new BABYLON.Matrix(cw / 2.0, 0, 0, 0,
			0, -ch / 2.0, 0, 0,
			0, 0, zmax - zmin, 0,
			cx + cw / 2.0, ch / 2.0 + cy, zmin, 1);

		return world.multiply(view).multiply(projection).multiply(viewportMatrix);
	};

	BABYLON.Matrix.Transpose = function (matrix) {
		var result = new BABYLON.Matrix();

		result.m[0] = matrix.m[0];
		result.m[1] = matrix.m[4];
		result.m[2] = matrix.m[8];
		result.m[3] = matrix.m[12];

		result.m[4] = matrix.m[1];
		result.m[5] = matrix.m[5];
		result.m[6] = matrix.m[9];
		result.m[7] = matrix.m[13];

		result.m[8] = matrix.m[2];
		result.m[9] = matrix.m[6];
		result.m[10] = matrix.m[10];
		result.m[11] = matrix.m[14];

		result.m[12] = matrix.m[3];
		result.m[13] = matrix.m[7];
		result.m[14] = matrix.m[11];
		result.m[15] = matrix.m[15];

		return result;
	};

	BABYLON.Matrix.Reflection = function (plane) {
		var matrix = new BABYLON.Matrix();

		plane.normalize();
		var x = plane.normal.x;
		var y = plane.normal.y;
		var z = plane.normal.z;
		var temp = -2 * x;
		var temp2 = -2 * y;
		var temp3 = -2 * z;
		matrix.m[0] = (temp * x) + 1;
		matrix.m[1] = temp2 * x;
		matrix.m[2] = temp3 * x;
		matrix.m[3] = 0.0;
		matrix.m[4] = temp * y;
		matrix.m[5] = (temp2 * y) + 1;
		matrix.m[6] = temp3 * y;
		matrix.m[7] = 0.0;
		matrix.m[8] = temp * z;
		matrix.m[9] = temp2 * z;
		matrix.m[10] = (temp3 * z) + 1;
		matrix.m[11] = 0.0;
		matrix.m[12] = temp * plane.d;
		matrix.m[13] = temp2 * plane.d;
		matrix.m[14] = temp3 * plane.d;
		matrix.m[15] = 1.0;

		return matrix;
	};

})();