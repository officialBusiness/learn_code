# default.vertex.fx


## 简介流程

1. define REFLECTION 纹理 mode 类型: MAP_EXPLICIT , MAP_SPHERICAL , MAP_PLANAR , MAP_CUBIC , MAP_PROJECTION , MAP_SKYBOX

2. 传入属性 position , normal , uv , uv2 , color

3. mvp 矩阵相关: world , view , worldViewProjection

4. 各个纹理贴图:
	>* DIFFUSE: vUv , matrix , infos
	>* AMBIENT: vUv , matrix , infos
	>* OPACITY: vUv , matrix , infos
	>* REFLECTION: vEyePosition , vUv , matrix , infos ,
	>* EMISSIVE: vUv , matrix , infos
	>* SPECULAR: vUv , matrix , infos
	>* BUMP: vUv , matrix , infos

5. varying 差值输出:
	>* vPositionW , vNormalW , vColor
	>* CLIPPLANE: vClipPlane , fClipDistance;
	>* FOG: fFogDistance
	>* SHADOWS: lightMatrix , vPositionFromLight

6. REFLECTION: computeReflectionCoords

7. main
	>* 赋值 gl_Position

	>* varying 差值输出:
		>>* 赋值 vPositionW , vNormalW
		>>* 赋值各个纹理 vUv
			>>>* vDiffuseUV
			>>>* vAmbientUV
			>>>* vOpacityUV
			>>>* vReflectionUVW
			>>>* vEmissiveUV
			>>>* vSpecularUV
			>>>* vBumpUV
		>>* 赋值 fClipDistance
		>>* 赋值 fFogDistance
		>>* 赋值灯光 vPositionFromLight0 , vPositionFromLight1 , vPositionFromLight2 , vPositionFromLight3
		>>* 赋值 vColor


## 参数类型

1. attribute 输入 vec3 position , vec3 normal , vec2 uv , vec2 uv2 , vec3 color

2. uniform 输入
	>* mvp 矩阵: mat4 world, mat4 view, mat4 worldViewProjection
	>* 纹理信息:
		>>* DIFFUSE: mat4 diffuseMatrix , vec2 vDiffuseInfos
		>>* AMBIENT: mat4 ambientMatrix , vec2 vAmbientInfos
		>>* OPACITY: mat4 opacityMatrix , vec2 vOpacityInfos
		>>* REFLECTION: mat4 reflectionMatrix , vec3 vReflectionInfos , vec3 vEyePosition
		>>* EMISSIVE: mat4 emissiveMatrix , vec2 vEmissiveInfos
		>>* SPECULAR: mat4 specularMatrix , vec2 vSpecularInfos
		>>* BUMP: mat4 bumpMatrix , vec2 vBumpInfos
	>* CLIPPLANE: vec4 vClipPlane
	>* 光照阴影: mat4 lightMatrix

3. varying 传输:
	>* 纹理 uv:
		>>* DIFFUSE: vec2 vDiffuseUV
		>>* AMBIENT: vec2 vAmbientUV
		>>* OPACITY: vec2 vOpacityUV
		>>* REFLECTION: vec3 vReflectionUVW
		>>* EMISSIVE: vec2 vEmissiveUV
		>>* SPECULAR: vec2 vSpecularUV
		>>* BUMP: vec2 vBumpUV
	>* attribute 属性: vec3 vPositionW, vec3 vNormalW, vec3 vColor
	>* CLIPPLANE: float fClipDistance
	>* FOG: float fFogDistance
	>* 光照阴影: vec4 vPositionFromLight

4. 方法:
	>* REFLECTION computeReflectionCoords


# default.fragment.fx


## 简介流程

1. uniform 常量: vEyePosition , vAmbientColor , vDiffuseColor , vSpecularColor , vEmissiveColor


2. 属性 varying 传输: vPositionW , vNormalW , vColor


3. 光照: vLightData , vLightDiffuse , vLightSpecular , vPositionFromLight , shadowSampler , vLightDirection , vLightGround

4. 纹理信息:
	>* DIFFUSE: vDiffuseUV , diffuseSampler , vDiffuseInfos
	>* AMBIENT: vAmbientUV , ambientSampler , vAmbientInfos
	>* OPACITY: vOpacityUV , opacitySampler , vOpacityInfos
	>* REFLECTION: vReflectionUVW , reflectionCubeSampler , reflection2DSampler , vReflectionInfos
	>* EMISSIVE: vEmissiveUV , vEmissiveInfos , emissiveSampler
	>* SPECULAR: vSpecularUV , vSpecularInfos , specularSampler

