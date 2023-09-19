import textures from './textures.js';
import utils from './utils.js';


// make sure we don't see a global gl
let gl = undefined;  // eslint-disable-line

let UNSIGNED_BYTE                  = 0x1401;

/* PixelFormat */
let DEPTH_COMPONENT                = 0x1902;
let RGBA                           = 0x1908;

/* Framebuffer Object. */
let RGBA4                          = 0x8056;
let RGB5_A1                        = 0x8057;
let RGB565                         = 0x8D62;
let DEPTH_COMPONENT16              = 0x81A5;
let STENCIL_INDEX                  = 0x1901;
let STENCIL_INDEX8                 = 0x8D48;
let DEPTH_STENCIL                  = 0x84F9;
let COLOR_ATTACHMENT0              = 0x8CE0;
let DEPTH_ATTACHMENT               = 0x8D00;
let STENCIL_ATTACHMENT             = 0x8D20;
let DEPTH_STENCIL_ATTACHMENT       = 0x821A;

/* TextureWrapMode */
let REPEAT                         = 0x2901;  // eslint-disable-line
let CLAMP_TO_EDGE                  = 0x812F;
let MIRRORED_REPEAT                = 0x8370;  // eslint-disable-line

/* TextureMagFilter */
let NEAREST                        = 0x2600;  // eslint-disable-line
let LINEAR                         = 0x2601;

/* TextureMinFilter */
let NEAREST_MIPMAP_NEAREST         = 0x2700;  // eslint-disable-line
let LINEAR_MIPMAP_NEAREST          = 0x2701;  // eslint-disable-line
let NEAREST_MIPMAP_LINEAR          = 0x2702;  // eslint-disable-line
let LINEAR_MIPMAP_LINEAR           = 0x2703;  // eslint-disable-line

const defaultAttachments = [
  { format: RGBA, type: UNSIGNED_BYTE, min: LINEAR, wrap: CLAMP_TO_EDGE, },
  { format: DEPTH_STENCIL, },
];

let attachmentsByFormat = {};
attachmentsByFormat[DEPTH_STENCIL] = DEPTH_STENCIL_ATTACHMENT;
attachmentsByFormat[STENCIL_INDEX] = STENCIL_ATTACHMENT;
attachmentsByFormat[STENCIL_INDEX8] = STENCIL_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT] = DEPTH_ATTACHMENT;
attachmentsByFormat[DEPTH_COMPONENT16] = DEPTH_ATTACHMENT;

function getAttachmentPointForFormat(format) {
  return attachmentsByFormat[format];
}

let renderbufferFormats = {};
renderbufferFormats[RGBA4] = true;
renderbufferFormats[RGB5_A1] = true;
renderbufferFormats[RGB565] = true;
renderbufferFormats[DEPTH_STENCIL] = true;
renderbufferFormats[DEPTH_COMPONENT16] = true;
renderbufferFormats[STENCIL_INDEX] = true;
renderbufferFormats[STENCIL_INDEX8] = true;

function isRenderbufferFormat(format) {
  return renderbufferFormats[format];
}

function createFramebufferInfo(gl, attachments, width, height) {
  var target = gl.FRAMEBUFFER;
  var fb = gl.createFramebuffer();
  gl.bindFramebuffer(target, fb);
  width  = width  || gl.drawingBufferWidth;
  height = height || gl.drawingBufferHeight;
  attachments = attachments || defaultAttachments;
  var colorAttachmentCount = 0;
  var framebufferInfo = {
    framebuffer: fb,
    attachments: [],
    width: width,
    height: height,
  };
  attachments.forEach(function(attachmentOptions) {
    var attachment = attachmentOptions.attachment;
    var format = attachmentOptions.format;
    var attachmentPoint = getAttachmentPointForFormat(format);
    if (!attachmentPoint) {
      attachmentPoint = COLOR_ATTACHMENT0 + colorAttachmentCount++;
    }
    if (!attachment) {
      if (isRenderbufferFormat(format)) {
        attachment = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, attachment);
        gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
      } else {
        var textureOptions = utils.shallowCopy(attachmentOptions);
        textureOptions.width = width;
        textureOptions.height = height;
        textureOptions.auto = attachmentOptions.auto === undefined ? false : attachmentOptions.auto;
        attachment = textures.createTexture(gl, textureOptions);
      }
    }
    if (attachment instanceof WebGLRenderbuffer) {
      gl.framebufferRenderbuffer(target, attachmentPoint, gl.RENDERBUFFER, attachment);
    } else if (attachment instanceof WebGLTexture) {
      gl.framebufferTexture2D(
          target,
          attachmentPoint,
          attachmentOptions.texTarget || gl.TEXTURE_2D,
          attachment,
          attachmentOptions.level || 0);
    } else {
      throw "unknown attachment type";
    }
    framebufferInfo.attachments.push(attachment);
  });
  return framebufferInfo;
}

function resizeFramebufferInfo(gl, framebufferInfo, attachments, width, height) {
  width  = width  || gl.drawingBufferWidth;
  height = height || gl.drawingBufferHeight;
  framebufferInfo.width = width;
  framebufferInfo.height = height;
  attachments = attachments || defaultAttachments;
  attachments.forEach(function(attachmentOptions, ndx) {
    var attachment = framebufferInfo.attachments[ndx];
    var format = attachmentOptions.format;
    if (attachment instanceof WebGLRenderbuffer) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, attachment);
      gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
    } else if (attachment instanceof WebGLTexture) {
      textures.resizeTexture(gl, attachment, attachmentOptions, width, height);
    } else {
      throw "unknown attachment type";
    }
  });
}

function bindFramebufferInfo(gl, framebufferInfo, target) {
  target = target || gl.FRAMEBUFFER;
  if (framebufferInfo) {
    gl.bindFramebuffer(target, framebufferInfo.framebuffer);
    gl.viewport(0, 0, framebufferInfo.width, framebufferInfo.height);
  } else {
    gl.bindFramebuffer(target, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }
}

export default {
	bindFramebufferInfo,
	createFramebufferInfo,
	resizeFramebufferInfo,
}