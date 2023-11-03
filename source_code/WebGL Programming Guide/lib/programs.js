
export function getWebGLContext(canvas, options = {}){
  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
  var context = null;
  for (var ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii], options);
    } catch(e) {
		  throw new Error(e)
    }
    if (context) {
      return context;
    }
  }
  throw new Error('获取 webgl context 失败');
}

function loadShader(gl, shaderType, shaderSource){
  const shader = gl.createShader(shaderType);

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if( compiled ){

    return shader;
  }else{

    let lastError = gl.getShaderInfoLog(shader);
    console.error('loadShader 出错');
	  throw new Error(lastError)
    gl.deleteShader(shader);

    return null;
  }

}

const VERTEXSHADER = 'VERTEX_SHADER';
const FRAGMENTSHADER = 'FRAGMENT_SHADER';

export function createProgram(gl, vs, fs){

	const vShader = loadShader(gl, gl.VERTEX_SHADER, vs);
	const fShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
  const program = gl.createProgram();

  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);

  gl.linkProgram(program);

  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if( linked ){
	  gl.useProgram(program);

	  return program;
  }else{
    var error = gl.getProgramInfoLog(program);
    console.error('createProgram 出错');
	  throw new Error(error)
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
  }
}