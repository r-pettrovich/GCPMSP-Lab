import {Pane} from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

export let fps;

///// Settings variables /////
export let settings =
{
    pixelRatio: Math.min(window.devicePixelRatio, 3),
    taaLevel: 2,
    tonemapping: 3, // LinearToneMapping = 1 ReinhardToneMapping = 2 CineonToneMapping = 3 ACESFilmicToneMapping = 4
    exposure: 0.95,
    brightness: -0.05,
    contrast: 0.2,
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
let mats = 
{
    plasterWhiteC: 0xCFD4E0,
    plasterWhiteR: 1,
    plasterBeigeC: 0xd8b493,
    plasterBeigeR: 1,
    linoleumC: 0x7D815E,
    linoleumR: 1,
    plasticWhiteC: 0xe5ebeb,
    plasticWhiteR: 1,
    plasticBeigeC: 0xe9efd8,
    plasticBeigeR: 1,
    plasticGrayC: 0x737F8A,
    plasticGrayR: 1,
    ceramicC: 0xF9F6EB,
    ceramicR: 0.45,
    metalC: 0xAAB1B7,
    metalR: 0.5,
    aoIntensity: 0.65,
}

///// Main function /////
export function initGUI(renderer, composer, taaPass, bcPass, scene, cameraBounds, axisHelper, camera, cameraControls, materialName, materialsList)
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
    Settings.addInput(settings, 'pixelRatio', {options: {'1x': 1, '2x': 2, 'Device PR': (Math.min(window.devicePixelRatio, 3))}, label: 'Pixel Ratio'})
    .on('change', (ev) =>
    {
        renderer.setPixelRatio(ev.value);
        composer.setPixelRatio(ev.value);
    });
    // TAA level
    Settings.addInput(settings, 'taaLevel', {options: {'0 - (1 Sample)': 0, '1 - (2 Samples)': 1, '2 - (4 Samples)': 2, '3 - (8 Samples)': 3, '4 - (16 Samples)': 4, '5 - (32 Samples)': 5}, label: 'TAA Level'})
    .on('change', (ev) =>
    {
        taaPass.sampleLevel = ev.value;
    });
    // Tonemapping
    Settings.addInput(settings, 'tonemapping', {options: {'LinearToneMapping': 1, 'ReinhardToneMapping': 2, 'CineonToneMapping': 3, 'ACESFilmicToneMapping': 4}, label: 'ToneMapping'})
    .on('change', (ev) =>
    {
        renderer.toneMapping = ev.value;
    });
    // Exposure
    Settings.addInput(settings, 'exposure', {min: 0, max: 2, label: 'Exposure'})
    .on('change', (ev) =>
    {
        renderer.toneMappingExposure = Math.pow (ev.value, 4.0);
    });
    // Brightness
    Settings.addInput(settings, 'brightness', {min: -1, max: 0, label: 'Brightness'})
    .on('change', (ev) =>
    {
        bcPass.uniforms["brightness"].value = ev.value;
    })
    // Contrast
    Settings.addInput(settings, 'contrast', {min: 0, max: 1, label: 'Contrast'})
    .on('change', (ev) =>
    {
        bcPass.uniforms["contrast"].value = ev.value;
    })
    // Axis toggle
    Settings.addInput(settings, 'axisVisibility', {label: 'Axis Helper'})
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

    ///// Camera /////
    // FOV
    Camera.addInput(cam, 'FOV', {min: 30, max: 80, label: 'FOV'})
    .on('change', (ev) =>
    {
        camera.fov = ev.value;
        camera.updateProjectionMatrix();
    });
    // Rotate Y
    Camera.addInput(cam, 'rotateY', {min: -360, max: 0, label: 'Rotate Y'})
    .on('change', (ev) =>
    {
        cameraControls.rotateAzimuthTo((ev.value * (Math.PI / 180)), 0, true);
    });
    // Rotate X
    Camera.addInput(cam, 'rotateX', {min: 0, max: 90, label: 'Rotate X'})
    .on('change', (ev) =>
    {
        cameraControls.rotatePolarTo((ev.value * (Math.PI / 180)), 0, true);
    });
    // Fit sphere radius
    Camera.addInput(cam, 'fitSphereRadius', {min: 1, max: 10, step: 0.1, label: 'Fit Sphere Radius'})
    .on('change', (ev) =>
    {
        cameraBounds.radius = ev.value;
        cameraControls.fitToSphere(cameraBounds, false);
    });

    ///// Materials /////
    // AO intensity
    Materials.addInput(mats, 'aoIntensity', {min: 0, max: 2, label: 'AO Intensity'})
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
    // Plaster white color
    PlasterWhite.addInput(mats, 'plasterWhiteC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_White.color.set(ev.value);
    });
    // Plaster white roughness
    PlasterWhite.addInput(mats, 'plasterWhiteR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_White.roughness = ev.value;
    });
    // Plaster beige color
    PlasterBeige.addInput(mats, 'plasterBeigeC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_Beige.color.set(ev.value);
    });
    // Plaster beige roughness
    PlasterBeige.addInput(mats, 'plasterBeigeR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plaster_Beige.roughness = ev.value;
    });
    // Linoleum color
    Linoleum.addInput(mats, 'linoleumC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Linoleum.color.set(ev.value);
    });
    // Linoleum roughness
    Linoleum.addInput(mats, 'linoleumR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Linoleum.roughness = ev.value;
    });
    // Plastic white color
    PlasticWhite.addInput(mats, 'plasticWhiteC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_White.color.set(ev.value);
    });
    // Plastic white roughness
    PlasticWhite.addInput(mats, 'plasticWhiteR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_White.roughness = ev.value;
    });
    // Plastic beige color
    PlasticBeige.addInput(mats, 'plasticBeigeC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Beige.color.set(ev.value);
    });
    // Plastic beige roughness
    PlasticBeige.addInput(mats, 'plasticBeigeR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Beige.roughness = ev.value;
    });
    // Plastic gray color
    PlasticGray.addInput(mats, 'plasticGrayC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Gray.color.set(ev.value);
    });
    // Plastic gray roughness
    PlasticGray.addInput(mats, 'plasticGrayR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Plastic_Gray.roughness = ev.value;
    });
    // Ceramic color
    Ceramic.addInput(mats, 'ceramicC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Ceramic.color.set(ev.value);
    });
    // Ceramic roughness
    Ceramic.addInput(mats, 'ceramicR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Ceramic.roughness = ev.value;
    });
    // Metal color
    Metal.addInput(mats, 'metalC', {view: 'color', label: 'Color'})
    .on('change', (ev) =>
    {
        materialsList.M_Metal.color.set(ev.value);
    });
    // Metal roughness
    Metal.addInput(mats, 'metalR', {min: 0, max: 1, label: 'Roughness'})
    .on('change', (ev) =>
    {
        materialsList.M_Metal.roughness = ev.value;
    });

    ///// Init material parameters /////
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

    return pane;
};