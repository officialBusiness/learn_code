import CubeTexture from '../Materials/textures/babylon.cubeTexture.js';
import MirrorTexture from '../Materials/textures/babylon.mirrorTexture.js';
import RenderTargetTexture from '../Materials/textures/babylon.renderTargetTexture.js';
import Texture from '../Materials/textures/babylon.texture.js';
import { Plane, Color3, Color4, Vector3, Quaternion } from './babylon.math.js';
import StandardMaterial from '../Materials/babylon.standardMaterial.js';
import MultiMaterial from '../Materials/babylon.multiMaterial.js';
import Animation from '../Animations/babylon.animation.js';
import ParticleSystem from '../Particles/babylon.particleSystem.js';
import PointLight from '../Light/babylon.pointLight.js';
import DirectionalLight from '../Light/babylon.directionalLight.js';
import SpotLight from '../Light/babylon.spotLight.js';
import HemisphericLight from '../Light/babylon.hemisphericLight.js';
import Mesh from '../Mesh/babylon.mesh.js';
import SubMesh from '../Mesh/babylon.subMesh.js';
import Tools from '../Tools/babylon.tools.js';
import FreeCamera from '../Cameras/babylon.freeCamera.js';

import Scene from '../babylon.scene.js';

var loadCubeTexture = function (rootUrl, parsedTexture, scene) {
    var texture = new CubeTexture(rootUrl + parsedTexture.name, scene);

    texture.name = parsedTexture.name;
    texture.hasAlpha = parsedTexture.hasAlpha;
    texture.level = parsedTexture.level;
    texture.coordinatesMode = parsedTexture.coordinatesMode;

    return texture;
};

var loadTexture = function (rootUrl, parsedTexture, scene) {
    if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
        return null;
    }

    if (parsedTexture.isCube) {
        return loadCubeTexture(rootUrl, parsedTexture, scene);
    }

    var texture;

    if (parsedTexture.mirrorPlane) {
        texture = new MirrorTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
        texture._waitingRenderList = parsedTexture.renderList;
        texture.mirrorPlane = Plane.FromArray(parsedTexture.mirrorPlane);
    } else if (parsedTexture.isRenderTarget) {
        texture = new RenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene);
        texture._waitingRenderList = parsedTexture.renderList;
    } else {
        texture = new Texture(rootUrl + parsedTexture.name, scene);
    }

    texture.name = parsedTexture.name;
    texture.hasAlpha = parsedTexture.hasAlpha;
    texture.level = parsedTexture.level;

    texture.coordinatesIndex = parsedTexture.coordinatesIndex;
    texture.coordinatesMode = parsedTexture.coordinatesMode;
    texture.uOffset = parsedTexture.uOffset;
    texture.vOffset = parsedTexture.vOffset;
    texture.uScale = parsedTexture.uScale;
    texture.vScale = parsedTexture.vScale;
    texture.uAng = parsedTexture.uAng;
    texture.vAng = parsedTexture.vAng;
    texture.wAng = parsedTexture.wAng;

    texture.wrapU = parsedTexture.wrapU;
    texture.wrapV = parsedTexture.wrapV;
    
    // Animations
    if (parsedTexture.animations) {
        for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
            var parsedAnimation = parsedTexture.animations[animationIndex];

            texture.animations.push(parseAnimation(parsedAnimation));
        }
    }

    return texture;
};

var parseMaterial = function (parsedMaterial, scene, rootUrl) {
    var material;
    material = new StandardMaterial(parsedMaterial.name, scene);

    material.ambientColor = Color3.FromArray(parsedMaterial.ambient);
    material.diffuseColor = Color3.FromArray(parsedMaterial.diffuse);
    material.specularColor = Color3.FromArray(parsedMaterial.specular);
    material.specularPower = parsedMaterial.specularPower;
    material.emissiveColor = Color3.FromArray(parsedMaterial.emissive);

    material.alpha = parsedMaterial.alpha;

    material.id = parsedMaterial.id;
    material.backFaceCulling = parsedMaterial.backFaceCulling;

    if (parsedMaterial.diffuseTexture) {
        material.diffuseTexture = loadTexture(rootUrl, parsedMaterial.diffuseTexture, scene);
    }

    if (parsedMaterial.ambientTexture) {
        material.ambientTexture = loadTexture(rootUrl, parsedMaterial.ambientTexture, scene);
    }

    if (parsedMaterial.opacityTexture) {
        material.opacityTexture = loadTexture(rootUrl, parsedMaterial.opacityTexture, scene);
    }

    if (parsedMaterial.reflectionTexture) {
        material.reflectionTexture = loadTexture(rootUrl, parsedMaterial.reflectionTexture, scene);
    }
    
    if (parsedMaterial.emissiveTexture) {
        material.emissiveTexture = loadTexture(rootUrl, parsedMaterial.emissiveTexture, scene);
    }
    
    if (parsedMaterial.specularTexture) {
        material.specularTexture = loadTexture(rootUrl, parsedMaterial.specularTexture, scene);
    }
    
    if (parsedMaterial.bumpTexture) {
        material.bumpTexture = loadTexture(rootUrl, parsedMaterial.bumpTexture, scene);
    }

    return material;
};

