var BABYLON = BABYLON || {};


(function () {
	BABYLON.ArcRotateCamera = function (name, alpha, beta, radius, target, scene) {
		this.name = name;
		this.id = name;
		this.alpha = alpha;
		this.beta = beta;
		this.radius = radius;
		this.target = target;

		this._scene = scene;

		scene.cameras.push(this);

		if (!scene.activeCamera) {
			scene.activeCamera = this;
		}

		this.getViewMatrix();

		// Animations
		this.animations = [];
	};

	BABYLON.ArcRotateCamera.prototype = Object.create(BABYLON.Camera.prototype);

	BABYLON.ArcRotateCamera.prototype.setPosition = function(position) {
		var radiusv3 = position.subtract(this.target.position ? this.target.position : this.target);
		this.radius = radiusv3.length();

		this.alpha = Math.atan(radiusv3.z / radiusv3.x);
		this.beta = Math.acos(radiusv3.y / this.radius);
	};
})();