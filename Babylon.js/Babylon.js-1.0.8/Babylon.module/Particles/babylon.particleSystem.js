import { Vector3, Color4, Matrix } from '../Tools/babylon.math.js';
import Particle from './babylon.particle.js';
import Engine from '../babylon.engine.js';
import Tools from '../Tools/babylon.tools.js';
import Texture from '../Materials/textures/babylon.texture.js';

var appendParticleVertex = function (particle, vertices, offsetX, offsetY) {
    vertices.push(particle.position.x);
    vertices.push(particle.position.y);
    vertices.push(particle.position.z);
    vertices.push(particle.color.r);
    vertices.push(particle.color.g);
    vertices.push(particle.color.b);
    vertices.push(particle.color.a);
    vertices.push(particle.angle);
    vertices.push(particle.size);
    vertices.push(offsetX);
    vertices.push(offsetY);
};

var randomNumber = function (min, max) {
    if (min == max) {
        return (min);
    }

    var random = Math.random();

    return ((random * (max - min)) + min);
};

export default function ParticleSystem(name, capacity, scene) {
    this.name = name;
    this.id = name;
    this._capacity = capacity;

    this._scene = scene;

    scene.particleSystems.push(this);

    // Vectors and colors
    this.gravity = Vector3.Zero();
    this.direction1 = new Vector3(0, 1.0, 0);
    this.direction2 = new Vector3(0, 1.0, 0);
    this.minEmitBox = new Vector3(-0.5, -0.5, -0.5);
    this.maxEmitBox = new Vector3(0.5, 0.5, 0.5);
    this.color1 = new Color4(1.0, 1.0, 1.0, 1.0);
    this.color2 = new Color4(1.0, 1.0, 1.0, 1.0);
    this.colorDead = new Color4(0, 0, 0, 1.0);
    this.deadAlpha = 0;
    this.textureMask = new Color4(1.0, 1.0, 1.0, 1.0);

    // Particles
    this.particles = [];
    this._newPartsExcess = 0;

    // VBO
    this._vertexDeclaration = [3, 4, 4];
    this._vertexStrideSize = 11 * 4; // 10 floats per particle (x, y, z, r, g, b, a, angle, size, offsetX, offsetY)
    this._vertexBuffer = scene.getEngine().createDynamicVertexBuffer(capacity * this._vertexStrideSize * 4);

    var indices = [];
    var index = 0;
    for (var count = 0; count < capacity; count++) {
        indices.push(index);
        indices.push(index + 1);
        indices.push(index + 2);
        indices.push(index);
        indices.push(index + 2);
        indices.push(index + 3);
        index += 4;
    }

    this._indexBuffer = scene.getEngine().createIndexBuffer(indices);
};

// Members
ParticleSystem.prototype.emitter = null;
ParticleSystem.prototype.emitRate = 10;
ParticleSystem.prototype.manualEmitCount = -1;
ParticleSystem.prototype.updateSpeed = 0.01;
ParticleSystem.prototype.targetStopDuration = 0;
ParticleSystem.prototype.disposeOnStop = false;

ParticleSystem.prototype.minEmitPower = 1;
ParticleSystem.prototype.maxEmitPower = 1;

ParticleSystem.prototype.minLifeTime = 1;
ParticleSystem.prototype.maxLifeTime = 1;

ParticleSystem.prototype.minSize = 1;
ParticleSystem.prototype.maxSize = 1;
ParticleSystem.prototype.minAngularSpeed = 0;
ParticleSystem.prototype.maxAngularSpeed = 0;

ParticleSystem.prototype.particleTexture = null;

ParticleSystem.prototype.onDispose = null;

ParticleSystem.prototype.blendMode = ParticleSystem.BLENDMODE_ONEONE;

// Methods   
ParticleSystem.prototype.isAlive = function () {
    return this._alive;
};

ParticleSystem.prototype.start = function () {
    this._started = true;
    this._stopped = false;
    this._actualFrame = 0;
};

ParticleSystem.prototype.stop = function () {
    this._stopped = true;
};

