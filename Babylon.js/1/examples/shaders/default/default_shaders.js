
export const shaderName = 'default_shader';

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