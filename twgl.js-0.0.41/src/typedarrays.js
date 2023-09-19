
/* DataType */
let BYTE                           = 0x1400;
let UNSIGNED_BYTE                  = 0x1401;
let SHORT                          = 0x1402;
let UNSIGNED_SHORT                 = 0x1403;
let INT                            = 0x1404;
let UNSIGNED_INT                   = 0x1405;
let FLOAT                          = 0x1406;

function getGLTypeForTypedArray(typedArray) {
  if (typedArray instanceof Int8Array)    { return BYTE; }           // eslint-disable-line
  if (typedArray instanceof Uint8Array)   { return UNSIGNED_BYTE; }  // eslint-disable-line
  if (typedArray instanceof Int16Array)   { return SHORT; }          // eslint-disable-line
  if (typedArray instanceof Uint16Array)  { return UNSIGNED_SHORT; } // eslint-disable-line
  if (typedArray instanceof Int32Array)   { return INT; }            // eslint-disable-line
  if (typedArray instanceof Uint32Array)  { return UNSIGNED_INT; }   // eslint-disable-line
  if (typedArray instanceof Float32Array) { return FLOAT; }          // eslint-disable-line
  throw "unsupported typed array type";
}

function getTypedArrayTypeForGLType(type) {
  switch (type) {
    case BYTE:           return Int8Array;     // eslint-disable-line
    case UNSIGNED_BYTE:  return Uint8Array;    // eslint-disable-line
    case SHORT:          return Int16Array;    // eslint-disable-line
    case UNSIGNED_SHORT: return Uint16Array;   // eslint-disable-line
    case INT:            return Int32Array;    // eslint-disable-line
    case UNSIGNED_INT:   return Uint32Array;   // eslint-disable-line
    case FLOAT:          return Float32Array;  // eslint-disable-line
    default:
      throw "unknown gl type";
  }
}

function isArrayBuffer(a) {
  return a && a.buffer && a.buffer instanceof ArrayBuffer;
}

export default {
  getGLTypeForTypedArray,
  getTypedArrayTypeForGLType,
  isArrayBuffer,
}