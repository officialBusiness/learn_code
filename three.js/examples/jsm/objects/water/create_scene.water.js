
import * as THREE from 'three';

export function createWaterScene(){

	const group = new THREE.Group();

	group.add( new THREE.AmbientLight( 0xff0000 ) );

	const	boxMesh = new THREE.Mesh(
		new THREE.BoxGeometry( 1, 1, 1 ),
		new THREE.MeshStandardMaterial( { roughness: 0 } )
	);

	boxMesh.position.y = 2;
	group.add( boxMesh );


	const icosahedronMesh = new THREE.Mesh(
		new THREE.IcosahedronGeometry( 0.5, 4 ),
		new THREE.MeshBasicMaterial({
			color: 0xffffff,
		})
	);

	icosahedronMesh.position.set( 2, 2, 2 );
	group.add( icosahedronMesh );


	const coneMesh = new THREE.Mesh(
		new THREE.ConeGeometry( 0.5, 1, 64 ),
		new THREE.MeshBasicMaterial( {
			color: 'yellow'
		})
	);
	coneMesh.position.set( -2, 2, -2 );
	group.add( coneMesh );


	group.add( new THREE.AxesHelper(20) );


	return group;
}