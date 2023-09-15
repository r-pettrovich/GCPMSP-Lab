import * as THREE from 'three';
import CameraControls from './dist/camera-controls.module.js';
CameraControls.install( { THREE: THREE } );

const width = window.innerWidth;
const height = window.innerHeight;
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera1 = new THREE.PerspectiveCamera( 75, width / 2 / height, 0.01, 100 );
camera1.position.set( 0, 0, 2 );
const cameraObject1 = new THREE.Mesh(
	new THREE.BoxGeometry( .2, .2, .5 ),
	new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } )
);
cameraObject1.geometry.translate( 0, 0, .25 );
cameraObject1.matrixAutoUpdate = false;
scene.add( cameraObject1 );

const camera2 = new THREE.PerspectiveCamera( 30, width / 2 / height, 0.01, 100 );
camera2.position.set( 4, 4, 4 );
const cameraObject2 = cameraObject1.clone();
cameraObject2.matrixAutoUpdate = false;
scene.add( cameraObject2 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( width, height );
document.body.appendChild( renderer.domElement );

const cameraControlsLeft = new CameraControls( camera1, renderer.domElement );
const cameraControlsRight = new CameraControls( camera2, renderer.domElement );
cameraControlsLeft.interactiveArea = new DOMRect( 0, 0, 0.5, 1 );
cameraControlsRight.interactiveArea = new DOMRect( .5, 0, 0.5, 1 );

camera1.updateMatrix();
cameraObject1.matrix.copy( camera1.matrix );
camera2.updateMatrix();
cameraObject2.matrix.copy( camera2.matrix );

const mesh = new THREE.Mesh(
	new THREE.BoxGeometry( 1, 1, 1 ),
	new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } )
);
scene.add( mesh );

const gridHelper = new THREE.GridHelper( 50, 50 );
gridHelper.position.y = - 1;
scene.add( gridHelper );

const viewSize = renderer.getSize( new THREE.Vector2() );

const renderLeft = () => {

	camera1.updateMatrix();
	cameraObject1.matrix.copy( camera1.matrix );
	const left = 0;
	const top = 0;
	const width = viewSize.x / 2;
	const height = viewSize.y;
	renderer.setViewport( left, top, width, height );
	renderer.setScissor( left, top, width, height );
	renderer.setScissorTest( true );
	renderer.render( scene, camera1 );

}

const renderRight = () => {

	camera2.updateMatrix();
	cameraObject2.matrix.copy( camera2.matrix );
	const left = viewSize.x / 2;
	const top = 0;
	const width = viewSize.x / 2;
	const height = viewSize.y;
	renderer.setViewport( left, top, width, height );
	renderer.setScissor( left, top, width, height );
	renderer.setScissorTest( true );
	renderer.render( scene, camera2 );

}

renderLeft();
renderRight();

( function anim () {

	const delta = clock.getDelta();
	const elapsed = clock.getElapsedTime();
	const updatedLeft = cameraControlsLeft.update( delta );
	const updatedRight = cameraControlsRight.update( delta );

	// if ( elapsed > 30 ) { return; }

	requestAnimationFrame( anim );

	renderer.getSize( viewSize );

	if ( updatedLeft || updatedRight ) {

		renderLeft();
		renderRight();

	}

} )();

// make variable available to browser console
globalThis.THREE = THREE;
globalThis.cameraControlsLeft = cameraControlsLeft;
globalThis.cameraControlsRight = cameraControlsRight;
globalThis.mesh = mesh;