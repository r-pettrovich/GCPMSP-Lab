import './style.css';
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import {getGPUTier} from 'detect-gpu';
import {GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import CameraControls from 'camera-controls';
CameraControls.install({THREE: THREE});
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {TAARenderPass} from 'three/addons/postprocessing/TAARenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {BrightnessContrastShader} from 'three/addons/shaders/BrightnessContrastShader.js';
import * as gui from './gui.js';
import * as logic from './logic.js';

let cameraBoundsP, cameraBoundsO, sceneTargetP, sceneTargetO, frameTargetP, frameTargetO, sceneBBox, frameBBox, mixer, animationsList = {}, meshName, meshList = {}, materialName, materialsList = {}, cameraControlsP, cameraControlsO, axisHelper = new THREE.AxesHelper();
let maxAnisotropy, pmremGenerator;
let device, orientation, appIsLoaded = false, gpuTier, manager, startDelay = 750, scene, cameraP, cameraO, cameraOValue = 2, clock, canvas, width, height, renderer, composer, taaPassP, taaPassO, outputPass, bcPass;

init();
initCameraControls();
function init()
{
    ///// Checking for WebGL 2.0 compatibility /////
    if (WebGL.isWebGL2Available() === false)
    {
        const webglBlock = document.getElementById('webgl-block');
        webglBlock.style.display = 'flex';
        return;
    };

    ///// Scene /////
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7c939c);
    canvas = document.getElementById('webgl');
    width = window.innerWidth;
    height = window.innerHeight;
    cameraP = new THREE.PerspectiveCamera(gui.cam.FOV, width / height, 1.35, 100);
    cameraO = new THREE.OrthographicCamera(width / -cameraOValue, width / cameraOValue, height / cameraOValue, height / -cameraOValue, 1, 100);

    ///// Renderer /////
    renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer: false}); //logarithmicDepthBuffer fixes Apple AO flickering bug, but causing performance drop
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
    // TAA render pass
    taaPassP = new TAARenderPass(scene, cameraP);
    taaPassP.enabled = true;
    taaPassO = new TAARenderPass(scene, cameraO);
    taaPassO.enabled = false;
    taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel;
    taaPassP.unbiased = taaPassO.unbiased = true; // false - for better performance
    // Output pass
    outputPass = new OutputPass();
    // BrightnessContrast
    bcPass = new ShaderPass(BrightnessContrastShader);
    bcPass.uniforms["brightness"].value = gui.settings.brightness;
    bcPass.uniforms["contrast"].value = gui.settings.contrast;

    ///// Adding passes /////
    composer.addPass(taaPassP);
    composer.addPass(taaPassO);
    composer.addPass(outputPass);
    composer.addPass(bcPass); // BrightnessContrast needs to be the last
};

///// Performance benchmark /////
(async () =>
{
    const gpu = await getGPUTier();
    gpuTier = gpu.tier;
    checkDevice();
})();

///// Check device /////
function checkDevice()
{
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile)
    {
        device = 'mobile';
        // Camera init settings
        cameraBoundsP.radius = 8.5;
        cameraControlsP.minDistance = 12;
        cameraControlsP.maxDistance = 50;
        cameraBoundsO.radius = 5.5;
        cameraControlsO.minZoom = 30;
        cameraControlsO.maxZoom = 120;
        // Quality settings
        taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel = 0;
        checkOrientation();
    } else
    {
        device = 'desktop'
        // Camera init settings
        cameraBoundsP.radius = gui.cam.radiusP;
        cameraControlsP.minDistance = 9.7;
        cameraControlsP.maxDistance = 25;
        cameraBoundsO.radius = gui.cam.radiusO;
        cameraControlsO.minZoom = 35;
        cameraControlsO.maxZoom = 180;
        // Quality settings
        if (gpuTier === 1)
        {
            // taaPassP.enabled = false;
            taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel = 0;
        } else if (gpuTier === 2)
        {
            if (window.devicePixelRatio === 1)
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel = 2;
            } else
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel = 1;
            }
            // renderPass.enabled = false;  // renderPass is redundant if taaPass is working
        } else if (gpuTier === 3)
        {
            if (window.devicePixelRatio === 1)
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel;
            } else
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = gui.settings.taaLevel = 1;
            }
            // renderPass.enabled = false;  // renderPass is redundant if taaPass is working
        };
        logic.toggleDeviceBlock(device, orientation);
        appIsLoaded = true;
        loadApp();
    };
};

///// Check orientation /////
function checkOrientation()
{
    if (window.matchMedia('(orientation: portrait)').matches && appIsLoaded === false)
    {
        orientation = 'portrait';
        appIsLoaded = true;
        logic.toggleDeviceBlock(device, orientation);
        loadApp();
    } else if (window.matchMedia('(orientation: portrait)').matches && appIsLoaded === true)
    {
        orientation = 'portrait';
        logic.toggleDeviceBlock(device, orientation);
    } else if (window.matchMedia('(orientation: landscape)').matches)
    {
        orientation = 'landscape'
        logic.toggleDeviceBlock(device, orientation);
    };
};

