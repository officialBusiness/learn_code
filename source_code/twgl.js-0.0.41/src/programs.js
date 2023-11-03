const error =
    (    window.console
      && window.console.error
      && typeof window.console.error === "function"
    )
    ? window.console.error.bind(window.console)
    : function() { };
// make sure we don't see a global gl
let gl = undefined;  // eslint-disable-line

function addLineNumbers(src) {
  return src.split("\n").map(function(line, ndx) {
    return (ndx + 1) + ": " + line;
  }).join("\n");
}

function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
  var errFn = opt_errorCallback || error;
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Load the shader source
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check the compile status
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    // Something went wrong during compilation; get the error
    var lastError = gl.getShaderInfoLog(shader);
    errFn(addLineNumbers(shaderSource) + "\n*** Error compiling shader: " + lastError);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
  var errFn = opt_errorCallback || error;
  var program = gl.createProgram();
  shaders.forEach(function(shader) {
    gl.attachShader(program, shader);
  });
  // if (opt_attribs) {
  //   opt_attribs.forEach(function(attrib,  ndx) {
  //     gl.bindAttribLocation(
  //         program,
  //         opt_locations ? opt_locations[ndx] : ndx,
  //         attrib);
  //   });
  // }
  gl.linkProgram(program);

  // Check the link status
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
      // something went wrong with the link
      var lastError = gl.getProgramInfoLog(program);
      errFn("Error in program linking:" + lastError);

      gl.deleteProgram(program);
      return null;
  }
  return program;
}

const defaultShaderType = [
  "VERTEX_SHADER",
  "FRAGMENT_SHADER",
];

function createProgramFromSources(
    gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
  var shaders = [];
  for (var ii = 0; ii < shaderSources.length; ++ii) {
    var shader = loadShader(
        gl, shaderSources[ii], gl[defaultShaderType[ii]], opt_errorCallback);
    if (!shader) {
      return null;
    }
    shaders.push(shader);
  }
  return createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
}

function getBindPointForSamplerType(gl, type) {
  if (type === gl.SAMPLER_2D) {
    return gl.TEXTURE_2D;
  }
  if (type === gl.SAMPLER_CUBE) {
    return gl.TEXTURE_CUBE_MAP;
  }
}

function createUniformSetters(gl, program) {
  var textureUnit = 0;

  /**
   * Creates a setter for a uniform of the given program with it's
   * location embedded in the setter.
   * @param {WebGLProgram} program
   * @param {WebGLUniformInfo} uniformInfo
   * @returns {function} the created setter.
   */
  function createUniformSetter(program, uniformInfo) {
    var location = gl.getUniformLocation(program, uniformInfo.name);
    var type = uniformInfo.type;
    // Check if this uniform is an array
    var isArray = (uniformInfo.size > 1 && uniformInfo.name.substr(-3) === "[0]");
    if (type === gl.FLOAT && isArray) {
      return function(v) {
        gl.uniform1fv(location, v);
      };
    }
    if (type === gl.FLOAT) {
      return function(v) {
        gl.uniform1f(location, v);
      };
    }
    if (type === gl.FLOAT_VEC2) {
      return function(v) {
        gl.uniform2fv(location, v);
      };
    }
    if (type === gl.FLOAT_VEC3) {
      return function(v) {
        gl.uniform3fv(location, v);
      };
    }
    if (type === gl.FLOAT_VEC4) {
      return function(v) {
        gl.uniform4fv(location, v);
      };
    }
    if (type === gl.INT && isArray) {
      return function(v) {
        gl.uniform1iv(location, v);
      };
    }
    if (type === gl.INT) {
      return function(v) {
        gl.uniform1i(location, v);
      };
    }
    if (type === gl.INT_VEC2) {
      return function(v) {
        gl.uniform2iv(location, v);
      };
    }
    if (type === gl.INT_VEC3) {
      return function(v) {
        gl.uniform3iv(location, v);
      };
    }
    if (type === gl.INT_VEC4) {
      return function(v) {
        gl.uniform4iv(location, v);
      };
    }
    if (type === gl.BOOL && isArray) {
      return function(v) {
        gl.uniform1iv(location, v);
      };
    }
    if (type === gl.BOOL) {
      return function(v) {
        gl.uniform1i(location, v);
      };
    }
    if (type === gl.BOOL_VEC2) {
      return function(v) {
        gl.uniform2iv(location, v);
      };
    }
    if (type === gl.BOOL_VEC3) {
      return function(v) {
        gl.uniform3iv(location, v);
      };
    }
    if (type === gl.BOOL_VEC4) {
      return function(v) {
        gl.uniform4iv(location, v);
      };
    }
    if (type === gl.FLOAT_MAT2) {
      return function(v) {
        gl.uniformMatrix2fv(location, false, v);
      };
    }
    if (type === gl.FLOAT_MAT3) {
      return function(v) {
        gl.uniformMatrix3fv(location, false, v);
      };
    }
    if (type === gl.FLOAT_MAT4) {
      return function(v) {
        gl.uniformMatrix4fv(location, false, v);
      };
    }
    if ((type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) && isArray) {
      var units = [];
      for (var ii = 0; ii < uniformInfo.size; ++ii) {
        units.push(textureUnit++);
      }
      return function(bindPoint, units) {
        return function(textures) {
          gl.uniform1iv(location, units);
          textures.forEach(function(texture, index) {
            gl.activeTexture(gl.TEXTURE0 + units[index]);
            gl.bindTexture(bindPoint, texture);
          });
        };
      }(getBindPointForSamplerType(gl, type), units);
    }
    if (type === gl.SAMPLER_2D || type === gl.SAMPLER_CUBE) {
      return function(bindPoint, unit) {
        return function(texture) {
          gl.uniform1i(location, unit);
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(bindPoint, texture);
        };
      }(getBindPointForSamplerType(gl, type), textureUnit++);
    }
    throw ("unknown type: 0x" + type.toString(16)); // we should never get here.
  }

  var uniformSetters = { };
  var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  for (var ii = 0; ii < numUniforms; ++ii) {
    var uniformInfo = gl.getActiveUniform(program, ii);
    // console.log('uniformInfo:', uniformInfo);
    if (!uniformInfo) {
      break;
    }
    var name = uniformInfo.name;
    // remove the array suffix.
    if (name.substr(-3) === "[0]") {
      name = name.substr(0, name.length - 3);
    }
    var setter = createUniformSetter(program, uniformInfo);
    uniformSetters[name] = setter;
  }
  return uniformSetters;
}

