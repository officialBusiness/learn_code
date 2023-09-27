import { Matrix } from '../Tools/babylon.math.js';


export default function Camera(name, position, scene) {
	this.name = name;
	this.id = name;
	this.position = position;

	this._scene = scene;

	scene.cameras.push(this);

	if (!scene.activeCamera) {
		scene.activeCamera = this;
	}
};

// Members
Camera.prototype.fov = 0.8;
Camera.prototype.minZ = 0.1;
Camera.prototype.maxZ = 1000.0;
Camera.prototype.inertia = 0.9;

// Methods
Camera.prototype.attachControl = function (canvas) {
};

Camera.prototype.detachControl = function (canvas) {
};

Camera.prototype._update = function () {
};

Camera.prototype.getViewMatrix = function () {
	return Matrix.Identity();
};

Camera.prototype.getProjectionMatrix = function () {
	return new Matrix.PerspectiveFovLH(this.fov, this._scene.getEngine().getAspectRatio(), this.minZ, this.maxZ);
};