import './style.css';
import * as THREE from 'three';
import {GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import CameraControls from 'camera-controls';
CameraControls.install({THREE: THREE});
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {TAARenderPass} from 'three/addons/postprocessing/TAARenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {BrightnessContrastShader} from 'three/addons/shaders/BrightnessContrastShader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import * as logic from './logic.js';
import * as gui from './gui.js';

let cameraBounds, sceneTarget, frameTarget, mixer, animationsList = {}, meshName, meshList = {}, materialName, materialsList = {}, cameraControls, axisHelper = new THREE.AxesHelper();
let maxAnisotropy, pmremGenerator;
let manager, startDelay = 750, scene, camera, width, height, renderer, composer, renderPass, taaPass, outputPass, bcPass;

///// Loading manager /////
manager = new THREE.LoadingManager();
manager.onLoad = () =>
{
    // console.log(scene);
    // console.log(meshList);
    // console.log(materialsList);
    // console.log(animationsList);
    console.log('Three R' + THREE.REVISION);
    // Start application
    initCameraControls();
    setTimeout(() =>
    {   
        gui.initGUI(renderer, composer, taaPass, bcPass, scene, cameraBounds, axisHelper, camera, cameraControls, materialName, materialsList);
        logic.updateActions(scene, cameraControls, cameraBounds, frameTarget, materialsList, meshName, meshList, mixer, animationsList);
        renderScene();
    }, startDelay);
};
manager.onProgress = (url, itemsLoaded, itemsTotal) =>
{
    const progress = itemsLoaded / itemsTotal;
    logic.updateLoadingBar(progress, startDelay);
};

///// Scene /////
const clock = new THREE.Clock();
scene = new THREE.Scene();
scene.background = new THREE.Color(0x768388);
width = window.innerWidth;
height = window.innerHeight;
const canvas = document.getElementById('webgl');
camera = new THREE.PerspectiveCamera(gui.cam.FOV, width / height, 0.3, 100);

///// Renderer /////
renderer = new THREE.WebGLRenderer();
renderer.toneMapping = gui.settings.tonemapping;
renderer.toneMappingExposure = gui.settings.exposure;
renderer.setSize(width, height);
renderer.setPixelRatio(gui.settings.pixelRatio);
canvas.appendChild(renderer.domElement);
maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

///// Postprocess /////
composer = new EffectComposer(renderer);
composer.setSize(width, height);
composer.setPixelRatio(gui.settings.pixelRatio);
// Render pass
renderPass = new RenderPass(scene, camera);
// TAA
taaPass = new TAARenderPass(scene, camera);
taaPass.sampleLevel = gui.settings.taaLevel;
taaPass.unbiased = false; // false - for better performance
// Output pass
outputPass = new OutputPass();
// BrightnessContrast
bcPass = new ShaderPass(BrightnessContrastShader);
bcPass.uniforms["brightness"].value = gui.settings.brightness;
bcPass.uniforms["contrast"].value = gui.settings.contrast;
// Adding passes
composer.addPass(renderPass);
composer.addPass(taaPass);
composer.addPass(outputPass);
composer.addPass(bcPass); // BrightnessContrast needs to be last

///// Check device /////
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile)
{
    gui.cam.fitSphereRadius = 8.5;
    taaPass.enabled = false;
    logic.toggleDeviceBlock();
    loadApp();
} else
{
    gui.cam.fitSphereRadius = 6.7;
    logic.toggleDeviceBlock();
    loadApp();
};

///// Loading application /////
function loadApp ()
{
    // Checking for WebGL 2.0 compatibility
    /* if (WebGL.isWebGL2Available() === false)
    {
        document.body.appendChild(WebGL.getWebGL2ErrorMessage());
        return;
    }; */

    // Loading scene
    const ktx2 = new KTX2Loader().setTranscoderPath('./assets/').detectSupport(renderer);
    const gltfLoader = new GLTFLoader(manager);
    gltfLoader.setKTX2Loader(ktx2);
    gltfLoader.load('./assets/GCPMSP_Lab.glb',
    (gltf) =>
    {
        scene.add(gltf.scene);
        mixer = new THREE.AnimationMixer(gltf.scene);
        animationsList = gltf.animations;
        // Searching for materials
        scene.traverse((object) =>
        {
            if (object.isMesh)
            {
                // Create mesh list
                meshName = object.name;
                if (!meshList[meshName])
                {
                    meshList[meshName] = object;
                }
                // Create material list
                materialName = object.material.name;
                if (!materialsList[materialName])
                {
                    materialsList[materialName] = object.material;
                }
            }
        });
        // Apply textures anisotropy
        for (materialName in materialsList)
        {
            const material = materialsList[materialName];
            if (material.map)
            {
                material.map.anisotropy = maxAnisotropy;
            }
            if (material.aoMap)
            {
                material.aoMap.anisotropy = maxAnisotropy;
            }
            if (material.roughnessMap)
            {
                material.roughnessMap.anisotropy = maxAnisotropy;
            }
        };
    });

    // Loading HDRI environment
    new RGBELoader(manager).load('./assets/environment.hdr',
    (hdri) =>
    {
        pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envmap = pmremGenerator.fromEquirectangular(hdri).texture;
        scene.environment = envmap;
        // hdri.mapping = THREE.EquirectangularReflectionMapping;
        // scene.background = hdri;
        pmremGenerator.dispose();
    });
};

///// Camera Controls /////
function initCameraControls()
{
    cameraControls = new CameraControls(camera, canvas);
    sceneTarget = new THREE.Vector3(0.65, 0.8, -4.65);
    frameTarget = new THREE.Vector3(-0.025, 0.8, -3.5);
    // Settings
    cameraControls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControls.minDistance = 9.5;
    cameraControls.maxDistance = 50;
    cameraControls.maxPolarAngle = 90 * (Math.PI / 180);
    cameraControls.azimuthRotateSpeed = 0.55;
    cameraControls.truckSpeed = 2.35;
    cameraControls.dollySpeed = 0.75;
    // cameraControls.smoothTime = 0.3;
    // Camera target boundary box
    const boundaryBoxSize = new THREE.Vector3(6, 2, 6);
    const minPoint = new THREE.Vector3().subVectors(sceneTarget, boundaryBoxSize);
    const maxPoint = new THREE.Vector3().addVectors(sceneTarget, boundaryBoxSize);
    const boundaryBox = new THREE.Box3(minPoint, maxPoint);
    cameraControls.setBoundary(boundaryBox);
    // Init position
    cameraBounds = CameraControls.createBoundingSphere(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12)));
    cameraBounds.center.copy(sceneTarget);
    cameraBounds.radius = gui.cam.fitSphereRadius;
    cameraControls.setLookAt(-3.56, 12.7, 7.47, sceneTarget.x, sceneTarget.y, sceneTarget.z, true);
    cameraControls.fitToSphere(cameraBounds, true);
    cameraControls.saveState();
};

///// Window resized /////
window.addEventListener('resize', () =>
{
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(gui.settings.pixelRatio);
    composer.setSize(width, height);
    composer.setPixelRatio(gui.settings.pixelRatio);
    cameraControls.fitToSphere(cameraBounds, true);
});

///// Render /////
function renderScene()
{
    logic.raycast(scene, camera);

    gui.fps.begin();
    const delta = clock.getDelta();
    // Animation mixer
    if (mixer)
    {
        mixer.update(delta);
    };
    // Update cameraControls
    if (cameraControls)
    {
        cameraControls.update(delta);
    };
    gui.fps.end();
    requestAnimationFrame(renderScene);
    composer.render();
};