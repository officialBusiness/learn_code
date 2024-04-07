THREE.ShaderChunk = {};

// File:src/renderers/shaders/ShaderChunk/alphamap_fragment.glsl

THREE.ShaderChunk[ 'alphamap_fragment' ] = `#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/alphamap_pars_fragment.glsl

THREE.ShaderChunk[ 'alphamap_pars_fragment' ] = `#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/alphatest_fragment.glsl

THREE.ShaderChunk[ 'alphatest_fragment' ] = `#ifdef ALPHATEST
	if ( diffuseColor.a < ALPHATEST ) discard;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/ambient_pars.glsl

THREE.ShaderChunk[ 'ambient_pars' ] = `uniform vec3 ambientLightColor;
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	return PI * ambientLightColor;
}
`;

// File:src/renderers/shaders/ShaderChunk/aomap_fragment.glsl

THREE.ShaderChunk[ 'aomap_fragment' ] = `#ifdef USE_AOMAP
	reflectedLight.indirectDiffuse *= ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/aomap_pars_fragment.glsl

THREE.ShaderChunk[ 'aomap_pars_fragment' ] = `#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/begin_vertex.glsl

THREE.ShaderChunk[ 'begin_vertex' ] = `
vec3 transformed = vec3( position );
`;

// File:src/renderers/shaders/ShaderChunk/beginnormal_vertex.glsl

THREE.ShaderChunk[ 'beginnormal_vertex' ] = `
vec3 objectNormal = vec3( normal );
`;

// File:src/renderers/shaders/ShaderChunk/bsdfs.glsl

THREE.ShaderChunk[ 'bsdfs' ] = `bool testLightInRange( const in float lightDistance, const in float cutoffDistance ) {
	return any( bvec2( cutoffDistance == 0.0, lightDistance < cutoffDistance ) );
}
float calcLightAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	if ( decayExponent > 0.0 ) {
	  return pow( saturate( -lightDistance / cutoffDistance + 1.0 ), decayExponent );
	}
	return 1.0;
}
vec3 BRDF_Diffuse_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 specularColor, const in float dotLH ) {
	float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
	return ( 1.0 - specularColor ) * fresnel + specularColor;
}
float G_GGX_Smith( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = alpha * alpha;
	float gl = dotNL + pow( a2 + ( 1.0 - a2 ) * dotNL * dotNL, 0.5 );
	float gv = dotNV + pow( a2 + ( 1.0 - a2 ) * dotNV * dotNV, 0.5 );
	return 1.0 / ( gl * gv );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = alpha * alpha;
	float denom = dotNH * dotNH * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / ( denom * denom );
}
vec3 BRDF_Specular_GGX( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {
	float alpha = roughness * roughness;
	vec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );
	float dotNL = saturate( dot( geometry.normal, incidentLight.direction ) );
	float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
	float dotNH = saturate( dot( geometry.normal, halfDir ) );
	float dotLH = saturate( dot( incidentLight.direction, halfDir ) );
	vec3 F = F_Schlick( specularColor, dotLH );
	float G = G_GGX_Smith( alpha, dotNL, dotNV );
	float D = D_GGX( alpha, dotNH );
	return F * ( G * D );
}
vec3 BRDF_Specular_GGX_Environment( const in GeometricContext geometry, const in vec3 specularColor, const in float roughness ) {
	float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
	return specularColor * AB.x + AB.y;
}
float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_Specular_BlinnPhong( const in IncidentLight incidentLight, const in GeometricContext geometry, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( incidentLight.direction + geometry.viewDir );
	float dotNH = saturate( dot( geometry.normal, halfDir ) );
	float dotLH = saturate( dot( incidentLight.direction, halfDir ) );
	vec3 F = F_Schlick( specularColor, dotLH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
}
float GGXRoughnessToBlinnExponent( const in float ggxRoughness ) {
	return ( 2.0 / square( ggxRoughness + 0.0001 ) - 2.0 );
}
`;

// File:src/renderers/shaders/ShaderChunk/bumpmap_pars_fragment.glsl

THREE.ShaderChunk[ 'bumpmap_pars_fragment' ] = `#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vUv );
		vec2 dSTdy = dFdy( vUv );
		float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
		vec3 vSigmaX = dFdx( surf_pos );
		vec3 vSigmaY = dFdy( surf_pos );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 );
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/color_fragment.glsl

