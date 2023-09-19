import typedArrays from './typedarrays.js';
import utils from './utils.js';

var gl = undefined;
const defaults = {
  textureColor: new Uint8Array([255, 0, 0, 255]),
  textureOptions: {},
};
var isArrayBuffer = typedArrays.isArrayBuffer;

/* PixelFormat */
var ALPHA                          = 0x1906;
var RGB                            = 0x1907;
var RGBA                           = 0x1908;
var LUMINANCE                      = 0x1909;
var LUMINANCE_ALPHA                = 0x190A;

/* TextureWrapMode */
var REPEAT                         = 0x2901;  // eslint-disable-line
var MIRRORED_REPEAT                = 0x8370;  // eslint-disable-line

/* TextureMagFilter */
var NEAREST                        = 0x2600;  // eslint-disable-line

/* TextureMinFilter */
var NEAREST_MIPMAP_NEAREST         = 0x2700;  // eslint-disable-line
var LINEAR_MIPMAP_NEAREST          = 0x2701;  // eslint-disable-line
var NEAREST_MIPMAP_LINEAR          = 0x2702;  // eslint-disable-line
var LINEAR_MIPMAP_LINEAR           = 0x2703;  // eslint-disable-line


function setDefaultTextureColor(color) {
  defaults.textureColor = new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]);
}

var invalidDefaultKeysRE = /^textureColor$/;
function validDefaultKeys(key) {
  return !invalidDefaultKeysRE.test(key);
}

function setDefaults(newDefaults) {
  if (newDefaults.textureColor) {
    setDefaultTextureColor(newDefaults.textureColor);
  }
  Object.keys(newDefaults).filter(validDefaultKeys).forEach(function(key) {
    defaults[key] = newDefaults[key];
  });
}

var glEnumToString = (function() {
  var enums;

  function init(gl) {
    if (!enums) {
      enums = {};
      Object.keys(gl).forEach(function(key) {
        if (typeof gl[key] === 'number') {
          enums[gl[key]] = key;
        }
      });
    }
  }

  return function glEnumToString(gl, value) {
    init();
    return enums[value] || ("0x" + value.toString(16));
  };
}());

var lastPackState = {};

function savePackState(gl, options) {
  if (options.colorspaceConversion !== undefined) {
    lastPackState.colorSpaceConversion = gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL);
  }
  if (options.premultiplyAlpha !== undefined) {
    lastPackState.premultiplyAlpha = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
  }
  if (options.flipY !== undefined) {
    lastPackState.flipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  }
}

function restorePackState(gl, options) {
  if (options.colorspaceConversion !== undefined) {
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, lastPackState.colorSpaceConversion);
  }
  if (options.premultiplyAlpha !== undefined) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, lastPackState.premultiplyAlpha);
  }
  if (options.flipY !== undefined) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, lastPackState.flipY);
  }
}

function setTextureParameters(gl, tex, options) {
  var target = options.target || gl.TEXTURE_2D;
  gl.bindTexture(target, tex);
  if (options.min) {
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min);
  }
  if (options.mag) {
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag);
  }
  if (options.wrap) {
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrap);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrap);
  }
  if (options.wrapS) {
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS);
  }
  if (options.wrapT) {
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT);
  }
}

