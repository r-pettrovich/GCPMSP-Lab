import {gsap} from 'gsap';
import {Raycaster, Vector2} from 'three';
import {settings, cam} from './gui';

let intersects, raycaster = new Raycaster(), pointer = new Vector2();
let doorAClosed = true, doorBClosed = true, doorCClosed = true, doorDClosed = true, doorEClosed = true, WindowAClosed = true;
let buildingVisible = true, zonesVisible = false;
let buttonBuilding = document.getElementById('button-building'), buttonZones = document.getElementById('button-zones');

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
export function updateActions (device, scene, cameraControls, cameraBounds, sceneTarget, frameTarget, materialsList, meshName, meshList, mixer, animationsList)
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
        if(buildingVisible === true)
        {
            gsap.to('#button-building', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            buttonBuilding.classList.add('button-building-pressed');
            floorFrame.visible = true;
            building.visible = false;
            building.traverse((object) =>
            {
                object.layers.set(1);
            });
            if(zonesVisible === true)
            {
                zonesBuilding.visible = false;
            };
            buildingVisible = false;
            // Camera
            if (device === 'mobile')
            {
                cameraControls.maxDistance = 20;
                cameraBounds.radius = 4;
            } else
            {
                cameraControls.maxDistance = 15;
                cameraBounds.radius = 3.5;
            }
            cameraControls.minDistance = 6;
            cameraBounds.center.copy(frameTarget);
            cameraControls.setLookAt(6.5, 4.66, 0.62, frameTarget.x, frameTarget.y, frameTarget.z, true);
            cameraControls.fitToSphere(cameraBounds, true);
        } else
        {
            gsap.to('#button-building', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            buttonBuilding.classList.remove('button-building-pressed');
            building.traverse((object) =>
            {
                object.layers.set(0);
            });
            setTimeout(() =>
            {
                floorFrame.visible = false;
                building.visible = true;
                if(zonesVisible === true)
                {
                    zonesBuilding.visible = true;
                };
                buildingVisible = true;
            }, 250);
            // Camera
            if (device === 'mobile')
            {
                cameraControls.maxDistance = 45;
                cameraBounds.radius = 8.5;
            } else
            {
                cameraControls.maxDistance = 25;
                cameraBounds.radius = 6.7;
            }
            cameraControls.minDistance = cam.minDist;
            cameraBounds.center.copy(sceneTarget);
            cameraControls.setLookAt(-3.56, 12.7, 7.47, sceneTarget.x, sceneTarget.y, sceneTarget.z, true);
            cameraControls.fitToSphere(cameraBounds, true);
        }
    });
    // Toggle zones visibility
    buttonZones.addEventListener('click', () =>
    {
        if(zonesVisible === false)
        {
            gsap.to('#button-zones', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            gsap.to('#zones', {yPercent: 100, opacity: 1, duration: 0.4, ease: 'power2.out'});
            buttonZones.classList.add('button-zones-pressed');
            if(buildingVisible === true)
            {
                zonesBuilding.visible = true;
                zonesFrame.visible = true;
            } else
            {
                zonesFrame.visible = true;
            }
            zonesVisible = true;
        } else
        {
            gsap.to('#button-zones', {scale: 0.93, duration: 0.08, repeat: 1, yoyo: true, ease: "power1.out"});
            gsap.to('#zones', {yPercent: -100, opacity: 0, duration: 0.4, ease: 'power2.in'});
            buttonZones.classList.remove('button-zones-pressed');
            zonesBuilding.visible = false;
            zonesFrame.visible = false;
            zonesVisible = false;
        }
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
    })

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

export function raycast (scene, camera)
{
    raycaster.setFromCamera(pointer, camera);
    intersects = raycaster.intersectObjects(scene.children);
};