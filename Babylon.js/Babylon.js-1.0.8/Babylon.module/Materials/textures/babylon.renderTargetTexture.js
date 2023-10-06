import Texture from './babylon.texture.js';

export default function RenderTargetTexture(name, size, scene, generateMipMaps) {
    this._scene = scene;
    this._scene.textures.push(this);

    this.name = name;

    this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);
};

RenderTargetTexture.prototype = Object.create(Texture.prototype);

// Members
RenderTargetTexture.prototype.renderList = [];
RenderTargetTexture.prototype.isRenderTarget = true;
RenderTargetTexture.prototype.coordinatesMode = Texture.PROJECTION_MODE;

// Methods  
RenderTargetTexture.prototype.onBeforeRender = null;
RenderTargetTexture.prototype.onAfterRender = null;

RenderTargetTexture.prototype.resize = function(size, generateMipMaps) {
    this.releaseInternalTexture();
    this._texture = this._scene.getEngine().createRenderTargetTexture(size, generateMipMaps);
};

RenderTargetTexture.prototype.render = function () {
    if (this.onBeforeRender) {
        this.onBeforeRender();
    }

    var scene = this._scene;
    var engine = scene.getEngine();
    
    if (this._waitingRenderList) {
        this.renderList = [];
        for (var index = 0; index < this._waitingRenderList.length; index++) {
            var id = this._waitingRenderList[index];
            this.renderList.push(this._scene.getMeshByID(id));
        }

        delete this._waitingRenderList;
    }

    if (!this.renderList || this.renderList.length == 0) {
        return;
    }
    
    // Bind
    engine.bindFramebuffer(this._texture);

    // Clear
    engine.clear(scene.clearColor, true, true);
    
    // Dispatch subMeshes
    this._opaqueSubMeshes = [];
    this._transparentSubMeshes = [];
    this._alphaTestSubMeshes = [];
    
    for (var meshIndex = 0; meshIndex < this.renderList.length; meshIndex++) {
        var mesh = this.renderList[meshIndex];

        if (mesh.material && mesh.isEnabled() && mesh.isVisible) {
            for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                var subMesh = mesh.subMeshes[subIndex];
                var material = subMesh.getMaterial();
                
                if (material.needAlphaTesting()) { // Alpha test
                    this._alphaTestSubMeshes.push(subMesh);
                } else if (material.needAlphaBlending()) { // Transparent
                    if (material.alpha > 0) {
                        this._transparentSubMeshes.push(subMesh); // Opaque
                    }
                } else {
                    this._opaqueSubMeshes.push(subMesh);
                }
            }
        }
    }
    
    // Render
    scene._localRender(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, this.renderList);

    // Unbind
    engine.unBindFramebuffer(this._texture);
    
    if (this.onAfterRender) {
        this.onAfterRender();
    }
};
