
export default function MultiMaterial(name, scene) {
    this.name = name;
    this.id = name;
    
    this._scene = scene;
    scene.multiMaterials.push(this);

    this.subMaterials = [];
};

// Properties
MultiMaterial.prototype.getSubMaterial = function (index) {
    if (index < 0 || index >= this.subMaterials.length) {
        return this._scene.defaultMaterial;
    }

    return this.subMaterials[index];
};