# Babylon.js 代码版本说明

## Babylon.js-1.0.8: 初始的第一版

* 纹理无法展示: 需要在 default.vertex.fx 中添加 float 精度

* 视频纹理无法播放: 在 babylon.engine.js 的 updateVideoTexture 函数中不能直接 texImage2D ，需要添加视频缩放操作

## Babylon.js-1.0.8.1

## Babylon.js-1.0.9:

* babylon.camera.js 中 prototype 添加了正交相机相关参数， getProjectionMatrix 中根据 mode 属性返回相机类型对应的矩阵

## Babylon.js-1.0.10:

* babylon.standardMaterial.js 中抽离调整了 ie 判断

* babylon.mesh.js 中添加了 CreateCylinder

* 调整了 default.fragment.fx 内的部分代码位置和参数名，大体功能不变

* babylon.math.js 中  BABYLON.Matrix m 属性从单纯的 Array 添加了 Float32Array 类型的可能，并且优先使用 Float32Array

## Babylon.js-1.0.11: 能够展示纹理 ; 能够播放视频纹理

* babylon.arcRotateCamera.js 添加了 eventPrefix

* 修改 babylon.videoTexture.js 中 wrapU 、 wrapV 属性的默认值 BABYLON.Texture.REPEAT_CLAMPMODE 为 BABYLON.Texture.WRAP_ADDRESSMODE

* babylon.effect.js 中 添加 \_compilationError 属性，添加了 getCompilationError 函数，完善了创建 createShaderProgram 时的错误信息收集

* babylon.standardMaterial.js 中去除了部分 ie 判断(部分调整回去了)

* 调整了 babylon.particleSystem.js 中的 colorStep 计算过程中 diff 的获取方式，删除了 deadAlpha 属性

* default.vertex.fx 中添加了 float 精度，解决 纹理无法展示的问题

* layer.vertex.fx 中添加了 float 精度

* particles.vertex.fx 中添加了 float 精度

* sprites.vertex.fx 中添加了 float 精度

* babylon.sceneLoader.js parseParticleSystem 中删除了 deadAlpha 属性的赋值

* babylon.tools.js 添加了 GetPointerPrefix

* babylon.engine.js
	>* 微调了 \_caps.standardDerivatives 的获取判断
	>* 修改了 createDynamicTexture 的参数 noMipmap 为 generateMipMaps， height 直接由 width 赋值，不需要计算两遍
	>* 修改了 updateDynamicTexture 的参数 noMipmap 为 generateMipMaps 、 添加了视频的尺寸缩放

## Babylon.js-1.1.0: light 添加了 shadow 相关代码 , 不过 shadow 的 shader 代码只在 default.vertex.fx 有添加

* babylon.arcRotateCamera.js
	>* attachControl 中添加了 pointerId 事件校验
	>* attachControl 中添加了 MSPointerDown 函数绑定 \_onGestureStart 事件， detachControl 添加事件移除
	>* attachControl 中添加了 MSGestureChange 函数绑定 \_onGesture 事件， detachControl 添加事件移除

* 添加了 Lights/Shadows/babylon.shadowGenerator.js

* babylon.directionalLight.js 添加了 position 属性

* babylon.hemisphericLight.js 添加了 getShadowGenerator 函数

* babylon.light.js 添加了 getScene , getShadowGenerator , dispose 函数

* babylon.pointLight.js 添加了 getShadowGenerator 函数

* babylon.mirrorTexture.js 添加 renderList 属性初始化空数组

* babylon.renderTargetTexture.js
	>* 将 renderList 从 prototype 中转移到构造函数中初始化

	>* 在 render 中 移除 mesh.material 的判断，添加 customRenderFunction 自定义渲染函数

* babylon.standardMaterial.js
	>* isReady 中添加 Shadows 相关 define
	>* isReady createEffect 时，添加 lightMatrix , shadowSampler

	>* bind 中添加了 lightMatrix 和 shadowSampler 的 uniform 传入

