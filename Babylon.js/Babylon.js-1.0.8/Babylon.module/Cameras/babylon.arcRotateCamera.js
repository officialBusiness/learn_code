import Camera from './babylon.camera.js';
import Engine from '../babylon.engine.js';
import { Vector3, Matrix } from '../Tools/babylon.math.js';

export default function ArcRotateCamera(name, alpha, beta, radius, target, scene) {
	this.name = name;
	this.id = name;
	this.alpha = alpha;
	this.beta = beta;
	this.radius = radius;
	this.target = target;

	this._keys = [];
	this.keysUp = [38];
	this.keysDown = [40];
	this.keysLeft = [37];
	this.keysRight = [39];

	this._scene = scene;

	scene.cameras.push(this);

	if (!scene.activeCamera) {
		scene.activeCamera = this;
	}

	this.getViewMatrix();
	
	// Animations
	this.animations = [];
};

ArcRotateCamera.prototype = Object.create(Camera.prototype);

// Members
ArcRotateCamera.prototype.inertialAlphaOffset = 0;
ArcRotateCamera.prototype.inertialBetaOffset = 0;

// Methods
ArcRotateCamera.prototype.attachControl = function(canvas) {
	var previousPosition;
	var that = this;
	
	this._onPointerDown = function (evt) {
		previousPosition = {
			x: evt.clientX,
			y: evt.clientY
		};

		evt.preventDefault();
	};

	this._onPointerUp = function (evt) {
		previousPosition = null;
		evt.preventDefault();
	};

	this._onPointerMove = function (evt) {
		if (!previousPosition) {
			return;
		}

		var offsetX = evt.clientX - previousPosition.x;
		var offsetY = evt.clientY - previousPosition.y;

		that.inertialAlphaOffset -= offsetX / 1000;
		that.inertialBetaOffset -= offsetY / 1000;

		previousPosition = {
			x: evt.clientX,
			y: evt.clientY
		};

		evt.preventDefault();
	};

	this._wheel = function(event) {
		var delta = 0;
		if (event.wheelDelta) {
			delta = event.wheelDelta / 120;
		} else if (event.detail) {
			delta = -event.detail / 3;
		}

		if (delta)
			that.radius -= delta;

		if (event.preventDefault)
			event.preventDefault();
	};
	
	this._onKeyDown = function (evt) {
		if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
			that.keysDown.indexOf(evt.keyCode) !== -1 ||
			that.keysLeft.indexOf(evt.keyCode) !== -1 ||
			that.keysRight.indexOf(evt.keyCode) !== -1) {
			var index = that._keys.indexOf(evt.keyCode);

			if (index === -1) {
				that._keys.push(evt.keyCode);
			}
			evt.preventDefault();
		}
	};

	this._onKeyUp = function (evt) {
		if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
			that.keysDown.indexOf(evt.keyCode) !== -1 ||
			that.keysLeft.indexOf(evt.keyCode) !== -1 ||
			that.keysRight.indexOf(evt.keyCode) !== -1) {
			var index = that._keys.indexOf(evt.keyCode);

			if (index >= 0) {
				that._keys.splice(index, 1);
			}
			evt.preventDefault();
		}
	};
	
	this._onLostFocus = function () {
		that._keys = [];
	};

	canvas.addEventListener("pointerdown", this._onPointerDown);
	canvas.addEventListener("pointerup", this._onPointerUp);
	canvas.addEventListener("pointerout", this._onPointerUp);
	canvas.addEventListener("pointermove", this._onPointerMove);
	window.addEventListener("keydown", this._onKeyDown, true);
	window.addEventListener("keyup", this._onKeyUp, true);
	window.addEventListener('mousewheel', this._wheel, { passive: false });
	window.addEventListener("blur", this._onLostFocus, true);
};

ArcRotateCamera.prototype.detachControl = function (canvas) {
	canvas.removeEventListener("pointerdown", this._onPointerDown);
	canvas.removeEventListener("pointerup", this._onPointerUp);
	canvas.removeEventListener("pointerout", this._onPointerUp);
	canvas.removeEventListener("pointermove", this._onPointerMove);
	window.removeEventListener("keydown", this._onKeyDown);
	window.removeEventListener("keyup", this._onKeyUp);
	window.removeEventListener('mousewheel', this._wheel, { passive: false });
	window.removeEventListener("blur", this._onLostFocus);
};

ArcRotateCamera.prototype._update = function () {
	// Keyboard
	for (var index = 0; index < this._keys.length; index++) {
		var keyCode = this._keys[index];

		if (this.keysLeft.indexOf(keyCode) !== -1) {
			this.inertialAlphaOffset -= 0.01;
		} else if (this.keysUp.indexOf(keyCode) !== -1) {
			this.inertialBetaOffset -= 0.01;
		} else if (this.keysRight.indexOf(keyCode) !== -1) {
			this.inertialAlphaOffset += 0.01;
		} else if (this.keysDown.indexOf(keyCode) !== -1) {
			this.inertialBetaOffset += 0.01;
		}
	}
	
	// Inertia
	if (this.inertialAlphaOffset != 0 || this.inertialBetaOffset != 0) {

		this.alpha += this.inertialAlphaOffset;
		this.beta += this.inertialBetaOffset;

		this.inertialAlphaOffset *= this.inertia;
		this.inertialBetaOffset *= this.inertia;

		if (Math.abs(this.inertialAlphaOffset) < Engine.epsilon){
			this.inertialAlphaOffset = 0;
		}

		if (Math.abs(this.inertialBetaOffset) < Engine.epsilon){
			this.inertialBetaOffset = 0;
		}
	}
};

ArcRotateCamera.prototype.setPosition = function(position) {
	var radiusv3 = position.subtract(this.target.position ? this.target.position : this.target);
	this.radius = radiusv3.length();

	this.alpha = Math.atan(radiusv3.z / radiusv3.x);
	this.beta = Math.acos(radiusv3.y / this.radius);
};

ArcRotateCamera.prototype.getViewMatrix = function () {
	// Compute
	if (this.beta > Math.PI)
		this.beta = Math.PI;

	if (this.beta <= 0)
		this.beta = 0.01;

	var cosa = Math.cos(this.alpha);
	var sina = Math.sin(this.alpha);
	var cosb = Math.cos(this.beta);
	var sinb = Math.sin(this.beta);

	this.position = this.target.add(new Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb));
	return new Matrix.LookAtLH(this.position, this.target, Vector3.Up());
};