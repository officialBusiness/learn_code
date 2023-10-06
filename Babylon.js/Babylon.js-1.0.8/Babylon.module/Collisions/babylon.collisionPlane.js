import { Vector3 } from '../Tools/babylon.math.js';


export default function CollisionPlane(origin, normal) {
	this.normal = normal;
	this.origin = origin;

	normal.normalize();

	this.equation = [];
	this.equation[0] = normal.x;
	this.equation[1] = normal.y;
	this.equation[2] = normal.z;
	this.equation[3] = -(normal.x * origin.x + normal.y * origin.y + normal.z * origin.z);
};

// Methods
CollisionPlane.prototype.isFrontFacingTo = function (direction, epsilon) {
	var dot = Vector3.Dot(this.normal, direction);

	return (dot <= epsilon);
};

CollisionPlane.prototype.signedDistanceTo = function (point) {
	return Vector3.Dot(point, this.normal) + this.equation[3];
};

// Statics
CollisionPlane.CreateFromPoints = function (p1, p2, p3) {
	var normal = Vector3.Cross(p2.subtract(p1), p3.subtract(p1));

	return new CollisionPlane(p1, normal);
};