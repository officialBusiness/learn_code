import * as THREE from 'three';


export default function getPrepareMaskUnit( depthTexture = null ){

	return {

		prepareMaskMaterial: new THREE.ShaderMaterial( {
			uniforms: {
				depthTexture: {
					value: depthTexture
				},
				cameraNearFar: {
					value: new THREE.Vector2( 0.5, 0.5 )
				},
				textureMatrix: {
					value: null
				}
			},
			vertexShader: `
				#include <morphtarget_pars_vertex>
				#include <skinning_pars_vertex>

				varying vec4 projTexCoord;
				varying vec4 vPosition;
				uniform mat4 textureMatrix;

				void main() {

					#include <skinbase_vertex>
					#include <begin_vertex>
					#include <morphtarget_vertex>
					#include <skinning_vertex>
					#include <project_vertex>

					vPosition = mvPosition;

					vec4 worldPosition = vec4( transformed, 1.0 );

					#ifdef USE_INSTANCING

						worldPosition = instanceMatrix * worldPosition;

					#endif

					worldPosition = modelMatrix * worldPosition;

					projTexCoord = textureMatrix * worldPosition;

				}
			`,
			fragmentShader: `
				#include <packing>
				varying vec4 vPosition;
				varying vec4 projTexCoord;
				uniform sampler2D depthTexture;
				uniform vec2 cameraNearFar;

				void main() {

					float depth = unpackRGBAToDepth(texture2DProj( depthTexture, projTexCoord ));
					float viewZ = - perspectiveDepthToViewZ( depth, cameraNearFar.x, cameraNearFar.y );
					float depthTest = (-vPosition.z > viewZ) ? 1.0 : 0.0;
					gl_FragColor = vec4(0.0, depthTest, 1.0, 1.0);
				}
			`,
			side: THREE.DoubleSide
		} )
	}
}