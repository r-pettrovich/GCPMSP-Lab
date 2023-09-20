import {gsap} from 'gsap';

let actions = [], locators = [], locks = [], locatorsCoordinates = [], locatorsProjections = [], keypadMaterials = [];
let doorAClosed = true, doorBClosed = true, doorCClosed = true, doorDClosed = true, doorEClosed = true, WindowAClosed = true, buildingVisible = true, zonesVisible = false;
let buttonBuilding = document.getElementById('button-building'), buttonZones = document.getElementById('button-zones'), buttonCamera = document.getElementById('button-camera');
export let cameraProjection = 'persp';

///// Toggle device block /////
export function toggleDeviceBlock (device, orientation)
{
    if (device === 'desktop')
    {
        gsap.set('#device-block', {display: 'none'});
    } else if (orientation === 'portrait')
    {
        gsap.set('#device-block', {display: 'none'});
    } else if (orientation === 'landscape')
    {
        gsap.set('#device-block', {display: 'block'});
    }
};

///// Update loading bar /////
export function updateLoadingBar (progress, startDelay)
{
    gsap.to('#preloader-bar', {width: `${progress * 100}%`, ease: 'power1.out'});
    if (progress === 1)
    {
        gsap.to('#preloader', {autoAlpha: 0, duration: 0.75, delay: startDelay / 1000,
        onComplete: () =>
        {
            gsap.set('#preloader', {display: 'none'})
        }});
        // Toggle UI
        gsap.set('#top', {display: 'flex'});
        gsap.set('#menu', {display: 'flex'});
        gsap.set('#zones', {display: 'flex'});
        gsap.set('.lock', {display: 'block'});
    }
};