THREE.ShaderChunk[ 'color_fragment' ] = `#ifdef USE_COLOR
	diffuseColor.rgb *= vColor;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/color_pars_fragment.glsl

THREE.ShaderChunk[ 'color_pars_fragment' ] = `#ifdef USE_COLOR
	varying vec3 vColor;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/color_pars_vertex.glsl

THREE.ShaderChunk[ 'color_pars_vertex' ] = `#ifdef USE_COLOR
	varying vec3 vColor;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/color_vertex.glsl

THREE.ShaderChunk[ 'color_vertex' ] = `#ifdef USE_COLOR
	vColor.xyz = color.xyz;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/common.glsl

THREE.ShaderChunk[ 'common' ] = `#define PI 3.14159
#define PI2 6.28318
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6
#define saturate(a) clamp( a, 0.0, 1.0 )
#define whiteCompliment(a) ( 1.0 - saturate( a ) )
float square( const in float x ) { return x*x; }
float average( const in vec3 color ) { return dot( color, vec3( 0.3333 ) ); }
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
vec3 projectOnPlane(in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	float distance = dot( planeNormal, point - pointOnPlane );
	return - distance * planeNormal + point;
}
float sideOfPlane( in vec3 point, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return sign( dot( point - pointOnPlane, planeNormal ) );
}
vec3 linePlaneIntersect( in vec3 pointOnLine, in vec3 lineDirection, in vec3 pointOnPlane, in vec3 planeNormal ) {
	return lineDirection * ( dot( planeNormal, pointOnPlane - pointOnLine ) / dot( planeNormal, lineDirection ) ) + pointOnLine;
}
vec3 inputToLinear( in vec3 a ) {
	#ifdef GAMMA_INPUT
		return pow( a, vec3( float( GAMMA_FACTOR ) ) );
	#else
		return a;
	#endif
}
vec3 linearToOutput( in vec3 a ) {
	#ifdef GAMMA_OUTPUT
		return pow( a, vec3( 1.0 / float( GAMMA_FACTOR ) ) );
	#else
		return a;
	#endif
}
`;

// File:src/renderers/shaders/ShaderChunk/defaultnormal_vertex.glsl

THREE.ShaderChunk[ 'defaultnormal_vertex' ] = `#ifdef FLIP_SIDED
	objectNormal = -objectNormal;
	#endif
vec3 transformedNormal = normalMatrix * objectNormal;
`;

// File:src/renderers/shaders/ShaderChunk/displacementmap_vertex.glsl

THREE.ShaderChunk[ 'displacementmap_vertex' ] = `#ifdef USE_DISPLACEMENTMAP
	transformed += normal * ( texture2D( displacementMap, uv ).x * displacementScale + displacementBias );
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/displacementmap_pars_vertex.glsl

THREE.ShaderChunk[ 'displacementmap_pars_vertex' ] = `#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/emissivemap_fragment.glsl

THREE.ShaderChunk[ 'emissivemap_fragment' ] = `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vUv );
	emissiveColor.rgb = inputToLinear( emissiveColor.rgb );
	totalEmissiveLight *= emissiveColor.rgb;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/emissivemap_pars_fragment.glsl

THREE.ShaderChunk[ 'emissivemap_pars_fragment' ] = `#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/envmap_fragment.glsl

THREE.ShaderChunk[ 'envmap_fragment' ] = `#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )
		vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToVertex, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef DOUBLE_SIDED
		float flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );
	#else
		float flipNormal = 1.0;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#elif defined( ENVMAP_TYPE_EQUIREC )
		vec2 sampleUV;
		sampleUV.y = saturate( flipNormal * reflectVec.y * 0.5 + 0.5 );
		sampleUV.x = atan( flipNormal * reflectVec.z, flipNormal * reflectVec.x ) * RECIPROCAL_PI2 + 0.5;
		vec4 envColor = texture2D( envMap, sampleUV );
	#elif defined( ENVMAP_TYPE_SPHERE )
		vec3 reflectView = flipNormal * normalize((viewMatrix * vec4( reflectVec, 0.0 )).xyz + vec3(0.0,0.0,1.0));
		vec4 envColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5 );
	#endif
	envColor.xyz = inputToLinear( envColor.xyz );
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/envmap_pars_fragment.glsl

THREE.ShaderChunk[ 'envmap_pars_fragment' ] = `#if defined( USE_ENVMAP ) || defined( STANDARD )
	uniform float reflectivity;
	uniform float envMapIntenstiy;
	#endif