* babylon.mesh.js
	>* prototype 添加 receiveShadows 属性，初始化为 false

	>* render 中的 buffer 绑定和渲染相关代码抽离到 bindAndDraw 中

* babylon.subMesh.js 添加 getMesh 函数

* default.vertex.fx: 添加 SHADOWS 相关的代码， lightMatrix 和 vPositionFromLight

* default.fragment.fx 移除了 SPOTLIGHT2 相关的 vLightDirection2

* 添加 /Shaders/shadowMap.fragment.fx

* 添加 /Shaders/shadowMap.vertex.fx

* babylon.sceneLoader.js
	>* 添加 parseShadowGenerator 函数
	>* 修改 parseLight 函数
	>* parseMesh 中添加 receiveShadows 的赋值
	>* Load 中添加 shadowGenerators 的判断加载

* babylon.engine.js setTexture 中添加 channel 是否小于 0 的判断

* babylon.scene.js
	>* 添加 getLightByID 函数
	>* render 中添加 shadow 相关渲染
	>* dispose 添加 light 的销毁

## Babylon.js-1.2.0: 修改添加数据计算存储相关的代码 ; 将部分类的数据放到属性上 ; default.fragment.fx 添加 shadow 相关代码. 主要是对代码进行翻新了一下已经添加 shader

* babylon.tools.js 添加 SmartArray 对象， 其中有 push , reset , concat , indexOf 函数

* babylon.math.js
	>* Color3 添加 multiplyToRef , scaleToRef , copyFrom , copyFromFloats 函数
	>* Color4 添加 addInPlace , subtractToRef , scaleToRef 函数 ; 修改 Lerp 静态函数 , 添加 LerpToRef 静态函数
	>* Vector2 添加 scaleInPlace 函数
	>* Vector3 添加 addInPlace , addToRef , subtractInPlace , subtractToRef , subtractFromFloats , subtractFromFloatsToRef , scaleInPlace , scaleToRef , equalsToFloats , multiplyInPlace , multiplyToRef , divideToRef , copyFrom , copyFromFloats 函数; 添加 FromArrayToRef , FromFloatsToRef , TransformCoordinatesToRef , TransformCoordinatesFromFloatsToRef , TransformNormalToRef , TransformNormalFromFloatsToRef , CrossToRef , NormalizeToRef 静态函数 ; 修改 TransformCoordinates , TransformNormal , Cross , Normalize 静态函数
	>* Quaternion 添加 toRotationMatrix 函数 ; 添加 RotationYawPitchRoll , RotationYawPitchRollToRef 静态函数
	>* Matrix 添加 multiplyToRef 函数 ; 修改 multiply 函数 ; 添加 FromValuesToRef , IdentityToRef , RotationXToRef , RotationYToRef , RotationZToRef , RotationYawPitchRollToRef , ScalingToRef , TranslationToRef , LookAtLHToRef , OrthoOffCenterLHToRef , PerspectiveFovLHToRef , ReflectionToRef 静态函数 ; 修改 RotationX , RotationY , RotationZ , RotationYawPitchRoll , Scaling , Translation , LookAtLH , OrthoOffCenterLH , PerspectiveFovLH , Reflection 静态函数
	>* Plane 添加 copyFromPoints , isFrontFacingTo , signedDistanceTo 函数 ; 修改 FromPoints 静态函数 ; 添加 FromPositionAndNormal , SignedDistanceToPlaneFromPositionAndNormal 静态函数
	>* Frustum 修改 GetPlanes 静态函数 ; 添加 GetPlanesToRef 静态函数 ;

* babylon.engine.js
	>* runRenderLoop 相关: 将 runRenderLoop 中的主体渲染执行函数抽离到 \_renderLoop 中 ; stopRenderLoop 函数执行时将 \_renderFunction 赋值为 null

	>* updateDynamicTexture 函数添加 invertY 参数，传入 \_gl.pixelStorei 中