///// Update actions /////
export function updateActions (device, scene, cameraControlsP, cameraControlsO, cameraBoundsP, cameraBoundsO, sceneTargetP, sceneTargetO, frameTargetP, frameTargetO, sceneBBox, frameBBox, materialsList, meshName, meshList, mixer, animationsList)
{
    // Hide objects
    for (meshName in meshList)
    {
        if (meshName.includes('Static_Floor_Frame') || meshName.includes('Zones'))
        {
            meshList[meshName].visible = false;
        }
    };
    // Prepare objects variables
    const building = scene.getObjectByName('Static_Building');
    const floorFrame = scene.getObjectByName('Static_Floor_Frame');
    const zonesBuilding = scene.getObjectByName('Zones_Building');
    const zonesFrame = scene.getObjectByName('Zones_Frame');
    // Prepare locators variables
    locators = [
        scene.getObjectByName('Locator_Lock_a'),
        scene.getObjectByName('Locator_Lock_b'),
        scene.getObjectByName('Locator_Lock_c'),
        scene.getObjectByName('Locator_Lock_d'),
        scene.getObjectByName('Locator_Lock_e'),
        scene.getObjectByName('Locator_Lock_f')
    ];
    locks = [
        document.getElementById('lock-a'),
        document.getElementById('lock-b'),
        document.getElementById('lock-c'),
        document.getElementById('lock-d'),
        document.getElementById('lock-e'),
        document.getElementById('lock-f')
    ];
    // Prepare materials variables
    keypadMaterials = [
        materialsList['M_KeyPad_a'],
        materialsList['M_KeyPad_b'],
        materialsList['M_KeyPad_c'],
        materialsList['M_KeyPad_d'],
        materialsList['M_KeyPad_e']
    ];
    // Prepare animations variables
    actions = [
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_a_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_b_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_c_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_d_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_e_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Window_a_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Window_a_Handle_Action')),
        mixer.clipAction(animationsList.find((anim) => anim.name === 'Fan_Action'))
    ]
    // Play fan animation
    actions[7].play();

    ///// UI buttons actions /////
    // Toggle building visibility
    buttonBuilding.addEventListener('click', () =>
    {
        if (buildingVisible === true)
        {
            gsap.to('#button-building', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            buttonBuilding.classList.add('button-building-pressed');
            buttonBuilding.title = "Показать здание";
            floorFrame.visible = true;
            building.visible = false;
            zonesBuilding.visible = false;
            building.traverse((object) =>
            {
                object.layers.set(1);
            });
            buildingVisible = false;
            // Camera behavior
            if (cameraProjection === 'persp')
            {
                if (device === 'mobile')
                {
                    cameraBoundsP.radius = 4;
                    cameraControlsP.minDistance = 8;
                    cameraControlsP.maxDistance = 28;
                } else
                {
                    cameraBoundsP.radius = 3.5;
                    cameraControlsP.minDistance = 6;
                    cameraControlsP.maxDistance = 15;
                }
                cameraControlsP.setBoundary(frameBBox);
                cameraBoundsP.center.copy(frameTargetP);
                cameraControlsP.setLookAt(6.5, 2.5, 0.62, frameTargetP.x, frameTargetP.y, frameTargetP.z, true);
                cameraControlsP.fitToSphere(cameraBoundsP, true);
                gsap.set('.lock', {display: 'block'});
            } else if (cameraProjection === 'ortho')
            {
                if (device === 'mobile')
                {
                    cameraBoundsO.radius = 4;
                    cameraControlsO.minZoom = 40;
                    cameraControlsO.maxZoom = 160;
                } else
                {
                    cameraBoundsO.radius = 3;
                    cameraControlsO.minZoom = 80;
                    cameraControlsO.maxZoom = 320;
                }
                cameraControlsO.setBoundary(frameBBox);
                cameraBoundsO.center.copy(frameTargetO);
                cameraControlsO.setLookAt(-0.025, 8, -3.5, frameTargetO.x, frameTargetO.y, frameTargetO.z, true);
                cameraControlsO.rotateAzimuthTo(-90 * (Math.PI / 180), false);
                cameraControlsO.fitToSphere(cameraBoundsO, true);
            };
        } else
        {
            gsap.to('#button-building', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            buttonBuilding.classList.remove('button-building-pressed');
            buttonBuilding.title = "Скрыть здание";
            building.traverse((object) =>
            {
                object.layers.set(0);
            });
            setTimeout(() =>
            {
                floorFrame.visible = false;
                building.visible = true;
                if (zonesVisible === true)
                {
                    zonesBuilding.visible = true;
                };
                buildingVisible = true;
            }, 250);
            // Camera behavior
            if (cameraProjection === 'persp')
            {
                if (device === 'mobile')
                {
                    cameraBoundsP.radius = 8.5;
                    cameraControlsP.minDistance = 12;
                    cameraControlsP.maxDistance = 50;
                } else
                {
                    cameraBoundsP.radius = 6.7;
                    cameraControlsP.minDistance = 9.7;
                    cameraControlsP.maxDistance = 25;
                }
                cameraControlsP.setBoundary(sceneBBox);
                cameraBoundsP.center.copy(sceneTargetP);
                cameraControlsP.setLookAt(-3.56, 9, 7.47, sceneTargetP.x, sceneTargetP.y, sceneTargetP.z, true);
                cameraControlsP.fitToSphere(cameraBoundsP, true);
            } else if (cameraProjection === 'ortho')
            {
                if (device === 'mobile')
                {
                    cameraBoundsO.radius = 5.3;
                    cameraControlsO.minZoom = 30;
                    cameraControlsO.maxZoom = 120;
                } else
                {
                    cameraBoundsO.radius = 8;
                    cameraControlsO.minZoom = 35;
                    cameraControlsO.maxZoom = 180;
                }
                cameraControlsO.setBoundary(sceneBBox);
                cameraBoundsO.center.copy(sceneTargetO);
                cameraControlsO.setLookAt(0.7, 8, -4.65, sceneTargetO.x, sceneTargetO.y, sceneTargetO.z, true);
                cameraControlsO.rotateAzimuthTo(-90 * (Math.PI / 180), false);
                cameraControlsO.fitToSphere(cameraBoundsO, true);
            };
        };
    });
    // Toggle zones visibility
    buttonZones.addEventListener('click', () =>
    {
        if (zonesVisible === false)
        {
            gsap.to('#button-zones', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            gsap.to('#zones', {yPercent: 100, opacity: 1, duration: 0.5, ease: 'power2.out'});
            buttonZones.classList.add('button-zones-pressed');
            buttonZones.title = "Скрыть зоны";
            if (buildingVisible === true)
            {
                zonesBuilding.visible = true;
                zonesFrame.visible = true;
            } else
            {
                zonesFrame.visible = true;
            };
            zonesVisible = true;
        } else
        {
            gsap.to('#button-zones', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            gsap.to('#zones', {yPercent: -100, opacity: 0, duration: 0.5, ease: 'power2.in'});
            buttonZones.classList.remove('button-zones-pressed');
            buttonZones.title = "Показать зоны";
            zonesBuilding.visible = false;
            zonesFrame.visible = false;
            zonesVisible = false;
        };
    });
    // Toggle camera projection
    buttonCamera.addEventListener('click', () =>
    {
        if (cameraProjection === 'persp')
        {
            gsap.to('#button-camera', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            gsap.set('.lock', {display: 'none'});
            buttonCamera.classList.add('button-camera-pressed');
            buttonCamera.title = "Перспективная проекция";
            cameraProjection = 'ortho';
            // Camera behavior
            if (buildingVisible === true)
            {
                if (device === 'mobile')
                {
                    cameraBoundsO.radius = 5.3;
                    cameraControlsO.minZoom = 30;
                    cameraControlsO.maxZoom = 120;
                } else
                {
                    cameraBoundsO.radius = 8;
                    cameraControlsO.minZoom = 35;
                    cameraControlsO.maxZoom = 180;
                };
                cameraControlsO.setBoundary(sceneBBox);
                cameraBoundsO.center.copy(sceneTargetO);
                cameraControlsO.setLookAt(0.7, 8, -4.65, sceneTargetO.x, sceneTargetO.y, sceneTargetO.z, true);
                cameraControlsO.rotateAzimuthTo(-90 * (Math.PI / 180), false);
                cameraControlsO.fitToSphere(cameraBoundsO, true);
            } else
            {
                if (device === 'mobile')
                {
                    cameraBoundsO.radius = 4;
                    cameraControlsO.minZoom = 40;
                    cameraControlsO.maxZoom = 160;
                } else
                {
                    cameraBoundsO.radius = 3;
                    cameraControlsO.minZoom = 80;
                    cameraControlsO.maxZoom = 320;
                };
                cameraControlsO.setBoundary(frameBBox);
                cameraBoundsO.center.copy(frameTargetO);
                cameraControlsO.setLookAt(-0.025, 8, -3.5, frameTargetO.x, frameTargetO.y, frameTargetO.z, true);
                cameraControlsO.rotateAzimuthTo(-90 * (Math.PI / 180), false);
                cameraControlsO.fitToSphere(cameraBoundsO, true);
            };
        } else
        {
            gsap.to('#button-camera', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            gsap.set('.lock', {display: 'block'});
            buttonCamera.classList.remove('button-camera-pressed');
            buttonCamera.title = "Ортографическая проекция";
            cameraProjection = 'persp';
            // Camera behavior
            if (buildingVisible === true)
            {
                if (device === 'mobile')
                {
                    cameraBoundsP.radius = 8.5;
                    cameraControlsP.minDistance = 12;
                    cameraControlsP.maxDistance = 50;
                } else
                {
                    cameraBoundsP.radius = 6.7;
                    cameraControlsP.minDistance = 9.7;
                    cameraControlsP.maxDistance = 25;
                };
                cameraControlsP.setBoundary(sceneBBox);
                cameraBoundsP.center.copy(sceneTargetP);
                cameraControlsP.setLookAt(-3.56, 9, 7.47, sceneTargetP.x, sceneTargetP.y, sceneTargetP.z, true);
                cameraControlsP.fitToSphere(cameraBoundsP, true);
            } else
            {
                if (device === 'mobile')
                {
                    cameraBoundsP.radius = 4;
                    cameraControlsP.minDistance = 8;
                    cameraControlsP.maxDistance = 28;
                } else
                {
                    cameraBoundsP.radius = 3.5;
                    cameraControlsP.minDistance = 6;
                    cameraControlsP.maxDistance = 15;
                }
                cameraControlsP.setBoundary(frameBBox);
                cameraBoundsP.center.copy(frameTargetP);
                cameraControlsP.setLookAt(6.5, 2.5, 0.62, frameTargetP.x, frameTargetP.y, frameTargetP.z, true);
                cameraControlsP.fitToSphere(cameraBoundsP, true);
            };
        };
    });

    ///// Handle interactive objects /////
    // Door_a
    locks[0].addEventListener ('click', () =>
    {
        if (!actions[0].isRunning())
        {
            if (doorAClosed === true)
            {
                gsap.to(locks[0], {rotationY: 180, duration: 0.3, ease: "power1.out",});
                setTimeout (() => {locks[0].classList.add('lock-pressed')}, 150);
                actions[0].timeScale = 1;
                actions[0].paused = false;
                actions[0].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[0].emissive.set(0x09ff00);
                doorAClosed = false;
            } else
            {
                gsap.to(locks[0], {rotationY: 0, duration: 0.3, ease: "power1.out"});
                setTimeout (() => {locks[0].classList.remove('lock-pressed')}, 150);
                actions[0].timeScale = -1;
                actions[0].paused = false;
                setTimeout (() => {keypadMaterials[0].emissive.set(0xFF0002)}, 1500);
                doorAClosed = true;
            };
        };
    });
    // Door_b
    locks[1].addEventListener ('click', () =>
    {
        if (!actions[1].isRunning())
        {
            if (doorBClosed === true)
            {
                gsap.to(locks[1], {rotationY: 180, duration: 0.3, ease: "power1.out",});
                setTimeout (() => {locks[1].classList.add('lock-pressed')}, 150);
                actions[1].timeScale = 1;
                actions[1].paused = false;
                actions[1].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[1].emissive.set(0x09ff00);
                doorBClosed = false;
            } else
            {
                gsap.to(locks[1], {rotationY: 0, duration: 0.3, ease: "power1.out"});
                setTimeout (() => {locks[1].classList.remove('lock-pressed')}, 150);
                actions[1].timeScale = -1;
                actions[1].paused = false;
                setTimeout (() => {keypadMaterials[1].emissive.set(0xFF0002)}, 1500);
                doorBClosed = true;
            };
        };
    });
};

///// Update loks positions /////
export function updateLocksPosition(cameraP)
{
    for (let i = 0; i < locators.length; i++)
    {
        locatorsCoordinates[i] = locators[i].position.clone();
        locatorsCoordinates[i].project(cameraP);
        locatorsProjections[i] = {};
        locatorsProjections[i].x = (locatorsCoordinates[i].x + 1) * window.innerWidth / 2;
        locatorsProjections[i].y = (-locatorsCoordinates[i].y + 1) * window.innerHeight / 2;
        gsap.set(locks[i], {x: locatorsProjections[i].x, y: locatorsProjections[i].y});
    };
};

///// Raycaster /////
/* export function raycast(scene, cameraP)
{
    raycaster.setFromCamera(pointer, cameraP);
    intersects = raycaster.intersectObjects(scene.children);
}; */