function make1Pixel(color) {
  color = color || defaults.textureColor;
  if (isArrayBuffer(color)) {
    return color;
  }
  return new Uint8Array([color[0] * 255, color[1] * 255, color[2] * 255, color[3] * 255]);
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

function setTextureFilteringForSize(gl, tex, options, width, height) {
  options = options || defaults.textureOptions;
  var target = options.target || gl.TEXTURE_2D;
  width = width || options.width;
  height = height || options.height;
  gl.bindTexture(target, tex);
  if (!isPowerOf2(width) || !isPowerOf2(height)) {
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  } else {
    gl.generateMipmap(target);
  }
}

function getCubeFaceOrder(gl, options) {
  options = options || {};
  return options.cubeFaceOrder || [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    ];
}

function getCubeFacesWithNdx(gl, options) {
  var faces = getCubeFaceOrder(gl, options);
  // work around bug in NVidia drivers. We have to upload the first face first else the driver crashes :(
  var facesWithNdx = faces.map(function(face, ndx) {
    return { face: face, ndx: ndx };
  });
  facesWithNdx.sort(function(a, b) {
    return a.face - b.face;
  });
  return facesWithNdx;
}

var setTextureFromElement = function() {
  var ctx = document.createElement("canvas").getContext("2d");
  return function setTextureFromElement(gl, tex, element, options) {
    options = options || defaults.textureOptions;
    var target = options.target || gl.TEXTURE_2D;
    var width = element.width;
    var height = element.height;
    var format = options.format || gl.RGBA;
    var type = options.type || gl.UNSIGNED_BYTE;
    savePackState(gl, options);
    gl.bindTexture(target, tex);
    if (target === gl.TEXTURE_CUBE_MAP) {
      // guess the parts
      var imgWidth  = element.width;
      var imgHeight = element.height;
      var size;
      var slices;
      if (imgWidth / 6 === imgHeight) {
        // It's 6x1
        size = imgHeight;
        slices = [0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0];
      } else if (imgHeight / 6 === imgWidth) {
        // It's 1x6
        size = imgWidth;
        slices = [0, 0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5];
      } else if (imgWidth / 3 === imgHeight / 2) {
        // It's 3x2
        size = imgWidth / 3;
        slices = [0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 2, 1];
      } else if (imgWidth / 2 === imgHeight / 3) {
        // It's 2x3
        size = imgWidth / 2;
        slices = [0, 0, 1, 0, 0, 1, 1, 1, 0, 2, 1, 2];
      } else {
        throw "can't figure out cube map from element: " + (element.src ? element.src : element.nodeName);
      }
      ctx.canvas.width = size;
      ctx.canvas.height = size;
      width = size;
      height = size;
      getCubeFacesWithNdx(gl, options).forEach(function(f) {
        var xOffset = slices[f.ndx * 2 + 0] * size;
        var yOffset = slices[f.ndx * 2 + 1] * size;
        ctx.drawImage(element, xOffset, yOffset, size, size, 0, 0, size, size);
        gl.texImage2D(f.face, 0, format, format, type, ctx.canvas);
      });
      // Free up the canvas memory
      ctx.canvas.width = 1;
      ctx.canvas.height = 1;
    } else {
      gl.texImage2D(target, 0, format, format, type, element);
    }
    restorePackState(gl, options);
    if (options.auto !== false) {
      setTextureFilteringForSize(gl, tex, options, width, height);
    }
    setTextureParameters(gl, tex, options);
  };
}();

function noop() {
}

function loadImage(url, crossOrigin, callback) {
  callback = callback || noop;
  var img = new Image();
  crossOrigin = crossOrigin !== undefined ? crossOrigin : defaults.crossOrigin;
  if (crossOrigin !== undefined) {
    img.crossOrigin = crossOrigin;
  }
  img.onerror = function() {
    var msg = "couldn't load image: " + url;
    error(msg);
    callback(msg, img);
  };
  img.onload = function() {
    callback(null, img);
  };
  img.src = url;
  return img;
}

function setTextureTo1PixelColor(gl, tex, options) {
  options = options || defaults.textureOptions;
  var target = options.target || gl.TEXTURE_2D;
  gl.bindTexture(target, tex);
  if (options.color === false) {
    return;
  }
  // Assume it's a URL
  // Put 1x1 pixels in texture. That makes it renderable immediately regardless of filtering.
  var color = make1Pixel(options.color);
  if (target === gl.TEXTURE_CUBE_MAP) {
    for (var ii = 0; ii < 6; ++ii) {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
    }
  } else {
    gl.texImage2D(target, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, color);
  }
}

function loadTextureFromUrl(gl, tex, options, callback) {
  callback = callback || noop;
  options = options || defaults.textureOptions;
  // setTextureTo1PixelColor(gl, tex, options);
  // Because it's async we need to copy the options.
  // options = utils.shallowCopy(options);
  var img = loadImage(options.src, options.crossOrigin, function(err, img) {
    if (err) {
      callback(err, tex, img);
    } else {
      setTextureFromElement(gl, tex, img, options);
      callback(null, tex, img);
    }
  });
  return img;
}  

function loadCubemapFromUrls(gl, tex, options, callback) {
  callback = callback || noop;
  var urls = options.src;
  if (urls.length !== 6) {
    throw "there must be 6 urls for a cubemap";
  }
  var format = options.format || gl.RGBA;
  var type = options.type || gl.UNSIGNED_BYTE;
  var target = options.target || gl.TEXTURE_2D;
  if (target !== gl.TEXTURE_CUBE_MAP) {
    throw "target must be TEXTURE_CUBE_MAP";
  }
  setTextureTo1PixelColor(gl, tex, options);
  // Because it's async we need to copy the options.
  options = utils.shallowCopy(options);
  var numToLoad = 6;
  var errors = [];
  var imgs;
  var faces = getCubeFaceOrder(gl, options);

  function uploadImg(faceTarget) {
    return function(err, img) {
      --numToLoad;
      if (err) {
        errors.push(err);
      } else {
        if (img.width !== img.height) {
          errors.push("cubemap face img is not a square: " + img.src);
        } else {
          savePackState(gl, options);
          gl.bindTexture(target, tex);

          // So assuming this is the first image we now have one face that's img sized
          // and 5 faces that are 1x1 pixel so size the other faces
          if (numToLoad === 5) {
            // use the default order
            getCubeFaceOrder(gl).forEach(function(otherTarget) {
              // Should we re-use the same face or a color?
              gl.texImage2D(otherTarget, 0, format, format, type, img);
            });
          } else {
            gl.texImage2D(faceTarget, 0, format, format, type, img);
          }

          restorePackState(gl, options);
          gl.generateMipmap(target);
        }
      }

      if (numToLoad === 0) {
        callback(errors.length ? errors : undefined, imgs, tex);
      }
    };
  }

  imgs = urls.map(function(url, ndx) {
    return loadImage(url, options.crossOrigin, uploadImg(faces[ndx]));
  });
}

function getNumComponentsForFormat(format) {
  switch (format) {
    case ALPHA:
    case LUMINANCE:
      return 1;
    case LUMINANCE_ALPHA:
      return 2;
    case RGB:
      return 3;
    case RGBA:
      return 4;
    default:
      throw "unknown type: " + format;
  }
}

function getTextureTypeForArrayType(gl, src) {
  if (isArrayBuffer(src)) {
    return typedArrays.getGLTypeForTypedArray(src);
  }
  return gl.UNSIGNED_BYTE;
}

function setTextureFromArray(gl, tex, src, options) {
  options = options || defaults.textureOptions;
  var target = options.target || gl.TEXTURE_2D;
  gl.bindTexture(target, tex);
  var width = options.width;
  var height = options.height;
  var format = options.format || gl.RGBA;
  var type = options.type || getTextureTypeForArrayType(gl, src);
  var numComponents = getNumComponentsForFormat(format);
  var numElements = src.length / numComponents;
  if (numElements % 1) {
    throw "length wrong size for format: " + glEnumToString(gl, format);
  }
  if (!width && !height) {
    var size = Math.sqrt(numElements / (target === gl.TEXTURE_CUBE_MAP ? 6 : 1));
    if (size % 1 === 0) {
      width = size;
      height = size;
    } else {
      width = numElements;
      height = 1;
    }
  } else if (!height) {
    height = numElements / width;
    if (height % 1) {
      throw "can't guess height";
    }
  } else if (!width) {
    width = numElements / height;
    if (width % 1) {
      throw "can't guess width";
    }
  }
  if (!isArrayBuffer(src)) {
    var Type = typedArrays.getTypedArrayTypeForGLType(type);
    src = new Type(src);
  }
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, options.unpackAlignment || 1);
  savePackState(gl, options);
  if (target === gl.TEXTURE_CUBE_MAP) {
    var faceSize = numElements / 6 * numComponents;
    getCubeFacesWithNdx(gl, options).forEach(function(f) {
      var offset = faceSize * f.ndx;
      var data = src.subarray(offset, offset + faceSize);
      gl.texImage2D(f.face, 0, format, width, height, 0, format, type, data);
    });
  } else {
    gl.texImage2D(target, 0, format, width, height, 0, format, type, src);
  }
  restorePackState(gl, options);
  return {
    width: width,
    height: height,
  };
}