ParticleSystem.prototype._update = function (newParticles) {
    // Update current
    this._alive = this.particles.length > 0;
    for (var index = 0; index < this.particles.length; index++) {
        var particle = this.particles[index];
        particle.age += this._scaledUpdateSpeed;

        if (particle.age >= particle.lifeTime) {
            this.particles.splice(index, 1);
            index--;
            continue;
        }
        else {
            particle.color = particle.color.add(particle.colorStep.scale(this._scaledUpdateSpeed));

            if (particle.color.a < 0)
                particle.color.a = 0;

            particle.position = particle.position.add(particle.direction.scale(this._scaledUpdateSpeed));

            particle.angle += particle.angularSpeed * this._scaledUpdateSpeed;

            particle.direction = particle.direction.add(this.gravity.scale(this._scaledUpdateSpeed));
        }
    }
    
    // Add new ones
    var worldMatrix;

    if (this.emitter.position) {
        worldMatrix = this.emitter.getWorldMatrix();
    } else {
        worldMatrix = Matrix.Translation(this.emitter.x, this.emitter.y, this.emitter.z);
    }

    for (var index = 0; index < newParticles; index++) {
        if (this.particles.length == this._capacity) {
            break;
        }

        var particle = new Particle();
        this.particles.push(particle);

        var emitPower = randomNumber(this.minEmitPower, this.maxEmitPower);

        var randX = randomNumber(this.direction1.x, this.direction2.x);
        var randY = randomNumber(this.direction1.y, this.direction2.y);
        var randZ = randomNumber(this.direction1.z, this.direction2.z);

        particle.direction = Vector3.TransformNormal(new Vector3(randX, randY, randZ).scale(emitPower), worldMatrix);

        particle.lifeTime = randomNumber(this.minLifeTime, this.maxLifeTime);

        particle.size = randomNumber(this.minSize, this.maxSize);
        particle.angularSpeed = randomNumber(this.minAngularSpeed, this.maxAngularSpeed);

        randX = randomNumber(this.minEmitBox.x, this.maxEmitBox.x);
        randY = randomNumber(this.minEmitBox.y, this.maxEmitBox.y);
        randZ = randomNumber(this.minEmitBox.z, this.maxEmitBox.z);
        var dispatch = new Vector3(randX, randY, randZ);

        particle.position = Vector3.TransformCoordinates(dispatch, worldMatrix);

        var step = randomNumber(0, 1.0);

        var startColor = Color4.Lerp(this.color1, this.color2, step);
        var deadColor = this.colorDead;
        startColor.a = 1.0;
        deadColor.a = this.deadAlpha;

        particle.color = startColor;
        var diff = deadColor.subtract(startColor);
        particle.colorStep = diff.scale(1.0 / particle.lifeTime);
    }
};

ParticleSystem.prototype._getEffect = function () {
    var defines = [];
    
    // if (BABYLON.clipPlane) {
    //     defines.push("#define CLIPPLANE");
    // }
    
    // Effect
    var join = defines.join("\n");
    if (this._cachedDefines != join) {
        this._cachedDefines = join;
        this._effect = this._scene.getEngine().createEffect("particles",
            ["position", "color", "options"],
            ["invView", "view", "projection", "vClipPlane", "textureMask"],
            ["diffuseSampler"], join);
    }

    return this._effect;
};

