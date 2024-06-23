import { Matrix, TmpVectors, Vector2, Vector3, Vector4, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Tools } from "@babylonjs/core/Misc/tools.js";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { LinesMesh } from "@babylonjs/core/Meshes/linesMesh.js";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh.js";
import { Material } from "@babylonjs/core/Materials/material.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { _GLTFMaterialExporter } from "./glTFMaterialExporter.js";
import { _GLTFUtilities } from "./glTFUtilities.js";
import { GLTFData } from "./glTFData.js";
import { _GLTFAnimation } from "./glTFAnimation.js";
import { Camera } from "@babylonjs/core/Cameras/camera.js";
import { EngineStore } from "@babylonjs/core/Engines/engineStore.js";
import { MultiMaterial } from "@babylonjs/core/Materials/multiMaterial.js";
// Matrix that converts handedness on the X-axis.
const convertHandednessMatrix = Matrix.Compose(new Vector3(-1, 1, 1), Quaternion.Identity(), Vector3.Zero());
// 180 degrees rotation in Y.
const rotation180Y = new Quaternion(0, 1, 0, 0);
function isNoopNode(node, useRightHandedSystem) {
    if (!(node instanceof TransformNode)) {
        return false;
    }
    // Transform
    if (useRightHandedSystem) {
        const matrix = node.getWorldMatrix();
        if (!matrix.isIdentity()) {
            return false;
        }
    }
    else {
        const matrix = node.getWorldMatrix().multiplyToRef(convertHandednessMatrix, TmpVectors.Matrix[0]);
        if (!matrix.isIdentity()) {
            return false;
        }
    }
    // Geometry
    if ((node instanceof Mesh && node.geometry) || (node instanceof InstancedMesh && node.sourceMesh.geometry)) {
        return false;
    }
    return true;
}
function convertNodeHandedness(node) {
    const translation = Vector3.FromArrayToRef(node.translation || [0, 0, 0], 0, TmpVectors.Vector3[0]);
    const rotation = Quaternion.FromArrayToRef(node.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[0]);
    const scale = Vector3.FromArrayToRef(node.scale || [1, 1, 1], 0, TmpVectors.Vector3[1]);
    const matrix = Matrix.ComposeToRef(scale, rotation, translation, TmpVectors.Matrix[0]).multiplyToRef(convertHandednessMatrix, TmpVectors.Matrix[0]);
    matrix.decompose(scale, rotation, translation);
    if (translation.equalsToFloats(0, 0, 0)) {
        delete node.translation;
    }
    else {
        node.translation = translation.asArray();
    }
    if (Quaternion.IsIdentity(rotation)) {
        delete node.rotation;
    }
    else {
        node.rotation = rotation.asArray();
    }
    if (scale.equalsToFloats(1, 1, 1)) {
        delete node.scale;
    }
    else {
        node.scale = scale.asArray();
    }
}
/**
 * Converts Babylon Scene into glTF 2.0.
 * @internal
 */