function setEmptyTexture(gl, tex, options) {
  var target = options.target || gl.TEXTURE_2D;
  gl.bindTexture(target, tex);
  var format = options.format || gl.RGBA;
  var type = options.type || gl.UNSIGNED_BYTE;
  savePackState(gl, options);
  if (target === gl.TEXTURE_CUBE_MAP) {
    for (var ii = 0; ii < 6; ++ii) {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, format, options.width, options.height, 0, format, type, null);
    }
  } else {
    gl.texImage2D(target, 0, format, options.width, options.height, 0, format, type, null);
  }
}

function createTexture(gl, options, callback) {
  callback = callback || noop;
  options = options || defaults.textureOptions;
  var tex = gl.createTexture();
  var target = options.target || gl.TEXTURE_2D;
  var width  = options.width  || 1;
  var height = options.height || 1;
  gl.bindTexture(target, tex);
  if (target === gl.TEXTURE_CUBE_MAP) {
    // this should have been the default for CUBEMAPS :(
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  var src = options.src;
  if (src) {
    if (typeof src === "function") {
      src = src(gl, options);
    }
    if (typeof (src) === "string") {
      loadTextureFromUrl(gl, tex, options, callback);
    } else if (isArrayBuffer(src) ||
               (Array.isArray(src) && (
                    typeof src[0] === 'number' ||
                    Array.isArray(src[0]) ||
                    isArrayBuffer(src[0]))
               )
              ) {
      var dimensions = setTextureFromArray(gl, tex, src, options);
      width  = dimensions.width;
      height = dimensions.height;
    } else if (Array.isArray(src) && typeof (src[0]) === 'string') {
      loadCubemapFromUrls(gl, tex, options, callback);
    } else if (src instanceof HTMLElement) {
      setTextureFromElement(gl, tex, src, options);
      width  = src.width;
      height = src.height;
    } else {
      throw "unsupported src type";
    }
  } else {
    setEmptyTexture(gl, tex, options);
  }
  if (options.auto !== false) {
    setTextureFilteringForSize(gl, tex, options, width, height);
  }
  setTextureParameters(gl, tex, options);
  return tex;
}

function resizeTexture(gl, tex, options, width, height) {
  width = width || options.width;
  height = height || options.height;
  var target = options.target || gl.TEXTURE_2D;
  gl.bindTexture(target, tex);
  var format = options.format || gl.RGBA;
  var type;
  var src = options.src;
  if (!src) {
    type = options.type || gl.UNSIGNED_BYTE;
  } else if (isArrayBuffer(src) || (Array.isArray(src) && typeof (src[0]) === 'number')) {
    type = options.type || getTextureTypeForArrayType(gl, src);
  } else {
    type = options.type || gl.UNSIGNED_BYTE;
  }
  if (target === gl.TEXTURE_CUBE_MAP) {
    for (var ii = 0; ii < 6; ++ii) {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + ii, 0, format, width, height, 0, format, type, null);
    }
  } else {
    gl.texImage2D(target, 0, format, width, height, 0, format, type, null);
  }
}