#ifdef USE_ENVMAP
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	uniform float flipEnvMap;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( STANDARD )
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/envmap_pars_vertex.glsl

THREE.ShaderChunk[ 'envmap_pars_vertex' ] = `#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP ) && ! defined( PHONG ) && ! defined( STANDARD )
	varying vec3 vReflect;
	uniform float refractionRatio;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/envmap_vertex.glsl

THREE.ShaderChunk[ 'envmap_vertex' ] = `#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP ) && ! defined( PHONG ) && ! defined( STANDARD )
	vec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
	vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#ifdef ENVMAP_MODE_REFLECTION
		vReflect = reflect( cameraToVertex, worldNormal );
	#else
		vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/fog_fragment.glsl

THREE.ShaderChunk[ 'fog_fragment' ] = `#ifdef USE_FOG
	#ifdef USE_LOGDEPTHBUF_EXT
		float depth = gl_FragDepthEXT / gl_FragCoord.w;
	#else
		float depth = gl_FragCoord.z / gl_FragCoord.w;
	#endif
	#ifdef FOG_EXP2
		float fogFactor = whiteCompliment( exp2( - fogDensity * fogDensity * depth * depth * LOG2 ) );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, depth );
	#endif

	outgoingLight = mix( outgoingLight, fogColor, fogFactor );
	#endif`;

// File:src/renderers/shaders/ShaderChunk/fog_pars_fragment.glsl

THREE.ShaderChunk[ 'fog_pars_fragment' ] = `#ifdef USE_FOG
	uniform vec3 fogColor;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
	#endif`;

// File:src/renderers/shaders/ShaderChunk/lightmap_fragment.glsl

THREE.ShaderChunk[ 'lightmap_fragment' ] = `#ifdef USE_LIGHTMAP
	reflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/lightmap_pars_fragment.glsl

THREE.ShaderChunk[ 'lightmap_pars_fragment' ] = `#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/lights_lambert_vertex.glsl

