import { Vector3 } from '../Tools/babylon.math.js';

export default function BoundingSphere(vertices, stride, start, count) {
	var minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
	var maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

	for (var index = start; index < start + count; index += stride) {
		var current = new Vector3(vertices[index], vertices[index + 1], vertices[index + 2]);

		minimum = Vector3.Minimize(current, minimum);
		maximum = Vector3.Maximize(current, maximum);
	}
	
	var distance = Vector3.Distance(minimum, maximum);
	
	this.center = Vector3.Lerp(minimum, maximum, 0.5);;
	this.radius = distance * 0.5;
};

// Methods
BoundingSphere.prototype._update = function (world, scale) {
	this.centerWorld = Vector3.TransformCoordinates(this.center, world);
	this.radiusWorld = this.radius * scale;
};

BoundingSphere.prototype.isInFrustrum = function (frustumPlanes) {
	for (var i = 0; i < 6; i++) {
		if (frustumPlanes[i].dotCoordinate(this.centerWorld) <= -this.radiusWorld)
			return false;
	}

	return true;
};

BoundingSphere.prototype.intersectsPoint = function(point) {
	var x = this.centerWorld.x - point.x;
	var y = this.centerWorld.y - point.y;
	var z = this.centerWorld.z - point.z;

	var distance = Math.sqrt((x * x) + (y * y) + (z * z));

	if (this.radiusWorld < distance)
		return false;

	return true;
};

// Statics
BoundingSphere.intersects = function (sphere0, sphere1) {
	var x = sphere0.centerWorld.x - sphere1.centerWorld.x;
	var y = sphere0.centerWorld.y - sphere1.centerWorld.y;
	var z = sphere0.centerWorld.z - sphere1.centerWorld.z;

	var distance = Math.sqrt((x * x) + (y * y) + (z * z));

	if (sphere0.radiusWorld + sphere1.radiusWorld < distance)
		return false;

	return true;
};