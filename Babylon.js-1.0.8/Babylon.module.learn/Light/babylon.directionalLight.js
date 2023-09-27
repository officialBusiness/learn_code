import Light from './babylon.light.js';
import { Color3 } from '../Tools/babylon.math.js';

export default function DirectionalLight(name, direction, scene) {
	this.name = name;
	this.id = name;
	this.direction = direction;
	this.diffuse = new Color3(1.0, 1.0, 1.0);
	this.specular = new Color3(1.0, 1.0, 1.0);
	this._scene = scene;

	scene.lights.push(this);
	
	// Animations
	this.animations = [];
};

DirectionalLight.prototype = Object.create(Light.prototype);