THREE.ShaderChunk[ 'lights_lambert_vertex' ] = `vec3 diffuse = vec3( 1.0 );
GeometricContext geometry;
geometry.position = mvPosition.xyz;
geometry.normal = normalize( transformedNormal );
geometry.viewDir = normalize( -mvPosition.xyz );
GeometricContext backGeometry;
backGeometry.position = geometry.position;
backGeometry.normal = -geometry.normal;
backGeometry.viewDir = geometry.viewDir;
vLightFront = vec3( 0.0 );
#ifdef DOUBLE_SIDED
	vLightBack = vec3( 0.0 );
	#endif
IncidentLight directLight;
float dotNL;
vec3 directLightColor_Diffuse;
#if NUM_POINT_LIGHTS > 0
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		directLight = getPointDirectLight( pointLights[ i ], geometry );
		dotNL = dot( geometry.normal, directLight.direction );
		directLightColor_Diffuse = PI * directLight.color;
		vLightFront += saturate( dotNL ) * directLightColor_Diffuse;
		#ifdef DOUBLE_SIDED
			vLightBack += saturate( -dotNL ) * directLightColor_Diffuse;
		#endif
	}
	#endif
#if NUM_SPOT_LIGHTS > 0
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		directLight = getSpotDirectLight( spotLights[ i ], geometry );
		dotNL = dot( geometry.normal, directLight.direction );
		directLightColor_Diffuse = PI * directLight.color;
		vLightFront += saturate( dotNL ) * directLightColor_Diffuse;
		#ifdef DOUBLE_SIDED
			vLightBack += saturate( -dotNL ) * directLightColor_Diffuse;
		#endif
	}
	#endif
#if NUM_DIR_LIGHTS > 0
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directLight = getDirectionalDirectLight( directionalLights[ i ], geometry );
		dotNL = dot( geometry.normal, directLight.direction );
		directLightColor_Diffuse = PI * directLight.color;
		vLightFront += saturate( dotNL ) * directLightColor_Diffuse;
		#ifdef DOUBLE_SIDED
			vLightBack += saturate( -dotNL ) * directLightColor_Diffuse;
		#endif
	}
	#endif
#if NUM_HEMI_LIGHTS > 0
	for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
		vLightFront += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );
		#ifdef DOUBLE_SIDED
			vLightBack += getHemisphereLightIrradiance( hemisphereLights[ i ], backGeometry );
		#endif
	}
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/lights_pars.glsl

THREE.ShaderChunk[ 'lights_pars' ] = `#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
		int shadow;
		float shadowBias;
		float shadowRadius;
		vec2 shadowMapSize;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	IncidentLight getDirectionalDirectLight( const in DirectionalLight directionalLight, const in GeometricContext geometry ) {
		IncidentLight directLight;
		directLight.color = directionalLight.color;
		directLight.direction = directionalLight.direction;
		directLight.visible = true;
		return directLight;
	}
	#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
		int shadow;
		float shadowBias;
		float shadowRadius;
		vec2 shadowMapSize;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	IncidentLight getPointDirectLight( const in PointLight pointLight, const in GeometricContext geometry ) {
		IncidentLight directLight;
		vec3 lVector = pointLight.position - geometry.position;
		directLight.direction = normalize( lVector );
		float lightDistance = length( lVector );
		if ( testLightInRange( lightDistance, pointLight.distance ) ) {
			directLight.color = pointLight.color;
			directLight.color *= calcLightAttenuation( lightDistance, pointLight.distance, pointLight.decay );
			directLight.visible = true;
		} else {
			directLight.color = vec3( 0.0 );
			directLight.visible = false;
		}
		return directLight;
	}
	#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float angleCos;
		float penumbra;
		int shadow;
		float shadowBias;
		float shadowRadius;
		vec2 shadowMapSize;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	IncidentLight getSpotDirectLight( const in SpotLight spotLight, const in GeometricContext geometry ) {
		IncidentLight directLight;
		vec3 lVector = spotLight.position - geometry.position;
		directLight.direction = normalize( lVector );
		float lightDistance = length( lVector );
		float spotEffect = dot( directLight.direction, spotLight.direction );
		if ( all( bvec2( spotEffect > spotLight.angleCos, testLightInRange( lightDistance, spotLight.distance ) ) ) ) {
			float spotEffect = dot( spotLight.direction, directLight.direction );
			spotEffect *= clamp( ( spotEffect - spotLight.angleCos ) / spotLight.penumbra, 0.0, 1.0 );
			directLight.color = spotLight.color;
			directLight.color *= ( spotEffect * calcLightAttenuation( lightDistance, spotLight.distance, spotLight.decay ) );
			directLight.visible = true;
		} else {
			directLight.color = vec3( 0.0 );
			directLight.visible = false;
		}
		return directLight;
	}
	#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in GeometricContext geometry ) {
		float dotNL = dot( geometry.normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		return PI * mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
	}
	#endif
