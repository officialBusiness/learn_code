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

## Babylon.js-1.0.11:

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

## Babylon.js-1.1.0:

* babylon.arcRotateCamera.js
	>* attachControl 中添加了 pointerId 事件校验
	>* attachControl 中添加了 MSPointerDown 函数绑定 \_onGestureStart 事件， detachControl 添加事件移除
	>* attachControl 中添加了 MSGestureChange 函数绑定 \_onGesture 事件， detachControl 添加事件移除

* 添加了 Lights/Shadows/babylon.shadowGenerator.js

* babylon.directionalLight.js 添加了 position 属性

* babylon.hemisphericLight.js 添加了 getShadowGenerator 函数

* babylon.light.js 添加了 getScene 、 getShadowGenerator 、 dispose 函数

* babylon.pointLight.js 添加了 getShadowGenerator 函数

* babylon.mirrorTexture.js 添加 renderList 属性初始化空数组

* babylon.renderTargetTexture.js
	>* 将 renderList 从 prototype 中转移到构造函数中初始化
	>* 在 render 中 移除 mesh.material 的判断，添加 customRenderFunction 自定义渲染函数

* babylon.standardMaterial.js
	>* isReady 中添加 Shadows 相关 define
	>* isReady createEffect 时，添加 lightMatrix 、 shadowSampler
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

<!--

改的东西有点多，以后再完善

## Babylon.js-1.2.0:

* babylon.animatable.js prototype 的 fromFrame 默认值改为 0 ， toFrame 默认值改为 100

* babylon.animation.js animate 函数判断添加起始帧

* babylon.arcRotateCamera.js
	>* 构造函数添加 position 属性，初始化为 BABYLON.Vector3.Zero() ，添加 \_viewMatrix 属性初始化为 new BABYLON.Matrix()
	>* prototype 上添加 lowerAlphaLimit 、 upperAlphaLimit 、 lowerBetaLimit 、 upperBetaLimit 、 lowerRadiusLimit 、 upperRadiusLimit 属性，初始化都为 null
	>* attachControl 中的 \_onGesture 函数添加禁止冒泡和禁止默认事件
	>* \_update 函数中添加 Limits 判断和 alpha 、 beta 、 radius 三个参数的范围限制
	>* getViewMatrix 中修改 add 为 addToRef ，并添加 position 参数 、 修改 LookAtLH 为 LookAtLHToRef ，并添加 \_viewMatrix

* babylon.camera.js getProjectionMatrix 函数添加 \_projectionMatrix 判断是否存在，不存在返回默认值 、 PerspectiveFovLH 改为 PerspectiveFovLHToRef 并添加 \_projectionMatrix 参数 、 OrthoOffCenterLH 改为 OrthoOffCenterLHToRef -->

<!--

## Babylon.js-1.2.1

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
