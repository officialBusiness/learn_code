
export default function Light(name, scene) {
	this.name = name;
	this.id = name;

	this._scene = scene;

	scene.lights.push(this);
};

// Members
Light.prototype.intensity = 1.0;
Light.prototype.isEnabled = true;