#if defined( USE_ENVMAP ) && defined( STANDARD )
	vec3 getLightProbeIndirectIrradiance( const in GeometricContext geometry, const in int maxMIPLevel ) {
		#ifdef DOUBLE_SIDED
			float flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );
		#else
			float flipNormal = 1.0;
		#endif
		vec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );
		#ifdef ENVMAP_TYPE_CUBE
			vec3 queryVec = flipNormal * vec3( flipEnvMap * worldNormal.x, worldNormal.yz );
			#ifdef TEXTURE_LOD_EXT
				vec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );
			#else
				vec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );
			#endif
		#else
			vec3 envMapColor = vec3( 0.0 );
		#endif
		envMapColor.rgb = inputToLinear( envMapColor.rgb );
		return PI * envMapColor.rgb * envMapIntensity;
	}
	float getSpecularMIPLevel( const in float blinnShininessExponent, const in int maxMIPLevel ) {
		float maxMIPLevelScalar = float( maxMIPLevel );
		float desiredMIPLevel = maxMIPLevelScalar - 0.79248 - 0.5 * log2( square( blinnShininessExponent ) + 1.0 );
		return clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );
	}
	vec3 getLightProbeIndirectRadiance( const in GeometricContext geometry, const in float blinnShininessExponent, const in int maxMIPLevel ) {
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( -geometry.viewDir, geometry.normal );
		#else
			vec3 reflectVec = refract( -geometry.viewDir, geometry.normal, refractionRatio );
		#endif
		#ifdef DOUBLE_SIDED
			float flipNormal = ( float( gl_FrontFacing ) * 2.0 - 1.0 );
		#else
			float flipNormal = 1.0;
		#endif
		reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
		float specularMIPLevel = getSpecularMIPLevel( blinnShininessExponent, maxMIPLevel );
		#ifdef ENVMAP_TYPE_CUBE
			vec3 queryReflectVec = flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz );
			#ifdef TEXTURE_LOD_EXT
				vec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );
			#else
				vec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );
			#endif
		#elif defined( ENVMAP_TYPE_EQUIREC )
			vec2 sampleUV;
			sampleUV.y = saturate( flipNormal * reflectVec.y * 0.5 + 0.5 );
			sampleUV.x = atan( flipNormal * reflectVec.z, flipNormal * reflectVec.x ) * RECIPROCAL_PI2 + 0.5;
			#ifdef TEXTURE_LOD_EXT
				vec4 envMapColor = texture2DLodEXT( envMap, sampleUV, specularMIPLevel );
			#else
				vec4 envMapColor = texture2D( envMap, sampleUV, specularMIPLevel );
			#endif
		#elif defined( ENVMAP_TYPE_SPHERE )
			vec3 reflectView = flipNormal * normalize((viewMatrix * vec4( reflectVec, 0.0 )).xyz + vec3(0.0,0.0,1.0));
			#ifdef TEXTURE_LOD_EXT
				vec4 envMapColor = texture2DLodEXT( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );
			#else
				vec4 envMapColor = texture2D( envMap, reflectView.xy * 0.5 + 0.5, specularMIPLevel );
			#endif
		#endif
		envMapColor.rgb = inputToLinear( envMapColor.rgb );
		return envMapColor.rgb * envMapIntensity;
	}
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/lights_phong_fragment.glsl

THREE.ShaderChunk[ 'lights_phong_fragment' ] = `BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;
`;

// File:src/renderers/shaders/ShaderChunk/lights_phong_pars_fragment.glsl

THREE.ShaderChunk[ 'lights_phong_pars_fragment' ] = `#ifdef USE_ENVMAP
	varying vec3 vWorldPosition;
	#endif
varying vec3 vViewPosition;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#endif
struct BlinnPhongMaterial {
	vec3	diffuseColor;
	vec3	specularColor;
	float	specularShininess;
	float	specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * PI * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_Specular_BlinnPhong( directLight, geometry, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
#define Material_LightProbeLOD( material )	(0)
`;

// File:src/renderers/shaders/ShaderChunk/lights_phong_pars_vertex.glsl

THREE.ShaderChunk[ 'lights_phong_pars_vertex' ] = `#ifdef USE_ENVMAP
	varying vec3 vWorldPosition;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/lights_phong_vertex.glsl

THREE.ShaderChunk[ 'lights_phong_vertex' ] = `#ifdef USE_ENVMAP
	vWorldPosition = worldPosition.xyz;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/lights_standard_fragment.glsl

THREE.ShaderChunk[ 'lights_standard_fragment' ] = `StandardMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.specularRoughness = clamp( roughnessFactor, 0.04, 1.0 );
material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
`;

// File:src/renderers/shaders/ShaderChunk/lights_standard_pars_fragment.glsl

THREE.ShaderChunk[ 'lights_standard_pars_fragment' ] = `struct StandardMaterial {
	vec3	diffuseColor;
	float	specularRoughness;
	vec3	specularColor;
};
void RE_Direct_Standard( const in IncidentLight directLight, const in GeometricContext geometry, const in StandardMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * PI * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_Specular_GGX( directLight, geometry, material.specularColor, material.specularRoughness );
}
void RE_IndirectDiffuse_Standard( const in vec3 irradiance, const in GeometricContext geometry, const in StandardMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Standard( const in vec3 radiance, const in GeometricContext geometry, const in StandardMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectSpecular += radiance * BRDF_Specular_GGX_Environment( geometry, material.specularColor, material.specularRoughness );
}
#define RE_Direct				RE_Direct_Standard
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Standard
#define RE_IndirectSpecular		RE_IndirectSpecular_Standard
#define Material_BlinnShininessExponent( material )   GGXRoughnessToBlinnExponent( material.specularRoughness )
`;

