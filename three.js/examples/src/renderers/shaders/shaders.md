# shader chunk 掌握情况

* common<!-- 有点多 暂时不写 -->

## vertex

* batching_pars_vertex
	>* attribute batchId
	>* uniform highp sampler2D batchingTexture
	>* mat4 getBatchingMatrix( const in float i ) {}

* uv_pars_vertex
	>* varying vec2 vUv;

	>* uniform mat3 mapTransform;
	>* varying vec2 vMapUv;

	>* uniform mat3 alphaMapTransform;
	>* varying vec2 vAlphaMapUv;

	>* uniform mat3 lightMapTransform;
	>* varying vec2 vLightMapUv;

	>* uniform mat3 aoMapTransform;
	>* varying vec2 vAoMapUv;

	>* uniform mat3 bumpMapTransform;
	>* varying vec2 vBumpMapUv;

	>* uniform mat3 normalMapTransform;
	>* varying vec2 vNormalMapUv;

	>* uniform mat3 displacementMapTransform;
	>* varying vec2 vDisplacementMapUv;

	>* uniform mat3 emissiveMapTransform;
	>* varying vec2 vEmissiveMapUv;

	>* uniform mat3 metalnessMapTransform;
	>* varying vec2 vMetalnessMapUv;

	>* uniform mat3 roughnessMapTransform;
	>* varying vec2 vRoughnessMapUv;

	>* uniform mat3 anisotropyMapTransform;
	>* varying vec2 vAnisotropyMapUv;

	>* uniform mat3 clearcoatMapTransform;
	>* varying vec2 vClearcoatMapUv;

	>* uniform mat3 clearcoatNormalMapTransform;
	>* varying vec2 vClearcoatNormalMapUv;

	>* uniform mat3 clearcoatRoughnessMapTransform;
	>* varying vec2 vClearcoatRoughnessMapUv;

	>* uniform mat3 sheenColorMapTransform;
	>* varying vec2 vSheenColorMapUv;

	>* uniform mat3 sheenRoughnessMapTransform;
	>* varying vec2 vSheenRoughnessMapUv;

	>* uniform mat3 iridescenceMapTransform;
	>* varying vec2 vIridescenceMapUv;

	>* uniform mat3 iridescenceThicknessMapTransform;
	>* varying vec2 vIridescenceThicknessMapUv;

	>* uniform mat3 specularMapTransform;
	>* varying vec2 vSpecularMapUv;

	>* uniform mat3 specularColorMapTransform;
	>* varying vec2 vSpecularColorMapUv;

	>* uniform mat3 specularIntensityMapTransform;
	>* varying vec2 vSpecularIntensityMapUv;

	>* uniform mat3 transmissionMapTransform;
	>* varying vec2 vTransmissionMapUv;

	>* uniform mat3 thicknessMapTransform;
	>* varying vec2 vThicknessMapUv;

* envmap_pars_vertex
	>* varying vec3 vWorldPosition;
	>* varying vec3 vReflect;
	>* uniform float refractionRatio;

* color_pars_vertex
	>* varying vec4 vColor;
	>* varying vec3 vColor;

* fog_pars_vertex
	>* varying float vFogDepth;

* morphtarget_pars_vertex
	>* uniform float morphTargetBaseInfluence;

	>* uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];

	>* uniform sampler2DArray morphTargetsTexture;
	>* uniform ivec2 morphTargetsTextureSize;
	>* vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {}

	>* uniform float morphTargetInfluences[ 8 ];

	>* uniform float morphTargetInfluences[ 4 ];

* skinning_pars_vertex
	>* uniform mat4 bindMatrix;
	>* uniform mat4 bindMatrixInverse;

	>* uniform highp sampler2D boneTexture;

	>* mat4 getBoneMatrix( const in float i ) {}

* logdepthbuf_pars_vertex
	>* varying float vFragDepth;
	>* varying float vIsPerspective;

* clipping_planes_pars_vertex
	>* varying vec3 vClipPosition;

* uv_vertex
	>* uv_vertex

	>* vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;

	>* vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;

	>* vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;

	>* vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;

	>* vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;

	>* vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;

	>* vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;

	>* vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;

	>* vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;

	>* vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;

	>* vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;

	>* vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;

	>* vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;

	>* vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;

	>* vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;

	>* vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;

	>* vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;

	>* vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;

	>* vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;

	>* vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;

	>* vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;

	>* vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;

	>* vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;

* color_vertex
	>* vColor \*= color; vColor.xyz \*= instanceColor.xyz;

