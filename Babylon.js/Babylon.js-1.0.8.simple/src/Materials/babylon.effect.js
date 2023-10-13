var BABYLON = BABYLON || {};

(function(){
	BABYLON.Effect = function (
		baseName,
		attributesNames, uniformsNames,
		samplers, engine, defines) {

		this._engine = engine;
		this.name = baseName;
		this.defines = defines;
		this._uniformsNames = uniformsNames.concat(samplers);
		this._samplers = samplers;
		this._isReady = false;

		var that = this;

		if( BABYLON.Effect.ShadersStore[baseName + "VectexShader"] ){

		}else{
			var shaderUrl = BABYLON.Engine.ShadersRepository + baseName;
			// Vertex shader
			BABYLON.Tools.LoadFile(shaderUrl + '.vertex.fx',
				function(vertexSourceCode){
					//Fragment shader
					BABYLON.Tools.LoadFile(shaderUrl + '.fragment.fx', function(fragmentSourceCode){
						that._prepareEffect(
							vertexSourceCode, fragmentSourceCode,
							attributesNames, defines
						);
					});
				});
		}

	};

	//Properties
	BABYLON.Effect.prototype.isReady = function (){
		return this._isReady;
	}

	BABYLON.Effect.prototype.getProgram = function (){
		return this._program;
	}

	BABYLON.Effect.prototype.getAttribute = function (index) {
		return this._attributes[index];
	};

	BABYLON.Effect.prototype.getAttributesCount = function () {
		return this._attributes.length;
	};

	BABYLON.Effect.prototype.getUniform = function (uniformName){
		return this._uniforms[this._uniformsNames.indexOf(uniformName)];
	}

	// Methods
	BABYLON.Effect.prototype._prepareEffect = function (
		vertexSourceCode, fragmentSourceCode,
		attributesNames, defines
	){
		var engine = this._engine;
		this._program = engine.createShaderProgram(
											vertexSourceCode, fragmentSourceCode,
											defines
										);

		this._uniforms = engine.getUniforms(
											this._program, this._uniformsNames
										);

		this._attributes = engine.getAttributes(
												this._program, attributesNames
											);

		for( var index = 0; index < this._samplers.length; index ++ ){
			var sampler = this.getUniform(this._samplers[index]);

			if( sampler === null ){
				this._samplers.splice(index, 1);
				index --;
			}
		}

		// engine.bindSamplers(this);

		this._isReady = true;
	}

	BABYLON.Effect.prototype.setMatrix = function (
		uniformName, matrix
	){

		this._engine.setMatrix(this.getUniform(uniformName), matrix);
	}

	BABYLON.Effect.prototype.setVector3 = function (
		uniformName, vector3
	){

    this._engine.setVector3(this.getUniform(uniformName), vector3);
	}

	BABYLON.Effect.prototype.setColor3 = function (
		uniformName, color3
	){

		this._engine.setColor3(this.getUniform(uniformName), color3);
	}

	BABYLON.Effect.prototype.setColor4 = function (
		uniformName, color3, alpha
	){

		this._engine.setColor4(this.getUniform(uniformName), color3, alpha);
	}

	// Statics
	BABYLON.Effect.ShadersStore = {};
})();