* babylon.scene.js
	>* 初始化相关: \_toBeDisposed , \_activeMeshes , \_opaqueSubMeshes , \_transparentSubMeshes , \_alphaTestSubMeshes , \_processedMaterials , \_renderTargets , \_activeParticleSystems 都初始化为 new BABYLON.Tools.SmartArray(256); 添加 \_transformMatrix , \_scaledPosition , \_scaledVelocity 并初始化 BABYLON.Vector3.Zero();

	>* 添加 getWaitingItemsCount 函数, 返回 \_pendingData 数组的元素数量

	>* setTransformMatrix 中 \_transformMatrix 的赋值方式转为 multiplyToRef

	>* \_evaluateActiveMeshes 中修改 \_activeMeshes , \_opaqueSubMeshes , \_transparentSubMeshes , \_alphaTestSubMeshes , \_processedMaterials , \_renderTargets , \_activeParticleSystems 的初始化方式 ， 并修改后续对应的代码 ; 将 frustumPlanes 改为 this.\_frustumPlanes 并修改 \_frustumPlanes 的初始化方式 ， 修改后续对应的代码;

	>* \_localRender 对应 \_evaluateActiveMeshes 变化的代码进行修改 ; 销毁 \_toBeDisposed 之后赋值为 null ;

	>* \_getNewPosition 对应 babylon.math.js 修改相关代码
	>* \_collideWithWorld 对应 babylon.math.js 修改相关代码

* babylon.animatable.js prototype 的 fromFrame 默认值改为 0 ， toFrame 默认值改为 100

* babylon.animation.js animate 函数判断添加起始帧

* babylon.arcRotateCamera.js
	>* 构造函数添加 position 属性，初始化为 BABYLON.Vector3.Zero() ，添加 \_viewMatrix 属性初始化为 new BABYLON.Matrix()
	>* prototype 上添加 lowerAlphaLimit , upperAlphaLimit , lowerBetaLimit , upperBetaLimit , lowerRadiusLimit , upperRadiusLimit 属性，初始化都为 null
	>* attachControl 中的 \_onGesture 函数添加禁止冒泡和禁止默认事件
	>* \_update 函数中添加 Limits 判断和 alpha 、 beta 、 radius 三个参数的范围限制
	>* getViewMatrix 对应 babylon.math.js 修改相关代码， 修改 add 为 addToRef ，并添加 position 参数 、 修改 LookAtLH 为 LookAtLHToRef ，并添加 \_viewMatrix

* babylon.camera.js getProjectionMatrix 函数对应 babylon.math.js 修改相关代码，添加 \_projectionMatrix 判断是否存在，不存在返回默认值 、 PerspectiveFovLH 改为 PerspectiveFovLHToRef 并添加 \_projectionMatrix 参数 、 OrthoOffCenterLH 改为 OrthoOffCenterLHToRef

* babylon.freeCamera.js
	>* key 事件触发添加， keysUp 添加 87 (w); keysLeft 添加 81 (q); keysRight 添加 68 (d)
	>* 添加 \_currentTarget , \_upVector , \_viewMatrix , \_camMatrix , \_cameraTransformMatrix , \_cameraRotationMatrix , \_referencePoint , \_transformedReferencePoint , \_oldPosition , \_diffPosition , \_newPosition 属性到实例对象并初始化
	>* setTarget , \_collideWithWorld , \_update , getViewMatrix 中从声明变量变为修改实例对象属性，并对应 babylon.math.js 修改赋值代码
	>* \_checkInputs 添加 \_localDirection 判断 ， 若为空则对 \_localDirection , \_transformedDirection 初始化 ; 之后声明变量变为修改实例对象属性，并对应 babylon.math.js 修改赋值代码

* babylon.touchCamera.js
	>* 添加 \_cameraRotationMatrix 属性并初始化
	>* \_checkInputs 对应 babylon.math.js 修改赋值代码