var parseMaterialById = function (id, parsedData, scene, rootUrl) {
    for (var index = 0; index < parsedData.materials.length; index++) {
        var parsedMaterial = parsedData.materials[index];
        if (parsedMaterial.id === id) {
            return parseMaterial(parsedMaterial, scene, rootUrl);
        }
    }

    return null;
};

var parseMultiMaterial = function (parsedMultiMaterial, scene) {
    var multiMaterial = new MultiMaterial(parsedMultiMaterial.name, scene);

    multiMaterial.id = parsedMultiMaterial.id;

    for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
        var subMatId = parsedMultiMaterial.materials[matIndex];

        if (subMatId) {
            multiMaterial.subMaterials.push(scene.getMaterialByID(subMatId));
        } else {
            multiMaterial.subMaterials.push(null);
        }
    }

    return multiMaterial;
};

var parseParticleSystem = function (parsedParticleSystem, scene, rootUrl) {
    var emitter = scene.getLastMeshByID(parsedParticleSystem.emitterId);

    var particleSystem = new ParticleSystem("particles#" + emitter.name, parsedParticleSystem.capacity, scene);
    if (parsedParticleSystem.textureName) {
        particleSystem.particleTexture = new Texture(rootUrl + parsedParticleSystem.textureName, scene);
    }
    particleSystem.minAngularSpeed = parsedParticleSystem.minAngularSpeed;
    particleSystem.maxAngularSpeed = parsedParticleSystem.maxAngularSpeed;
    particleSystem.minSize = parsedParticleSystem.minSize;
    particleSystem.maxSize = parsedParticleSystem.maxSize;
    particleSystem.minLifeTime = parsedParticleSystem.minLifeTime;
    particleSystem.maxLifeTime = parsedParticleSystem.maxLifeTime;
    particleSystem.emitter = emitter;
    particleSystem.emitRate = parsedParticleSystem.emitRate;
    particleSystem.minEmitBox = Vector3.FromArray(parsedParticleSystem.minEmitBox);
    particleSystem.maxEmitBox = Vector3.FromArray(parsedParticleSystem.maxEmitBox);
    particleSystem.gravity = Vector3.FromArray(parsedParticleSystem.gravity);
    particleSystem.direction1 = Vector3.FromArray(parsedParticleSystem.direction1);
    particleSystem.direction2 = Vector3.FromArray(parsedParticleSystem.direction2);
    particleSystem.color1 = Color4.FromArray(parsedParticleSystem.color1);
    particleSystem.color2 = Color4.FromArray(parsedParticleSystem.color2);
    particleSystem.colorDead = Color4.FromArray(parsedParticleSystem.colorDead);
    particleSystem.deadAlpha = parsedParticleSystem.deadAlpha;
    particleSystem.updateSpeed = parsedParticleSystem.updateSpeed;
    particleSystem.targetStopDuration = parsedParticleSystem.targetStopFrame;
    particleSystem.textureMask = Color4.FromArray(parsedParticleSystem.textureMask);
    particleSystem.blendMode = parsedParticleSystem.blendMode;
    particleSystem.start();

    return particleSystem;
};

var parseAnimation = function (parsedAnimation) {
    var animation = new Animation(parsedAnimation.name, parsedAnimation.property, parsedAnimation.framePerSecond, parsedAnimation.dataType, parsedAnimation.loopBehavior);

    var dataType = parsedAnimation.dataType;
    var keys = [];
    for (var index = 0; index < parsedAnimation.keys.length; index++) {
        var key = parsedAnimation.keys[index];

        var data;

        switch (dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                data = key.values[0];
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
                data = Quaternion.FromArray(key.values);
                break;
            case Animation.ANIMATIONTYPE_VECTOR3:
            default:
                data = Vector3.FromArray(key.values);
                break;
        }

        keys.push({
            frame: key.frame,
            value: data
        });
    }

    animation.setKeys(keys);

    return animation;
};

