import './style.css'
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
import * as logic from './logic.js';
import * as gui from './gui.js';

let sceneBounds, cameraBounds, cameraTarget, mixer, animationList, meshName, meshList = {}, materialName, materialsList = {}, cameraControls, axisHelper = new THREE.AxesHelper();
let maxAnisotropy, pmremGenerator;
let manager, startDelay = 750, scene, camera, width, height, renderer, composer, renderPass, taaPass, outputPass, bcPass;

///// Loading manager /////
manager = new THREE.LoadingManager();
manager.onLoad = () =>
{
    // console.log(scene);
    // console.log(meshList);
    console.log(materialsList);
    // console.log(animationList);
    console.log('Three R' + THREE.REVISION);
    // Start application
    initCameraControls();
    setTimeout(() =>
    {   
        gui.initGUI(renderer, composer, taaPass, bcPass, scene, cameraBounds, axisHelper, camera, cameraControls, materialName, materialsList);
        logic.updateActions(scene, materialsList, meshName, meshList, mixer, animationList);
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
width = window.innerWidth;
height = window.innerHeight;
const canvas = document.getElementById('webgl');
camera = new THREE.PerspectiveCamera(gui.cam.FOV, width / height, 0.3, 100);

///// Renderer /////
renderer = new THREE.WebGLRenderer({powerPreference: "high-performance", antialias: false, alpha: true});
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = gui.settings.tonemapping;
renderer.toneMappingExposure = gui.settings.exposure;
renderer.setPixelRatio(gui.settings.pixelRatio);
renderer.setSize(width, height);
canvas.appendChild(renderer.domElement);
maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

///// Postprocess /////
composer = new EffectComposer(renderer);
composer.setPixelRatio(gui.settings.pixelRatio);
composer.setSize(width, height);
// Render pass
renderPass = new RenderPass(scene, camera);
// TAA
taaPass = new TAARenderPass(scene, camera);
taaPass.sampleLevel = gui.settings.taaLevel;
taaPass.unbiased = false; // false - for better performance
taaPass.enabled = gui.settings.taaActive;
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
    gui.cam.fitSphereRadius = 8;
    logic.toggleDeviceBlock();
    loadApp();
} else
{
    gui.cam.fitSphereRadius = 6.5;
    logic.toggleDeviceBlock();
    loadApp();
};

///// Loading application /////
function loadApp ()
{
    // Loading scene
    const ktx2 = new KTX2Loader().setTranscoderPath('./assets/').detectSupport(renderer);
    const gltfLoader = new GLTFLoader(manager);
    gltfLoader.setKTX2Loader(ktx2);
    gltfLoader.load('./assets/GCPMSP_Lab.glb',
    (gltf) =>
    {
        scene.add(gltf.scene);
        mixer = new THREE.AnimationMixer(gltf.scene);
        animationList = gltf.animations;
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
    new RGBELoader(manager).load('./assets/Environment.hdr',
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
    cameraTarget = new THREE.Vector3(1, 0, -4.65);
    // Settings
    cameraControls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControls.minDistance = 2;
    cameraControls.maxDistance = 80;
    cameraControls.maxPolarAngle = 90 * (Math.PI / 180);
    cameraControls.azimuthRotateSpeed = 0.55;
    cameraControls.truckSpeed = 2.35;
    cameraControls.dollySpeed = 0.75;
    // Camera target boundary box
    const boundaryBoxSize = new THREE.Vector3(8, 2, 6);
    const minPoint = new THREE.Vector3().subVectors(cameraTarget, boundaryBoxSize);
    const maxPoint = new THREE.Vector3().addVectors(cameraTarget, boundaryBoxSize);
    const boundaryBox = new THREE.Box3(minPoint, maxPoint);
    cameraControls.setBoundary(boundaryBox);
    // Init position
    sceneBounds  = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12));
    cameraBounds = CameraControls.createBoundingSphere(sceneBounds);
    cameraBounds.center.copy(cameraTarget);
    cameraBounds.radius = gui.cam.fitSphereRadius;
    cameraControls.rotateTo(gui.cam.rotateY * (Math.PI / 180), gui.cam.rotateX * (Math.PI / 180), true)
    cameraControls.fitToSphere(cameraBounds, true);
};

///// Window resized /////
window.addEventListener('resize', () =>
{
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(gui.settings.pixelRatio);
    renderer.setSize(width, height);
    composer.setPixelRatio(gui.settings.pixelRatio);
    composer.setSize(width, height);
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