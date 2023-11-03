var BABYLON = BABYLON || {};

(function () {
	////////////////////////////////// Frustum //////////////////////////////////
	BABYLON.Frustum = {};

	// Statics
	BABYLON.Frustum.GetPlanes = function (transform) {
		var frustumPlanes = [];
		frustumPlanes.push(new BABYLON.Plane( // near
			transform.m[3] + transform.m[2],
			transform.m[7] + transform.m[6],
			transform.m[10] + transform.m[10],
			transform.m[15] + transform.m[14]));
		frustumPlanes[0].normalize();

		frustumPlanes.push(new BABYLON.Plane( // far
			transform.m[3] - transform.m[2],
			transform.m[7] - transform.m[6],
			transform.m[11] - transform.m[10],
			transform.m[15] - transform.m[14]));
		frustumPlanes[1].normalize();

		frustumPlanes.push(new BABYLON.Plane( // left
			transform.m[3] + transform.m[0],
			transform.m[7] + transform.m[4],
			transform.m[11] + transform.m[8],
			transform.m[15] + transform.m[12]));
		frustumPlanes[2].normalize();

		frustumPlanes.push(new BABYLON.Plane( // right
			transform.m[3] - transform.m[0],
			transform.m[7] - transform.m[4],
			transform.m[11] - transform.m[8],
			transform.m[15] - transform.m[12]));
		frustumPlanes[3].normalize();

		frustumPlanes.push(new BABYLON.Plane( // top
			transform.m[3] - transform.m[1],
			transform.m[7] - transform.m[5],
			transform.m[11] - transform.m[9],
			transform.m[15] - transform.m[13]));
		frustumPlanes[4].normalize();

		frustumPlanes.push(new BABYLON.Plane( // bottom
			transform.m[3] + transform.m[1],
			transform.m[7] + transform.m[5],
			transform.m[11] + transform.m[9],
			transform.m[15] + transform.m[13]));
		frustumPlanes[5].normalize();

		return frustumPlanes;
	};
})();