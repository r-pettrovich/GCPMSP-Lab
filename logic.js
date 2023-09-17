import {gsap} from 'gsap';
import {Raycaster, Vector2} from 'three';

let intersects, raycaster = new Raycaster(), pointer = new Vector2();
let doorAClosed = true, doorBClosed = true, doorCClosed = true, doorDClosed = true, doorEClosed = true, WindowAClosed = true;
let buildingVisible = true, zonesVisible = false;
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
    }
};

///// Update actions /////
export function updateActions (device, scene, cameraControlsP, cameraControlsO, cameraBoundsP, cameraBoundsO, sceneTargetP, sceneTargetO, frameTargetP, frameTargetO, sceneBBox, frameBBox, materialsList, meshName, meshList, mixer, animationsList)
{
    // Hide objects
    for (meshName in meshList)
    {
        if (meshName.includes('Collision') || meshName.includes('Static_Floor_Frame') || meshName.includes('Zones'))
        {
            meshList[meshName].visible = false;
        }
    };
    //Prepare objects variables
    const building = scene.getObjectByName('Static_Building');
    const floorBuilding = scene.getObjectByName('Static_Floor_Building');
    const floorFrame = scene.getObjectByName('Static_Floor_Frame');
    const zonesBuilding = scene.getObjectByName('Zones_Building');
    const zonesFrame = scene.getObjectByName('Zones_Frame');
    // Prepare materials variables
    const keypadAMat = materialsList['M_KeyPad_a'];
    const keypadBMat = materialsList['M_KeyPad_b'];
    const keypadCMat = materialsList['M_KeyPad_c'];
    const keypadDMat = materialsList['M_KeyPad_d'];
    const keypadEMat = materialsList['M_KeyPad_e'];
    // Prepare animations variables
    const DoorAAction = mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_a_Action'));
    const DoorBAction = mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_b_Action'));
    const DoorCAction = mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_c_Action'));
    const DoorDAction = mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_d_Action'));
    const DoorEAction = mixer.clipAction(animationsList.find((anim) => anim.name === 'Door_e_Action'));
    const Window_a_Action = mixer.clipAction(animationsList.find((anim) => anim.name === 'Window_a_Action'));
    const Window_a_Handle_Action = mixer.clipAction(animationsList.find((anim) => anim.name === 'Window_a_Handle_Action'));
    const Fan_Action = mixer.clipAction(animationsList.find((anim) => anim.name === 'Fan_Action'));
    Fan_Action.play();

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
                    cameraBoundsO.radius = 5,5;
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
                cameraControlsO.setLookAt(0, 8, -4.65, sceneTargetO.x, sceneTargetO.y, sceneTargetO.z, true);
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
                    cameraBoundsO.radius = 5,5;
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
                cameraControlsO.setLookAt(0, 8, -4.65, sceneTargetO.x, sceneTargetO.y, sceneTargetO.z, true);
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


    ///// Cursor 'pointer' when howering over collisions /////
    document.addEventListener('mousemove', () =>
    {
        if (intersects.length > 0)
        {
            if (intersects[0].object.name.includes('Collision'))
            {
                document.body.style.cursor = 'pointer';
            }
            else
            {
                document.body.style.cursor = 'default';
            }
        };
    });

    ///// Handle interactive objects /////
    document.addEventListener('click', () =>
    {
        if (intersects.length > 0)
        {
            // Door_a
            if (intersects[0].object.name === 'KeyPad_a_Collision')
            {
                if (!DoorAAction.isRunning())
                {
                    if (doorAClosed === true)
                    {
                        DoorAAction.timeScale = 1;
                        DoorAAction.paused = false;
                        DoorAAction.play().setLoop(1, 0).clampWhenFinished = true;
                        keypadAMat.emissive.set(0x09ff00);
                        doorAClosed = false;
                    }
                    else
                    {
                        DoorAAction.timeScale = -1;
                        DoorAAction.paused = false;
                        setTimeout (() => {keypadAMat.emissive.set(0xFF0002)}, 1500);
                        doorAClosed = true;
                    }
                }
            };
            // Door_b
            if (intersects[0].object.name === 'KeyPad_b_Collision')
            {
                if (!DoorBAction.isRunning())
                {
                    if (doorBClosed === true)
                    {
                        DoorBAction.timeScale = 1;
                        DoorBAction.paused = false;
                        DoorBAction.play().setLoop(1, 0).clampWhenFinished = true;
                        keypadBMat.emissive.set(0x09ff00);
                        doorBClosed = false;
                    }
                    else
                    {
                        DoorBAction.timeScale = -1;
                        DoorBAction.paused = false;
                        setTimeout (() => {keypadBMat.emissive.set(0xFF0002)}, 1500);
                        doorBClosed = true;
                    }
                }
            };
            // Door_c
            if (intersects[0].object.name === 'KeyPad_c_Collision')
            {
                if (!DoorCAction.isRunning())
                {
                    if (doorCClosed === true)
                    {
                        DoorCAction.timeScale = 1;
                        DoorCAction.paused = false;
                        DoorCAction.play().setLoop(1, 0).clampWhenFinished = true;
                        keypadCMat.emissive.set(0x09ff00);
                        doorCClosed = false;
                    }
                    else
                    {
                        DoorCAction.timeScale = -1;
                        DoorCAction.paused = false;
                        setTimeout (() => {keypadCMat.emissive.set(0xFF0002)}, 1500);
                        doorCClosed = true;
                    }
                }
            };
            // Door_d
            if (intersects[0].object.name === 'KeyPad_d_Collision')
            {
                if (!DoorDAction.isRunning())
                {
                    if (doorDClosed === true)
                    {
                        DoorDAction.timeScale = 1;
                        DoorDAction.paused = false;
                        DoorDAction.play().setLoop(1, 0).clampWhenFinished = true;
                        keypadDMat.emissive.set(0x09ff00);
                        doorDClosed = false;
                    }
                    else
                    {
                        DoorDAction.timeScale = -1;
                        DoorDAction.paused = false;
                        setTimeout (() => {keypadDMat.emissive.set(0xFF0002)}, 1500);
                        doorDClosed = true;
                    }
                }
            };
            // Door_e
            if (intersects[0].object.name === 'KeyPad_e_Collision')
            {
                if (!DoorEAction.isRunning())
                {
                    if (doorEClosed === true)
                    {
                        DoorEAction.timeScale = 1;
                        DoorEAction.paused = false;
                        DoorEAction.play().setLoop(1, 0).clampWhenFinished = true;
                        keypadEMat.emissive.set(0x09ff00);
                        doorEClosed = false;
                    }
                    else
                    {
                        DoorEAction.timeScale = -1;
                        DoorEAction.paused = false;
                        setTimeout (() => {keypadEMat.emissive.set(0xFF0002)}, 1500);
                        doorEClosed = true;
                    }
                }
            };
            // Window_a
            if (intersects[0].object.name === 'Window_a_Collision')
            {
                if (!Window_a_Action.isRunning())
                {
                    if (WindowAClosed === true)
                    {
                        Window_a_Action.timeScale = 1;
                        Window_a_Action.paused = false;
                        Window_a_Handle_Action.timeScale = 1;
                        Window_a_Handle_Action.paused = false;
                        Window_a_Action.play().setLoop(1, 0).clampWhenFinished = true;
                        Window_a_Handle_Action.play().setLoop(1, 0).clampWhenFinished = true;
                        WindowAClosed = false;
                    }
                    else
                    {
                        Window_a_Action.timeScale = -1;
                        Window_a_Handle_Action.timeScale = -1;
                        Window_a_Action.paused = false;
                        setTimeout (() => {Window_a_Handle_Action.paused = false;}, 950);
                        WindowAClosed = true;
                    }
                }
            };
        };
    });
};

///// Raycaster /////
document.addEventListener('mousemove', (event) =>
{
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
});

export function raycast (scene, cameraP)
{
    raycaster.setFromCamera(pointer, cameraP);
    intersects = raycaster.intersectObjects(scene.children);
};