ParticleSystem.prototype.animate = function () {
    if (!this._started)
        return;

    var effect = this._getEffect();

    // Check
    if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady())
        return;

    this._scaledUpdateSpeed = this.updateSpeed * this._scene.getAnimationRatio();

    // determine the number of particles we need to create   
    var emitCout;
    
    if (this.manualEmitCount > -1) {
        emitCout = this.manualEmitCount;
        this.manualEmitCount = 0;
    } else {
        emitCout = this.emitRate;
    }

    var newParticles = ((emitCout * this._scaledUpdateSpeed) >> 0);
    this._newPartsExcess += emitCout * this._scaledUpdateSpeed - newParticles;

    if (this._newPartsExcess > 1.0) {
        newParticles += this._newPartsExcess >> 0;
        this._newPartsExcess -= this._newPartsExcess >> 0;
    }

    this._alive = false;

    if (!this._stopped) {
        this._actualFrame += this._scaledUpdateSpeed;

        if (this.targetStopDuration && this._actualFrame >= this.targetStopDuration)
            this.stop();
    } else {
        newParticles = 0;
    }

    this._update(newParticles);

    // Stopped?
    if (this._stopped) {
        if (!this._alive) {
            this._started = false;
            if (this.disposeOnStop) {
                this._scene._toBeDisposed.push(this);
            }
        }
    }

    // Update VBO
    var vertices = [];
    for (var index = 0; index < this.particles.length; index++) {
        var particle = this.particles[index];

        appendParticleVertex(particle, vertices, 0, 0);
        appendParticleVertex(particle, vertices, 1, 0);
        appendParticleVertex(particle, vertices, 1, 1);
        appendParticleVertex(particle, vertices, 0, 1);
    }
    var engine = this._scene.getEngine();
    engine.updateDynamicVertexBuffer(this._vertexBuffer, vertices);
};

ParticleSystem.prototype.render = function () {
    var effect = this._getEffect();

    // Check
    if (!this.emitter || !effect.isReady() || !this.particleTexture || !this.particleTexture.isReady() || !this.particles.length)
        return 0;

    var engine = this._scene.getEngine();

    // Render
    engine.enableEffect(effect);

    var viewMatrix = this._scene.getViewMatrix();
    effect.setTexture("diffuseSampler", this.particleTexture);
    effect.setMatrix("view", viewMatrix);
    effect.setMatrix("projection", this._scene.getProjectionMatrix());
    effect.setFloat4("textureMask", this.textureMask.r, this.textureMask.g, this.textureMask.b, this.textureMask.a);

    // if (BABYLON.clipPlane) {
    //     var invView = viewMatrix.clone();
    //     invView.invert();
    //     effect.setMatrix("invView", invView);
    //     effect.setFloat4("vClipPlane", BABYLON.clipPlane.normal.x, BABYLON.clipPlane.normal.y, BABYLON.clipPlane.normal.z, BABYLON.clipPlane.d);
    // }

    // VBOs
    engine.bindBuffers(this._vertexBuffer, this._indexBuffer, this._vertexDeclaration, this._vertexStrideSize, effect);

    // Draw order
    if (this.blendMode === ParticleSystem.BLENDMODE_ONEONE) {
        engine.setAlphaMode(Engine.ALPHA_ADD);
    } else {
        engine.setAlphaMode(Engine.ALPHA_COMBINE);
    }
    engine.draw(true, 0, this.particles.length * 6);
    engine.setAlphaMode(Engine.ALPHA_DISABLE);

    return this.particles.length;
};

ParticleSystem.prototype.dispose = function () {
    if (this._vertexBuffer) {
        //this._scene.getEngine()._releaseBuffer(this._vertexBuffer);
        this._vertexBuffer = null;
    }

    if (this._indexBuffer) {
        this._scene.getEngine()._releaseBuffer(this._indexBuffer);
        this._indexBuffer = null;
    }

    if (this.particleTexture) {
        this.particleTexture.dispose();
        this.particleTexture = null;
    }

    // Remove from scene
    var index = this._scene.particleSystems.indexOf(this);
    this._scene.particleSystems.splice(index, 1);
    
    // Callback
    if (this.onDispose) {
        this.onDispose();
    }
};

// Clone
ParticleSystem.prototype.clone = function(name, newEmitter) {
    var result = new ParticleSystem(name, this._capacity, this._scene);

    Tools.DeepCopy(this, result, ["particles"], ["_vertexDeclaration", "_vertexStrideSize"]);

    if (newEmitter === undefined) {
        newEmitter = this.emitter;
    }

    result.emitter = newEmitter;
    if (this.particleTexture) {
        result.particleTexture = new Texture(this.particleTexture.name, this._scene);
    }

    result.start();

    return result;
};

// Statics
ParticleSystem.BLENDMODE_ONEONE = 0;
ParticleSystem.BLENDMODE_STANDARD = 1;