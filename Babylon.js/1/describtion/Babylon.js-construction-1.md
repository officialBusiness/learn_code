# construction-1.md

&emsp;一份比较简单的代码说明，不是很规范，更多是模糊的感觉。

## engine

* createVertexBuffer
	>* gl.createBuffer
	>* gl.bindBuffer
	>* gl.bufferData

* createDynamicVertexBuffer
	>* gl.createBuffer
	>* gl.bindBuffer
	>* gl.bufferData

* updateDynamicVertexBuffer
	>* gl.bindBuffer
	>* gl.bufferSubData

* createIndexBuffer
	>* gl.createBuffer
	>* gl.bindBuffer
	>* gl.bufferData

* bindBuffers
	>* gl.bindBuffer
	>* effect.getAttribute
	>* gl.vertexAttribPointer

* createEffect
	>* \_compiledEffects
	>* new BABYLON.Effect

* compileShader
	>* gl.createShader
	>* gl.shaderSource
	>* gl.compileShader
	>* gl.getShaderParameter
	>* gl.getShaderInfoLog

* createShaderProgram
	>* gl.createProgram
	>* gl.attachShader
	>* gl.linkProgram
	>* gl.deleteShader

* getUniforms
	>* gl.getUniformLocation

* getAttributes
	>* gl.getAttribLocation

* enableEffect
	>* gl.useProgram
	>* gl.enableVertexAttribArray

* createTexture
	>* gl.createTexture
	>* gl.bindTexture
	>* gl.pixelStorei
	>* gl.texImage2D
	>* gl.texParameteri
	>* gl.generateMipmap

* bindSamplers
	>* gl.useProgram
	>* effect.getSamplers
	>* effect.getUniform
	>* gl.uniform1i

## Scene

### render

1. beforeRender
2. \_onBeforeRenderCallbacks
3. setTransformMatrix
4. \_animate
5. \_evaluateActiveMeshes
	>1. \_activeMeshes.push
	>2. \_processedMaterials.push
	>3. \_renderTargets.concat
	>4. \_transparentSubMeshes.push
	>5. \_alphaTestSubMeshes.push
	>6. \_opaqueSubMeshes.push
	>7. \_activeParticleSystems.push
	>8. particleSystem.animate
6. renderTarget.render
7. engine.restoreDefaultFramebuffer ; engine.clear
8. layer.render (Backgrounds)
9. \_localRender
	>1. submesh.render (opaqueSubMeshes)
	>2. submesh.render (alphaTestSubMeshes)
	>3. spriteManager.render
	>4. submesh.render (transparentSubMeshes)
	>5. particleSystem.render
10. layer.render Foregrounds
11. activeCamera.\_update
12. afterRender
13. dispose

## Effect

* defines , \_uniformsNames , \_samplers
* Tools.LoadFile
* \_prepareEffect

### \_prepareEffect

* \_program = engine.createShaderProgram
* \_uniforms = engine.getUniforms
* \_attributes = engine.getAttributes
* getUniform(清除不需要的 sampler)
* engine.bindSamplers

## Texture
```
BABYLON.BaseTexture
	├──BABYLON.CubeTexture: createCubeTexture
	├──BABYLON.Texture: createTexture
			├──BBABYLON.VideoTexture: createDynamicTexture
			├──BABYLON.DynamicTexture: createDynamicTexture
			├──BABYLON.RenderTargetTexture: createRenderTargetTexture
					├──BABYLON.MirrorTexture: createRenderTargetTexture
```

## Layer

### 渲染流程

1. new BABYLON.Layer
	>* new BABYLON.Texture
	>* scene.getEngine().createVertexBuffe
	>* scene.getEngine().createIndexBuffer
	>* scene.getEngine().createEffect
2. scene.render => layer.render
	>* engine.enableEffect
	>* effect.setTexture ; effect.setMatrix ; effect.setFloat4
	>* engine.bindBuffers
	>* engine.draw

## SpriteManager

### 渲染流程

1. new BABYLON.SpriteManager
	>* new BABYLON.Texture
	>* scene.getEngine().createDynamicVertexBuffer
	>* scene.getEngine().createIndexBuffer
	>* scene.getEngine().createEffect
	>* new BABYLON.Sprite ; sprite.playAnimation
2. scene.render => \_localRender => spriteManager.render
	>* sprite.\_animate
	>* appendSpriteVertex
	>* engine.updateDynamicVertexBuffer
	>* engine.enableEffect
	>* setTexture ; setMatrix ; setVector2 ; setFloat4 ; setColor3
	>* engine.bindBuffers
	>* effect.setBool ; engine.setColorWrite ; engine.draw
	>* engine.setAlphaMode ; engine.draw

## ParticleSystem

### 渲染流程

1. new BABYLON.ParticleSystem
	>* scene.getEngine().createDynamicVertexBuffer
	>* scene.getEngine().createIndexBuffer
	>* new BABYLON.Texture
	>* particleSystem.start
2. scene.render => \_evaluateActiveMeshes => \_activeParticleSystems.push ; particleSystem.animate
	>* \_getEffect: scene.getEngine().createEffect
	>* \_update
	>* appendParticleVertex ; engine.updateDynamicVertexBuffer
3. scene.render => \_localRender => particleSystem.render
	>* engine.enableEffect
	>* effect.setTexture ; effect.setMatrix ; effect.setFloat4 ; effect.setFloat4
	>* engine.bindBuffers
	>* engine.setAlphaMode ; engine.draw

## Mesh

### 渲染流程