function setUniforms(setters, values) {  // eslint-disable-line
  var actualSetters = setters.uniformSetters || setters;
  var numArgs = arguments.length;
  for (var andx = 1; andx < numArgs; ++andx) {
    var vals = arguments[andx];
    if (Array.isArray(vals)) {
      var numValues = vals.length;
      for (var ii = 0; ii < numValues; ++ii) {
        setUniforms(actualSetters, vals[ii]);
      }
    } else {
      for (var name in vals) {
        var setter = actualSetters[name];
        if (setter) {
          setter(vals[name]);
        }
      }
    }
  }
}

function createAttributeSetters(gl, program) {
  var attribSetters = {
  };

  function createAttribSetter(index) {
    return function(b) {
        gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
        gl.enableVertexAttribArray(index);
        gl.vertexAttribPointer(
            index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);
      };
  }

  var numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (var ii = 0; ii < numAttribs; ++ii) {
    var attribInfo = gl.getActiveAttrib(program, ii);
    // console.log('attribInfo:', attribInfo);
    if (!attribInfo) {
      break;
    }
    var index = gl.getAttribLocation(program, attribInfo.name);
    attribSetters[attribInfo.name] = createAttribSetter(index);
  }

  return attribSetters;
}

function setAttributes(setters, buffers) {
  for (var name in buffers) {
    var setter = setters[name];
    if (setter) {
      setter(buffers[name]);
    }
  }
}

function setBuffersAndAttributes(gl, programInfo, buffers) {
  setAttributes(programInfo.attribSetters || programInfo, buffers.attribs);
  if (buffers.indices) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  }
}

function createProgramInfoFromProgram(gl, program) {
  var uniformSetters = createUniformSetters(gl, program);
  var attribSetters = createAttributeSetters(gl, program);
  return {
    program: program,
    uniformSetters: uniformSetters,
    attribSetters: attribSetters,
  };
}

function createProgramInfo(
    gl, shaderSources, opt_attribs, 
    opt_locations, opt_errorCallback) {
  var program = createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback);
  if (!program) {
    return null;
  }
  return createProgramInfoFromProgram(gl, program);
}

export default {
    createAttributeSetters,

    createProgram,
    createProgramFromSources,
    createProgramInfo,
    createProgramInfoFromProgram,
    createUniformSetters,

    setAttributes,
    setBuffersAndAttributes,
    setUniforms,
  };
