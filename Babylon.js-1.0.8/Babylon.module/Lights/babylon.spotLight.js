import Light from './babylon.light.js';
import { Color3 } from '../Tools/babylon.math.js';

export default function SpotLight(name, position, direction, angle, exponent, scene) {
	this.name = name;
	this.id = name;
	this.position = position;
	this.direction = direction;
	this.angle = angle;
	this.exponent = exponent;
	this.diffuse = new Color3(1.0, 1.0, 1.0);
	this.specular = new Color3(1.0, 1.0, 1.0);
	this._scene = scene;

	scene.lights.push(this);

	// Animations
	this.animations = [];
};

SpotLight.prototype = Object.create(Light.prototype);
