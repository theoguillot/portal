import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import Tween from '@tweenjs/tween.js'; 

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)



/*
 * Textures
 */
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })
const axe = new THREE.MeshBasicMaterial({ map: bakedTexture })

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

// Portal light material
debugObject.portalColorStart = '#000000'
debugObject.portalColorEnd = '#ffffff'
const portalLightMaterial = new THREE.ShaderMaterial({ 
    uniforms: {
        uTime: { value: 0},
        uColorStart: {value: new THREE.Color(debugObject.portalColorStart)},
        uColorEnd: {value: new THREE.Color(debugObject.portalColorEnd)}
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader
 })

gui 
    .addColor(debugObject, 'portalColorStart')
    .onChange(()=>
    {
        portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart) 
    })
    gui 
    .addColor(debugObject, 'portalColorEnd')
    .onChange(()=>
    {
        portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd) 
    })



 
/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()
let currentIntersect = null
const rayOrigin = new THREE.Vector3(- 3, 0, 0)
const rayDirection = new THREE.Vector3(10, 0, 0)
rayDirection.normalize()

/**
 * Model
 */
gltfLoader.load(
    'portal.glb',
    (gltf) =>
    {
        // Material for outlining the object
        const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        scene.add(gltf.scene)
        const axeMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

        // Get each object
        const bakedMesh = gltf.scene.children.find((child) => child.name === 'baked')
        const portalLightMesh = gltf.scene.children.find((child) => child.name === 'portallight')
        const poleLightAMesh = gltf.scene.children.find((child) => child.name === 'polelightA')
        const poleLightBMesh = gltf.scene.children.find((child) => child.name === 'polelightB')
        const axeMesh = gltf.scene.children.find((child) => child.name === 'axe')

        // Apply materials
        bakedMesh.material = bakedMaterial
        portalLightMesh.material = portalLightMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial
        axeMesh.material = axeMaterial
        const mouse = new THREE.Vector2();

           
        // Event listener for mouse movement
        window.addEventListener('mousemove', (event) => {
            // Calculate normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Cast a ray from the camera through the mouse position
            raycaster.setFromCamera(mouse, camera);

            // Check for intersections
            const intersects = raycaster.intersectObject(axeMesh);

            // If the ray intersects with the axe object
            if (intersects.length > 0) {
                // Change the color of the axe
                outlinePass.selectedObjects = [axeMesh];// Set color to red (you can choose any color)
            } else {
                // Reset the color of the axe
                outlinePass.selectedObjects = []; // Set color back to white (or its original color)
            }
        });
        // Event listener for mouse movement and click
        window.addEventListener('click', (event) => {
            // Calculate normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Cast a ray from the camera through the mouse position
            raycaster.setFromCamera(mouse, camera);

            // Check for intersections
            const intersects = raycaster.intersectObject(axeMesh);

            // If the ray intersects with the axe object
            if (intersects.length > 0) {
                // Perform loop animation
                const animate = (t) => {
                    Tween.update(t);
                    window.requestAnimationFrame(animate);
                };
                animate();
                
                console.log(axeMesh.position.x);
                
                const startRotation = 0; // Initial rotation
                const halfwayRotation = Math.PI; // Halfway rotation (180 degrees)
                const endRotation = Math.PI * 2; // Full rotation (360 degrees)
                
                const startHeight = axeMesh.position.y; // Initial height
                const peakHeight = startHeight + 0.7; // Adjust the peak height as needed
                
                // First tween: rotate halfway and go up
                const tween1 = new Tween.Tween({ y: startHeight, zRotation: startRotation })
                    .to({ y: peakHeight, zRotation: halfwayRotation }, 800)
                    .onUpdate((coords) => {
                        axeMesh.position.y = coords.y;
                        axeMesh.rotation.z = coords.zRotation;
                    });
                
                // Second tween: go down and complete full rotation
                const tween2 = new Tween.Tween({ y: peakHeight, zRotation: halfwayRotation })
                    .to({ y: startHeight, zRotation: endRotation }, 600)
                    .onUpdate((coords) => {
                        axeMesh.position.y = coords.y;
                        axeMesh.rotation.z = coords.zRotation;
                    });
                
                // Chain the tweens together
                tween1.chain(tween2);
                
                // Start the animation
                tween1.start();
            }
        });
       
        
    }
    
)

/**
 * Fireflies
 */
//Geometry

const fireflireGeometry = new THREE.BufferGeometry()
const fireflireCount = 30
const positionArray = new Float32Array(fireflireCount * 3) //x y z d'où le *3
const scaleArray = new Float32Array(fireflireCount * 1)
for(let i = 0 ; i < fireflireCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) *4
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) *4

    scaleArray[i] = Math.random()
}

fireflireGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3)) //Number of value per vertex, xyz
fireflireGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1)) //Number of value per vertex, xyz

//Material

const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime: { value: 0},
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: {value: 100}
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})
gui.add(firefliesMaterial.uniforms.uSize, 'value').min(1).max(500).name('firefliesSize')
//POints
const fireflies = new THREE.Points(fireflireGeometry, firefliesMaterial)
scene.add(fireflies)
/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //Update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#201919'
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor')
gui.onChange(()=>
{
    renderer.setClearColor(debugObject.clearColor)
})

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.visibleEdgeColor.set(0xffffff); // Set the color of the outline
outlinePass.hiddenEdgeColor.set(0xffffff); // Set the color of hidden edges
outlinePass.edgeThickness = 2; // Adjust the thickness of the outline
outlinePass.edgeStrength = 10; // Adjust the strength of the outline

composer.addPass(outlinePass);
const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);  
composer.addPass(gammaCorrectionPass);
/**
 * Animate
 */
const clock = new THREE.Clock()


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    //update fireflies
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)
    // Update composer
    composer.render();

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()