var parseLight = function(parsedLight, scene) {
    var light;

    switch (parsedLight.type) {
        case 0:
            light = new PointLight(parsedLight.name, Vector3.FromArray(parsedLight.data), scene);
            break;
        case 1:
            light = new DirectionalLight(parsedLight.name, Vector3.FromArray(parsedLight.data), scene);
            break;
        case 2:
            light = new SpotLight(parsedLight.name, Vector3.FromArray(parsedLight.data), Vector3.FromArray(parsedLight.direction), parsedLight.angle, parsedLight.exponent, scene);
            break;
        case 3:
            light = new HemisphericLight(parsedLight.name, Vector3.FromArray(parsedLight.data), scene);
            light.groundColor = Color3.FromArray(parsedLight.groundColor);
            break;
    }

    light.id = parsedLight.id;

    if (parsedLight.intensity) {
        light.intensity = parsedLight.intensity;
    }
    light.diffuse = Color3.FromArray(parsedLight.diffuse);
    light.specular = Color3.FromArray(parsedLight.specular);
};

var parseMesh = function (parsedMesh, scene) {
    var declaration = null;
    
    switch (parsedMesh.uvCount) {
        case 0:
            declaration = [3, 3];
            break;
        case 1:
            declaration = [3, 3, 2];
            break;
        case 2:
            declaration = [3, 3, 2, 2];
            break;
    }

    var mesh = new Mesh(parsedMesh.name, declaration, scene);
    mesh.id = parsedMesh.id;

    mesh.position = Vector3.FromArray(parsedMesh.position);
    mesh.rotation = Vector3.FromArray(parsedMesh.rotation);
    mesh.scaling = Vector3.FromArray(parsedMesh.scaling);

    mesh.setEnabled(parsedMesh.isEnabled);
    mesh.isVisible = parsedMesh.isVisible;

    mesh.billboardMode = parsedMesh.billboardMode;

    if (parsedMesh.visibility !== undefined) {
        mesh.visibility = parsedMesh.visibility;
    }

    mesh.checkCollisions = parsedMesh.checkCollisions;

    if (parsedMesh.vertices && parsedMesh.indices) {
        mesh.setVertices(parsedMesh.vertices, parsedMesh.uvCount);
        mesh.setIndices(parsedMesh.indices);
    }

    if (parsedMesh.parentId) {
        mesh.parent = scene.getLastMeshByID(parsedMesh.parentId);
    }
    if (parsedMesh.materialId) {
        mesh.setMaterialByID(parsedMesh.materialId);
    } else {
        mesh.material = null;
    }

    // SubMeshes
    if (parsedMesh.subMeshes) {
        mesh.subMeshes = [];
        for (var subIndex = 0; subIndex < parsedMesh.subMeshes.length; subIndex++) {
            var parsedSubMesh = parsedMesh.subMeshes[subIndex];

            var subMesh = new SubMesh(parsedSubMesh.materialIndex, parsedSubMesh.verticesStart, parsedSubMesh.verticesCount, parsedSubMesh.indexStart, parsedSubMesh.indexCount, mesh);
        }
    }
    
    // Animations
    if (parsedMesh.animations) {
        for (var animationIndex = 0; animationIndex < parsedMesh.animations.length; animationIndex++) {
            var parsedAnimation = parsedMesh.animations[animationIndex];

            mesh.animations.push(parseAnimation(parsedAnimation));
        }
    }
    
    if (parsedMesh.autoAnimate) {
        scene.beginAnimation(mesh, parsedMesh.autoAnimateFrom, parsedMesh.autoAnimateTo, parsedMesh.autoAnimateLoop, 1.0);
    }

    return mesh;
};

var isDescendantOf = function (mesh, name, hierarchyIds) {
    if (mesh.name === name) {
        hierarchyIds.push(mesh.id);
        return true;
    }
    
    if (mesh.parentId && hierarchyIds.indexOf(mesh.parentId) !== -1) {
        hierarchyIds.push(mesh.id);
        return true;
    }

    return false;
};