5. SHADOWS: unpack , unpackHalf , computeShadow , ChebychevInequality , computeShadowWithVSM

6. BUMP:
	>* vBumpUV , vBumpInfos , bumpSampler
	>* cotangent_frame , perturbNormal

7. CLIPPLANE: fClipDistance

8. FOG:
	>* FOGMODE_NONE , FOGMODE_EXP , FOGMODE_EXP2 , FOGMODE_LINEAR , E
	>* vFogInfos , vFogColor , fFogDistance
	>* CalcFogFactor

9. 光照计算函数: computeLighting , computeSpotLighting , computeHemisphericLighting

10. main
	>* fClipDistance 判定是否 discard
	>* viewDirectionW 声明

	>* baseColor , diffuseColor 声明
	>* diffuseColor 乘 vColor
	>* baseColor 赋值为 diffuseSampler ; 判断是否 ALPHATEST discard ; baseColor 乘 vDiffuseInfos.y

	>* normalW 赋值

	>* baseAmbientColor 声明 ; 赋值为 ambientSampler 并且乘 vAmbientInfos.y

	>* diffuseBase , specularBase 声明

	>* shadow 声明
	>* 计算光照得到 info
	>* 根据 vPositionFromLight , shadowSampler 计算 shadow

	>* diffuseBase 加上 info.diffuse 并且乘 shadow
	>* specularBase 加上 info.specular 并且乘 shadow

	>* reflectionColor 声明
	>* reflectionColor 根据情况赋值为 reflectionCubeSampler 或者 reflection2DSampler 并且乘 vReflectionInfos.y

	>* alpha 声明赋值为 vDiffuseColor.a;
	>* opacityMap 声明赋值为 opacitySampler 并且乘 vec3(0.3, 0.59, 0.11)
	>* alpha 乘 (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;

	>* emissiveColor 声明赋值为 vEmissiveColor
	>* emissiveColor 加上 emissiveSampler 和 vEmissiveInfos.y 的积

	>* specularColor 声明赋值为 vSpecularColor
	>* specularColor 赋值为 specularSampler 和 vSpecularInfos.y 的积

	>* 计算 finalDiffuse , finalSpecular
	>* 计算 color

	>* 根据 fog 修改 color

	>* gl_FragColor 赋值为 color


## 参数说明

1. vec4 color = vec4(finalDiffuse * baseAmbientColor + finalSpecular + reflectionColor, alpha)

	>* finalDiffuse = clamp(diffuseBase * diffuseColor + emissiveColor + vAmbientColor, 0.0, 1.0) * baseColor.rgb;
		>>* diffuseBase
			>>>* diffuseBase = vec3(0., 0., 0.);
			>>>* diffuseBase += info.diffuse * shadow;
		>>* diffuseColor
			>>>* diffuseColor = vDiffuseColor.rgb;
			>>>* diffuseColor \*= vColor;
		>>* emissiveColor
			>>>* vec3 emissiveColor = vEmissiveColor;
			>>>* emissiveColor += texture2D(emissiveSampler, vEmissiveUV).rgb * vEmissiveInfos.y;
		>>* uniform vec3 vAmbientColor;
		>>* baseColor
			>>>* baseColor = texture2D(diffuseSampler, vDiffuseUV);
			>>>* baseColor.rgb \*= vDiffuseInfos.y;

	>* baseAmbientColor
		>>* vec3 baseAmbientColor = vec3(1., 1., 1.);
		>>* baseAmbientColor = texture2D(ambientSampler, vAmbientUV).rgb * vAmbientInfos.y;

	>* reflectionColor
		>* reflectionColor = textureCube(reflectionCubeSampler, vReflectionUVW).rgb * vReflectionInfos.y
		>* reflectionColor = texture2D(reflection2DSampler, coords).rgb * vReflectionInfos.y;

	>* finalSpecular = specularBase * specularColor;
		>>* specularBase
			>>>* vec3 specularBase = vec3(0., 0., 0.);
			>>>* specularBase += info.specular * shadow;
		>>* specularColor
			>>>* vec3 specularColor = vSpecularColor.rgb;
			>>>* specularColor = texture2D(specularSampler, vSpecularUV).rgb * vSpecularInfos.y;

	>* alpha
		>>* alpha = vDiffuseColor.a;
		>>* vec3 opacityMap = texture2D(opacitySampler, vOpacityUV).rgb * vec3(0.3, 0.59, 0.11);
		>>* alpha \*= (opacityMap.x + opacityMap.y + opacityMap.z)* vOpacityInfos.y;

2. color.rgb = fog * color.rgb + (1.0 - fog) * vFogColor;
	>* fog = CalcFogFactor()