* morphinstance_vertex
	>* float morphTargetInfluences[MORPHTARGETS_COUNT];
	>* float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;

* morphcolor_vertex
	>* vColor \*= morphTargetBaseInfluence; vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ]; vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];

* batching_vertex
	>* mat4 batchingMatrix = getBatchingMatrix( batchId );

* beginnormal_vertex
	>* vec3 objectNormal
	>* vec3 objectTangent

* morphnormal_vertex
	>* objectNormal \*= morphTargetBaseInfluence; objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ]; objectNormal += morphNormal0 * morphTargetInfluences[ 0 ]; objectNormal += morphNormal1 * morphTargetInfluences[ 1 ]; objectNormal += morphNormal2 * morphTargetInfluences[ 2 ]; objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];

* skinbase_vertex
	>* mat4 boneMatX = getBoneMatrix( skinIndex.x );
	>* mat4 boneMatY = getBoneMatrix( skinIndex.y );
	>* mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	>* mat4 boneMatW = getBoneMatrix( skinIndex.w );

* skinnormal_vertex
	>* mat4 skinMatrix = mat4( 0.0 ); skinMatrix += ; skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	>* objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	>* objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;

* defaultnormal_vertex
	>* vec3 transformedNormal = objectNormal;
	>* vec3 transformedTangent = objectTangent;

	>* mat3 bm = mat3( batchingMatrix );

	>* mat3 im = mat3( instanceMatrix );

* begin_vertex
	>* vec3 transformed = vec3( position );
	>* vPosition = vec3( position );

* morphtarget_vertex
	>* transformed \*= morphTargetBaseInfluence;
	>* transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	>* transformed +=;

* skinning_vertex
	>* vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	>* vec4 skinned = vec4( 0.0 ); skinned += ;
	>* transformed = ( bindMatrixInverse * skinned ).xyz;

* project_vertex
	>* vec4 mvPosition = vec4( transformed, 1.0 );
	>* mvPosition = batchingMatrix * mvPosition; mvPosition = instanceMatrix * mvPosition; mvPosition = modelViewMatrix * mvPosition;
	>* gl_Position = projectionMatrix * mvPosition;

* logdepthbuf_vertex
	>* vFragDepth = 1.0 + gl_Position.w;
	>* vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );

* clipping_planes_vertex
	>* vClipPosition = - mvPosition.xyz;

* worldpos_vertex
	>* vec4 worldPosition = vec4( transformed, 1.0 ); worldPosition = ;

* envmap_vertex
	>* vWorldPosition = worldPosition.xyz;
	>* vec3 cameraToVertex;
	>* vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	>* vReflect =;

* fog_vertex
	>* vFogDepth = - mvPosition.z;

## fragment

* dithering_pars_fragment
	>* vec3 dithering( vec3 color ) {}

* color_pars_fragment
	>* varying vec4 vColor;
	>* varying vec3 vColor;

* uv_pars_fragment
	>* varying vec2 vUv;
	>* varying vec2 vMapUv;
	>* varying vec2 vAlphaMapUv;
	>* varying vec2 vLightMapUv;
	>* varying vec2 vAoMapUv;
	>* varying vec2 vBumpMapUv;
	>* varying vec2 vNormalMapUv;
	>* varying vec2 vEmissiveMapUv;
	>* varying vec2 vMetalnessMapUv;
	>* varying vec2 vRoughnessMapUv;
	>* varying vec2 vAnisotropyMapUv;
	>* varying vec2 vClearcoatMapUv;
	>* varying vec2 vClearcoatNormalMapUv;
	>* varying vec2 vClearcoatRoughnessMapUv;
	>* varying vec2 vIridescenceMapUv;
	>* varying vec2 vIridescenceThicknessMapUv;
	>* varying vec2 vSheenColorMapUv;
	>* varying vec2 vSheenRoughnessMapUv;
	>* varying vec2 vSpecularMapUv;
	>* varying vec2 vSpecularColorMapUv;
	>* varying vec2 vSpecularIntensityMapUv;

	>* uniform mat3 transmissionMapTransform;
	>* varying vec2 vTransmissionMapUv;

	>* uniform mat3 thicknessMapTransform;
	>* varying vec2 vThicknessMapUv;

* map_pars_fragment
	>* uniform sampler2D map;

* alphamap_pars_fragment
	>* uniform sampler2D alphaMap;

* alphatest_pars_fragment
	>* uniform float alphaTest;

* alphahash_pars_fragment
	>* const float ALPHA_HASH_SCALE = 0.05;
	>* float hash2D( vec2 value ) {}
	>* float hash3D( vec3 value ) {}
	>* float getAlphaHashThreshold( vec3 position ) {}

