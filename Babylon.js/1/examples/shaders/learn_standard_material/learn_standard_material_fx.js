
import { shaderName } from './learn_standard_material.js';

BABYLON.Effect.ShadersStore[shaderName + "VertexShader"] = `

	precision mediump float;

	// Attributes
	attribute vec3 position;
	attribute vec3 normal;
	#ifdef UV1
	attribute vec2 uv;
	#endif
	#ifdef UV2
	attribute vec2 uv2;
	#endif
	#ifdef VERTEXCOLOR
	attribute vec3 color;
	#endif

	// Uniforms
	uniform mat4 worldViewProjection;

	#ifdef DIFFUSE
	varying vec2 vDiffuseUV;
	uniform mat4 diffuseMatrix;
	uniform vec2 vDiffuseInfos;
	#endif

	#ifdef EMISSIVE
	varying vec2 vEmissiveUV;
	uniform vec2 vEmissiveInfos;
	uniform mat4 emissiveMatrix;
	#endif

	#ifdef VERTEXCOLOR
	varying vec3 vColor;
	#endif


	void main(void) {
		gl_Position = worldViewProjection * vec4(position, 1.0);

		// Texture coordinates
	#ifndef UV1
		vec2 uv = vec2(0., 0.);
	#endif
	#ifndef UV2
		vec2 uv2 = vec2(0., 0.);
	#endif

	#ifdef DIFFUSE
		if (vDiffuseInfos.x == 0.)
		{
			vDiffuseUV = vec2(diffuseMatrix * vec4(uv, 1.0, 0.0));
		}
		else
		{
			vDiffuseUV = vec2(diffuseMatrix * vec4(uv2, 1.0, 0.0));
		}
	#endif

	#ifdef EMISSIVE
		if (vEmissiveInfos.x == 0.)
		{
			vEmissiveUV = vec2(emissiveMatrix * vec4(uv, 1.0, 0.0));
		}
		else
		{
			vEmissiveUV = vec2(emissiveMatrix * vec4(uv2, 1.0, 0.0));
		}
	#endif

		// Vertex color
	#ifdef VERTEXCOLOR
		vColor = color;
	#endif
	}
`