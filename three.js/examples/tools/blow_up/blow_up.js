import * as THREE from 'three';

function resetBox3( box3 ){

	box3.min.x = box3.min.y = box3.min.z = Infinity;
	box3.max.x = box3.max.y = box3.max.z = -Infinity;
}

// 只支持 mesh
// 待完善其他 mesh 的偏移
// 待完善自定义路径操作
export default class BlowUp{

	constructor( model, scene ){

		const
			blowUpHelper = new THREE.Group(),

			modelBox3 = new THREE.Box3(
				new THREE.Vector3( Infinity, Infinity, Infinity),
				new THREE.Vector3( -Infinity, -Infinity, -Infinity)
			),
			modelCenter = new THREE.Vector3(),

			meshMap = new Map(),

			_min = new THREE.Vector3(),
			_max = new THREE.Vector3();

		model.traverse(( node )=>{

			if( node.geometry && !meshMap.has( node ) ){

				if( node.isSkinnedMesh ){
					console.warn('不支持 SkinnedMesh');
					// return;
				} else if( node.isInstancedMesh ){
					console.warn('应该不支持 InstancedMesh 吧');
					// return;
				} else if( node.isBatchedMesh ){
					console.warn('BatchedMesh 不知道支不支持，试试吧');
				}

				const { geometry, matrix, matrixWorld } = node;

				if( !geometry.boundingBox ){

					geometry.computeBoundingBox();
				}

				const meshMessage = {

					position: node.position.clone(),
					quaternion: node.quaternion.clone(),
					scale: node.scale.clone(),

					positionWorld: new THREE.Vector3(),
					quaternionWorld: new THREE.Quaternion(),
					scaleWorld: new THREE.Vector3(),
					centerWorld: new THREE.Vector3(),

					// matrix: matrix.clone(),
					// matrixInvert: matrix.clone().invert(),

					// matrixWorld: matrixWorld.clone(),
					// matrixWorldInvert: matrixWorld.clone().invert(),

					// parentMatrix: matrixWorld.clone().multiply( matrix.clone().invert() ),
					parentMatrixInvert: new THREE.Matrix4(),

					helper: new THREE.Group().add(new THREE.Mesh(
						new THREE.SphereGeometry(0.04),
						new THREE.MeshBasicMaterial({
							depthTest: false,
						}),
					)),
				}

				meshMap.set( node, meshMessage );

				blowUpHelper.add( meshMessage.helper );
			}
		});

		const worldCenterSphere = new THREE.Mesh(
			new THREE.SphereGeometry(0.04),
			new THREE.MeshBasicMaterial({
				color: 0xff0000,
				depthTest: false,
			}),
		);
		blowUpHelper.add( worldCenterSphere );
		scene.add( blowUpHelper );

		resetModelMessage();
		function resetModelMessage(){
			model.updateMatrixWorld( true, true );

			resetBox3( modelBox3 );

			meshMap.forEach(( meshMessage, mesh, map )=>{

				const {
					geometry, matrix, matrixWorld,
					position, quaternion, scale
				} = mesh;

				meshMessage.position.copy( position );
				meshMessage.quaternion.copy( quaternion );
				meshMessage.scale.copy( scale );

				matrixWorld.decompose(
					meshMessage.positionWorld,
					meshMessage.quaternionWorld,
					meshMessage.scaleWorld,
				);

				meshMessage.parentMatrixInvert
					.copy( matrix )
					.invert()
					.premultiply( matrixWorld )
					.invert()

				_min.copy( geometry.boundingBox.min ).applyMatrix4( matrixWorld );
				_max.copy( geometry.boundingBox.max ).applyMatrix4( matrixWorld );

				modelBox3.expandByPoint( _min );
				modelBox3.expandByPoint( _max );

				geometry.boundingBox.getCenter( meshMessage.centerWorld );
				meshMessage.centerWorld.applyMatrix4( matrixWorld );

				meshMessage.helper.position.copy( meshMessage.centerWorld );
			});
			modelBox3.getCenter( modelCenter );

			worldCenterSphere.position.copy( modelCenter );
		}

		return {
			blowUpHelper,
			resetModelMessage,
			blowUpMeshes( skew ){

				const _vector3 = new THREE.Vector3();

				meshMap.forEach(( meshMessage, mesh, map )=>{

					_vector3
						.copy( meshMessage.centerWorld )
						.sub( modelCenter )
						.normalize()
						.multiplyScalar( skew );

					meshMessage.helper.position
						.copy( meshMessage.centerWorld )
						.add( _vector3 );

					mesh.position
						.copy( meshMessage.positionWorld )
						.add( _vector3 )
						.applyMatrix4( meshMessage.parentMatrixInvert );
				});
			}
		}
	}
}