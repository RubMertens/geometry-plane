/* eslint-disable @typescript-eslint/no-non-null-assertion */
import anime, { AnimeInstance } from 'animejs'
import { GUI } from 'dat.gui'
import {
  BufferAttribute,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  WebGLRenderer,
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new Scene()
const aspect = window.innerWidth / window.innerHeight
const camera = new PerspectiveCamera(75, aspect, 0.01, 1000)

camera.position.set(0, 0, 15)
camera.lookAt(0, 0, 0)

const frontLight = new DirectionalLight('white', 1)
frontLight.position.set(0, 100, 100)
const backLight = new DirectionalLight('white', 1)
backLight.position.set(0, -100, -100)
scene.add(frontLight)
scene.add(backLight)

const planeParams = {
  width: 70,
  height: 50,
  widthSegments: 50,
  heightSegments: 50,
}

function generatePlane() {
  const geom = new PlaneGeometry(
    planeParams.width,
    planeParams.height,
    planeParams.widthSegments,
    planeParams.heightSegments
  )
  const mat = new MeshPhongMaterial({
    // color: 'rebeccapurple',
    side: DoubleSide,
    flatShading: true,
    vertexColors: true,
  })
  const position = geom.getAttribute('position')
  geom.setAttribute('color', new BufferAttribute(new Float32Array(position.array.length), 3))
  const runningAnimations: AnimeInstance[] = []
  for (let i = 0; i < position.count; i++) {
    position.setX(i, position.getX(i) + Math.random())
    position.setZ(i, position.getZ(i) + Math.random())
    position.setY(i, position.getY(i) + Math.random())
    geom.getAttribute('color').setXYZ(i, 0.1, 0.1, 0.1)

    const original = { x: position.getX(i), y: position.getY(i), z: position.getZ(i) }
    const animate = anime({
      targets: original,
      x: original.x + (Math.random() - 0.5) * 1.5,
      y: original.y + (Math.random() - 0.5) * 1.5,
      z: original.z + (Math.random() - 0.5) * 1.5,
      direction: 'alternate',
      loop: true,
      easing: 'linear',
      duration: 10_000,
      update: () => {
        position.setX(i, original.x)
        position.setY(i, original.y)
        position.setZ(i, original.z)
        position.needsUpdate = true
      },
    })
    runningAnimations.push(animate)
  }

  return { mesh: new Mesh(geom, mat), animations: runningAnimations }
}

let plane = generatePlane()
console.log(plane)
scene.add(plane.mesh)
const renderer = new WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false
controls.enableZoom = false
controls.rotateSpeed = 0.1

document.body.appendChild(renderer.domElement)

function regeneratePlane() {
  scene.remove(plane.mesh)
  plane.animations.forEach((a) => anime.remove(a))
  plane = generatePlane()
  scene.add(plane.mesh)
}

const rayCaster = new Raycaster()

const glowTraceOnMouseEvent = (rawCoords: { clientX: number; clientY: number }) => {
  const x = (rawCoords.clientX / window.innerWidth) * 2 - 1
  const y = -(rawCoords.clientY / window.innerHeight) * 2 + 1

  rayCaster.setFromCamera({ x, y }, camera)
  const intersections = rayCaster.intersectObject(plane.mesh)

  if (intersections.length > 0) {
    const intersect = intersections[0]

    const color = plane.mesh.geometry.getAttribute('color')

    const white = { r: 1, g: 1, b: 1 }
    //#6495ED
    const blue = { r: 0x64 / 255, g: 0x95 / 255, b: 0xed / 255 }
    //0.4, 0.2, 0.6
    const purple = {
      r: 0.4,
      g: 0.2,
      b: 0.6,
    }
    const black = {
      r: 0.1,
      b: 0.1,
      g: 0.1,
    }

    const targetColor = { ...white }

    anime({
      targets: targetColor,
      keyframes: [white, blue, purple, black],
      easing: 'linear',
      autoplay: true,
      update: () => {
        const { r, g, b } = targetColor
        color.setXYZ(intersect.face!.a, r, g, b)
        color.setXYZ(intersect.face!.b, r, g, b)
        color.setXYZ(intersect.face!.c, r, g, b)
        color.needsUpdate = true
      },
    })
  }
}

addEventListener('mousemove', (e) => {
  glowTraceOnMouseEvent(e)
})
addEventListener('touchmove', (e) => {
  glowTraceOnMouseEvent(e.touches[0])
})

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

const gui = new GUI()
gui.add(planeParams, 'width', 1, 100, 1).updateDisplay().onChange(regeneratePlane)
gui.add(planeParams, 'height', 1, 100, 1).updateDisplay().onChange(regeneratePlane)
gui.add(planeParams, 'widthSegments', 1, 100, 1).updateDisplay().onChange(regeneratePlane)
gui.add(planeParams, 'heightSegments', 1, 100, 1).updateDisplay().onChange(regeneratePlane)
gui.close()

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
