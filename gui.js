import {Pane} from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

export let fps;

// Settings variables
export let settings =
{
    pixelRatio: 2,
    taaActive: true,
    taaLevel: 2,
    tonemapping: 3, // LinearToneMapping = 1 ReinhardToneMapping = 2 CineonToneMapping = 3 ACESFilmicToneMapping = 4
    exposure: 0.9,
    brightness: -0.02,
    contrast: 0.02,
    axisVisibility: false
};
// Camera
export let cam = 
{
    FOV: 45,
    rotateY: -20,
    rotateX: 43,
    fitSphere: false,
    fitSphereRadius: 6.5
};
// Materails
export let mat = 
{
    aoIntensity: 0.8,
}

// Main function
export function initGUI(renderer, composer, taaPass, bcPass, scene, cameraBounds, axisHelper, camera, cameraControls, materialName, materialList)
{
    const pane = new Pane({container: document.getElementById('gui')});
    pane.registerPlugin(EssentialsPlugin);
    // FPS
    fps = pane.addBlade({view: 'fpsgraph', label: 'FPS', linecount: 2});
    pane.addSeparator();
    // Folders
    const Settings = pane.addFolder({title: 'Settings', expanded: false});
    const Camera = pane.addFolder({title: 'Camera', expanded: false});
    const Materials = pane.addFolder({title: 'Materials', expanded: false});

    // Settings
    // Pixel Ratio
    Settings.addInput(settings, 'pixelRatio',
    {options: {'1x': 1, '2x': 2, 'Device PR': (Math.min(window.devicePixelRatio, 3))}, label: 'Pixel Ratio'})
    .on('change', (ev) =>
    {
        renderer.setPixelRatio(ev.value);
        composer.setPixelRatio(ev.value);
    });
    // TAA toggle
    Settings.addInput(settings, 'taaActive',
    {label: 'TAA'})
    .on('change', (ev) =>
    {
        taaPass.enabled = ev.value;
    });
    // TAA level
    Settings.addInput(settings, 'taaLevel',
    {options: {'0 - (1 Sample)': 0, '1 - (2 Samples)': 1, '2 - (4 Samples)': 2, '3 - (8 Samples)': 3, '4 - (16 Samples)': 4, '5 - (32 Samples)': 5}, label: 'TAA Level'})
    .on('change', (ev) =>
    {
        taaPass.sampleLevel = ev.value;
    });
    // Tonemapping
    Settings.addInput(settings, 'tonemapping',
    {options: {'LinearToneMapping': 1, 'ReinhardToneMapping': 2, 'CineonToneMapping': 3, 'ACESFilmicToneMapping': 4}, label: 'ToneMapping'})
    .on('change', (ev) =>
    {
        renderer.toneMapping = ev.value;
    });
    // Exposure
    Settings.addInput(settings, 'exposure',
    {min: 0, max: 2, label: 'Exposure'})
    .on('change', (ev) =>
    {
        renderer.toneMappingExposure = Math.pow (ev.value, 4.0);
    });
    // Brightness
    Settings.addInput(settings, 'brightness',
    {min: -1, max: 0, label: 'Brightness'})
    .on('change', (ev) =>
    {
        bcPass.uniforms["brightness"].value = ev.value;
    })
    // Contrast
    Settings.addInput(settings, 'contrast',
    {min: 0, max: 1, label: 'Contrast'})
    .on('change', (ev) =>
    {
        bcPass.uniforms["contrast"].value = ev.value;
    })
    // Axis toggle
    Settings.addInput(settings, 'axisVisibility',
    {label: 'Axis Helper'})
    .on('change', (ev) =>
    {
        if(ev.value)
        {
            scene.add(axisHelper);
        } else
        {
            scene.remove(axisHelper);
        }
    });

    // Camera
    // FOV
    Camera.addInput(cam, 'FOV',
    {min: 30, max: 80, label: 'FOV'})
    .on('change', (ev) =>
    {
        camera.fov = ev.value;
        camera.updateProjectionMatrix();
    });
    // Rotate Y
    Camera.addInput(cam, 'rotateY',
    {min: -360, max: 0, label: 'Rotate Y'})
    .on('change', (ev) =>
    {
        cameraControls.rotateAzimuthTo((ev.value * (Math.PI / 180)), 0, true);
    });
    // Rotate X
    Camera.addInput(cam, 'rotateX',
    {min: 0, max: 90, label: 'Rotate X'})
    .on('change', (ev) =>
    {
        cameraControls.rotatePolarTo((ev.value * (Math.PI / 180)), 0, true);
    });
    // Fit sphere radius
    Camera.addInput(cam, 'fitSphereRadius',
    {min: 1, max: 10, step: 0.1, label: 'Fit Sphere Radius'})
    .on('change', (ev) =>
    {
        cameraBounds.radius = ev.value;
        cameraControls.fitToSphere(cameraBounds, false);
    })

    // Materials
    // AO intensity
    Materials.addInput(mat, 'aoIntensity',
    {min: 0, max: 2, label: 'AO Intensity'})
    .on('change', (ao) =>
    {
        for (materialName in materialList)
        {
            if (materialList[materialName].aoMap)
            {
                materialList[materialName].aoMapIntensity = ao.value;
            }
        }
    })

    // Init material parameters
    for (materialName in materialList)
    {
        if (materialList[materialName].aoMap)
        {
            materialList[materialName].aoMapIntensity = mat.aoIntensity;
        }
    }


    return pane;
};