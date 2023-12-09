import attributes from './attributes.js';
import textures from './textures.js';

var gl = undefined;  // eslint-disable-line

function setDefaults(newDefaults) {
  attributes.setDefaults_(newDefaults);  // eslint-disable-line
  textures.setDefaults_(newDefaults);  // eslint-disable-line
}

function create3DContext(canvas, opt_attribs) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], opt_attribs);
    } catch(e) {}  // eslint-disable-line
    if (context) {
      break;
    }
  }
  return context;
}

function getWebGLContext(canvas, opt_attribs) {
  var gl = create3DContext(canvas, opt_attribs);
  return gl;
}

function resizeCanvasToDisplaySize(canvas, multiplier) {
  multiplier = multiplier || 1;
  multiplier = Math.max(1, multiplier);
  var width  = canvas.clientWidth * multiplier | 0;
  var height = canvas.clientHeight * multiplier | 0;
  if (canvas.width !== width ||
      canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
}

var api = {
  "getWebGLContext": getWebGLContext,
  "resizeCanvasToDisplaySize": resizeCanvasToDisplaySize,
  "setDefaults": setDefaults,
};

export default api;