///// Loading application /////
function loadApp()
{
    // Manager
    manager = new THREE.LoadingManager();
    manager.onLoad = () =>
    {
        // console.log(scene);
        // console.log(meshList);
        // console.log(materialsList);
        // console.log(animationsList);
        console.log('Three R' + THREE.REVISION);
        console.log('Device: ' + device);
        console.log('GPU Tier: ' + gpuTier);
        // Start application
        setTimeout(() =>
        {
            cameraControlsP.fitToSphere(cameraBoundsP, true);
            cameraControlsO.fitToSphere(cameraBoundsO, false);
            gui.initGUI(renderer, composer, taaPassP, taaPassO, bcPass, scene, cameraBoundsP, cameraBoundsO, axisHelper, cameraP, cameraControlsP, cameraControlsO, materialName, materialsList);
            logic.updateActions(device, scene, cameraControlsP, cameraControlsO, cameraBoundsP, cameraBoundsO, sceneTargetP, sceneTargetO, frameTargetP, frameTargetO, sceneBBox, frameBBox, materialsList, meshName, meshList, mixer, animationsList);
            renderScene();
        }, startDelay);
    };
    manager.onProgress = (url, itemsLoaded, itemsTotal) =>
    {
        const progress = itemsLoaded / itemsTotal;
        logic.updateLoadingBar(progress, startDelay);
    };

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
    cameraControlsP = new CameraControls(cameraP, canvas);
    sceneTargetP = new THREE.Vector3(0.65, 1.58, -4.65);
    frameTargetP = new THREE.Vector3(-0.025, 1.58, -3.5);
    cameraControlsO = new CameraControls(cameraO, canvas);
    sceneTargetO = new THREE.Vector3(0, 0, -4.65);
    frameTargetO = new THREE.Vector3(-0.025, 0, -3.5);
    // Perspective camera settings
    cameraControlsP.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControlsP.maxPolarAngle = 90 * (Math.PI / 180);
    cameraControlsP.azimuthRotateSpeed = 0.55;
    cameraControlsP.truckSpeed = 1.75;
    cameraControlsP.dollySpeed = 0.75;
    // Orthographic camera settings
    cameraControlsO.mouseButtons.left = CameraControls.ACTION.TRUCK;
    cameraControlsO.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControlsO.touches.one = CameraControls.ACTION.TOUCH_TRUCK;
    cameraControlsO.dollySpeed = 2.5;
    // Camera target boundary box
    /* const boundaryBoxSize = new THREE.Vector3(6, 2, 6);
    const minPoint = new THREE.Vector3().subVectors(sceneTargetP, boundaryBoxSize);
    const maxPoint = new THREE.Vector3().addVectors(sceneTargetP, boundaryBoxSize);
    const boundaryBox = new THREE.Box3(minPoint, maxPoint);
    cameraControlsP.setBoundary(boundaryBox);
    cameraControlsO.setBoundary(boundaryBox); */

    ///// Testing boundary boxes /////
    const sceneBBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 12), new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true}));
    sceneBBoxMesh.position.copy(sceneTargetP);
    const frameBBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 9), new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true}));
    frameBBoxMesh.position.copy(frameTargetP);
    scene.add(sceneBBoxMesh);
    scene.add(frameBBoxMesh);
    sceneBBoxMesh.visible = true;
    frameBBoxMesh.visible = true;
    // sceneBBoxPMesh.layers.set(1);
    // frameBBoxPMesh.layers.set(1);
    sceneBBox = new THREE.Box3().setFromObject(sceneBBoxMesh);
    frameBBox = new THREE.Box3().setFromObject(frameBBoxMesh);
    cameraControlsP.setBoundary(sceneBBox);
    cameraControlsO.setBoundary(sceneBBox);
    // Init position
    cameraBoundsP = CameraControls.createBoundingSphere(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12)));
    cameraBoundsP.center.copy(sceneTargetP);
    cameraBoundsO = CameraControls.createBoundingSphere(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12)));
    cameraBoundsO.center.copy(sceneTargetO);
    cameraControlsP.setLookAt(-3.56, 9, 7.47, sceneTargetP.x, sceneTargetP.y, sceneTargetP.z, true);
    cameraControlsO.setLookAt(0, 8, -4.65, sceneTargetO.x, sceneTargetO.y, sceneTargetO.z, true);
    cameraControlsO.rotateAzimuthTo(-90 * (Math.PI / 180), false);
};

///// Window resized /////
window.addEventListener('resize', () =>
{
    checkOrientation();
    width = window.innerWidth;
    height = window.innerHeight;
    cameraP.aspect = width / height;
    cameraP.updateProjectionMatrix();
    cameraO.left = width / -cameraOValue;
	cameraO.right = width / cameraOValue;
	cameraO.top = height / cameraOValue;
	cameraO.bottom = height / -cameraOValue;
    cameraO.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(gui.settings.pixelRatio);
    composer.setSize(width, height);
    composer.setPixelRatio(gui.settings.pixelRatio);
    cameraControlsP.fitToSphere(cameraBoundsP, true);
    cameraControlsO.fitToSphere(cameraBoundsO, true);
});

///// Render /////
function renderScene()
{
    logic.raycast(scene, cameraP);

    gui.fps.begin();
    const delta = clock.getDelta();
    // Animation mixer
    if (mixer)
    {
        mixer.update(delta);
    };
    // Update cameraControls
    cameraControlsP.update(delta);
    cameraControlsO.update(delta);
    // Toggle camera projection
    taaPassP.enabled = (logic.cameraProjection === 'persp');
    taaPassO.enabled = (logic.cameraProjection === 'ortho');

    gui.fps.end();
    requestAnimationFrame(renderScene);
    composer.render();
};