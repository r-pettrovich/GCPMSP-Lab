# GCPMSP-Lab
A WebGL laboratory expansion project for a Karaganda Center of Primary Medical and Sanitary Care, based on [three.js](https://github.com/mrdoob/three.js/). Designed for 3D visualization of the laboratory expansion plan within the constraints of the existing clinic building's limited space.

![preview](https://github.com/r-pettrovich/GCPMSP-Lab/assets/9007540/d01d2dd1-ab18-47df-8644-44643b86f579)

## Features

* Designed to work on desktop and mobile devices (WebGL 2.0 support required)
* Clean and scalable html interface animated with [GSAP](https://greensock.com/gsap/)
* Smooth camera with transitions based on [camera-controls](https://github.com/yomotsu/camera-controls)
* Scene setup and debugging panel, hidden from end-user. Press 'PPP' on keyboard to unhide. Based on [tweakpane](https://github.com/cocopon/tweakpane)
* TAA level auto-selection depending on device performance based on [detect-gpu](https://github.com/pmndrs/detect-gpu)

## Live Demo
[GCPMSP-Lab](https://gcpmsp.kz/lab/en/)

## Development

```npm install``` to install all dependencies

```npm run dev``` for run in developer mode

```npm run build``` for build project

```npm run prev``` for preview build version
