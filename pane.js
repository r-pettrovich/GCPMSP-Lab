import {Pane} from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

export let fps, pressCount = 0, paneDiv = document.getElementById('pane');

///// Settings variables /////
export let settings =
{
    pixelRatio: Math.min(window.devicePixelRatio, 3),
    taaLevel: 3,
    tonemapping: 4, // LinearToneMapping = 1 ReinhardToneMapping = 2 CineonToneMapping = 3 ACESFilmicToneMapping = 4
    exposure: 1.05,
    brightness: 0.00,
    contrast: 0.12,
    axisVisibility: false,
    sceneBBoxVisibility: false,
    frameBBoxVisibility: false
};
// Camera
export let cam = 
{
    FOV: 45,
    radiusP: 6.7,
    radiusO: 8,
};
// Materails
let mats = 
{
    plasterWhiteC: 0xd2d2cb,
    plasterWhiteR: 1,
    plasterBeigeC: 0xe2bf9a,
    plasterBeigeR: 1,
    linoleumC: 0x71796f,
    linoleumR: 1,
    plasticWhiteC: 0xe4e5e8,
    plasticWhiteR: 1,
    plasticBeigeC: 0xe8ebd7,
    plasticBeigeR: 1,
    plasticGrayC: 0x808a95,
    plasticGrayR: 1,
    ceramicC: 0xd2d0cd,
    ceramicR: 0.3,
    metalC: 0xb1b4b5,
    metalR: 0.45,
    aoIntensity: 0.7
};

