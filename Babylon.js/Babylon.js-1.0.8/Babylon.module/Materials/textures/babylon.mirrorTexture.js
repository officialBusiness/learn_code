import RenderTargetTexture from './babylon.renderTargetTexture.js';
import { Plane, Matrix } from '../../Tools/babylon.math.js';


export default function MirrorTexture(name, size, scene, generateMipMaps) {
    this._scene = scene;
    this._scene.textures.push(this);

    this.name = name;        

    this._texture = scene.getEngine().createRenderTargetTexture(size, generateMipMaps);
};

MirrorTexture.prototype = Object.create(RenderTargetTexture.prototype);

// Members
MirrorTexture.prototype.mirrorPlane = new Plane(0, 1, 0, 1);

// Method
MirrorTexture.prototype.onBeforeRender = function () {
    var scene = this._scene;

    var mirrorMatrix = Matrix.Reflection(this.mirrorPlane);
    this._savedViewMatrix = scene.getViewMatrix();

    scene.setTransformMatrix(mirrorMatrix.multiply(this._savedViewMatrix), scene.getProjectionMatrix());

    // BABYLON.clipPlane = this.mirrorPlane;

    scene.getEngine().cullBackFaces = false;
};

MirrorTexture.prototype.onAfterRender = function () {
    var scene = this._scene;

    scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
    scene.getEngine().cullBackFaces = true;

    // delete BABYLON.clipPlane;
};