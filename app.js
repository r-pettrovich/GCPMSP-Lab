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
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {TAARenderPass} from 'three/addons/postprocessing/TAARenderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {BrightnessContrastShader} from 'three/addons/shaders/BrightnessContrastShader.js';
import * as gui from './gui.js';
import * as logic from './logic.js';

let cameraBounds, sceneTarget, frameTarget, mixer, animationsList = {}, meshName, meshList = {}, materialName, materialsList = {}, cameraControls, axisHelper = new THREE.AxesHelper();
let maxAnisotropy, pmremGenerator;
let device, orientation, appIsLoaded = false, gpuTier, manager, startDelay = 750, scene, cameraP, clock, canvas, width, height, renderer, composer, renderPass, taaPass, outputPass, bcPass;

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
    width = window.innerWidth;
    height = window.innerHeight;
    canvas = document.getElementById('webgl');
    cameraP = new THREE.PerspectiveCamera(gui.cam.FOV, width / height, 1.35, 100);

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
    // Render pass
    // renderPass = new RenderPass(scene, camera);
    // TAA
    taaPass = new TAARenderPass(scene, cameraP);
    taaPass.sampleLevel = gui.settings.taaLevel;
    taaPass.unbiased = true; // false - for better performance
    // Output pass
    outputPass = new OutputPass();
    // BrightnessContrast
    bcPass = new ShaderPass(BrightnessContrastShader);
    bcPass.uniforms["brightness"].value = gui.settings.brightness;
    bcPass.uniforms["contrast"].value = gui.settings.contrast;
    // Adding passes
    // composer.addPass(renderPass);
    composer.addPass(taaPass);
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
        cameraControls.maxDistance = 45;
        cameraBounds.radius = 8.5;
        gui.cam.radius = 8.5;
        // Quality settings
        // taaPass.enabled = false;
        taaPass.sampleLevel = 0;
        gui.settings.taaLevel = 0;
        checkOrientation();
    } else
    {
        device = 'desktop'
        // Camera init settings
        cameraControls.maxDistance = 25;
        cameraBounds.radius = 6.7;
        gui.cam.radius = 6.7;
        // Quality settings
        if (gpuTier === 1)
        {
            // taaPass.enabled = false;
            taaPass.sampleLevel = 0;
            gui.settings.taaLevel = 0;
        } else if (gpuTier === 2)
        {
            if (window.devicePixelRatio === 1)
            {
                taaPass.sampleLevel = 2;
                gui.settings.taaLevel = 2;
            } else
            {
                taaPass.sampleLevel = 1;
                gui.settings.taaLevel = 1;
            }
            // renderPass.enabled = false;  // renderPass is redundant if taaPass is working
        } else if (gpuTier === 3)
        {
            if (window.devicePixelRatio === 1)
            {
                taaPass.sampleLevel = 3;
                gui.settings.taaLevel = 3;
            } else
            {
                taaPass.sampleLevel = 1;
                gui.settings.taaLevel = 1;
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
            cameraControls.fitToSphere(cameraBounds, true);
            gui.initGUI(renderer, composer, taaPass, bcPass, scene, cameraBounds, axisHelper, cameraP, cameraControls, materialName, materialsList);
            logic.updateActions(device, scene, cameraControls, cameraBounds, sceneTarget, frameTarget, materialsList, meshName, meshList, mixer, animationsList);
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
    cameraControls = new CameraControls(cameraP, canvas);
    sceneTarget = new THREE.Vector3(0.65, 0.8, -4.65);
    frameTarget = new THREE.Vector3(-0.025, 1, -3.5);
    // Settings
    cameraControls.mouseButtons.middle = CameraControls.ACTION.TRUCK;
    cameraControls.minDistance = 9.7;
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
    cameraBounds.radius = gui.cam.radius;
    cameraControls.setLookAt(-3.56, 12.7, 7.47, sceneTarget.x, sceneTarget.y, sceneTarget.z, true);
};

///// Window resized /////
window.addEventListener('resize', () =>
{
    checkOrientation();
    width = window.innerWidth;
    height = window.innerHeight;
    cameraP.aspect = width / height;
    cameraP.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(gui.settings.pixelRatio);
    composer.setSize(width, height);
    composer.setPixelRatio(gui.settings.pixelRatio);
    // cameraControls.fitToSphere(cameraBounds, true);
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
    if (cameraControls)
    {
        cameraControls.update(delta);
    };
    gui.fps.end();
    requestAnimationFrame(renderScene);
    composer.render();
};