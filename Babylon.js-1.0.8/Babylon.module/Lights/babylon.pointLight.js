import Light from './babylon.light.js';
import { Color3 } from '../Tools/babylon.math.js';

export default function PointLight(name, position, scene) {
	this.name = name;
	this.id = name;
	this.position = position;
	this.diffuse = new Color3(1.0, 1.0, 1.0);
	this.specular = new Color3(1.0, 1.0, 1.0);
	this._scene = scene;

	scene.lights.push(this);

	// Animations
	this.animations = [];
};

PointLight.prototype = Object.create(Light.prototype);