* babylon.collider.js
	>* 添加 basePointWorld , velocityWorld , normalizedVelocity , \_trianglePlane , \_collisionPoint , \_planeIntersectionPoint , \_tempVector , \_tempVector2 , \_tempVector3 , \_tempVector4 , \_edge , \_baseToVertex , \_destinationPoint , \_slidePlaneNormal , \_displacementVector 属性并初始化
	>* \_initialize , \_canDoCollision , \_testTriangle , \_getResponse 对应 babylon.math.js 修改赋值代码
	>* checkPointInTriangle 函数转为 Collider 类属性函数 ， 并对应 babylon.math.js 修改赋值代码
	>* intersectBoxAASphere 简单调整数据逻辑，并且修改比较的属性(从大写变成小写，可能是之前的 bug)

* babylon.boundingBox.js
	>* vectorsWorld , minimumWorld , maximumWorld 属性从 \_update 移到构造函数初始化
	>* \_update 对应 babylon.math.js 修改赋值代码

* babylon.boundingSphere.js
	>* centerWorld 属性从 \_update 移到构造函数初始化
	>* \_update 对应 babylon.math.js 修改赋值代码

* babylon.shadowGenerator.js
	>* renderSubMesh 对应 babylon.math.js 修改赋值代码
	>* customRenderFunction 中对应数组变为 SmartArray 作代码修改
	>* 构造函数添加 \_viewMatrix , \_projectionMatrix , \_transformMatrix , \_worldViewProjection 属性并初始化
	>* getTransformMatrix 对应 babylon.math.js 修改赋值代码

* babylon.effect.js
	>* 构造函数中判断 url 是否是相关路径，添加相对路径的 shader 文件请求
	>* 添加 \_cacheMatrix , \_cacheFloat2 , \_cacheFloat3 , \_cacheFloat4 , \_cacheVector3 数据缓存类函数
	>* setMatrix , setVector3 , setFloat2 , setFloat3 , setFloat4 , setColor3 , setColor4 对应添加的缓存类函数做代码修改
	>* 删除 setVector2 类函数

* babylon.standardMaterial.js
	>* 构造函数添加 \_renderTargets , \_renderTargets , \_worldViewProjectionMatrix , \_lightMatrix , \_globalAmbientColor , \_baseColor , \_scaledDiffuse , \_scaledSpecular 属性并初始化
	>* getRenderTargetTextures 对应 \_renderTargets 属性作代码修改
	>* bind 对应 \_baseColor , \_worldViewProjectionMatrix , \_globalAmbientColor , \_scaledDiffuse , \_scaledSpecular 属性作代码修改 ; 对应 babylon.effect.js 中的 setFloat2 函数作代码修改 ; 对应 babylon.math.js 修改赋值代码

* babylon.dynamicTexture.js
	>* update 类函数添加 invertY 传入参数
	>* 添加 drawText 类函数

* babylon.mirrorTexture.js
	>* 构造函数中添加 \_transformMatrix , \_mirrorMatrix 属性并初始化
	>* onBeforeRender 中对应 \_mirrorMatrix 属性做对应修改 ; 对应 babylon.math.js 修改赋值代码

* babylon.renderTargetTexture.js
	>* render 函数根据对应数组变为 SmartArray 作代码修改

* babylon.texture.js
	>* \_prepareRowForTextureGeneration 函数对应 babylon.math.js 修改赋值代码
	>* \_computeTextureMatrix 函数根据 \_cachedTextureMatrix 判断矩阵相关信息是否需要初始化 ; 对应 babylon.math.js 修改赋值代码
	>* \_computeReflectionTextureMatrix 函数根据 \_cachedTextureMatrix 判断矩阵相关信息是否需要初始化 ; 对应 babylon.math.js 修改赋值代码

