
export default function Material(name, scene) {
	this.name = name;
	this.id = name;
	
	this._scene = scene;
	scene.materials.push(this);
};

// Members
Material.prototype.alpha = 1.0;
Material.prototype.wireframe = false;
Material.prototype.backFaceCulling = true;
Material.prototype._effect = null;

Material.prototype.onDispose = null;

// Properties
Material.prototype.isReady = function () {
	return true;
};

Material.prototype.getEffect = function () {
	return this._effect;
};

Material.prototype.needAlphaBlending = function () {
	return (this.alpha < 1.0);
};

Material.prototype.needAlphaTesting = function () {
	return false;
};

// Methods   
Material.prototype._preBind = function () {
	var engine = this._scene.getEngine();
	
	engine.enableEffect(this._effect);
	engine.setState(this.backFaceCulling);
};

Material.prototype.bind = function (world, mesh) {       
};

Material.prototype.unbind = function () {
};

Material.prototype.baseDispose = function () {
	// Remove from scene
	var index = this._scene.materials.indexOf(this);
	this._scene.materials.splice(index, 1);

	// Callback
	if (this.onDispose) {
		this.onDispose();
	}
};

Material.prototype.dispose = function () {
	this.baseDispose();
};