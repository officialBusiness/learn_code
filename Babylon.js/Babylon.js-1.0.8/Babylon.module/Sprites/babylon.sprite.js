import { Vector3, Color4 } from '../Tools/babylon.math.js';

export default function Sprite(name, manager) {
    this.name = name;
    this._manager = manager;

    this._manager.sprites.push(this);

    this.position = Vector3.Zero();
    this.color = new Color4(1.0, 1.0, 1.0, 1.0);

    this._frameCount = 0;
};

// Members
Sprite.prototype.position = null;
Sprite.prototype.size = 1.0;
Sprite.prototype.angle = 0;
Sprite.prototype.cellIndex = 0;
Sprite.prototype.invertU = 0;
Sprite.prototype.invertV = 0;

Sprite.prototype._animationStarted = false;
Sprite.prototype._loopAnimation = false;
Sprite.prototype._fromIndex = false;
Sprite.prototype._toIndex = false;
Sprite.prototype._delay = false;
Sprite.prototype._direction = 1;

// Methods
Sprite.prototype.playAnimation = function (from, to, loop, delay) {
    this._fromIndex = from;
    this._toIndex = to;
    this._loopAnimation = loop;
    this._delay = delay;
    this._animationStarted = true;

    this._direction = from < to ? 1 : -1;

    this.cellIndex = from;
    this._time = 0;
};

Sprite.prototype.stopAnimation = function() {
    this._animationStarted = false;
};

Sprite.prototype._animate = function (deltaTime) {
    if (!this._animationStarted)
        return;

    this._time += deltaTime;
    if (this._time > this._delay) {
        this._time = this._time % this._delay;
        this.cellIndex += this._direction;
        if (this.cellIndex == this._toIndex) {
            if (this._loopAnimation) {
                this.cellIndex = this._fromIndex;
            } else {
                this._animationStarted = false;
            }
        }
    }
}