// File:src/renderers/shaders/ShaderChunk/lights_template.glsl

THREE.ShaderChunk[ 'lights_template' ] = `
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = normalize( vViewPosition );
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		directLight = getPointDirectLight( pointLight, geometry );
		#ifdef USE_SHADOWMAP
		directLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		directLight = getSpotDirectLight( spotLight, geometry );
		#ifdef USE_SHADOWMAP
		directLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		directLight = getDirectionalDirectLight( directionalLight, geometry );
		#ifdef USE_SHADOWMAP
		directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#endif
#if defined( RE_IndirectDiffuse )
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#ifdef USE_LIGHTMAP
		irradiance += PI * texture2D( lightMap, vUv2 ).xyz * lightMapIntensity;
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );
		}
	#endif
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
	#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	vec3 radiance = getLightProbeIndirectRadiance( geometry, Material_BlinnShininessExponent( material ), 8 );
	RE_IndirectSpecular( radiance, geometry, material, reflectedLight );
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/linear_to_gamma_fragment.glsl

THREE.ShaderChunk[ 'linear_to_gamma_fragment' ] = `
	outgoingLight = linearToOutput( outgoingLight );
	`;

// File:src/renderers/shaders/ShaderChunk/logdepthbuf_fragment.glsl

THREE.ShaderChunk[ 'logdepthbuf_fragment' ] = `#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)
	gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/logdepthbuf_pars_fragment.glsl

THREE.ShaderChunk[ 'logdepthbuf_pars_fragment' ] = `#ifdef USE_LOGDEPTHBUF
	uniform float logDepthBufFC;
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/logdepthbuf_pars_vertex.glsl

THREE.ShaderChunk[ 'logdepthbuf_pars_vertex' ] = `#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
	#endif
	uniform float logDepthBufFC;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/logdepthbuf_vertex.glsl

THREE.ShaderChunk[ 'logdepthbuf_vertex' ] = `#ifdef USE_LOGDEPTHBUF
	gl_Position.z = log2(max( EPSILON, gl_Position.w + 1.0 )) * logDepthBufFC;
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
	#else
		gl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/map_fragment.glsl

THREE.ShaderChunk[ 'map_fragment' ] = `#ifdef USE_MAP
	vec4 texelColor = texture2D( map, vUv );
	texelColor.xyz = inputToLinear( texelColor.xyz );
	diffuseColor *= texelColor;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/map_pars_fragment.glsl

THREE.ShaderChunk[ 'map_pars_fragment' ] = `#ifdef USE_MAP
	uniform sampler2D map;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/map_particle_fragment.glsl

THREE.ShaderChunk[ 'map_particle_fragment' ] = `#ifdef USE_MAP
	diffuseColor *= texture2D( map, vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) * offsetRepeat.zw + offsetRepeat.xy );
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/map_particle_pars_fragment.glsl

THREE.ShaderChunk[ 'map_particle_pars_fragment' ] = `#ifdef USE_MAP
	uniform vec4 offsetRepeat;
	uniform sampler2D map;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/metalnessmap_fragment.glsl

THREE.ShaderChunk[ 'metalnessmap_fragment' ] = `float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vUv );
	metalnessFactor *= texelMetalness.r;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/metalnessmap_pars_fragment.glsl

THREE.ShaderChunk[ 'metalnessmap_pars_fragment' ] = `#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/morphnormal_vertex.glsl

THREE.ShaderChunk[ 'morphnormal_vertex' ] = `#ifdef USE_MORPHNORMALS
	objectNormal += ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];
	objectNormal += ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];
	objectNormal += ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];
	objectNormal += ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/morphtarget_pars_vertex.glsl

