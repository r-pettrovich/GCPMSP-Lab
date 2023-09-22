import {gsap} from 'gsap';

let actions = [], keypadMaterials = [], locators = [], locatorsCoordinates = [], locatorsProjections = [], lockContainers = [], locks = [];
let buildingVisible = true, zonesVisible = false, doorAClosed = true, doorBClosed = true, doorCClosed = true, doorDClosed = true, doorEClosed = true, WindowAClosed = true;
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
    };
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
        };
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
    lockContainers = [
        document.getElementById('lock-a-container'),
        document.getElementById('lock-b-container'),
        document.getElementById('lock-c-container'),
        document.getElementById('lock-d-container'),
        document.getElementById('lock-e-container'),
        document.getElementById('lock-f-container')
    ]
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
            buildingVisible = false;
            // Camera behavior
            if (cameraProjection === 'persp')
            {
                if (device === 'mobile')
                {
                    cameraBoundsP.radius = 4;
                    cameraControlsP.minDistance = 8;
                    cameraControlsP.maxDistance = 20;
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
            setTimeout(() =>
            {
                floorFrame.visible = false;
                building.visible = true;
                if (zonesVisible === true)
                {
                    zonesBuilding.visible = true;
                };
                buildingVisible = true;
            }, 200);
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
                    cameraControlsP.maxDistance = 20;
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
                gsap.to(locks[0], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[0].classList.add('lock-pressed')
                    gsap.to(locks[0], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[0].timeScale = 1;
                actions[0].paused = false;
                actions[0].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[0].emissive.set(0x09ff00);
                doorAClosed = false;
            } else
            {
                gsap.to(locks[0], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[0].classList.remove('lock-pressed')
                    gsap.to(locks[0], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
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
                gsap.to(locks[1], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[1].classList.add('lock-pressed')
                    gsap.to(locks[1], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[1].timeScale = 1;
                actions[1].paused = false;
                actions[1].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[1].emissive.set(0x09ff00);
                doorBClosed = false;
            } else
            {
                gsap.to(locks[1], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[1].classList.remove('lock-pressed')
                    gsap.to(locks[1], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[1].timeScale = -1;
                actions[1].paused = false;
                setTimeout (() => {keypadMaterials[1].emissive.set(0xFF0002)}, 1500);
                doorBClosed = true;
            };
        };
    });
    // Door_c
    locks[2].addEventListener ('click', () =>
    {
        if (!actions[2].isRunning())
        {
            if (doorCClosed === true)
            {
                gsap.to(locks[2], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[2].classList.add('lock-pressed')
                    gsap.to(locks[2], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[2].timeScale = 1;
                actions[2].paused = false;
                actions[2].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[2].emissive.set(0x09ff00);
                doorCClosed = false;
            } else
            {
                gsap.to(locks[2], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[2].classList.remove('lock-pressed')
                    gsap.to(locks[2], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[2].timeScale = -1;
                actions[2].paused = false;
                setTimeout (() => {keypadMaterials[2].emissive.set(0xFF0002)}, 1500);
                doorCClosed = true;
            };
        };
    });
    // Door_d
    locks[3].addEventListener ('click', () =>
    {
        if (!actions[3].isRunning())
        {
            if (doorDClosed === true)
            {
                gsap.to(locks[3], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[3].classList.add('lock-pressed')
                    gsap.to(locks[3], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[3].timeScale = 1;
                actions[3].paused = false;
                actions[3].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[3].emissive.set(0x09ff00);
                doorDClosed = false;
            } else
            {
                gsap.to(locks[3], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[3].classList.remove('lock-pressed')
                    gsap.to(locks[3], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[3].timeScale = -1;
                actions[3].paused = false;
                setTimeout (() => {keypadMaterials[3].emissive.set(0xFF0002)}, 1500);
                doorDClosed = true;
            };
        };
    });
    // Door_e
    locks[4].addEventListener ('click', () =>
    {
        if (!actions[4].isRunning())
        {
            if (doorEClosed === true)
            {
                gsap.to(locks[4], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[4].classList.add('lock-pressed')
                    gsap.to(locks[4], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[4].timeScale = 1;
                actions[4].paused = false;
                actions[4].play().setLoop(1, 0).clampWhenFinished = true;
                keypadMaterials[4].emissive.set(0x09ff00);
                doorEClosed = false;
            } else
            {
                gsap.to(locks[4], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[4].classList.remove('lock-pressed')
                    gsap.to(locks[4], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[4].timeScale = -1;
                actions[4].paused = false;
                setTimeout (() => {keypadMaterials[4].emissive.set(0xFF0002)}, 1500);
                doorEClosed = true;
            };
        };
    });
    // Window_a
    locks[5].addEventListener ('click', () =>
    {
        if (!actions[5].isRunning())
        {
            if (WindowAClosed === true)
            {
                gsap.to(locks[5], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[5].classList.add('lock-pressed')
                    gsap.to(locks[5], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[5].timeScale = 1;
                actions[6].timeScale = 1;
                actions[5].paused = false;
                actions[6].paused = false;
                actions[5].play().setLoop(1, 0).clampWhenFinished = true;
                actions[6].play().setLoop(1, 0).clampWhenFinished = true;
                WindowAClosed = false;
            } else
            {
                gsap.to(locks[5], {rotationY: 90, duration: 0.15, ease: "power1.in",
                onComplete: () =>
                {
                    locks[5].classList.remove('lock-pressed')
                    gsap.to(locks[5], {rotationY: 0, duration: 0.15, ease: "power1.out"});
                }
                });
                actions[5].timeScale = -1;
                actions[6].timeScale = -1;
                actions[5].paused = false;
                setTimeout (() => {actions[6].paused = false}, 950);
                WindowAClosed = true;
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
        gsap.set(lockContainers[i], {x: locatorsProjections[i].x, y: locatorsProjections[i].y});
    };
    // Toggle locks visibility
    if (cameraProjection === 'persp' && buildingVisible === false)
    {
        gsap.set('.lock-container', {display: 'block'});
    } else
    {
        gsap.set('.lock-container', {display: 'none'});
    };
};