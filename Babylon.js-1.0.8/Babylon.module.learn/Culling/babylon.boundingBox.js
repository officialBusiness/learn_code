import { Vector3 } from '../Tools/babylon.math.js';


export default function BoundingBox(vertices, stride, start, count) {
	this.minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
	this.maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

	for (var index = start; index < start + count; index += stride) {
		var current = new Vector3(vertices[index], vertices[index + 1], vertices[index + 2]);

		this.minimum = Vector3.Minimize(current, this.minimum);
		this.maximum = Vector3.Maximize(current, this.maximum);
	}
	
	// Bounding vectors
	this.vectors = [];

	this.vectors.push(this.minimum.clone());
	this.vectors.push(this.maximum.clone());

	this.vectors.push(this.minimum.clone());
	this.vectors[2].x = this.maximum.x;

	this.vectors.push(this.minimum.clone());
	this.vectors[3].y = this.maximum.y;

	this.vectors.push(this.minimum.clone());
	this.vectors[4].z = this.maximum.z;

	this.vectors.push(this.maximum.clone());
	this.vectors[5].z = this.minimum.z;

	this.vectors.push(this.maximum.clone());
	this.vectors[6].x = this.minimum.x;

	this.vectors.push(this.maximum.clone());
	this.vectors[7].y = this.minimum.y;
	
	// OBB
	this.center = this.maximum.add(this.minimum).scale(0.5);
	this.extends = this.maximum.subtract(this.minimum).scale(0.5);
	this.directions = [Vector3.Zero(), Vector3.Zero(), Vector3.Zero()];
};

// Methods
BoundingBox.prototype._update = function (world) {
	this.vectorsWorld = [];
	this.minimumWorld = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
	this.maximumWorld = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

	for (var index = 0; index < this.vectors.length; index++) {
		var v = Vector3.TransformCoordinates(this.vectors[index], world);
		this.vectorsWorld.push(v);

		if (v.x < this.minimumWorld.x)
			this.minimumWorld.x = v.x;
		if (v.y < this.minimumWorld.y)
			this.minimumWorld.y = v.y;
		if (v.z < this.minimumWorld.z)
			this.minimumWorld.z = v.z;

		if (v.x > this.maximumWorld.x)
			this.maximumWorld.x = v.x;
		if (v.y > this.maximumWorld.y)
			this.maximumWorld.y = v.y;
		if (v.z > this.maximumWorld.z)
			this.maximumWorld.z = v.z;
	}

	// OBB
	this.center = this.maximumWorld.add(this.minimumWorld).scale(0.5);
	this.directions[0] = Vector3.FromArray(world.m, 0);
	this.directions[1] = Vector3.FromArray(world.m, 4);
	this.directions[2] = Vector3.FromArray(world.m, 8);
};

BoundingBox.prototype.isInFrustrum = function (frustumPlanes) {
	for (var p = 0; p < 6; p++) {
		var inCount = 8;

		for (var i = 0; i < 8; i++) {
			if (frustumPlanes[p].dotCoordinate(this.vectorsWorld[i]) < 0) {
				--inCount;
			} else {
				break;
			}
		}
		if (inCount == 0)
			return false;
	}
	return true;
};

BoundingBox.prototype.intersectsPoint = function (point) {
	if (this.maximumWorld.x < point.x || this.minimumWorld.x > point.x)
		return false;

	if (this.maximumWorld.y < point.y || this.minimumWorld.y > point.y)
		return false;

	if (this.maximumWorld.z < point.z || this.minimumWorld.z > point.z)
		return false;

	return true;
};

BoundingBox.prototype.intersectsSphere = function (sphere) {    
	var vector = Vector3.Clamp(sphere.centerWorld, this.minimumWorld, this.maximumWorld);
	var num = Vector3.DistanceSquared(sphere.centerWorld, vector);
	return (num <= (sphere.radiusWorld * sphere.radiusWorld));
};

// Statics
BoundingBox.intersects = function (box0, box1) {
	if (box0.maximumWorld.x < box1.minimumWorld.x || box0.minimumWorld.x > box1.maximumWorld.x)
		return false;

	if (box0.maximumWorld.y < box1.minimumWorld.y || box0.minimumWorld.y > box1.maximumWorld.y)
		return false;

	if (box0.maximumWorld.z < box1.minimumWorld.z || box0.minimumWorld.z > box1.maximumWorld.z)
		return false;

	return true;
};