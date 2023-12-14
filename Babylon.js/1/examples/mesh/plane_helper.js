
export function createMathPlane(
	name,
	a, b, c, d,
	ltX, ltY, rtX, rtY,
	lbX, lbY, rbX, rbY,
	scene
){
	const mathPlane = new BABYLON.Mesh(name, [3, 3, 2], scene);

	// aX + bY + cZ + d = 0;
	mathPlane.a = a;
	mathPlane.b = b;
	mathPlane.c = c;
	mathPlane.d = d;

	mathPlane.ltX = ltX;
	mathPlane.ltY = ltY;
	mathPlane.rtX = rtX;
	mathPlane.rtY = rtY;
	mathPlane.lbX = lbX;
	mathPlane.lbY = lbY;
	mathPlane.rbX = rbX;
	mathPlane.rbY = rbY;

	const vertices = getMathPlaneVertices( mathPlane );

	// Indices
	const indices = [
		0, 1, 2,
		0, 2, 3,
	];

	mathPlane.setVertices(vertices, 1, true);
	mathPlane.setIndices(indices);

	return mathPlane;
}

export function updateMathPlane( mathPlane ){

	const vertices = getMathPlaneVertices( mathPlane );

	mathPlane.updateVertices(vertices);
}

function getMathPlaneVertices(mathPlane){
	const
		vertices = [],
		{
			a, b, c, d,
			ltX, ltY, rtX, rtY,
			lbX, lbY, rbX, rbY,
		} = mathPlane;

	// Vertices
	vertices.push(
		lbX, lbY, (-d - a * lbX - b * lbY) / c,
		a, b, c,
		0, 0
	);
	vertices.push(
		rbX, rbY, (-d - a * rbX - b * rbY) / c,
		a, b, c,
		0, 0
	);
	vertices.push(
		rtX, rtY, (-d - a * rtX - b * rtY) / c,
		a, b, c,
		0, 0
	);
	vertices.push(
		ltX, ltY, (-d - a * ltX - b * ltY) / c,
		a, b, c,
		0, 0
	);

	return vertices;
}