THREE.ShaderChunk[ 'morphtarget_pars_vertex' ] = `#ifdef USE_MORPHTARGETS
	#ifndef USE_MORPHNORMALS
	uniform float morphTargetInfluences[ 8 ];
	#else
	uniform float morphTargetInfluences[ 4 ];
	#endif
	#endif`;

// File:src/renderers/shaders/ShaderChunk/morphtarget_vertex.glsl

THREE.ShaderChunk[ 'morphtarget_vertex' ] = `#ifdef USE_MORPHTARGETS
	transformed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];
	transformed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];
	transformed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];
	transformed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];
	#ifndef USE_MORPHNORMALS
	transformed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];
	transformed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];
	transformed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];
	transformed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/normal_fragment.glsl

THREE.ShaderChunk[ 'normal_fragment' ] = `#ifdef FLAT_SHADED
	vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );
	vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );
	vec3 normal = normalize( cross( fdx, fdy ) );
	#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal = normal * ( -1.0 + 2.0 * float( gl_FrontFacing ) );
	#endif
	#endif
#ifdef USE_NORMALMAP
	normal = perturbNormal2Arb( -vViewPosition, normal );
	#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/normalmap_pars_fragment.glsl

THREE.ShaderChunk[ 'normalmap_pars_fragment' ] = `#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( vUv.st );
		vec2 st1 = dFdy( vUv.st );
		vec3 S = normalize( q0 * st1.t - q1 * st0.t );
		vec3 T = normalize( -q0 * st1.s + q1 * st0.s );
		vec3 N = normalize( surf_norm );
		vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
		mapN.xy = normalScale * mapN.xy;
		mat3 tsn = mat3( S, T, N );
		return normalize( tsn * mapN );
	}
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/project_vertex.glsl

THREE.ShaderChunk[ 'project_vertex' ] = `#ifdef USE_SKINNING
	vec4 mvPosition = modelViewMatrix * skinned;
	#else
	vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
	#endif
gl_Position = projectionMatrix * mvPosition;
`;

// File:src/renderers/shaders/ShaderChunk/roughnessmap_fragment.glsl

THREE.ShaderChunk[ 'roughnessmap_fragment' ] = `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vUv );
	roughnessFactor *= texelRoughness.r;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/roughnessmap_pars_fragment.glsl

THREE.ShaderChunk[ 'roughnessmap_pars_fragment' ] = `#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl

THREE.ShaderChunk[ 'shadowmap_pars_fragment' ] = `#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHTS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHTS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];
	#endif
	#if NUM_SPOT_LIGHTS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHTS ];
		varying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];
	#endif
	#if NUM_POINT_LIGHTS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHTS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];
	#endif
	float unpackDepth( const in vec4 rgba_depth ) {
		const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
		return dot( rgba_depth, bit_shift );
	}
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackDepth( texture2D( depths, uv ) ) );
	}
	float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {
		const vec2 offset = vec2( 0.0, 1.0 );
		vec2 texelSize = vec2( 1.0 ) / size;
		vec2 centroidUV = floor( uv * size + 0.5 ) / size;
		float lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );
		float lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );
		float rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );
		float rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );
		vec2 f = fract( uv * size + 0.5 );
		float a = mix( lb, lt, f.y );
		float b = mix( rb, rt, f.y );
		float c = mix( a, b, f.x );
		return c;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
		bool inFrustum = all( inFrustumVec );
		bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
		bool frustumTest = all( frustumTestVec );
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			return (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			return (
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return 1.0;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		float dp = ( length( lightToPosition ) - shadowBias ) / 1000.0;
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/shadowmap_pars_vertex.glsl

THREE.ShaderChunk[ 'shadowmap_pars_vertex' ] = `#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHTS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHTS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHTS ];
	#endif
	#if NUM_SPOT_LIGHTS > 0
		uniform mat4 spotShadowMatrix[ NUM_SPOT_LIGHTS ];
		varying vec4 vSpotShadowCoord[ NUM_SPOT_LIGHTS ];
	#endif
	#if NUM_POINT_LIGHTS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHTS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHTS ];
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/shadowmap_vertex.glsl

THREE.ShaderChunk[ 'shadowmap_vertex' ] = `#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHTS > 0
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * worldPosition;
	}
	#endif
	#if NUM_SPOT_LIGHTS > 0
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		vSpotShadowCoord[ i ] = spotShadowMatrix[ i ] * worldPosition;
	}
	#endif
	#if NUM_POINT_LIGHTS > 0
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * worldPosition;
	}
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/shadowmask_pars_fragment.glsl

