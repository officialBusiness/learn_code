import typedArrays from './typedarrays.js';

var gl = undefined;  // eslint-disable-line

function setBufferFromTypedArray(gl, type, buffer, array, drawType) {
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, array, drawType || gl.STATIC_DRAW);
}

function createBufferFromTypedArray(gl, typedArray, type, drawType) {
  if (typedArray instanceof WebGLBuffer) {
    return typedArray;
  }
  type = type || gl.ARRAY_BUFFER;
  var buffer = gl.createBuffer();
  setBufferFromTypedArray(gl, type, buffer, typedArray, drawType);
  return buffer;
}

function isIndices(name) {
  return name === "indices";
}

function getNormalizationForTypedArray(typedArray) {
  if (typedArray instanceof Int8Array)    { return true; }  // eslint-disable-line
  if (typedArray instanceof Uint8Array)   { return true; }  // eslint-disable-line
  return false;
}

function guessNumComponentsFromName(name, length) {
  var numComponents;
  if (name.indexOf("coord") >= 0) {
    numComponents = 2;
  } else if (name.indexOf("color") >= 0) {
    numComponents = 4;
  } else {
    numComponents = 3;  // position, normals, indices ...
  }

  if (length % numComponents > 0) {
    throw "can not guess numComponents. You should specify it.";
  }

  return numComponents;
}

function makeTypedArray(array, name) {
  if (typedArrays.isArrayBuffer(array)) {
    return array;
  }

  if (typedArrays.isArrayBuffer(array.data)) {
    return array.data;
  }

  if (Array.isArray(array)) {
    array = {
      data: array,
    };
  }

  var Type = array.type;
  if (!Type) {
    if (name === "indices") {
      Type = Uint16Array;
    } else {
      Type = Float32Array;
    }
  }
  return new Type(array.data);
}

function createAttribsFromArrays(gl, arrays) {
  var attribs = {};
  Object.keys(arrays).forEach(function(arrayName) {
    if (!isIndices(arrayName)) {
      var array = arrays[arrayName];
      var attribName = array.attrib || array.name || array.attribName || arrayName;
      var typedArray = makeTypedArray(array, arrayName);

      attribs[attribName] = {
        buffer:        createBufferFromTypedArray(gl, typedArray, undefined, array.drawType),
        numComponents: array.numComponents || array.size || guessNumComponentsFromName(arrayName),
        type:          typedArrays.getGLTypeForTypedArray(typedArray),
        normalize:     array.normalize !== undefined ? array.normalize : getNormalizationForTypedArray(typedArray),
        stride:        array.stride || 0,
        offset:        array.offset || 0,
        drawType:      array.drawType,
      };
    }
  });
  return attribs;
}

function setAttribInfoBufferFromArray(gl, attribInfo, array, offset) {
  array = makeTypedArray(array);
  if (offset) {
    gl.bindBuffer(gl.ARRAY_BUFFER, attribInfo.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, array);
  } else {
    setBufferFromTypedArray(gl, gl.ARRAY_BUFFER, attribInfo.buffer, array, attribInfo.drawType);
  }
}

var getNumElementsFromNonIndexedArrays = (function() {
  var positionKeys = ['position', 'positions', 'a_position'];

  return function getNumElementsFromNonIndexedArrays(arrays) {
    var key;
    for (var ii = 0; ii < positionKeys.length; ++ii) {
      key = positionKeys[ii];
      if (key in arrays) {
        break;
      }
    }
    if (ii === positionKeys.length) {
      key = Object.keys(arrays)[0];
    }
    var array = arrays[key];
    var length = array.length || array.data.length;
    var numComponents = array.numComponents || guessNumComponentsFromName(key, length);
    var numElements = length / numComponents;
    if (length % numComponents > 0) {
      throw "numComponents " + numComponents + " not correct for length " + length;
    }
    return numElements;
  };
}());

function createBufferInfoFromArrays(gl, arrays) {
  var bufferInfo = {
    attribs: createAttribsFromArrays(gl, arrays),
  };
  var indices = arrays.indices;
  if (indices) {
    indices = makeTypedArray(indices, "indices");
    bufferInfo.indices = createBufferFromTypedArray(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
    bufferInfo.numElements = indices.length;
    bufferInfo.elementType = (indices instanceof Uint32Array) ?  gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  } else {
    bufferInfo.numElements = getNumElementsFromNonIndexedArrays(arrays);
  }

  return bufferInfo;
}

function createBufferFromArray(gl, array, arrayName) {
  var type = arrayName === "indices" ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
  var typedArray = makeTypedArray(array, arrayName);
  return createBufferFromTypedArray(gl, typedArray, type);
}

function createBuffersFromArrays(gl, arrays) {
  var buffers = { };
  Object.keys(arrays).forEach(function(key) {
    buffers[key] = createBufferFromArray(gl, arrays[key], key);
  });

  return buffers;
}

export default {
	createAttribsFromArrays,
	createBuffersFromArrays,
	createBufferFromArray,
	createBufferFromTypedArray,
	createBufferInfoFromArrays,
	setAttribInfoBufferFromArray,

}