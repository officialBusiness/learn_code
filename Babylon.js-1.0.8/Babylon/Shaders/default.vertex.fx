﻿#define MAP_EXPLICIT	0.
#define MAP_SPHERICAL	1.
#define MAP_PLANAR		2.
#define MAP_CUBIC		3.
#define MAP_PROJECTION	4.
#define MAP_SKYBOX		5.

// Attributes
attribute vec3 position;
attribute vec3 normal;
#ifdef UV1
attribute vec2 uv;
#endif
#ifdef UV2
attribute vec2 uv2;
#endif

// Uniforms
uniform mat4 world;
uniform mat4 view;
uniform mat4 worldViewProjection;

#ifdef DIFFUSE
varying vec2 vDiffuseUV;
uniform mat4 diffuseMatrix;
uniform vec2 vDiffuseInfos;
#endif

#ifdef AMBIENT
varying vec2 vAmbientUV;
uniform mat4 ambientMatrix;
uniform vec2 vAmbientInfos;
#endif

#ifdef OPACITY
varying vec2 vOpacityUV;
uniform mat4 opacityMatrix;
uniform vec2 vOpacityInfos;
#endif

#ifdef REFLECTION
uniform vec3 vEyePosition;
varying vec3 vReflectionUVW;
uniform vec3 vReflectionInfos;
uniform mat4 reflectionMatrix;
#endif

#ifdef EMISSIVE
varying vec2 vEmissiveUV;
uniform vec2 vEmissiveInfos;
uniform mat4 emissiveMatrix;
#endif

#ifdef SPECULAR
varying vec2 vSpecularUV;
uniform vec2 vSpecularInfos;
uniform mat4 specularMatrix;
#endif

#ifdef BUMP
varying vec2 vBumpUV;
uniform vec2 vBumpInfos;
uniform mat4 bumpMatrix;
#endif

// Output
varying vec3 vPositionW;
varying vec3 vNormalW;

#ifdef CLIPPLANE
uniform vec4 vClipPlane;
varying float fClipDistance;
#endif

#ifdef FOG
varying float fFogDistance;
#endif

#ifdef REFLECTION
vec3 computeReflectionCoords(float mode, vec4 worldPos, vec3 worldNormal)
{	
	if (mode == MAP_SPHERICAL)
	{
		vec3 coords = vec3(view * vec4(worldNormal, 0.0));	

		return vec3(reflectionMatrix * vec4(coords, 1.0));
	}
	else if (mode == MAP_PLANAR)
	{
		vec3 viewDir = worldPos.xyz - vEyePosition;
		vec3 coords = normalize(reflect(viewDir, worldNormal));

		return vec3(reflectionMatrix * vec4(coords, 1));
	}
	else if (mode == MAP_CUBIC)
	{
		vec3 viewDir = worldPos.xyz - vEyePosition;
		vec3 coords = reflect(viewDir, worldNormal);

		return vec3(reflectionMatrix * vec4(coords, 0));
	}
	else if (mode == MAP_PROJECTION)
	{
		return vec3(reflectionMatrix * (view * worldPos));
	}
	else if (mode == MAP_SKYBOX)
	{
		return position;
	}

	return vec3(0, 0, 0);
}
#endif

void main(void) {
	gl_Position = worldViewProjection * vec4(position, 1.0);   

	vec4 worldPos = world * vec4(position, 1.0);
	vPositionW = vec3(worldPos);
	vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

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

#ifdef AMBIENT
	if (vAmbientInfos.x == 0.)
	{
		vAmbientUV = vec2(ambientMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vAmbientUV = vec2(ambientMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#ifdef OPACITY
	if (vOpacityInfos.x == 0.)
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vOpacityUV = vec2(opacityMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#ifdef REFLECTION
	vReflectionUVW = computeReflectionCoords(vReflectionInfos.x, vec4(vPositionW, 1.0), vNormalW);
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

#ifdef SPECULAR
	if (vSpecularInfos.x == 0.)
	{
		vSpecularUV = vec2(specularMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vSpecularUV = vec2(specularMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

#ifdef BUMP
	if (vBumpInfos.x == 0.)
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv, 1.0, 0.0));
	}
	else
	{
		vBumpUV = vec2(bumpMatrix * vec4(uv2, 1.0, 0.0));
	}
#endif

	// Clip plane
#ifdef CLIPPLANE
		fClipDistance = dot(worldPos, vClipPlane);
#endif

	// Fog
#ifdef FOG
		fFogDistance = (view * worldPos).z;
#endif
}