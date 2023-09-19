var VecType = Float32Array;

function setDefaultType(ctor) {
    VecType = ctor;
}

function create(x, y, z) {
  var dst = new VecType(3);
  if (x) {
    dst[0] = x;
  }
  if (y) {
    dst[1] = y;
  }
  if (z) {
    dst[2] = z;
  }
  return dst;
}

function add(a, b, dst) {
  dst = dst || new VecType(3);

  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];

  return dst;
}

function subtract(a, b, dst) {
  dst = dst || new VecType(3);

  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];

  return dst;
}

function lerp(a, b, t, dst) {
  dst = dst || new VecType(3);

  dst[0] = (1 - t) * a[0] + t * b[0];
  dst[1] = (1 - t) * a[1] + t * b[1];
  dst[2] = (1 - t) * a[2] + t * b[2];

  return dst;
}

function mulScalar(v, k, dst) {
  dst = dst || new VecType(3);

  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;

  return dst;
}

function divScalar(v, k, dst) {
  dst = dst || new VecType(3);

  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;

  return dst;
}

function cross(a, b, dst) {
  dst = dst || new VecType(3);

  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = a[2] * b[0] - a[0] * b[2];
  dst[2] = a[0] * b[1] - a[1] * b[0];

  return dst;
}

function dot(a, b) {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}

function length(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function lengthSq(v) {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
}

function normalize(a, dst) {
  dst = dst || new VecType(3);

  var lenSq = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
  var len = Math.sqrt(lenSq);
  if (len > 0.00001) {
    dst[0] = a[0] / len;
    dst[1] = a[1] / len;
    dst[2] = a[2] / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }

  return dst;
}

function negate(v, dst) {
  dst = dst || new VecType(3);

  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];

  return dst;
}

function copy(v, dst) {
  dst = dst || new VecType(3);

  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];

  return dst;
}

function multiply(a, b, dst) {
  dst = dst || new VecType(3);

  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];

  return dst;
}

function divide(a, b, dst) {
  dst = dst || new VecType(3);

  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];

  return dst;
}

export default {
	add,
	copy,
	create,
	cross,
	divide,
	divScalar,
	dot,
	lerp,
	length,
	lengthSq,
	mulScalar,
	multiply,
	negate,
	normalize,
	setDefaultType,
	subtract,
}