import programs from './programs.js';

function drawBufferInfo(gl, type, bufferInfo, count, offset) {
  var indices = bufferInfo.indices;
  var numElements = count === undefined ? bufferInfo.numElements : count;
  offset = offset === undefined ? 0 : offset;
  if (indices) {
    gl.drawElements(type, numElements, bufferInfo.elementType === undefined ? gl.UNSIGNED_SHORT : bufferInfo.elementType, offset);
  } else {
    gl.drawArrays(type, offset, numElements);
  }
}

function drawObjectList(gl, objectsToDraw) {
  var lastUsedProgramInfo = null;
  var lastUsedBufferInfo = null;

  objectsToDraw.forEach(function(object) {
    if (object.active === false) {
      return;
    }

    var programInfo = object.programInfo;
    var bufferInfo = object.bufferInfo;
    var bindBuffers = false;

    if (programInfo !== lastUsedProgramInfo) {
      lastUsedProgramInfo = programInfo;
      gl.useProgram(programInfo.program);

      // We have to rebind buffers when changing programs because we
      // only bind buffers the program uses. So if 2 programs use the same
      // bufferInfo but the 1st one uses only positions the when the
      // we switch to the 2nd one some of the attributes will not be on.
      bindBuffers = true;
    }

    // Setup all the needed attributes.
    if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
      lastUsedBufferInfo = bufferInfo;
      programs.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    }

    // Set the uniforms.
    programs.setUniforms(programInfo, object.uniforms);

    // Draw
    drawBufferInfo(gl, object.type || gl.TRIANGLES, bufferInfo, object.count, object.offset);
  });
}

export default {
	drawBufferInfo,
	drawObjectList
}