* aomap_pars_fragment
	>* uniform sampler2D aoMap;
	>* uniform float aoMapIntensity;

* lightmap_pars_fragment
	>* uniform sampler2D lightMap;
	>* uniform float lightMapIntensity;

* envmap_common_pars_fragment
	>* uniform float envMapIntensity;
	>* uniform float flipEnvMap;
	>* uniform mat3 envMapRotation;
	>* uniform samplerCube envMap;
	>* uniform sampler2D envMap;

* envmap_common_pars_fragment
	>* uniform float envMapIntensity;
	>* uniform float flipEnvMap;
	>* uniform mat3 envMapRotation;
	>* uniform samplerCube envMap;
	>* uniform sampler2D envMap;

* envmap_pars_fragment
	>* uniform float reflectivity;
	>* varying vec3 vWorldPosition;
	>* uniform float refractionRatio;
	>* varying vec3 vReflect;

* fog_pars_fragment
	>* uniform vec3 fogColor;
	>* varying float vFogDepth;
	>* uniform float fogDensity;
	>* uniform float fogNear;
	>* uniform float fogFar;

* specularmap_pars_fragment
	>* uniform sampler2D specularMap;

* logdepthbuf_pars_fragment
	>* uniform float logDepthBufFC;
	>* varying float vFragDepth;
	>* varying float vIsPerspective;

* clipping_planes_pars_fragment
	>* varying vec3 vClipPosition;
	>* uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];

* clipping_planes_fragment <!-- 逻辑有点麻烦，建议直接学习代码 -->

* logdepthbuf_fragment
	>* gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;

* map_fragment
	>* vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	>* sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	>* diffuseColor \*= sampledDiffuseColor;

* color_fragment
	>* diffuseColor \*= vColor;
	>* diffuseColor.rgb \*= vColor;

* alphamap_fragment
	>* diffuseColor.a \*= texture2D( alphaMap, vAlphaMapUv ).g;

* alphatest_fragment
	>* diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );

* alphahash_fragment
	>* if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;

* specularmap_fragment
	>* vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	>* specularStrength = texelSpecular.r;
	>* specularStrength = 1.0;

* aomap_fragment
	>* float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	>* clearcoatSpecularIndirect \*= ambientOcclusion;
	>* sheenSpecularIndirect \*= ambientOcclusion;
	>* float dotNV = saturate( dot( geometryNormal, geometryViewDir ) ); reflectedLight.indirectSpecular \*= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

* envmap_fragment
	>* vec3 cameraToFrag
	>* vec3 reflectVec
	>* vec4 envColor
	>* outgoingLight =;

* opaque_fragment
	>* diffuseColor.a =
	>* gl_FragColor = vec4( outgoingLight, diffuseColor.a );

* tonemapping_fragment
	>* gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );

* colorspace_fragment
	>* gl_FragColor = linearToOutputTexel( gl_FragColor );

* fog_fragment
	>* float fogFactor =
	>* gl_FragColor.rgb =

* premultiplied_alpha_fragment
	>* gl_FragColor.rgb \*= gl_FragColor.a;

* dithering_fragment
	>* gl_FragColor.rgb = dithering( gl_FragColor.rgb );

<!--
- [x] FOG: 接收 gl_FragColor, 赋值 gl_FragColor

- [ ] ENVIRONMENT MAP

- [x] COLOR MAP (particles): 接收 gl_FragColor, 赋值 gl_FragColor

- [x] LIGHT MAP: 接收 gl_FragColor, 赋值 gl_FragColor

- [ ] BUMP MAP

- [ ] SPECULAR MAP

- [ ] LIGHTS LAMBERT

- [ ] LIGHTS PHONG

- [ ] VERTEX COLORS

- [ ] SKINNING

- [ ] MORPHING

- [ ] SHADOW MAP

- [x] ALPHATEST

- [ ] LINEAR SPACE
 -->

# shader chunk 划分

* batching
	>* batching_pars_vertex
	>* batching_vertex

* uv
	>* uv_pars_vertex
	>* uv_vertex

* color
	>* color_pars_vertex
	>* color_vertex

* morphinstance
	>* morphtarget_pars_vertex
	>* morphinstance_vertex


# shader lib 掌握情况



<!--
- [x] depth

- [x] normal

- [ ] basic

- [ ] lambert

- [ ] phong

- [ ] particle_basic

- [ ] dashed

- [ ] depthRGBA
 -->