///// Main function /////
export function initPane(renderer, composer, taaPassP, taaPassO, bcPass, scene, cameraBoundsP, cameraBoundsO, axisHelper, cameraP, cameraControlsP, cameraControlsO, sceneBBoxMesh, frameBBoxMesh, materialName, materialsList)
{
    const pane = new Pane({container: paneDiv});
    pane.registerPlugin(EssentialsPlugin);
    // FPS
    fps = pane.addBlade({view: 'fpsgraph', label: 'FPS', linecount: 2});
    pane.addBlade({view: 'separator'});
    // Folders
    const Settings = pane.addFolder({title: 'Settings', expanded: false});
    const Camera = pane.addFolder({title: 'Camera', expanded: false});
    const Materials = pane.addFolder({title: 'Materials', expanded: false});
    const PlasterWhite = Materials.addFolder({title: 'Plaster White', expanded: false});
    const PlasterBeige = Materials.addFolder({title: 'Plaster Beige', expanded: false});
    const Linoleum = Materials.addFolder({title: 'Linoleum', expanded: false});
    const PlasticWhite = Materials.addFolder({title: 'Plastic White', expanded: false});
    const PlasticBeige = Materials.addFolder({title: 'Plastic Beige', expanded: false});
    const PlasticGray = Materials.addFolder({title: 'Plastic Gray', expanded: false});
    const Ceramic = Materials.addFolder({title: 'Ceramic', expanded: false});
    const Metal = Materials.addFolder({title: 'Metal', expanded: false});

    ///// Settings /////
    // Pixel Ratio
    Settings.addBinding(settings, 'pixelRatio', {options: {'1x': 1, '2x': 2, 'Device PR': (Math.min(window.devicePixelRatio, 3))}, label: 'Pixel Ratio'})
    .on('change', (ev) =>
    {
        renderer.setPixelRatio(ev.value);
        composer.setPixelRatio(ev.value);
    });
    // TAA level
    Settings.addBinding(settings, 'taaLevel', {options: {'0 - (1 Sample)': 0, '1 - (2 Samples)': 1, '2 - (4 Samples)': 2, '3 - (8 Samples)': 3, '4 - (16 Samples)': 4, '5 - (32 Samples)': 5}, label: 'TAA Level'})
    .on('change', (ev) =>
    {
        taaPassP.sampleLevel = ev.value;
        taaPassO.sampleLevel = ev.value;
    });
    // Tonemapping
    Settings.addBinding(settings, 'tonemapping', {options: {'LinearToneMapping': 1, 'ReinhardToneMapping': 2, 'CineonToneMapping': 3, 'ACESFilmicToneMapping': 4}, label: 'ToneMapping'})
    .on('change', (ev) =>
    {
        renderer.toneMapping = ev.value;
    });
    // Exposure
    Settings.addBinding(settings, 'exposure', {min: 0, max: 2, label: 'Exposure'})
    .on('change', (ev) =>
    {
        renderer.toneMappingExposure = ev.value;
    });
    // Brightness
    Settings.addBinding(settings, 'brightness', {min: -1, max: 0, label: 'Brightness'})
    .on('change', (ev) =>
    {
        bcPass.uniforms["brightness"].value = ev.value;
    })
    // Contrast
    Settings.addBinding(settings, 'contrast', {min: 0, max: 1, label: 'Contrast'})
    .on('change', (ev) =>
    {
        bcPass.uniforms["contrast"].value = ev.value;
    })
    // Toggle axis helper visibility
    Settings.addBinding(settings, 'axisVisibility', {label: 'Axis Helper'})
    .on('change', (ev) =>
    {
        if(ev.value)
        {
            scene.add(axisHelper);
        } else
        {
            scene.remove(axisHelper);
        };
    });

    ///// Camera /////
    // FOV
    Camera.addBinding(cam, 'FOV', {min: 30, max: 80, label: 'FOV'})
    .on('change', (ev) =>
    {
        cameraP.fov = ev.value;
        cameraP.updateProjectionMatrix();
    });
    // Fit sphere radius perspective
    Camera.addBinding(cam, 'radiusP', {min: 1, max: 10, step: 0.1, label: 'Fit Sphere Radius P'})
    .on('change', (ev) =>
    {
        cameraBoundsP.radius = ev.value;
        cameraControlsP.fitToSphere(cameraBoundsP, false);
    });
    // Fit sphere radius orthographic
    Camera.addBinding(cam, 'radiusO', {min: 1, max: 10, step: 0.1, label: 'Fit Sphere Radius O'})
    .on('change', (ev) =>
    {
        cameraBoundsO.radius = ev.value;
        cameraControlsO.fitToSphere(cameraBoundsO, false);
    });
    // Toggle scene bounding box visibility
    Camera.addBinding(settings, 'sceneBBoxVisibility', {label: 'Scene Bounding Box'})
    .on('change', (ev) =>
    {
        if(ev.value)
        {
            sceneBBoxMesh.visible = true;
        } else
        {
            sceneBBoxMesh.visible = false;
        };
    });
    // Toggle frame bounding box visibility
    Camera.addBinding(settings, 'frameBBoxVisibility', {label: 'Frame Bounding Box'})
    .on('change', (ev) =>
    {
        if(ev.value)
        {
            frameBBoxMesh.visible = true;
        } else
        {
            frameBBoxMesh.visible = false;
        };
    });
    // Get camera position button
    Camera.addButton({title: 'Get Camera Position'})
    .on('click', () =>
    {
        console.log('Cam Persp:', cameraControlsP.getPosition());
        console.log('Cam Ortho:', cameraControlsO.getPosition());
    });

    ///// Materials /////
    // Plaster white color
    PlasterWhite.addBinding(mats, 'plasterWhiteC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_White.color.set(ev.value);
    });
    // Plaster white roughness
    PlasterWhite.addBinding(mats, 'plasterWhiteR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_White.roughness = ev.value;
    });
    // Plaster beige color
    PlasterBeige.addBinding(mats, 'plasterBeigeC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_Beige.color.set(ev.value);
    });
    // Plaster beige roughness
    PlasterBeige.addBinding(mats, 'plasterBeigeR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_Beige.roughness = ev.value;
    });
    // Linoleum color
    Linoleum.addBinding(mats, 'linoleumC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Linoleum.color.set(ev.value);
    });
    // Linoleum roughness
    Linoleum.addBinding(mats, 'linoleumR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Linoleum.roughness = ev.value;
    });
    // Plastic white color
    PlasticWhite.addBinding(mats, 'plasticWhiteC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_White.color.set(ev.value);
    });
    // Plastic white roughness
    PlasticWhite.addBinding(mats, 'plasticWhiteR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_White.roughness = ev.value;
    });
    // Plastic beige color
    PlasticBeige.addBinding(mats, 'plasticBeigeC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Beige.color.set(ev.value);
    });
    // Plastic beige roughness
    PlasticBeige.addBinding(mats, 'plasticBeigeR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Beige.roughness = ev.value;
    });
    // Plastic gray color
    PlasticGray.addBinding(mats, 'plasticGrayC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Gray.color.set(ev.value);
    });
    // Plastic gray roughness
    PlasticGray.addBinding(mats, 'plasticGrayR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Gray.roughness = ev.value;
    });
    // Ceramic color
    Ceramic.addBinding(mats, 'ceramicC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Ceramic.color.set(ev.value);
    });
    // Ceramic roughness
    Ceramic.addBinding(mats, 'ceramicR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Ceramic.roughness = ev.value;
    });
    // Metal color
    Metal.addBinding(mats, 'metalC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Metal.color.set(ev.value);
    });
    // Metal roughness
    Metal.addBinding(mats, 'metalR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Metal.roughness = ev.value;
    });
    // AO intensity
    Materials.addBinding(mats, 'aoIntensity', {min: 0, max: 2, label: 'AO Intensity'})
    .on('change', (ev) =>
    {
        for (materialName in materialsList)
        {
            if (materialsList[materialName].aoMap)
            {
                materialsList[materialName].aoMapIntensity = ev.value;
            }
        }
    });

    ///// Sync material parameters /////
    // AO intensity
    for (materialName in materialsList)
    {
        if (materialsList[materialName].aoMap)
        {
            materialsList[materialName].aoMapIntensity = mats.aoIntensity;
        }
    };
    // Colors
    materialsList.M_Plaster_White.color.set(mats.plasterWhiteC);
    materialsList.M_Plaster_Beige.color.set(mats.plasterBeigeC);
    materialsList.M_Linoleum.color.set(mats.linoleumC);
    materialsList.M_Plastic_White.color.set(mats.plasticWhiteC);
    materialsList.M_Plastic_Beige.color.set(mats.plasticBeigeC);
    materialsList.M_Plastic_Gray.color.set(mats.plasticGrayC);
    materialsList.M_Ceramic.color.set(mats.ceramicC);
    materialsList.M_Metal.color.set(mats.metalC);
    // Roughness
    materialsList.M_Plaster_White.roughness = mats.plasterWhiteR;
    materialsList.M_Plaster_Beige.roughness = mats.plasterBeigeR;
    materialsList.M_Linoleum.roughness = mats.linoleumR;
    materialsList.M_Plastic_White.roughness = mats.plasticWhiteR;
    materialsList.M_Plastic_Beige.roughness = mats.plasticBeigeR;
    materialsList.M_Plastic_Gray.roughness = mats.plasticGrayR;
    materialsList.M_Ceramic.roughness = mats.ceramicR;
    materialsList.M_Metal.roughness = mats.metalR;


    ///// Toggle tweakpane /////
    document.addEventListener('keydown', (event) =>
    {
        if (event.key === 'p' || event.key === 'P')
        {
            pressCount++;
            setTimeout (() => {pressCount = 0;}, 1000);
            if (pressCount === 3)
            {
                paneDiv.style.display = 'block';
            };
        } else
        {
            pressCount = 0;
        };
    });

    return pane;
};