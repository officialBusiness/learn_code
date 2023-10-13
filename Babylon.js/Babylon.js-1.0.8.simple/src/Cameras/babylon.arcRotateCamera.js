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

	BABYLON.ArcRotateCamera.prototype.getViewMatrix = function () {
		// Compute
		if (this.beta > Math.PI)
			this.beta = Math.PI;

		if (this.beta <= 0)
			this.beta = 0.01;

		var cosa = Math.cos(this.alpha);
		var sina = Math.sin(this.alpha);
		var cosb = Math.cos(this.beta);
		var sinb = Math.sin(this.beta);

		this.position = this.target.add(new BABYLON.Vector3(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb));
		return new BABYLON.Matrix.LookAtLH(this.position, this.target, BABYLON.Vector3.Up());
	};
})();