function isAsyncSrc(src) {
  return typeof src === 'string' ||
         (Array.isArray(src) && typeof src[0] === 'string');
}

function createTextures(gl, textureOptions, callback) {
  callback = callback || noop;
  var numDownloading = 0;
  var errors = [];
  var textures = {};
  var images = {};

  function callCallbackIfReady() {
    if (numDownloading === 0) {
      setTimeout(function() {
        callback(errors.length ? errors : undefined, textures, images);
      }, 0);
    }
  }

  Object.keys(textureOptions).forEach(function(name) {
    var options = textureOptions[name];
    var onLoadFn = undefined;
    if (isAsyncSrc(options.src)) {
      onLoadFn = function(err, tex, img) {
        images[name] = img;
        --numDownloading;
        if (err) {
          errors.push(err);
        }
        callCallbackIfReady();
      };
      ++numDownloading;
    }
    textures[name] = createTexture(gl, options, onLoadFn);
  });

  // queue the callback if there are no images to download.
  // We do this because if your code is structured to wait for
  // images to download but then you comment out all the async
  // images your code would break.
  callCallbackIfReady();

  return textures;
}

export default {
	setDefaults_: setDefaults,

	createTexture,
	setEmptyTexture,
	setTextureFromArray,
	loadTextureFromUrl,
	setTextureFromElement,
	setTextureFilteringForSize,
	setTextureParameters,
	setDefaultTextureColor,
	createTextures,
	resizeTexture,
	getNumComponentsForFormat,
}