* babylon.mesh.js
	>* \_cache 属性对象内的三个属性初始化修改赋值
	>* 添加 \_childrenFlag , \_localScaling , \_localRotation , \_localTranslation , \_localBillboard , \_localScalingRotation , \_localWorld , \_worldMatrix , \_collisionsTransformMatrix , \_collisionsScalingMatrix 属性并初始化
	>* computeWorldMatrix 函数中根据 \_cache 属性的变化作赋值改变 ; 对应 babylon.math.js 修改赋值代码 ; 根据构造函数中添加的属性作对应变化
	>* \_checkCollision 函数中对应 babylon.math.js 修改赋值代码 ; 根据构造函数中添加的属性作对应变化
	>* CreateGround 静态函数中顶点生成计算作略微修改(row 改为 1- row)
	>* CreateGroundFromHeightMap 静态函数中顶点生成计算作略微修改
	>* ComputeNormal 静态函数中对应 babylon.math.js 修改赋值代码

* babylon.particle.js
	>* position , direction , color , colorStep 属性从原型中移到构造函数中并初始化

* babylon.particleSystem.js
	>* appendParticleVertex 函数移到原型中并改名为 \_appendParticleVertex
	>* 构造函数添加 \_stockParticles , \_vertices , \_scaledColorStep , \_colorDiff , \_scaledDirection , \_scaledGravity 属性并初始化
	>* \_update 函数中根据 \_stockParticles 属性作一定修改 ; 对应 babylon.math.js 修改赋值代码
	>* animate 函数中代码根据 \_vertices 属性和 \_appendParticleVertex 方法作一定修改

* default.fragment.fx 添加 shadow 相关代码: 传入 shadowSampler 和 varying vPositionFromLight ; unpack , unpackHalf , computeShadow , ChebychevInequality , computeShadowWithVSM 函数 ; 最后 diffuseBase 和 specularBase 加上 shadow;

* babylon.spriteManager.js
	>* appendSpriteVertex 函数移到原型中并改名为 \_appendSpriteVertex
	>* 构造函数添加 \_vertices 属性
	>* render 函数中代码根据 \_vertices 属性 , \_appendSpriteVertex 方法 , 对应 babylon.effect.js 中的 setFloat2 函数作一定修改

## Babylon.js-1.2.1:

* babylon.engine.js
	>* 构造函数中修改全屏显示事件
	>* switchFullscreen 函数更改传入参数, 添加 \_pointerLockRequested 属性

* babylon.freeCamera.js attachControl 函数中代码根据 babylon.engine.js 中添加的 \_pointerLockRequested 属性作一定修改

* babylon.standardMaterial.js: isReady 函数中纹理是否加载完成和添加相关 define 结合 ; 调整 attribs 内的属性名添加

* babylon.mesh.js: setVertices 函数中添加 hasVertexColor 参数赋值到实例对象中

* default.fragment.fx 中添加 VERTEXCOLOR 相关代码

* default.vertex.fx 中添加 VERTEXCOLOR 相关代码

* babylon.sceneLoader.js parseMesh 函数中调整 declaration 的赋值方式 ; mesh.setVertices 时添加 updatable 和 hasVertexColor 参数

* 删除 babylon.tools.dds.js 文件

* babylon.tools.js: 修改 RequestFullscreen 函数中的全屏方法名(好像是单纯大小写写错了)


<!--

## Babylon.js-1.3.0

## Babylon.js-1.3.1

## Babylon.js-1.3.2

## Babylon.js-1.4.0

## Babylon.js-1.4.1

## Babylon.js-1.4.2

## Babylon.js-1.4.3

## Babylon.js-1.5.0

## Babylon.js-1.5.1

## Babylon.js-1.5.2

## Babylon.js-1.5.1.2

## Babylon.js-1.5.3

## Babylon.js-1.5.3.1

## Babylon.js-1.5.3.3

## Babylon.js-1.6.0

## Babylon.js-1.7.0

## Babylon.js-1.7.1

## Babylon.js-1.7.2

## Babylon.js-1.7.3

## Babylon.js-1.8.0

## Babylon.js-1.8.5

## Babylon.js-1.9.0: 有案例的最后的版本

## Babylon.js-1.10.0

## Babylon.js-1.11: 有纯 js 的最后的版本

## Babylon.js-1.12: 只有 ts 的第一的版本

## Babylon.js-1.13

## Babylon.js-1.14
 -->