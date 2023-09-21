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
import * as pane from './pane.js';
import * as logic from './logic.js';

let cameraControlsP, cameraControlsO, cameraBoundsP, cameraBoundsO, sceneTargetP, sceneTargetO, frameTargetP, frameTargetO, sceneBBox, frameBBox, sceneBBoxMesh, frameBBoxMesh;
let mixer, animationsList = [], meshName, meshList = [], materialName, materialsList = [], axisHelper = new THREE.AxesHelper();
let device, orientation, appIsLoaded = false, gpuTier, manager, startDelay = 750, maxAnisotropy, pmremGenerator;
let scene, cameraP, cameraO, cameraOValue = 2, canvas, width, height, clock, renderer, composer, taaPassP, taaPassO, outputPass, bcPass;

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
    cameraP = new THREE.PerspectiveCamera(pane.cam.FOV, width / height, 1.35, 100);
    cameraO = new THREE.OrthographicCamera(width / -cameraOValue, width / cameraOValue, height / cameraOValue, height / -cameraOValue, 1, 100);

    ///// Renderer /////
    renderer = new THREE.WebGLRenderer({logarithmicDepthBuffer: false}); //logarithmicDepthBuffer fixes Apple AO flickering bug, but causing performance drop. Increase camera near clip instead
    renderer.toneMapping = pane.settings.tonemapping;
    renderer.toneMappingExposure = pane.settings.exposure;
    renderer.setSize(width, height);
    renderer.setPixelRatio(pane.settings.pixelRatio);
    canvas.appendChild(renderer.domElement);
    maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    ///// Postprocess /////
    composer = new EffectComposer(renderer);
    composer.setSize(width, height);
    composer.setPixelRatio(pane.settings.pixelRatio);
    // TAA render pass
    taaPassP = new TAARenderPass(scene, cameraP);
    taaPassP.enabled = true;
    taaPassO = new TAARenderPass(scene, cameraO);
    taaPassO.enabled = false;
    taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel;
    taaPassP.unbiased = taaPassO.unbiased = true; // false - for better performance
    // Output pass
    outputPass = new OutputPass();
    // BrightnessContrast
    bcPass = new ShaderPass(BrightnessContrastShader);
    bcPass.uniforms["brightness"].value = pane.settings.brightness;
    bcPass.uniforms["contrast"].value = pane.settings.contrast;

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
        cameraBoundsO.radius = 5.3;
        cameraControlsO.minZoom = 30;
        cameraControlsO.maxZoom = 120;
        cameraControlsO.dollySpeed = 8;
        // Quality settings
        taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel = 0;
        checkOrientation();
    } else
    {
        device = 'desktop'
        // Camera init settings
        cameraBoundsP.radius = 6.7;
        cameraControlsP.minDistance = 9.7;
        cameraControlsP.maxDistance = 25;
        cameraBoundsO.radius = 8;
        cameraControlsO.minZoom = 35;
        cameraControlsO.maxZoom = 180;
        cameraControlsO.dollySpeed = 1.5;
        // Quality settings
        if (gpuTier === 1)
        {
            taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel = 0;
        } else if (gpuTier === 2)
        {
            if (window.devicePixelRatio === 1)
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel = 2;
            } else
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel = 1;
            }
        } else if (gpuTier === 3)
        {
            if (window.devicePixelRatio === 1)
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel;
            } else
            {
                taaPassP.sampleLevel = taaPassO.sampleLevel = pane.settings.taaLevel = 1;
            }
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
        logic.toggleDeviceBlock(device, orientation);
        appIsLoaded = true;
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
            pane.initPane(renderer, composer, taaPassP, taaPassO, bcPass, scene, cameraBoundsP, cameraBoundsO, axisHelper, cameraP, cameraControlsP, cameraControlsO, sceneBBoxMesh, frameBBoxMesh, materialName, materialsList);
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
        // Searching for meshes and materials
        scene.traverse((object) =>
        {
            if (object.isMesh)
            {
                // Create meshes list
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
    sceneTargetP = new THREE.Vector3(0.65, 1, -4.65);
    frameTargetP = new THREE.Vector3(-0.025, 1, -3.5);
    cameraControlsO = new CameraControls(cameraO, canvas);
    sceneTargetO = new THREE.Vector3(0.7, 0, -4.65);
    frameTargetO = new THREE.Vector3(-0.025, 0, -3.5);
    // Perspective camera settings
    cameraControlsP.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControlsP.touches.three = CameraControls.ACTION.NONE;
    cameraControlsP.maxPolarAngle = 90 * (Math.PI / 180);
    cameraControlsP.azimuthRotateSpeed = 0.55;
    cameraControlsP.truckSpeed = 1.75;
    cameraControlsP.dollySpeed = 0.75;
    // Orthographic camera settings
    cameraControlsO.mouseButtons.left = CameraControls.ACTION.TRUCK;
    cameraControlsO.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControlsO.touches.one = CameraControls.ACTION.TOUCH_TRUCK;
    cameraControlsO.touches.two = CameraControls.ACTION.TOUCH_ZOOM;
    cameraControlsO.touches.three = CameraControls.ACTION.NONE;
    cameraControlsO.truckSpeed = 2;
    // Camera target boundary box
    sceneBBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 12), new THREE.MeshBasicMaterial({color: 0x424249, wireframe: true}));
    frameBBoxMesh = new THREE.Mesh(new THREE.BoxGeometry(5, 4.5, 9), new THREE.MeshBasicMaterial({color: 0x424249, wireframe: true}));
    sceneBBoxMesh.position.copy(sceneTargetP);
    frameBBoxMesh.position.copy(frameTargetP);
    scene.add(sceneBBoxMesh);
    scene.add(frameBBoxMesh);
    sceneBBoxMesh.visible = false;
    frameBBoxMesh.visible = false;
    sceneBBox = new THREE.Box3().setFromObject(sceneBBoxMesh);
    frameBBox = new THREE.Box3().setFromObject(frameBBoxMesh);
    cameraControlsP.setBoundary(sceneBBox);
    cameraControlsO.setBoundary(sceneBBox);
    // Init position
    cameraBoundsP = CameraControls.createBoundingSphere(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12)));
    cameraBoundsO = CameraControls.createBoundingSphere(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12)));
    cameraBoundsP.center.copy(sceneTargetP);
    cameraBoundsO.center.copy(sceneTargetO);
    cameraControlsP.setLookAt(-3.56, 9, 7.47, sceneTargetP.x, sceneTargetP.y, sceneTargetP.z, true);
    cameraControlsO.setLookAt(0.7, 8, -4.65, sceneTargetO.x, sceneTargetO.y, sceneTargetO.z, true);
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
    renderer.setPixelRatio(pane.settings.pixelRatio);
    composer.setSize(width, height);
    composer.setPixelRatio(pane.settings.pixelRatio);
    cameraControlsP.fitToSphere(cameraBoundsP, true);
    cameraControlsO.fitToSphere(cameraBoundsO, true);
});

///// Render /////
function renderScene()
{
    pane.fps.begin();

    const delta = clock.getDelta();
    // Animation mixer
    if (mixer)
    {
        mixer.update(delta);
    };
    // Update loks positions before update cameraControls
    logic.updateLocksPosition(cameraP);
    // Update cameraControls
    cameraControlsP.update(delta);
    cameraControlsO.update(delta);
    // Toggle camera projection
    taaPassP.enabled = (logic.cameraProjection === 'persp');
    taaPassO.enabled = (logic.cameraProjection === 'ortho');

    pane.fps.end();

    requestAnimationFrame(renderScene);
    composer.render();
};