const SceneLoader = {
    ImportMesh: function (meshName, rootUrl, sceneFilename, scene, then, progressCallBack) {
        Tools.LoadFile(rootUrl + sceneFilename, function (data) {
            var parsedData = JSON.parse(data);

            // Meshes
            var meshes = [];
            var particleSystems = [];
            var hierarchyIds = [];                
            for (var index = 0; index < parsedData.meshes.length; index++) {
                var parsedMesh = parsedData.meshes[index];

                if (!meshName || isDescendantOf(parsedMesh, meshName, hierarchyIds)) {
                    // Material ?
                    if (parsedMesh.materialId) {
                        var materialFound = (scene.getMaterialByID(parsedMesh.materialId) !== null);
                        
                        if (!materialFound) {
                            for (var multimatIndex = 0; multimatIndex < parsedData.multiMaterials.length; multimatIndex++) {
                                var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                if (parsedMultiMaterial.id == parsedMesh.materialId) {
                                    for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                                        var subMatId = parsedMultiMaterial.materials[matIndex];

                                        parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                    }

                                    parseMultiMaterial(parsedMultiMaterial, scene);
                                    materialFound = true;
                                    break;
                                }
                            }
                        }

                        if (!materialFound) {
                            parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl);
                        }
                    }

                    meshes.push(parseMesh(parsedMesh, scene));
                }
            }
            
            // Particles
            if (parsedData.particleSystems) {
                for (var index = 0; index < parsedData.particleSystems.length; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];

                    if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                        particleSystems.push(parseParticleSystem(parsedParticleSystem, scene, rootUrl));
                    }
                }
            }

            if (then) {
                then(meshes, particleSystems);
            }
        }, progressCallBack);
    },
    Load: function (rootUrl, sceneFilename, engine, then, progressCallBack) {
        Tools.LoadFile(rootUrl + sceneFilename, function (data) {
            var parsedData = JSON.parse(data);
            var scene = new Scene(engine);

            // Scene
            scene.autoClear = parsedData.autoClear;
            scene.clearColor = Color3.FromArray(parsedData.clearColor);
            scene.ambientColor = Color3.FromArray(parsedData.ambientColor);
            scene.gravity = Vector3.FromArray(parsedData.gravity);

            // Fog
            if (parsedData.fogMode && parsedData.fogMode !== 0) {
                scene.fogMode = parsedData.fogMode;
                scene.fogColor = Color3.FromArray(parsedData.fogColor);
                scene.fogStart = parsedData.fogStart;
                scene.fogEnd = parsedData.fogEnd;
                scene.fogDensity = parsedData.fogDensity;
            }

            // Lights
            for (var index = 0; index < parsedData.lights.length; index++) {
                var parsedLight = parsedData.lights[index];
                parseLight(parsedLight, scene);
            }

            // Cameras
            for (var index = 0; index < parsedData.cameras.length; index++) {
                var parsedCamera = parsedData.cameras[index];
                var camera = new FreeCamera(parsedCamera.name, Vector3.FromArray(parsedCamera.position), scene);
                camera.id = parsedCamera.id;

                if (parsedCamera.target) {
                    camera.setTarget(Vector3.FromArray(parsedCamera.target));
                } else {
                    camera.rotation = Vector3.FromArray(parsedCamera.rotation);
                }

                camera.fov = parsedCamera.fov;
                camera.minZ = parsedCamera.minZ;
                camera.maxZ = parsedCamera.maxZ;

                camera.speed = parsedCamera.speed;
                camera.inertia = parsedCamera.inertia;

                camera.checkCollisions = parsedCamera.checkCollisions;
                camera.applyGravity = parsedCamera.applyGravity;
                if (parsedCamera.ellipsoid) {
                    camera.ellipsoid = Vector3.FromArray(parsedCamera.ellipsoid);
                }
            }

            if (parsedData.activeCameraID) {
                scene.activeCameraByID(parsedData.activeCameraID);
            }

            // Materials
            if (parsedData.materials) {
                for (var index = 0; index < parsedData.materials.length; index++) {
                    var parsedMaterial = parsedData.materials[index];
                    parseMaterial(parsedMaterial, scene, rootUrl);
                }
            }

            if (parsedData.multiMaterials) {
                for (var index = 0; index < parsedData.multiMaterials.length; index++) {
                    var parsedMultiMaterial = parsedData.multiMaterials[index];
                    parseMultiMaterial(parsedMultiMaterial, scene);
                }
            }

            // Meshes
            for (var index = 0; index < parsedData.meshes.length; index++) {
                var parsedMesh = parsedData.meshes[index];
                parseMesh(parsedMesh, scene);
            }

            // Particles Systems
            if (parsedData.particleSystems) {
                for (var index = 0; index < parsedData.particleSystems.length; index++) {
                    var parsedParticleSystem = parsedData.particleSystems[index];
                    parseParticleSystem(parsedParticleSystem, scene, rootUrl);
                }
            }

            // Finish
            if (then) {
                then(scene);
            }
        }, progressCallBack);
    }
};

export default SceneLoader;