var BABYLON = BABYLON || {};

(function () {
	BABYLON.Material = function (name, scene) {
		this.name = name;
		this.id = name;

		this._scene = scene;
		scene.materials.push(this);
	};

	BABYLON.Material.prototype.backFaceCulling = true;
	BABYLON.Material.prototype.wireframe = false;

	BABYLON.Material.prototype.getEffect = function () {
		return this._effect;
	};

	BABYLON.Material.prototype._preBind = function (){
		var engine = this._scene.getEngine();

		engine.enableEffect(this._effect);
		engine.setState(this.backFaceCulling);

	}

})();