export class _Exporter {
    _applyExtension(node, extensions, index, actionAsync) {
        if (index >= extensions.length) {
            return Promise.resolve(node);
        }
        const currentPromise = actionAsync(extensions[index], node);
        if (!currentPromise) {
            return this._applyExtension(node, extensions, index + 1, actionAsync);
        }
        return currentPromise.then((newNode) => this._applyExtension(newNode, extensions, index + 1, actionAsync));
    }
    _applyExtensions(node, actionAsync) {
        const extensions = [];
        for (const name of _Exporter._ExtensionNames) {
            extensions.push(this._extensions[name]);
        }
        return this._applyExtension(node, extensions, 0, actionAsync);
    }
    _extensionsPreExportTextureAsync(context, babylonTexture, mimeType) {
        return this._applyExtensions(babylonTexture, (extension, node) => extension.preExportTextureAsync && extension.preExportTextureAsync(context, node, mimeType));
    }
    _extensionsPostExportMeshPrimitiveAsync(context, meshPrimitive, babylonSubMesh, binaryWriter) {
        return this._applyExtensions(meshPrimitive, (extension, node) => extension.postExportMeshPrimitiveAsync && extension.postExportMeshPrimitiveAsync(context, node, babylonSubMesh, binaryWriter));
    }
    _extensionsPostExportNodeAsync(context, node, babylonNode, nodeMap, binaryWriter) {
        return this._applyExtensions(node, (extension, node) => extension.postExportNodeAsync && extension.postExportNodeAsync(context, node, babylonNode, nodeMap, binaryWriter));
    }
    _extensionsPostExportMaterialAsync(context, material, babylonMaterial) {
        return this._applyExtensions(material, (extension, node) => extension.postExportMaterialAsync && extension.postExportMaterialAsync(context, node, babylonMaterial));
    }
    _extensionsPostExportMaterialAdditionalTextures(context, material, babylonMaterial) {
        const output = [];
        for (const name of _Exporter._ExtensionNames) {
            const extension = this._extensions[name];
            if (extension.postExportMaterialAdditionalTextures) {
                output.push(...extension.postExportMaterialAdditionalTextures(context, material, babylonMaterial));
            }
        }
        return output;
    }
    _extensionsPostExportTextures(context, textureInfo, babylonTexture) {
        for (const name of _Exporter._ExtensionNames) {
            const extension = this._extensions[name];
            if (extension.postExportTexture) {
                extension.postExportTexture(context, textureInfo, babylonTexture);
            }
        }
    }
    _forEachExtensions(action) {
        for (const name of _Exporter._ExtensionNames) {
            const extension = this._extensions[name];
            if (extension.enabled) {
                action(extension);
            }
        }
    }
    _extensionsOnExporting() {
        this._forEachExtensions((extension) => {
            if (extension.wasUsed) {
                if (this._glTF.extensionsUsed == null) {
                    this._glTF.extensionsUsed = [];
                }
                if (this._glTF.extensionsUsed.indexOf(extension.name) === -1) {
                    this._glTF.extensionsUsed.push(extension.name);
                }
                if (extension.required) {
                    if (this._glTF.extensionsRequired == null) {
                        this._glTF.extensionsRequired = [];
                    }
                    if (this._glTF.extensionsRequired.indexOf(extension.name) === -1) {
                        this._glTF.extensionsRequired.push(extension.name);
                    }
                }
                if (this._glTF.extensions == null) {
                    this._glTF.extensions = {};
                }
                if (extension.onExporting) {
                    extension.onExporting();
                }
            }
        });
    }
    /**
     * Load glTF serializer extensions
     */
    _loadExtensions() {
        for (const name of _Exporter._ExtensionNames) {
            const extension = _Exporter._ExtensionFactories[name](this);
            this._extensions[name] = extension;
        }
    }
    /**
     * Creates a glTF Exporter instance, which can accept optional exporter options
     * @param babylonScene Babylon scene object
     * @param options Options to modify the behavior of the exporter
     */
    constructor(babylonScene, options) {
        this._extensions = {};
        this._glTF = {
            asset: { generator: `Babylon.js v${Engine.Version}`, version: "2.0" },
        };
        babylonScene = babylonScene || EngineStore.LastCreatedScene;
        if (!babylonScene) {
            return;
        }
        this._babylonScene = babylonScene;
        this._bufferViews = [];
        this._accessors = [];
        this._meshes = [];
        this._scenes = [];
        this._cameras = [];
        this._nodes = [];
        this._images = [];
        this._materials = [];
        this._materialMap = [];
        this._textures = [];
        this._samplers = [];
        this._skins = [];
        this._animations = [];
        this._imageData = {};
        this._orderedImageData = [];
        this._options = options || {};
        this._animationSampleRate = this._options.animationSampleRate || 1 / 60;
        this._glTFMaterialExporter = new _GLTFMaterialExporter(this);
        this._loadExtensions();
    }
    dispose() {
        for (const extensionKey in this._extensions) {
            const extension = this._extensions[extensionKey];
            extension.dispose();
        }
    }
    get options() {
        return this._options;
    }
    /**
     * Registers a glTF exporter extension
     * @param name Name of the extension to export
     * @param factory The factory function that creates the exporter extension
     */
    static RegisterExtension(name, factory) {
        if (_Exporter.UnregisterExtension(name)) {
            Tools.Warn(`Extension with the name ${name} already exists`);
        }
        _Exporter._ExtensionFactories[name] = factory;
        _Exporter._ExtensionNames.push(name);
    }
    /**
     * Un-registers an exporter extension
     * @param name The name fo the exporter extension
     * @returns A boolean indicating whether the extension has been un-registered
     */
    static UnregisterExtension(name) {
        if (!_Exporter._ExtensionFactories[name]) {
            return false;
        }
        delete _Exporter._ExtensionFactories[name];
        const index = _Exporter._ExtensionNames.indexOf(name);
        if (index !== -1) {
            _Exporter._ExtensionNames.splice(index, 1);
        }
        return true;
    }
    _reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter) {
        switch (primitiveMode) {
            case Material.TriangleFillMode: {
                if (!byteOffset) {
                    byteOffset = 0;
                }
                for (let i = submesh.indexStart, length = submesh.indexStart + submesh.indexCount; i < length; i = i + 3) {
                    const index = byteOffset + i * 4;
                    // swap the second and third indices
                    const secondIndex = binaryWriter.getUInt32(index + 4);
                    const thirdIndex = binaryWriter.getUInt32(index + 8);
                    binaryWriter.setUInt32(thirdIndex, index + 4);
                    binaryWriter.setUInt32(secondIndex, index + 8);
                }
                break;
            }
            case Material.TriangleFanDrawMode: {
                for (let i = submesh.indexStart + submesh.indexCount - 1, start = submesh.indexStart; i >= start; --i) {
                    binaryWriter.setUInt32(babylonIndices[i], byteOffset);
                    byteOffset += 4;
                }
                break;
            }
            case Material.TriangleStripDrawMode: {
                if (submesh.indexCount >= 3) {
                    binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 2], byteOffset + 4);
                    binaryWriter.setUInt32(babylonIndices[submesh.indexStart + 1], byteOffset + 8);
                }
                break;
            }
        }
    }
    /**
     * Reorders the vertex attribute data based on the primitive mode.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param primitiveMode Primitive mode of the mesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        switch (primitiveMode) {
            case Material.TriangleFillMode: {
                this._reorderTriangleFillMode(submesh, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                break;
            }
            case Material.TriangleStripDrawMode: {
                this._reorderTriangleStripDrawMode(submesh, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                break;
            }
            case Material.TriangleFanDrawMode: {
                this._reorderTriangleFanMode(submesh, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter);
                break;
            }
        }
    }
    /**
     * Reorders the vertex attributes in the correct triangle mode order .  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _reorderTriangleFillMode(submesh, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        const vertexBuffer = this._getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
        if (vertexBuffer) {
            const stride = vertexBuffer.byteStride / VertexBuffer.GetTypeByteLength(vertexBuffer.type);
            if (submesh.verticesCount % 3 !== 0) {
                Tools.Error("The submesh vertices for the triangle fill mode is not divisible by 3!");
            }
            else {
                const vertexData = [];
                let index = 0;
                switch (vertexBufferKind) {
                    case VertexBuffer.PositionKind:
                    case VertexBuffer.NormalKind: {
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            vertexData.push(Vector3.FromArray(meshAttributeArray, index));
                            vertexData.push(Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                            vertexData.push(Vector3.FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    case VertexBuffer.TangentKind: {
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            vertexData.push(Vector4.FromArray(meshAttributeArray, index));
                            vertexData.push(Vector4.FromArray(meshAttributeArray, index + 2 * stride));
                            vertexData.push(Vector4.FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    case VertexBuffer.ColorKind: {
                        const size = vertexBuffer.getSize();
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + size) {
                            index = x * stride;
                            if (size === 4) {
                                vertexData.push(Vector4.FromArray(meshAttributeArray, index));
                                vertexData.push(Vector4.FromArray(meshAttributeArray, index + 2 * stride));
                                vertexData.push(Vector4.FromArray(meshAttributeArray, index + stride));
                            }
                            else {
                                vertexData.push(Vector3.FromArray(meshAttributeArray, index));
                                vertexData.push(Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                                vertexData.push(Vector3.FromArray(meshAttributeArray, index + stride));
                            }
                        }
                        break;
                    }
                    case VertexBuffer.UVKind:
                    case VertexBuffer.UV2Kind: {
                        for (let x = submesh.verticesStart; x < submesh.verticesStart + submesh.verticesCount; x = x + 3) {
                            index = x * stride;
                            vertexData.push(Vector2.FromArray(meshAttributeArray, index));
                            vertexData.push(Vector2.FromArray(meshAttributeArray, index + 2 * stride));
                            vertexData.push(Vector2.FromArray(meshAttributeArray, index + stride));
                        }
                        break;
                    }
                    default: {
                        Tools.Error(`Unsupported Vertex Buffer type: ${vertexBufferKind}`);
                    }
                }
                this._writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, binaryWriter);
            }
        }
        else {
            Tools.Warn(`reorderTriangleFillMode: Vertex Buffer Kind ${vertexBufferKind} not present!`);
        }
    }
    /**
     * Reorders the vertex attributes in the correct triangle strip order.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _reorderTriangleStripDrawMode(submesh, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        const vertexBuffer = this._getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
        if (vertexBuffer) {
            const stride = vertexBuffer.byteStride / VertexBuffer.GetTypeByteLength(vertexBuffer.type);
            const vertexData = [];
            let index = 0;
            switch (vertexBufferKind) {
                case VertexBuffer.PositionKind:
                case VertexBuffer.NormalKind: {
                    index = submesh.verticesStart;
                    vertexData.push(Vector3.FromArray(meshAttributeArray, index + 2 * stride));
                    vertexData.push(Vector3.FromArray(meshAttributeArray, index + stride));
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(Vector4.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.ColorKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexBuffer.getSize() === 4
                            ? vertexData.push(Vector4.FromArray(meshAttributeArray, index))
                            : vertexData.push(Vector3.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.UVKind:
                case VertexBuffer.UV2Kind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(Vector2.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                default: {
                    Tools.Error(`Unsupported Vertex Buffer type: ${vertexBufferKind}`);
                }
            }
            this._writeVertexAttributeData(vertexData, byteOffset + 12, vertexBufferKind, binaryWriter);
        }
        else {
            Tools.Warn(`reorderTriangleStripDrawMode: Vertex buffer kind ${vertexBufferKind} not present!`);
        }
    }
    /**
     * Reorders the vertex attributes in the correct triangle fan order.  This is necessary when indices are not available and the winding order is
     * clock-wise during export to glTF
     * @param submesh BabylonJS submesh
     * @param vertexBufferKind The type of vertex attribute
     * @param meshAttributeArray The vertex attribute data
     * @param byteOffset The offset to the binary data
     * @param binaryWriter The binary data for the glTF file
     */
    _reorderTriangleFanMode(submesh, vertexBufferKind, meshAttributeArray, byteOffset, binaryWriter) {
        const vertexBuffer = this._getVertexBufferFromMesh(vertexBufferKind, submesh.getMesh());
        if (vertexBuffer) {
            const stride = vertexBuffer.byteStride / VertexBuffer.GetTypeByteLength(vertexBuffer.type);
            const vertexData = [];
            let index = 0;
            switch (vertexBufferKind) {
                case VertexBuffer.PositionKind:
                case VertexBuffer.NormalKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(Vector3.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.TangentKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(Vector4.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.ColorKind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(Vector4.FromArray(meshAttributeArray, index));
                        vertexBuffer.getSize() === 4
                            ? vertexData.push(Vector4.FromArray(meshAttributeArray, index))
                            : vertexData.push(Vector3.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                case VertexBuffer.UVKind:
                case VertexBuffer.UV2Kind: {
                    for (let x = submesh.verticesStart + submesh.verticesCount - 1; x >= submesh.verticesStart; --x) {
                        index = x * stride;
                        vertexData.push(Vector2.FromArray(meshAttributeArray, index));
                    }
                    break;
                }
                default: {
                    Tools.Error(`Unsupported Vertex Buffer type: ${vertexBufferKind}`);
                }
            }
            this._writeVertexAttributeData(vertexData, byteOffset, vertexBufferKind, binaryWriter);
        }
        else {
            Tools.Warn(`reorderTriangleFanMode: Vertex buffer kind ${vertexBufferKind} not present!`);
        }
    }
    /**
     * Writes the vertex attribute data to binary
     * @param vertices The vertices to write to the binary writer
     * @param byteOffset The offset into the binary writer to overwrite binary data
     * @param vertexAttributeKind The vertex attribute type
     * @param binaryWriter The writer containing the binary data
     */
    _writeVertexAttributeData(vertices, byteOffset, vertexAttributeKind, binaryWriter) {
        for (const vertex of vertices) {
            if (vertexAttributeKind === VertexBuffer.NormalKind) {
                vertex.normalize();
            }
            else if (vertexAttributeKind === VertexBuffer.TangentKind && vertex instanceof Vector4) {
                _GLTFUtilities._NormalizeTangentFromRef(vertex);
            }
            for (const component of vertex.asArray()) {
                binaryWriter.setFloat32(component, byteOffset);
                byteOffset += 4;
            }
        }
    }
    /**
     * Writes mesh attribute data to a data buffer
     * Returns the bytelength of the data
     * @param vertexBufferKind Indicates what kind of vertex data is being passed in
     * @param attributeComponentKind
     * @param meshAttributeArray Array containing the attribute data
     * @param stride Specifies the space between data
     * @param binaryWriter The buffer to write the binary data to
     * @param babylonTransformNode
     */
    _writeAttributeData(vertexBufferKind, attributeComponentKind, meshAttributeArray, stride, binaryWriter, babylonTransformNode) {
        let vertexAttributes = [];
        let index;
        switch (vertexBufferKind) {
            case VertexBuffer.PositionKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.NormalKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.normalize().asArray());
                }
                break;
            }
            case VertexBuffer.TangentKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    _GLTFUtilities._NormalizeTangentFromRef(vertexData);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.ColorKind: {
                const meshMaterial = babylonTransformNode.material;
                const convertToLinear = meshMaterial ? meshMaterial.getClassName() === "StandardMaterial" : true;
                const vertexData = stride === 3 ? new Color3() : new Color4();
                const useExactSrgbConversions = this._babylonScene.getEngine().useExactSrgbConversions;
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    if (stride === 3) {
                        Color3.FromArrayToRef(meshAttributeArray, index, vertexData);
                        if (convertToLinear) {
                            vertexData.toLinearSpaceToRef(vertexData, useExactSrgbConversions);
                        }
                    }
                    else {
                        Color4.FromArrayToRef(meshAttributeArray, index, vertexData);
                        if (convertToLinear) {
                            vertexData.toLinearSpaceToRef(vertexData, useExactSrgbConversions);
                        }
                    }
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.UVKind:
            case VertexBuffer.UV2Kind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector2.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.MatricesIndicesKind:
            case VertexBuffer.MatricesIndicesExtraKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            case VertexBuffer.MatricesWeightsKind:
            case VertexBuffer.MatricesWeightsExtraKind: {
                for (let k = 0, length = meshAttributeArray.length / stride; k < length; ++k) {
                    index = k * stride;
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    vertexAttributes.push(vertexData.asArray());
                }
                break;
            }
            default: {
                Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                vertexAttributes = [];
            }
        }
        let writeBinaryFunc;
        switch (attributeComponentKind) {
            case 5121 /* AccessorComponentType.UNSIGNED_BYTE */: {
                writeBinaryFunc = binaryWriter.setUInt8.bind(binaryWriter);
                break;
            }
            case 5123 /* AccessorComponentType.UNSIGNED_SHORT */: {
                writeBinaryFunc = binaryWriter.setUInt16.bind(binaryWriter);
                break;
            }
            case 5125 /* AccessorComponentType.UNSIGNED_INT */: {
                writeBinaryFunc = binaryWriter.setUInt32.bind(binaryWriter);
                break;
            }
            case 5126 /* AccessorComponentType.FLOAT */: {
                writeBinaryFunc = binaryWriter.setFloat32.bind(binaryWriter);
                break;
            }
            default: {
                Tools.Warn("Unsupported Attribute Component kind: " + attributeComponentKind);
                return;
            }
        }
        for (const vertexAttribute of vertexAttributes) {
            for (const component of vertexAttribute) {
                writeBinaryFunc(component);
            }
        }
    }
    /**
     * Writes mesh attribute data to a data buffer
     * Returns the bytelength of the data
     * @param vertexBufferKind Indicates what kind of vertex data is being passed in
     * @param attributeComponentKind attribute component type
     * @param meshPrimitive the mesh primitive
     * @param meshAttributeArray Array containing the attribute data
     * @param morphTargetAttributeArray
     * @param stride Specifies the space between data
     * @param binaryWriter The buffer to write the binary data to
     * @param minMax
     */
    writeMorphTargetAttributeData(vertexBufferKind, attributeComponentKind, meshPrimitive, meshAttributeArray, morphTargetAttributeArray, stride, binaryWriter, minMax) {
        let vertexAttributes = [];
        let index;
        let difference = new Vector3();
        let difference4 = new Vector4(0, 0, 0, 0);
        switch (vertexBufferKind) {
            case VertexBuffer.PositionKind: {
                for (let k = meshPrimitive.verticesStart; k < meshPrimitive.verticesCount; ++k) {
                    index = meshPrimitive.indexStart + k * stride;
                    const vertexData = Vector3.FromArray(meshAttributeArray, index);
                    const morphData = Vector3.FromArray(morphTargetAttributeArray, index);
                    difference = morphData.subtractToRef(vertexData, difference);
                    if (minMax) {
                        minMax.min.copyFromFloats(Math.min(difference.x, minMax.min.x), Math.min(difference.y, minMax.min.y), Math.min(difference.z, minMax.min.z));
                        minMax.max.copyFromFloats(Math.max(difference.x, minMax.max.x), Math.max(difference.y, minMax.max.y), Math.max(difference.z, minMax.max.z));
                    }
                    vertexAttributes.push(difference.asArray());
                }
                break;
            }
            case VertexBuffer.NormalKind: {
                for (let k = meshPrimitive.verticesStart; k < meshPrimitive.verticesCount; ++k) {
                    index = meshPrimitive.indexStart + k * stride;
                    const vertexData = Vector3.FromArray(meshAttributeArray, index).normalize();
                    const morphData = Vector3.FromArray(morphTargetAttributeArray, index).normalize();
                    difference = morphData.subtractToRef(vertexData, difference);
                    vertexAttributes.push(difference.asArray());
                }
                break;
            }
            case VertexBuffer.TangentKind: {
                for (let k = meshPrimitive.verticesStart; k < meshPrimitive.verticesCount; ++k) {
                    index = meshPrimitive.indexStart + k * (stride + 1);
                    const vertexData = Vector4.FromArray(meshAttributeArray, index);
                    _GLTFUtilities._NormalizeTangentFromRef(vertexData);
                    const morphData = Vector4.FromArray(morphTargetAttributeArray, index);
                    _GLTFUtilities._NormalizeTangentFromRef(morphData);
                    difference4 = morphData.subtractToRef(vertexData, difference4);
                    vertexAttributes.push([difference4.x, difference4.y, difference4.z]);
                }
                break;
            }
            default: {
                Tools.Warn("Unsupported Vertex Buffer Type: " + vertexBufferKind);
                vertexAttributes = [];
            }
        }
        let writeBinaryFunc;
        switch (attributeComponentKind) {
            case 5121 /* AccessorComponentType.UNSIGNED_BYTE */: {
                writeBinaryFunc = binaryWriter.setUInt8.bind(binaryWriter);
                break;
            }
            case 5123 /* AccessorComponentType.UNSIGNED_SHORT */: {
                writeBinaryFunc = binaryWriter.setUInt16.bind(binaryWriter);
                break;
            }
            case 5125 /* AccessorComponentType.UNSIGNED_INT */: {
                writeBinaryFunc = binaryWriter.setUInt32.bind(binaryWriter);
                break;
            }
            case 5126 /* AccessorComponentType.FLOAT */: {
                writeBinaryFunc = binaryWriter.setFloat32.bind(binaryWriter);
                break;
            }
            default: {
                Tools.Warn("Unsupported Attribute Component kind: " + attributeComponentKind);
                return;
            }
        }
        for (const vertexAttribute of vertexAttributes) {
            for (const component of vertexAttribute) {
                writeBinaryFunc(component);
            }
        }
    }
    /**
     * Generates glTF json data
     * @param shouldUseGlb Indicates whether the json should be written for a glb file
     * @param glTFPrefix Text to use when prefixing a glTF file
     * @param prettyPrint Indicates whether the json file should be pretty printed (true) or not (false)
     * @returns json data as string
     */
    _generateJSON(shouldUseGlb, glTFPrefix, prettyPrint) {
        const buffer = { byteLength: this._totalByteLength };
        let imageName;
        let imageData;
        let bufferView;
        let byteOffset = this._totalByteLength;
        if (buffer.byteLength) {
            this._glTF.buffers = [buffer];
        }
        if (this._nodes && this._nodes.length) {
            this._glTF.nodes = this._nodes;
        }
        if (this._meshes && this._meshes.length) {
            this._glTF.meshes = this._meshes;
        }
        if (this._scenes && this._scenes.length) {
            this._glTF.scenes = this._scenes;
            this._glTF.scene = 0;
        }
        if (this._cameras && this._cameras.length) {
            this._glTF.cameras = this._cameras;
        }
        if (this._bufferViews && this._bufferViews.length) {
            this._glTF.bufferViews = this._bufferViews;
        }
        if (this._accessors && this._accessors.length) {
            this._glTF.accessors = this._accessors;
        }
        if (this._animations && this._animations.length) {
            this._glTF.animations = this._animations;
        }
        if (this._materials && this._materials.length) {
            this._glTF.materials = this._materials;
        }
        if (this._textures && this._textures.length) {
            this._glTF.textures = this._textures;
        }
        if (this._samplers && this._samplers.length) {
            this._glTF.samplers = this._samplers;
        }
        if (this._skins && this._skins.length) {
            this._glTF.skins = this._skins;
        }
        if (this._images && this._images.length) {
            if (!shouldUseGlb) {
                this._glTF.images = this._images;
            }
            else {
                this._glTF.images = [];
                this._images.forEach((image) => {
                    if (image.uri) {
                        imageData = this._imageData[image.uri];
                        this._orderedImageData.push(imageData);
                        imageName = image.uri.split(".")[0] + " image";
                        bufferView = _GLTFUtilities._CreateBufferView(0, byteOffset, imageData.data.byteLength, undefined, imageName);
                        byteOffset += imageData.data.byteLength;
                        this._bufferViews.push(bufferView);
                        image.bufferView = this._bufferViews.length - 1;
                        image.name = imageName;
                        image.mimeType = imageData.mimeType;
                        image.uri = undefined;
                        if (!this._glTF.images) {
                            this._glTF.images = [];
                        }
                        this._glTF.images.push(image);
                    }
                });
                // Replace uri with bufferview and mime type for glb
                buffer.byteLength = byteOffset;
            }
        }
        if (!shouldUseGlb) {
            buffer.uri = glTFPrefix + ".bin";
        }
        const jsonText = prettyPrint ? JSON.stringify(this._glTF, null, 2) : JSON.stringify(this._glTF);
        return jsonText;
    }
    /**
     * Generates data for .gltf and .bin files based on the glTF prefix string
     * @param glTFPrefix Text to use when prefixing a glTF file
     * @param dispose Dispose the exporter
     * @returns GLTFData with glTF file data
     */
    _generateGLTFAsync(glTFPrefix, dispose = true) {
        return this._generateBinaryAsync().then((binaryBuffer) => {
            this._extensionsOnExporting();
            const jsonText = this._generateJSON(false, glTFPrefix, true);
            const bin = new Blob([binaryBuffer], { type: "application/octet-stream" });
            const glTFFileName = glTFPrefix + ".gltf";
            const glTFBinFile = glTFPrefix + ".bin";
            const container = new GLTFData();
            container.glTFFiles[glTFFileName] = jsonText;
            container.glTFFiles[glTFBinFile] = bin;
            if (this._imageData) {
                for (const image in this._imageData) {
                    container.glTFFiles[image] = new Blob([this._imageData[image].data], { type: this._imageData[image].mimeType });
                }
            }
            if (dispose) {
                this.dispose();
            }
            return container;
        });
    }
    /**
     * Creates a binary buffer for glTF
     * @returns array buffer for binary data
     */
    _generateBinaryAsync() {
        const binaryWriter = new _BinaryWriter(4);
        return this._createSceneAsync(binaryWriter).then(() => {
            if (this._localEngine) {
                this._localEngine.dispose();
            }
            return binaryWriter.getArrayBuffer();
        });
    }
    /**
     * Pads the number to a multiple of 4
     * @param num number to pad
     * @returns padded number
     */
    _getPadding(num) {
        const remainder = num % 4;
        const padding = remainder === 0 ? remainder : 4 - remainder;
        return padding;
    }
    /**
     * @internal
     */
    _generateGLBAsync(glTFPrefix, dispose = true) {
        return this._generateBinaryAsync().then((binaryBuffer) => {
            this._extensionsOnExporting();
            const jsonText = this._generateJSON(true);
            const glbFileName = glTFPrefix + ".glb";
            const headerLength = 12;
            const chunkLengthPrefix = 8;
            let jsonLength = jsonText.length;
            let encodedJsonText;
            let imageByteLength = 0;
            // make use of TextEncoder when available
            if (typeof TextEncoder !== "undefined") {
                const encoder = new TextEncoder();
                encodedJsonText = encoder.encode(jsonText);
                jsonLength = encodedJsonText.length;
            }
            for (let i = 0; i < this._orderedImageData.length; ++i) {
                imageByteLength += this._orderedImageData[i].data.byteLength;
            }
            const jsonPadding = this._getPadding(jsonLength);
            const binPadding = this._getPadding(binaryBuffer.byteLength);
            const imagePadding = this._getPadding(imageByteLength);
            const byteLength = headerLength + 2 * chunkLengthPrefix + jsonLength + jsonPadding + binaryBuffer.byteLength + binPadding + imageByteLength + imagePadding;
            //header
            const headerBuffer = new ArrayBuffer(headerLength);
            const headerBufferView = new DataView(headerBuffer);
            headerBufferView.setUint32(0, 0x46546c67, true); //glTF
            headerBufferView.setUint32(4, 2, true); // version
            headerBufferView.setUint32(8, byteLength, true); // total bytes in file
            //json chunk
            const jsonChunkBuffer = new ArrayBuffer(chunkLengthPrefix + jsonLength + jsonPadding);
            const jsonChunkBufferView = new DataView(jsonChunkBuffer);
            jsonChunkBufferView.setUint32(0, jsonLength + jsonPadding, true);
            jsonChunkBufferView.setUint32(4, 0x4e4f534a, true);
            //json chunk bytes
            const jsonData = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix);
            // if TextEncoder was available, we can simply copy the encoded array
            if (encodedJsonText) {
                jsonData.set(encodedJsonText);
            }
            else {
                const blankCharCode = "_".charCodeAt(0);
                for (let i = 0; i < jsonLength; ++i) {
                    const charCode = jsonText.charCodeAt(i);
                    // if the character doesn't fit into a single UTF-16 code unit, just put a blank character
                    if (charCode != jsonText.codePointAt(i)) {
                        jsonData[i] = blankCharCode;
                    }
                    else {
                        jsonData[i] = charCode;
                    }
                }
            }
            //json padding
            const jsonPaddingView = new Uint8Array(jsonChunkBuffer, chunkLengthPrefix + jsonLength);
            for (let i = 0; i < jsonPadding; ++i) {
                jsonPaddingView[i] = 0x20;
            }
            //binary chunk
            const binaryChunkBuffer = new ArrayBuffer(chunkLengthPrefix);
            const binaryChunkBufferView = new DataView(binaryChunkBuffer);
            binaryChunkBufferView.setUint32(0, binaryBuffer.byteLength + imageByteLength + imagePadding, true);
            binaryChunkBufferView.setUint32(4, 0x004e4942, true);
            // binary padding
            const binPaddingBuffer = new ArrayBuffer(binPadding);
            const binPaddingView = new Uint8Array(binPaddingBuffer);
            for (let i = 0; i < binPadding; ++i) {
                binPaddingView[i] = 0;
            }
            const imagePaddingBuffer = new ArrayBuffer(imagePadding);
            const imagePaddingView = new Uint8Array(imagePaddingBuffer);
            for (let i = 0; i < imagePadding; ++i) {
                imagePaddingView[i] = 0;
            }
            const glbData = [headerBuffer, jsonChunkBuffer, binaryChunkBuffer, binaryBuffer];
            // binary data
            for (let i = 0; i < this._orderedImageData.length; ++i) {
                glbData.push(this._orderedImageData[i].data);
            }
            glbData.push(binPaddingBuffer);
            glbData.push(imagePaddingBuffer);
            const glbFile = new Blob(glbData, { type: "application/octet-stream" });
            const container = new GLTFData();
            container.glTFFiles[glbFileName] = glbFile;
            if (this._localEngine != null) {
                this._localEngine.dispose();
            }
            if (dispose) {
                this.dispose();
            }
            return container;
        });
    }
    /**
     * Sets the TRS for each node
     * @param node glTF Node for storing the transformation data
     * @param babylonTransformNode Babylon mesh used as the source for the transformation data
     */
    _setNodeTransformation(node, babylonTransformNode) {
        if (!babylonTransformNode.getPivotPoint().equalsToFloats(0, 0, 0)) {
            Tools.Warn("Pivot points are not supported in the glTF serializer");
        }
        if (!babylonTransformNode.position.equalsToFloats(0, 0, 0)) {
            node.translation = babylonTransformNode.position.asArray();
        }
        if (!babylonTransformNode.scaling.equalsToFloats(1, 1, 1)) {
            node.scale = babylonTransformNode.scaling.asArray();
        }
        const rotationQuaternion = Quaternion.FromEulerAngles(babylonTransformNode.rotation.x, babylonTransformNode.rotation.y, babylonTransformNode.rotation.z);
        if (babylonTransformNode.rotationQuaternion) {
            rotationQuaternion.multiplyInPlace(babylonTransformNode.rotationQuaternion);
        }
        if (!Quaternion.IsIdentity(rotationQuaternion)) {
            node.rotation = rotationQuaternion.normalize().asArray();
        }
    }
    _setCameraTransformation(node, babylonCamera) {
        const translation = TmpVectors.Vector3[0];
        const rotation = TmpVectors.Quaternion[0];
        babylonCamera.getWorldMatrix().decompose(undefined, rotation, translation);
        if (!translation.equalsToFloats(0, 0, 0)) {
            node.translation = translation.asArray();
        }
        // // Rotation by 180 as glTF has a different convention than Babylon.
        rotation.multiplyInPlace(rotation180Y);
        if (!Quaternion.IsIdentity(rotation)) {
            node.rotation = rotation.asArray();
        }
    }
    _getVertexBufferFromMesh(attributeKind, bufferMesh) {
        if (bufferMesh.isVerticesDataPresent(attributeKind, true)) {
            const vertexBuffer = bufferMesh.getVertexBuffer(attributeKind, true);
            if (vertexBuffer) {
                return vertexBuffer;
            }
        }
        return null;
    }
    /**
     * Creates a bufferview based on the vertices type for the Babylon mesh
     * @param kind Indicates the type of vertices data
     * @param attributeComponentKind Indicates the numerical type used to store the data
     * @param babylonTransformNode The Babylon mesh to get the vertices data from
     * @param binaryWriter The buffer to write the bufferview data to
     * @param byteStride
     */
    _createBufferViewKind(kind, attributeComponentKind, babylonTransformNode, binaryWriter, byteStride) {
        const bufferMesh = babylonTransformNode instanceof Mesh
            ? babylonTransformNode
            : babylonTransformNode instanceof InstancedMesh
                ? babylonTransformNode.sourceMesh
                : null;
        if (bufferMesh) {
            const vertexBuffer = bufferMesh.getVertexBuffer(kind, true);
            const vertexData = bufferMesh.getVerticesData(kind, undefined, undefined, true);
            if (vertexBuffer && vertexData) {
                const typeByteLength = VertexBuffer.GetTypeByteLength(attributeComponentKind);
                const byteLength = vertexData.length * typeByteLength;
                const bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, kind + " - " + bufferMesh.name);
                this._bufferViews.push(bufferView);
                this._writeAttributeData(kind, attributeComponentKind, vertexData, byteStride / typeByteLength, binaryWriter, babylonTransformNode);
            }
        }
    }
    /**
     * Creates a bufferview based on the vertices type for the Babylon mesh
     * @param babylonSubMesh The Babylon submesh that the morph target is applied to
     * @param meshPrimitive
     * @param babylonMorphTarget the morph target to be exported
     * @param binaryWriter The buffer to write the bufferview data to
     */
    _setMorphTargetAttributes(babylonSubMesh, meshPrimitive, babylonMorphTarget, binaryWriter) {
        if (babylonMorphTarget) {
            if (!meshPrimitive.targets) {
                meshPrimitive.targets = [];
            }
            const target = {};
            const mesh = babylonSubMesh.getMesh();
            if (babylonMorphTarget.hasNormals) {
                const vertexNormals = mesh.getVerticesData(VertexBuffer.NormalKind, undefined, undefined, true);
                const morphNormals = babylonMorphTarget.getNormals();
                const count = babylonSubMesh.verticesCount;
                const byteStride = 12; // 3 x 4 byte floats
                const byteLength = count * byteStride;
                const bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, babylonMorphTarget.name + "_NORMAL");
                this._bufferViews.push(bufferView);
                const bufferViewIndex = this._bufferViews.length - 1;
                const accessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, babylonMorphTarget.name + " - " + "NORMAL", "VEC3" /* AccessorType.VEC3 */, 5126 /* AccessorComponentType.FLOAT */, count, 0, null, null);
                this._accessors.push(accessor);
                target.NORMAL = this._accessors.length - 1;
                this.writeMorphTargetAttributeData(VertexBuffer.NormalKind, 5126 /* AccessorComponentType.FLOAT */, babylonSubMesh, vertexNormals, morphNormals, byteStride / 4, binaryWriter);
            }
            if (babylonMorphTarget.hasPositions) {
                const vertexPositions = mesh.getVerticesData(VertexBuffer.PositionKind, undefined, undefined, true);
                const morphPositions = babylonMorphTarget.getPositions();
                const count = babylonSubMesh.verticesCount;
                const byteStride = 12; // 3 x 4 byte floats
                const byteLength = count * byteStride;
                const bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, babylonMorphTarget.name + "_POSITION");
                this._bufferViews.push(bufferView);
                const bufferViewIndex = this._bufferViews.length - 1;
                const minMax = { min: new Vector3(Infinity, Infinity, Infinity), max: new Vector3(-Infinity, -Infinity, -Infinity) };
                const accessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, babylonMorphTarget.name + " - " + "POSITION", "VEC3" /* AccessorType.VEC3 */, 5126 /* AccessorComponentType.FLOAT */, count, 0, null, null);
                this._accessors.push(accessor);
                target.POSITION = this._accessors.length - 1;
                this.writeMorphTargetAttributeData(VertexBuffer.PositionKind, 5126 /* AccessorComponentType.FLOAT */, babylonSubMesh, vertexPositions, morphPositions, byteStride / 4, binaryWriter, minMax);
                accessor.min = minMax.min.asArray();
                accessor.max = minMax.max.asArray();
            }
            if (babylonMorphTarget.hasTangents) {
                const vertexTangents = mesh.getVerticesData(VertexBuffer.TangentKind, undefined, undefined, true);
                const morphTangents = babylonMorphTarget.getTangents();
                const count = babylonSubMesh.verticesCount;
                const byteStride = 12; // 3 x 4 byte floats
                const byteLength = count * byteStride;
                const bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, byteStride, babylonMorphTarget.name + "_NORMAL");
                this._bufferViews.push(bufferView);
                const bufferViewIndex = this._bufferViews.length - 1;
                const accessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, babylonMorphTarget.name + " - " + "TANGENT", "VEC3" /* AccessorType.VEC3 */, 5126 /* AccessorComponentType.FLOAT */, count, 0, null, null);
                this._accessors.push(accessor);
                target.TANGENT = this._accessors.length - 1;
                this.writeMorphTargetAttributeData(VertexBuffer.TangentKind, 5126 /* AccessorComponentType.FLOAT */, babylonSubMesh, vertexTangents, morphTangents, byteStride / 4, binaryWriter);
            }
            meshPrimitive.targets.push(target);
        }
    }
    /**
     * The primitive mode of the Babylon mesh
     * @param babylonMesh The BabylonJS mesh
     * @returns Unsigned integer of the primitive mode or null
     */
    _getMeshPrimitiveMode(babylonMesh) {
        if (babylonMesh instanceof LinesMesh) {
            return Material.LineListDrawMode;
        }
        if (babylonMesh instanceof InstancedMesh || babylonMesh instanceof Mesh) {
            const baseMesh = babylonMesh instanceof Mesh ? babylonMesh : babylonMesh.sourceMesh;
            if (typeof baseMesh.overrideRenderingFillMode === "number") {
                return baseMesh.overrideRenderingFillMode;
            }
        }
        return babylonMesh.material ? babylonMesh.material.fillMode : Material.TriangleFillMode;
    }
    /**
     * Sets the primitive mode of the glTF mesh primitive
     * @param meshPrimitive glTF mesh primitive
     * @param primitiveMode The primitive mode
     */
    _setPrimitiveMode(meshPrimitive, primitiveMode) {
        switch (primitiveMode) {
            case Material.TriangleFillMode: {
                // glTF defaults to using Triangle Mode
                break;
            }
            case Material.TriangleStripDrawMode: {
                meshPrimitive.mode = 5 /* MeshPrimitiveMode.TRIANGLE_STRIP */;
                break;
            }
            case Material.TriangleFanDrawMode: {
                meshPrimitive.mode = 6 /* MeshPrimitiveMode.TRIANGLE_FAN */;
                break;
            }
            case Material.PointListDrawMode: {
                meshPrimitive.mode = 0 /* MeshPrimitiveMode.POINTS */;
                break;
            }
            case Material.PointFillMode: {
                meshPrimitive.mode = 0 /* MeshPrimitiveMode.POINTS */;
                break;
            }
            case Material.LineLoopDrawMode: {
                meshPrimitive.mode = 2 /* MeshPrimitiveMode.LINE_LOOP */;
                break;
            }
            case Material.LineListDrawMode: {
                meshPrimitive.mode = 1 /* MeshPrimitiveMode.LINES */;
                break;
            }
            case Material.LineStripDrawMode: {
                meshPrimitive.mode = 3 /* MeshPrimitiveMode.LINE_STRIP */;
                break;
            }
        }
    }
    /**
     * Sets the vertex attribute accessor based of the glTF mesh primitive
     * @param meshPrimitive glTF mesh primitive
     * @param attributeKind vertex attribute
     */
    _setAttributeKind(meshPrimitive, attributeKind) {
        switch (attributeKind) {
            case VertexBuffer.PositionKind: {
                meshPrimitive.attributes.POSITION = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.NormalKind: {
                meshPrimitive.attributes.NORMAL = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.ColorKind: {
                meshPrimitive.attributes.COLOR_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.TangentKind: {
                meshPrimitive.attributes.TANGENT = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.UVKind: {
                meshPrimitive.attributes.TEXCOORD_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.UV2Kind: {
                meshPrimitive.attributes.TEXCOORD_1 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesIndicesKind: {
                meshPrimitive.attributes.JOINTS_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesIndicesExtraKind: {
                meshPrimitive.attributes.JOINTS_1 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesWeightsKind: {
                meshPrimitive.attributes.WEIGHTS_0 = this._accessors.length - 1;
                break;
            }
            case VertexBuffer.MatricesWeightsExtraKind: {
                meshPrimitive.attributes.WEIGHTS_1 = this._accessors.length - 1;
                break;
            }
            default: {
                Tools.Warn("Unsupported Vertex Buffer Type: " + attributeKind);
            }
        }
    }
    /**
     * Sets data for the primitive attributes of each submesh
     * @param mesh glTF Mesh object to store the primitive attribute information
     * @param babylonTransformNode Babylon mesh to get the primitive attribute data from
     * @param binaryWriter Buffer to write the attribute data to
     * @returns promise that resolves when done setting the primitive attributes
     */
    _setPrimitiveAttributesAsync(mesh, babylonTransformNode, binaryWriter) {
        const promises = [];
        let bufferMesh = null;
        let bufferView;
        let minMax;
        if (babylonTransformNode instanceof Mesh) {
            bufferMesh = babylonTransformNode;
        }
        else if (babylonTransformNode instanceof InstancedMesh) {
            bufferMesh = babylonTransformNode.sourceMesh;
        }
        const attributeData = [
            { kind: VertexBuffer.PositionKind, accessorType: "VEC3" /* AccessorType.VEC3 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 12 },
            { kind: VertexBuffer.NormalKind, accessorType: "VEC3" /* AccessorType.VEC3 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 12 },
            { kind: VertexBuffer.ColorKind, accessorType: "VEC4" /* AccessorType.VEC4 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 16 },
            { kind: VertexBuffer.TangentKind, accessorType: "VEC4" /* AccessorType.VEC4 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 16 },
            { kind: VertexBuffer.UVKind, accessorType: "VEC2" /* AccessorType.VEC2 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 8 },
            { kind: VertexBuffer.UV2Kind, accessorType: "VEC2" /* AccessorType.VEC2 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 8 },
            { kind: VertexBuffer.MatricesIndicesKind, accessorType: "VEC4" /* AccessorType.VEC4 */, accessorComponentType: 5123 /* AccessorComponentType.UNSIGNED_SHORT */, byteStride: 8 },
            { kind: VertexBuffer.MatricesIndicesExtraKind, accessorType: "VEC4" /* AccessorType.VEC4 */, accessorComponentType: 5123 /* AccessorComponentType.UNSIGNED_SHORT */, byteStride: 8 },
            { kind: VertexBuffer.MatricesWeightsKind, accessorType: "VEC4" /* AccessorType.VEC4 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 16 },
            { kind: VertexBuffer.MatricesWeightsExtraKind, accessorType: "VEC4" /* AccessorType.VEC4 */, accessorComponentType: 5126 /* AccessorComponentType.FLOAT */, byteStride: 16 },
        ];
        if (bufferMesh) {
            let indexBufferViewIndex = null;
            const primitiveMode = this._getMeshPrimitiveMode(bufferMesh);
            const vertexAttributeBufferViews = {};
            const morphTargetManager = bufferMesh.morphTargetManager;
            // For each BabylonMesh, create bufferviews for each 'kind'
            for (const attribute of attributeData) {
                const attributeKind = attribute.kind;
                const attributeComponentKind = attribute.accessorComponentType;
                if (bufferMesh.isVerticesDataPresent(attributeKind, true)) {
                    const vertexBuffer = this._getVertexBufferFromMesh(attributeKind, bufferMesh);
                    attribute.byteStride = vertexBuffer
                        ? vertexBuffer.getSize() * VertexBuffer.GetTypeByteLength(attribute.accessorComponentType)
                        : VertexBuffer.DeduceStride(attributeKind) * 4;
                    if (attribute.byteStride === 12) {
                        attribute.accessorType = "VEC3" /* AccessorType.VEC3 */;
                    }
                    this._createBufferViewKind(attributeKind, attributeComponentKind, babylonTransformNode, binaryWriter, attribute.byteStride);
                    attribute.bufferViewIndex = this._bufferViews.length - 1;
                    vertexAttributeBufferViews[attributeKind] = attribute.bufferViewIndex;
                }
            }
            if (bufferMesh.getTotalIndices()) {
                const indices = bufferMesh.getIndices();
                if (indices) {
                    const byteLength = indices.length * 4;
                    bufferView = _GLTFUtilities._CreateBufferView(0, binaryWriter.getByteOffset(), byteLength, undefined, "Indices - " + bufferMesh.name);
                    this._bufferViews.push(bufferView);
                    indexBufferViewIndex = this._bufferViews.length - 1;
                    for (let k = 0, length = indices.length; k < length; ++k) {
                        binaryWriter.setUInt32(indices[k]);
                    }
                }
            }
            if (bufferMesh.subMeshes) {
                // go through all mesh primitives (submeshes)
                for (const submesh of bufferMesh.subMeshes) {
                    let babylonMaterial = submesh.getMaterial() || bufferMesh.getScene().defaultMaterial;
                    let materialIndex = null;
                    if (babylonMaterial) {
                        if (bufferMesh instanceof LinesMesh) {
                            // get the color from the lines mesh and set it in the material
                            const material = {
                                name: bufferMesh.name + " material",
                            };
                            if (!bufferMesh.color.equals(Color3.White()) || bufferMesh.alpha < 1) {
                                material.pbrMetallicRoughness = {
                                    baseColorFactor: bufferMesh.color.asArray().concat([bufferMesh.alpha]),
                                };
                            }
                            this._materials.push(material);
                            materialIndex = this._materials.length - 1;
                        }
                        else if (babylonMaterial instanceof MultiMaterial) {
                            const subMaterial = babylonMaterial.subMaterials[submesh.materialIndex];
                            if (subMaterial) {
                                babylonMaterial = subMaterial;
                                materialIndex = this._materialMap[babylonMaterial.uniqueId];
                            }
                        }
                        else {
                            materialIndex = this._materialMap[babylonMaterial.uniqueId];
                        }
                    }
                    const glTFMaterial = materialIndex != null ? this._materials[materialIndex] : null;
                    const meshPrimitive = { attributes: {} };
                    this._setPrimitiveMode(meshPrimitive, primitiveMode);
                    for (const attribute of attributeData) {
                        const attributeKind = attribute.kind;
                        if ((attributeKind === VertexBuffer.UVKind || attributeKind === VertexBuffer.UV2Kind) && !this._options.exportUnusedUVs) {
                            if (!glTFMaterial || !this._glTFMaterialExporter._hasTexturesPresent(glTFMaterial)) {
                                continue;
                            }
                        }
                        const vertexData = bufferMesh.getVerticesData(attributeKind, undefined, undefined, true);
                        if (vertexData) {
                            const vertexBuffer = this._getVertexBufferFromMesh(attributeKind, bufferMesh);
                            if (vertexBuffer) {
                                const stride = vertexBuffer.getSize();
                                const bufferViewIndex = attribute.bufferViewIndex;
                                if (bufferViewIndex != undefined) {
                                    // check to see if bufferviewindex has a numeric value assigned.
                                    minMax = { min: null, max: null };
                                    if (attributeKind == VertexBuffer.PositionKind) {
                                        minMax = _GLTFUtilities._CalculateMinMaxPositions(vertexData, 0, vertexData.length / stride);
                                    }
                                    const accessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, attributeKind + " - " + babylonTransformNode.name, attribute.accessorType, attribute.accessorComponentType, vertexData.length / stride, 0, minMax.min, minMax.max);
                                    this._accessors.push(accessor);
                                    this._setAttributeKind(meshPrimitive, attributeKind);
                                }
                            }
                        }
                    }
                    if (indexBufferViewIndex) {
                        // Create accessor
                        const accessor = _GLTFUtilities._CreateAccessor(indexBufferViewIndex, "indices - " + babylonTransformNode.name, "SCALAR" /* AccessorType.SCALAR */, 5125 /* AccessorComponentType.UNSIGNED_INT */, submesh.indexCount, submesh.indexStart * 4, null, null);
                        this._accessors.push(accessor);
                        meshPrimitive.indices = this._accessors.length - 1;
                    }
                    if (Object.keys(meshPrimitive.attributes).length > 0) {
                        const sideOrientation = babylonMaterial._getEffectiveOrientation(bufferMesh);
                        if (sideOrientation === (this._babylonScene.useRightHandedSystem ? Material.ClockWiseSideOrientation : Material.CounterClockWiseSideOrientation)) {
                            let byteOffset = indexBufferViewIndex != null ? this._bufferViews[indexBufferViewIndex].byteOffset : null;
                            if (byteOffset == null) {
                                byteOffset = 0;
                            }
                            let babylonIndices = null;
                            if (indexBufferViewIndex != null) {
                                babylonIndices = bufferMesh.getIndices();
                            }
                            if (babylonIndices) {
                                this._reorderIndicesBasedOnPrimitiveMode(submesh, primitiveMode, babylonIndices, byteOffset, binaryWriter);
                            }
                            else {
                                for (const attribute of attributeData) {
                                    const vertexData = bufferMesh.getVerticesData(attribute.kind, undefined, undefined, true);
                                    if (vertexData) {
                                        const byteOffset = this._bufferViews[vertexAttributeBufferViews[attribute.kind]].byteOffset || 0;
                                        this._reorderVertexAttributeDataBasedOnPrimitiveMode(submesh, primitiveMode, attribute.kind, vertexData, byteOffset, binaryWriter);
                                    }
                                }
                            }
                        }
                        if (materialIndex != null) {
                            meshPrimitive.material = materialIndex;
                        }
                    }
                    if (morphTargetManager) {
                        // By convention, morph target names are stored in the mesh extras.
                        if (!mesh.extras) {
                            mesh.extras = {};
                        }
                        mesh.extras.targetNames = [];
                        for (let i = 0; i < morphTargetManager.numTargets; ++i) {
                            const target = morphTargetManager.getTarget(i);
                            this._setMorphTargetAttributes(submesh, meshPrimitive, target, binaryWriter);
                            mesh.extras.targetNames.push(target.name);
                        }
                    }
                    mesh.primitives.push(meshPrimitive);
                    this._extensionsPostExportMeshPrimitiveAsync("postExport", meshPrimitive, submesh, binaryWriter);
                    promises.push();
                }
            }
        }
        return Promise.all(promises).then(() => {
            /* do nothing */
        });
    }
    /**
     * Creates a glTF scene based on the array of meshes
     * Returns the total byte offset
     * @param binaryWriter Buffer to write binary data to
     * @returns a promise that resolves when done
     */
    _createSceneAsync(binaryWriter) {
        const scene = { nodes: [] };
        let glTFNodeIndex;
        let glTFNode;
        let directDescendents;
        const nodes = [...this._babylonScene.transformNodes, ...this._babylonScene.meshes, ...this._babylonScene.lights, ...this._babylonScene.cameras];
        const removedRootNodes = new Set();
        // Scene metadata
        if (this._babylonScene.metadata) {
            if (this._options.metadataSelector) {
                scene.extras = this._options.metadataSelector(this._babylonScene.metadata);
            }
            else if (this._babylonScene.metadata.gltf) {
                scene.extras = this._babylonScene.metadata.gltf.extras;
            }
        }
        // Remove no-op root nodes
        if ((this._options.removeNoopRootNodes ?? true) && !this._options.includeCoordinateSystemConversionNodes) {
            for (const rootNode of this._babylonScene.rootNodes) {
                if (isNoopNode(rootNode, this._babylonScene.useRightHandedSystem)) {
                    removedRootNodes.add(rootNode);
                    // Exclude the node from list of nodes to export
                    nodes.splice(nodes.indexOf(rootNode), 1);
                }
            }
        }
        // Export babylon cameras to glTFCamera
        const cameraMap = new Map();
        this._babylonScene.cameras.forEach((camera) => {
            if (this._options.shouldExportNode && !this._options.shouldExportNode(camera)) {
                return;
            }
            const glTFCamera = {
                type: camera.mode === Camera.PERSPECTIVE_CAMERA ? "perspective" /* CameraType.PERSPECTIVE */ : "orthographic" /* CameraType.ORTHOGRAPHIC */,
            };
            if (camera.name) {
                glTFCamera.name = camera.name;
            }
            if (glTFCamera.type === "perspective" /* CameraType.PERSPECTIVE */) {
                glTFCamera.perspective = {
                    aspectRatio: camera.getEngine().getAspectRatio(camera),
                    yfov: camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED ? camera.fov : camera.fov * camera.getEngine().getAspectRatio(camera),
                    znear: camera.minZ,
                    zfar: camera.maxZ,
                };
            }
            else if (glTFCamera.type === "orthographic" /* CameraType.ORTHOGRAPHIC */) {
                const halfWidth = camera.orthoLeft && camera.orthoRight ? 0.5 * (camera.orthoRight - camera.orthoLeft) : camera.getEngine().getRenderWidth() * 0.5;
                const halfHeight = camera.orthoBottom && camera.orthoTop ? 0.5 * (camera.orthoTop - camera.orthoBottom) : camera.getEngine().getRenderHeight() * 0.5;
                glTFCamera.orthographic = {
                    xmag: halfWidth,
                    ymag: halfHeight,
                    znear: camera.minZ,
                    zfar: camera.maxZ,
                };
            }
            cameraMap.set(camera, this._cameras.length);
            this._cameras.push(glTFCamera);
        });
        const [exportNodes, exportMaterials] = this._getExportNodes(nodes);
        return this._glTFMaterialExporter._convertMaterialsToGLTFAsync(exportMaterials, "image/png" /* ImageMimeType.PNG */, true).then(() => {
            return this._createNodeMapAndAnimationsAsync(exportNodes, binaryWriter).then((nodeMap) => {
                return this._createSkinsAsync(nodeMap, binaryWriter).then((skinMap) => {
                    this._nodeMap = nodeMap;
                    this._totalByteLength = binaryWriter.getByteOffset();
                    if (this._totalByteLength == undefined) {
                        throw new Error("undefined byte length!");
                    }
                    // Build Hierarchy with the node map.
                    for (const babylonNode of nodes) {
                        glTFNodeIndex = this._nodeMap[babylonNode.uniqueId];
                        if (glTFNodeIndex !== undefined) {
                            glTFNode = this._nodes[glTFNodeIndex];
                            if (babylonNode.metadata) {
                                if (this._options.metadataSelector) {
                                    glTFNode.extras = this._options.metadataSelector(babylonNode.metadata);
                                }
                                else if (babylonNode.metadata.gltf) {
                                    glTFNode.extras = babylonNode.metadata.gltf.extras;
                                }
                            }
                            if (babylonNode instanceof Camera) {
                                glTFNode.camera = cameraMap.get(babylonNode);
                            }
                            if (this._options.shouldExportNode && !this._options.shouldExportNode(babylonNode)) {
                                Tools.Log("Omitting " + babylonNode.name + " from scene.");
                            }
                            else {
                                if (!babylonNode.parent && !this._babylonScene.useRightHandedSystem) {
                                    convertNodeHandedness(glTFNode);
                                }
                                if (!babylonNode.parent || removedRootNodes.has(babylonNode.parent)) {
                                    scene.nodes.push(glTFNodeIndex);
                                }
                            }
                            if (babylonNode instanceof Mesh) {
                                if (babylonNode.skeleton) {
                                    glTFNode.skin = skinMap[babylonNode.skeleton.uniqueId];
                                }
                            }
                            directDescendents = babylonNode.getDescendants(true);
                            if (!glTFNode.children && directDescendents && directDescendents.length) {
                                const children = [];
                                for (const descendent of directDescendents) {
                                    if (this._nodeMap[descendent.uniqueId] != null) {
                                        children.push(this._nodeMap[descendent.uniqueId]);
                                    }
                                }
                                if (children.length) {
                                    glTFNode.children = children;
                                }
                            }
                        }
                    }
                    if (scene.nodes.length) {
                        this._scenes.push(scene);
                    }
                });
            });
        });
    }
    /**
     * Getting the nodes and materials that would be exported.
     * @param nodes Babylon transform nodes
     * @returns Set of materials which would be exported.
     */
    _getExportNodes(nodes) {
        const exportNodes = [];
        const exportMaterials = new Set();
        for (const babylonNode of nodes) {
            if (!this._options.shouldExportNode || this._options.shouldExportNode(babylonNode)) {
                exportNodes.push(babylonNode);
                const babylonMesh = babylonNode;
                if (babylonMesh.subMeshes && babylonMesh.subMeshes.length > 0) {
                    const material = babylonMesh.material || babylonMesh.getScene().defaultMaterial;
                    if (material instanceof MultiMaterial) {
                        for (const subMaterial of material.subMaterials) {
                            if (subMaterial) {
                                exportMaterials.add(subMaterial);
                            }
                        }
                    }
                    else {
                        exportMaterials.add(material);
                    }
                }
            }
            else {
                `Excluding node ${babylonNode.name}`;
            }
        }
        return [exportNodes, exportMaterials];
    }
    /**
     * Creates a mapping of Node unique id to node index and handles animations
     * @param nodes Babylon transform nodes
     * @param binaryWriter Buffer to write binary data to
     * @returns Node mapping of unique id to index
     */
    _createNodeMapAndAnimationsAsync(nodes, binaryWriter) {
        let promiseChain = Promise.resolve();
        const nodeMap = {};
        let nodeIndex;
        const runtimeGLTFAnimation = {
            name: "runtime animations",
            channels: [],
            samplers: [],
        };
        const idleGLTFAnimations = [];
        for (const babylonNode of nodes) {
            promiseChain = promiseChain.then(() => {
                return this._createNodeAsync(babylonNode, binaryWriter).then((node) => {
                    const promise = this._extensionsPostExportNodeAsync("createNodeAsync", node, babylonNode, nodeMap, binaryWriter);
                    if (promise == null) {
                        Tools.Warn(`Not exporting node ${babylonNode.name}`);
                        return Promise.resolve();
                    }
                    else {
                        return promise.then((node) => {
                            if (!node) {
                                return;
                            }
                            this._nodes.push(node);
                            nodeIndex = this._nodes.length - 1;
                            nodeMap[babylonNode.uniqueId] = nodeIndex;
                            if (!this._babylonScene.animationGroups.length) {
                                _GLTFAnimation._CreateMorphTargetAnimationFromMorphTargetAnimations(babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, this._nodes, binaryWriter, this._bufferViews, this._accessors, this._animationSampleRate, this._options.shouldExportAnimation);
                                if (babylonNode.animations.length) {
                                    _GLTFAnimation._CreateNodeAnimationFromNodeAnimations(babylonNode, runtimeGLTFAnimation, idleGLTFAnimations, nodeMap, this._nodes, binaryWriter, this._bufferViews, this._accessors, this._animationSampleRate, this._options.shouldExportAnimation);
                                }
                            }
                        });
                    }
                });
            });
        }
        return promiseChain.then(() => {
            if (runtimeGLTFAnimation.channels.length && runtimeGLTFAnimation.samplers.length) {
                this._animations.push(runtimeGLTFAnimation);
            }
            idleGLTFAnimations.forEach((idleGLTFAnimation) => {
                if (idleGLTFAnimation.channels.length && idleGLTFAnimation.samplers.length) {
                    this._animations.push(idleGLTFAnimation);
                }
            });
            if (this._babylonScene.animationGroups.length) {
                _GLTFAnimation._CreateNodeAndMorphAnimationFromAnimationGroups(this._babylonScene, this._animations, nodeMap, binaryWriter, this._bufferViews, this._accessors, this._animationSampleRate, this._options.shouldExportAnimation);
            }
            return nodeMap;
        });
    }
    /**
     * Creates a glTF node from a Babylon mesh
     * @param babylonNode Source Babylon mesh
     * @param binaryWriter Buffer for storing geometry data
     * @returns glTF node
     */
    _createNodeAsync(babylonNode, binaryWriter) {
        return Promise.resolve().then(() => {
            // create node to hold translation/rotation/scale and the mesh
            const node = {};
            // create mesh
            const mesh = { primitives: [] };
            if (babylonNode.name) {
                node.name = babylonNode.name;
            }
            if (babylonNode instanceof TransformNode) {
                // Set transformation
                this._setNodeTransformation(node, babylonNode);
                if (babylonNode instanceof Mesh) {
                    const morphTargetManager = babylonNode.morphTargetManager;
                    if (morphTargetManager && morphTargetManager.numTargets > 0) {
                        mesh.weights = [];
                        for (let i = 0; i < morphTargetManager.numTargets; ++i) {
                            mesh.weights.push(morphTargetManager.getTarget(i).influence);
                        }
                    }
                }
                return this._setPrimitiveAttributesAsync(mesh, babylonNode, binaryWriter).then(() => {
                    if (mesh.primitives.length) {
                        this._meshes.push(mesh);
                        node.mesh = this._meshes.length - 1;
                    }
                    return node;
                });
            }
            else if (babylonNode instanceof Camera) {
                this._setCameraTransformation(node, babylonNode);
                return node;
            }
            else {
                return node;
            }
        });
    }
    /**
     * Creates a glTF skin from a Babylon skeleton
     * @param nodeMap Babylon transform nodes
     * @param binaryWriter Buffer to write binary data to
     * @returns Node mapping of unique id to index
     */
    _createSkinsAsync(nodeMap, binaryWriter) {
        const promiseChain = Promise.resolve();
        const skinMap = {};
        for (const skeleton of this._babylonScene.skeletons) {
            if (skeleton.bones.length <= 0) {
                continue;
            }
            // create skin
            const skin = { joints: [] };
            const inverseBindMatrices = [];
            const boneIndexMap = {};
            let maxBoneIndex = -1;
            for (let i = 0; i < skeleton.bones.length; ++i) {
                const bone = skeleton.bones[i];
                const boneIndex = bone.getIndex() ?? i;
                if (boneIndex !== -1) {
                    boneIndexMap[boneIndex] = bone;
                    if (boneIndex > maxBoneIndex) {
                        maxBoneIndex = boneIndex;
                    }
                }
            }
            for (let boneIndex = 0; boneIndex <= maxBoneIndex; ++boneIndex) {
                const bone = boneIndexMap[boneIndex];
                inverseBindMatrices.push(bone.getInvertedAbsoluteTransform());
                const transformNode = bone.getTransformNode();
                if (transformNode && nodeMap[transformNode.uniqueId] !== null && nodeMap[transformNode.uniqueId] !== undefined) {
                    skin.joints.push(nodeMap[transformNode.uniqueId]);
                }
                else {
                    Tools.Warn("Exporting a bone without a linked transform node is currently unsupported");
                }
            }
            if (skin.joints.length > 0) {
                // create buffer view for inverse bind matrices
                const byteStride = 64; // 4 x 4 matrix of 32 bit float
                const byteLength = inverseBindMatrices.length * byteStride;
                const bufferViewOffset = binaryWriter.getByteOffset();
                const bufferView = _GLTFUtilities._CreateBufferView(0, bufferViewOffset, byteLength, undefined, "InverseBindMatrices" + " - " + skeleton.name);
                this._bufferViews.push(bufferView);
                const bufferViewIndex = this._bufferViews.length - 1;
                const bindMatrixAccessor = _GLTFUtilities._CreateAccessor(bufferViewIndex, "InverseBindMatrices" + " - " + skeleton.name, "MAT4" /* AccessorType.MAT4 */, 5126 /* AccessorComponentType.FLOAT */, inverseBindMatrices.length, null, null, null);
                const inverseBindAccessorIndex = this._accessors.push(bindMatrixAccessor) - 1;
                skin.inverseBindMatrices = inverseBindAccessorIndex;
                this._skins.push(skin);
                skinMap[skeleton.uniqueId] = this._skins.length - 1;
                inverseBindMatrices.forEach((mat) => {
                    mat.m.forEach((cell) => {
                        binaryWriter.setFloat32(cell);
                    });
                });
            }
        }
        return promiseChain.then(() => {
            return skinMap;
        });
    }
}
_Exporter._ExtensionNames = new Array();
_Exporter._ExtensionFactories = {};
/**
 * @internal
 *
 * Stores glTF binary data.  If the array buffer byte length is exceeded, it doubles in size dynamically
 */
export class _BinaryWriter {
    /**
     * Initialize binary writer with an initial byte length
     * @param byteLength Initial byte length of the array buffer
     */
    constructor(byteLength) {
        this._arrayBuffer = new ArrayBuffer(byteLength);
        this._dataView = new DataView(this._arrayBuffer);
        this._byteOffset = 0;
    }
    /**
     * Resize the array buffer to the specified byte length
     * @param byteLength The new byte length
     * @returns The resized array buffer
     */
    _resizeBuffer(byteLength) {
        const newBuffer = new ArrayBuffer(byteLength);
        const copyOldBufferSize = Math.min(this._arrayBuffer.byteLength, byteLength);
        const oldUint8Array = new Uint8Array(this._arrayBuffer, 0, copyOldBufferSize);
        const newUint8Array = new Uint8Array(newBuffer);
        newUint8Array.set(oldUint8Array, 0);
        this._arrayBuffer = newBuffer;
        this._dataView = new DataView(this._arrayBuffer);
        return newBuffer;
    }
    /**
     * Get an array buffer with the length of the byte offset
     * @returns ArrayBuffer resized to the byte offset
     */
    getArrayBuffer() {
        return this._resizeBuffer(this.getByteOffset());
    }
    /**
     * Get the byte offset of the array buffer
     * @returns byte offset
     */
    getByteOffset() {
        if (this._byteOffset == undefined) {
            throw new Error("Byte offset is undefined!");
        }
        return this._byteOffset;
    }
    /**
     * Stores an UInt8 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    setUInt8(entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint8(byteOffset, entry);
            }
            else {
                Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
            }
        }
        else {
            if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                this._resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint8(this._byteOffset, entry);
            this._byteOffset += 1;
        }
    }
    /**
     * Stores an UInt16 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    setUInt16(entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint16(byteOffset, entry, true);
            }
            else {
                Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
            }
        }
        else {
            if (this._byteOffset + 2 > this._arrayBuffer.byteLength) {
                this._resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint16(this._byteOffset, entry, true);
            this._byteOffset += 2;
        }
    }
    /**
     * Gets an UInt32 in the array buffer
     * @param byteOffset If defined, specifies where to set the value as an offset.
     * @returns entry
     */
    getUInt32(byteOffset) {
        if (byteOffset < this._byteOffset) {
            return this._dataView.getUint32(byteOffset, true);
        }
        else {
            Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
            throw new Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
        }
    }
    getVector3Float32FromRef(vector3, byteOffset) {
        if (byteOffset + 8 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            vector3.x = this._dataView.getFloat32(byteOffset, true);
            vector3.y = this._dataView.getFloat32(byteOffset + 4, true);
            vector3.z = this._dataView.getFloat32(byteOffset + 8, true);
        }
    }
    setVector3Float32FromRef(vector3, byteOffset) {
        if (byteOffset + 8 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            this._dataView.setFloat32(byteOffset, vector3.x, true);
            this._dataView.setFloat32(byteOffset + 4, vector3.y, true);
            this._dataView.setFloat32(byteOffset + 8, vector3.z, true);
        }
    }
    getVector4Float32FromRef(vector4, byteOffset) {
        if (byteOffset + 12 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            vector4.x = this._dataView.getFloat32(byteOffset, true);
            vector4.y = this._dataView.getFloat32(byteOffset + 4, true);
            vector4.z = this._dataView.getFloat32(byteOffset + 8, true);
            vector4.w = this._dataView.getFloat32(byteOffset + 12, true);
        }
    }
    setVector4Float32FromRef(vector4, byteOffset) {
        if (byteOffset + 12 > this._byteOffset) {
            Tools.Error(`BinaryWriter: byteoffset is greater than the current binary buffer length!`);
        }
        else {
            this._dataView.setFloat32(byteOffset, vector4.x, true);
            this._dataView.setFloat32(byteOffset + 4, vector4.y, true);
            this._dataView.setFloat32(byteOffset + 8, vector4.z, true);
            this._dataView.setFloat32(byteOffset + 12, vector4.w, true);
        }
    }
    /**
     * Stores a Float32 in the array buffer
     * @param entry
     * @param byteOffset
     */
    setFloat32(entry, byteOffset) {
        if (isNaN(entry)) {
            Tools.Error("Invalid data being written!");
        }
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setFloat32(byteOffset, entry, true);
            }
            else {
                Tools.Error("BinaryWriter: byteoffset is greater than the current binary length!");
            }
        }
        if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
            this._resizeBuffer(this._arrayBuffer.byteLength * 2);
        }
        this._dataView.setFloat32(this._byteOffset, entry, true);
        this._byteOffset += 4;
    }
    /**
     * Stores an UInt32 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    setUInt32(entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setUint32(byteOffset, entry, true);
            }
            else {
                Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
            }
        }
        else {
            if (this._byteOffset + 4 > this._arrayBuffer.byteLength) {
                this._resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setUint32(this._byteOffset, entry, true);
            this._byteOffset += 4;
        }
    }
    /**
     * Stores an Int16 in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    setInt16(entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setInt16(byteOffset, entry, true);
            }
            else {
                Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
            }
        }
        else {
            if (this._byteOffset + 2 > this._arrayBuffer.byteLength) {
                this._resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setInt16(this._byteOffset, entry, true);
            this._byteOffset += 2;
        }
    }
    /**
     * Stores a byte in the array buffer
     * @param entry
     * @param byteOffset If defined, specifies where to set the value as an offset.
     */
    setByte(entry, byteOffset) {
        if (byteOffset != null) {
            if (byteOffset < this._byteOffset) {
                this._dataView.setInt8(byteOffset, entry);
            }
            else {
                Tools.Error("BinaryWriter: byteoffset is greater than the current binary buffer length!");
            }
        }
        else {
            if (this._byteOffset + 1 > this._arrayBuffer.byteLength) {
                this._resizeBuffer(this._arrayBuffer.byteLength * 2);
            }
            this._dataView.setInt8(this._byteOffset, entry);
            this._byteOffset++;
        }
    }
}
//# sourceMappingURL=glTFExporter.js.map