

import { shaderName } from './learn_standard_material.js';

BABYLON.Effect.ShadersStore[shaderName + "PixelShader"] = `
	#ifdef GL_ES
	precision mediump float;
	#endif

	#define MAP_PROJECTION	4.

	// Constants
	uniform vec3 vEyePosition;
	uniform vec3 vAmbientColor;
	uniform vec4 vDiffuseColor;
	uniform vec4 vSpecularColor;
	uniform vec3 vEmissiveColor;

	#ifdef VERTEXCOLOR
	varying vec3 vColor;
	#endif

	// Samplers
	#ifdef DIFFUSE
	varying vec2 vDiffuseUV;
	uniform sampler2D diffuseSampler;
	uniform vec2 vDiffuseInfos;
	#endif

	#ifdef EMISSIVE
	varying vec2 vEmissiveUV;
	uniform vec2 vEmissiveInfos;
	uniform sampler2D emissiveSampler;
	#endif

	void main(void) {

		// Base color
		vec4 baseColor = vec4(1., 1., 1., 1.);
		vec3 diffuseColor = vDiffuseColor.rgb;

		#ifdef VERTEXCOLOR
			diffuseColor *= vColor;
		#endif

		#ifdef DIFFUSE
			baseColor = texture2D(diffuseSampler, vDiffuseUV);

		#ifdef ALPHATEST
			if (baseColor.a < 0.4)
				discard;
		#endif

			baseColor.rgb *= vDiffuseInfos.y;
		#endif

		// Ambient color
		vec3 baseAmbientColor = vec3(1., 1., 1.);

		// Lighting
		vec3 diffuseBase = vec3(0., 0., 0.);
		vec3 specularBase = vec3(0., 0., 0.);

		// Reflection
		vec3 reflectionColor = vec3(0., 0., 0.);

		// Alpha
		float alpha = vDiffuseColor.a;

		// Emissive
		vec3 emissiveColor = vEmissiveColor;
		#ifdef EMISSIVE
			emissiveColor += texture2D(emissiveSampler, vEmissiveUV).rgb * vEmissiveInfos.y;
		#endif

		// Specular map
		vec3 specularColor = vSpecularColor.rgb;

		// Composition
		vec3 finalDiffuse = clamp(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
		vec3 finalSpecular = specularBase * specularColor;

		vec4 color = vec4(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor, alpha);

		gl_FragColor = color;
	}
`