THREE.ShaderChunk[ 'shadowmask_pars_fragment' ] = `float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHTS > 0
	DirectionalLight directionalLight;
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		shadow *= bool( directionalLight.shadow ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#endif
	#if NUM_SPOT_LIGHTS > 0
	SpotLight spotLight;
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		shadow *= bool( spotLight.shadow ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
	}
	#endif
	#if NUM_POINT_LIGHTS > 0
	PointLight pointLight;
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		shadow *= bool( pointLight.shadow ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;
	}
	#endif
	#endif
	return shadow;
}
`;

// File:src/renderers/shaders/ShaderChunk/skinbase_vertex.glsl

THREE.ShaderChunk[ 'skinbase_vertex' ] = `#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
	#endif`;

// File:src/renderers/shaders/ShaderChunk/skinning_pars_vertex.glsl

THREE.ShaderChunk[ 'skinning_pars_vertex' ] = `#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	#ifdef BONE_TEXTURE
		uniform sampler2D boneTexture;
		uniform int boneTextureWidth;
		uniform int boneTextureHeight;
		mat4 getBoneMatrix( const in float i ) {
			float j = i * 4.0;
			float x = mod( j, float( boneTextureWidth ) );
			float y = floor( j / float( boneTextureWidth ) );
			float dx = 1.0 / float( boneTextureWidth );
			float dy = 1.0 / float( boneTextureHeight );
			y = dy * ( y + 0.5 );
			vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
			vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
			vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
			vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
			mat4 bone = mat4( v1, v2, v3, v4 );
			return bone;
		}
	#else
		uniform mat4 boneGlobalMatrices[ MAX_BONES ];
		mat4 getBoneMatrix( const in float i ) {
			mat4 bone = boneGlobalMatrices[ int(i) ];
			return bone;
		}
	#endif
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/skinning_vertex.glsl

THREE.ShaderChunk[ 'skinning_vertex' ] = `#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	skinned  = bindMatrixInverse * skinned;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/skinnormal_vertex.glsl

THREE.ShaderChunk[ 'skinnormal_vertex' ] = `#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/specularmap_fragment.glsl

THREE.ShaderChunk[ 'specularmap_fragment' ] = `float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;
	#else
	specularStrength = 1.0;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/specularmap_pars_fragment.glsl

THREE.ShaderChunk[ 'specularmap_pars_fragment' ] = `#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/uv2_pars_fragment.glsl

THREE.ShaderChunk[ 'uv2_pars_fragment' ] = `#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	varying vec2 vUv2;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/uv2_pars_vertex.glsl

THREE.ShaderChunk[ 'uv2_pars_vertex' ] = `#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/uv2_vertex.glsl

THREE.ShaderChunk[ 'uv2_vertex' ] = `#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = uv2;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/uv_pars_fragment.glsl

THREE.ShaderChunk[ 'uv_pars_fragment' ] = `#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
	varying vec2 vUv;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/uv_pars_vertex.glsl

THREE.ShaderChunk[ 'uv_pars_vertex' ] = `#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
	varying vec2 vUv;
	uniform vec4 offsetRepeat;
	#endif
`;

// File:src/renderers/shaders/ShaderChunk/uv_vertex.glsl

THREE.ShaderChunk[ 'uv_vertex' ] = `#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP ) || defined( USE_EMISSIVEMAP ) || defined( USE_ROUGHNESSMAP ) || defined( USE_METALNESSMAP )
	vUv = uv * offsetRepeat.zw + offsetRepeat.xy;
	#endif`;

// File:src/renderers/shaders/ShaderChunk/worldpos_vertex.glsl

THREE.ShaderChunk[ 'worldpos_vertex' ] = `#if defined( USE_ENVMAP ) || defined( PHONG ) || defined( STANDARD ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )
	#ifdef USE_SKINNING
		vec4 worldPosition = modelMatrix * skinned;
	#else
		vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
	#endif
	#endif
`;

// File:src/renderers/shaders/UniformsUtils.js
