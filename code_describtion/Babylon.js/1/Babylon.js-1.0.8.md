# Babylon.js-1.0.8.md

## scene render

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
7. engine.restoreDefaultFramebuffer, engine.clear
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

### renderTarget render

### mesh render

### layer render

### sprite render

### particle render

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