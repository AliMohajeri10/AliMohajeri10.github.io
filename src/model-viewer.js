import * as THREE from "three";

import {
  OrbitControls,
} from "three/addons/controls/OrbitControls.js";

import {
  MTLLoader,
} from "three/addons/loaders/MTLLoader.js";

import {
  OBJLoader,
} from "three/addons/loaders/OBJLoader.js";

export function initializeModelViewer({
  containerId,
  statusId,
  objFile,
  mtlFile,

  rotation = {
    x: -0.12,
    y: 0,
    z: 0,
  },

  position = {
    x: 0,
    y: 0,
    z: 0,
  },
}) {
  const container =
    document.querySelector(containerId);

  const status =
    document.querySelector(statusId);

  if (!container) {
    console.error(
      `Model viewer container was not found: ${containerId}`
    );

    return null;
  }

  if (!status) {
    console.error(
      `Model viewer status was not found: ${statusId}`
    );

    return null;
  }

  status.textContent =
    `Loading ${mtlFile}…`;

  /* =========================================================
     SCENE
  ========================================================= */

  const scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(0xffffff);

  /* =========================================================
     FLOOR POSITION
  ========================================================= */

  const floorY = -1.35;

  const modelFloorClearance =
    0.08;

  /* =========================================================
     CAMERA
  ========================================================= */

  const camera =
    new THREE.PerspectiveCamera(
      38,
      1,
      0.01,
      100
    );

  camera.position.set(
    4.7,
    3.2,
    5.8
  );

  /* =========================================================
     RENDERER
  ========================================================= */

  let renderer;

  try {
    renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference:
          "high-performance",
      });
  } catch (error) {
    console.error(
      "WebGL renderer creation failed:",
      error
    );

    status.textContent =
      "WebGL is unavailable";

    return null;
  }

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      1.5
    )
  );

  renderer.outputColorSpace =
    THREE.SRGBColorSpace;

  renderer.shadowMap.enabled =
    true;

  renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

  renderer.domElement.setAttribute(
    "aria-label",
    `Interactive 3D model: ${objFile}`
  );

  container.appendChild(
    renderer.domElement
  );

  /* =========================================================
     CONTROLS
  ========================================================= */

  const controls =
    new OrbitControls(
      camera,
      renderer.domElement
    );

  controls.enableDamping =
    true;

  controls.dampingFactor =
    0.06;

  controls.enablePan =
    false;

  controls.minDistance =
    2.3;

  controls.maxDistance =
    12;

  controls.autoRotate =
    true;

  controls.autoRotateSpeed =
    0.7;

  controls.target.set(
    0,
    0.1,
    0
  );

  /* =========================================================
     LIGHTING
  ========================================================= */

  const hemisphereLight =
    new THREE.HemisphereLight(
      0xffffff,
      0xb8c0c8,
      1.8
    );

  scene.add(
    hemisphereLight
  );

  const keyLight =
    new THREE.DirectionalLight(
      0xffffff,
      4.2
    );

  keyLight.position.set(
    5,
    7,
    5
  );

  keyLight.castShadow =
    true;

  scene.add(
    keyLight
  );

  const fillLight =
    new THREE.DirectionalLight(
      0x9dbfff,
      2.2
    );

  fillLight.position.set(
    -5,
    2,
    -4
  );

  scene.add(
    fillLight
  );

  /* =========================================================
     FLOOR
  ========================================================= */

  const floor =
    new THREE.Mesh(
      new THREE.CircleGeometry(
        4.2,
        80
      ),

      new THREE.ShadowMaterial({
        color: 0x17202a,
        opacity: 0.12,
        depthWrite: false,
      })
    );

  floor.rotation.x =
    -Math.PI / 2;

  floor.position.y =
    floorY;

  floor.receiveShadow =
    true;

  floor.renderOrder =
    -2;

  scene.add(
    floor
  );

  /* =========================================================
     GRID
  ========================================================= */

  const grid =
    new THREE.GridHelper(
      8,
      16,
      0xcbd3dd,
      0xe3e7ec
    );

  grid.position.y =
    floorY + 0.01;

  grid.material.opacity =
    0.38;

  grid.material.transparent =
    true;

  grid.renderOrder =
    -1;

  scene.add(
    grid
  );

  let activeModel =
    null;

  /* =========================================================
     PREPARE MODEL
  ========================================================= */

  function prepareObject(object) {
    object.traverse(
      (child) => {
        if (!child.isMesh) {
          return;
        }

        /*
         * Disable shadows for the imported PCB model.
         * Large Altium OBJ files may contain many small meshes.
         */

        child.castShadow =
          false;

        child.receiveShadow =
          false;

        if (!child.material) {
          return;
        }

        const materials =
          Array.isArray(
            child.material
          )
            ? child.material
            : [child.material];

        materials.forEach(
          (material) => {
            if (!material) {
              return;
            }

            /*
             * Preserve the original Altium MTL settings.
             */

            if (
              "metalness" in material
            ) {
              material.metalness =
                Math.min(
                  material.metalness,
                  0.55
                );
            }

            if (
              "roughness" in material
            ) {
              material.roughness =
                Math.max(
                  material.roughness,
                  0.28
                );
            }

            if (material.map) {
              material.map.colorSpace =
                THREE.SRGBColorSpace;

              material.map.anisotropy =
                renderer.capabilities
                  .getMaxAnisotropy();

              material.map.needsUpdate =
                true;
            }

            material.needsUpdate =
              true;
          }
        );
      }
    );

    /* ---------------------------------------------------------
       1. CALCULATE ORIGINAL SIZE
    --------------------------------------------------------- */

    const originalBox =
      new THREE.Box3()
        .setFromObject(object);

    const originalSize =
      originalBox.getSize(
        new THREE.Vector3()
      );

    const maxDimension =
      Math.max(
        originalSize.x,
        originalSize.y,
        originalSize.z
      );

    if (
      !Number.isFinite(
        maxDimension
      ) ||
      maxDimension <= 0
    ) {
      throw new Error(
        "The OBJ model has invalid dimensions."
      );
    }

    /* ---------------------------------------------------------
       2. SCALE MODEL
    --------------------------------------------------------- */

    const targetSize =
      3.4;

    const scale =
      targetSize /
      maxDimension;

    object.scale.setScalar(
      scale
    );

    object.updateMatrixWorld(
      true
    );

    /* ---------------------------------------------------------
       3. CENTER MODEL
    --------------------------------------------------------- */

    const scaledBox =
      new THREE.Box3()
        .setFromObject(object);

    const scaledCenter =
      scaledBox.getCenter(
        new THREE.Vector3()
      );

    object.position.sub(
      scaledCenter
    );

    /* ---------------------------------------------------------
       4. APPLY INITIAL ROTATION
    --------------------------------------------------------- */

    object.rotation.set(
      rotation.x ?? 0,
      rotation.y ?? 0,
      rotation.z ?? 0
    );

    object.updateMatrixWorld(
      true
    );

    /* ---------------------------------------------------------
       5. FIND LOWEST POINT AFTER ROTATION
    --------------------------------------------------------- */

    const rotatedBox =
      new THREE.Box3()
        .setFromObject(object);

    /*
     * Calculate how much the model must move upward
     * so its lowest point remains above the floor.
     */

    const requiredLift =
      floorY +
      modelFloorClearance -
      rotatedBox.min.y;

    object.position.y +=
      requiredLift;

    /* ---------------------------------------------------------
       6. APPLY USER POSITION OFFSET
    --------------------------------------------------------- */

    object.position.x +=
      position.x ?? 0;

    object.position.y +=
      position.y ?? 0;

    object.position.z +=
      position.z ?? 0;

    object.updateMatrixWorld(
      true
    );

    /* ---------------------------------------------------------
       7. ADD TO SCENE
    --------------------------------------------------------- */

    scene.add(
      object
    );

    activeModel =
      object;

    fitCameraToObject(
      object
    );
  }

  /* =========================================================
     FIT CAMERA
  ========================================================= */

  function fitCameraToObject(
    object
  ) {
    const box =
      new THREE.Box3()
        .setFromObject(object);

    const size =
      box.getSize(
        new THREE.Vector3()
      );

    const center =
      box.getCenter(
        new THREE.Vector3()
      );

    const maxSize =
      Math.max(
        size.x,
        size.y,
        size.z
      );

    const verticalFov =
      THREE.MathUtils.degToRad(
        camera.fov
      );

    let distance =
      maxSize /
      (
        2 *
        Math.tan(
          verticalFov / 2
        )
      );

    distance *=
      1.5;

    const direction =
      new THREE.Vector3(
        1,
        0.7,
        1
      ).normalize();

    camera.position.copy(
      center
        .clone()
        .add(
          direction.multiplyScalar(
            distance
          )
        )
    );

    camera.near =
      Math.max(
        distance / 100,
        0.01
      );

    camera.far =
      Math.max(
        distance * 20,
        100
      );

    camera.updateProjectionMatrix();

    controls.target.copy(
      center
    );

    controls.minDistance =
      Math.max(
        distance * 0.35,
        0.5
      );

    controls.maxDistance =
      distance * 4;

    controls.update();
  }

  /* =========================================================
     LOAD OBJ + MTL
  ========================================================= */

  function loadModel() {
    const modelPath =
      `${import.meta.env.BASE_URL}models/`;

    const mtlUrl =
      `${modelPath}${mtlFile}`;

    const objUrl =
      `${modelPath}${objFile}`;

    console.log(
      "Loading MTL:",
      mtlUrl
    );

    console.log(
      "Loading OBJ:",
      objUrl
    );

    const mtlLoader =
      new MTLLoader();

    mtlLoader.setPath(
      modelPath
    );

    mtlLoader.setResourcePath(
      modelPath
    );

    status.textContent =
      `Loading ${mtlFile}…`;

    mtlLoader.load(
      mtlFile,

      (materials) => {
        try {
          materials.preload();
        } catch (error) {
          console.error(
            `Material preparation failed for ${mtlFile}:`,
            error
          );

          status.textContent =
            "Material preparation failed";

          return;
        }

        status.textContent =
          `Loading ${objFile}…`;

        const objLoader =
          new OBJLoader();

        objLoader.setMaterials(
          materials
        );

        objLoader.setPath(
          modelPath
        );

        objLoader.load(
          objFile,

          (object) => {
            try {
              prepareObject(
                object
              );

              status.textContent =
                "OBJ + MTL loaded";

              console.log(
                `Successfully loaded ${objFile}`
              );
            } catch (error) {
              console.error(
                `Model preparation failed for ${objFile}:`,
                error
              );

              status.textContent =
                "Model preparation failed";
            }
          },

          (event) => {
            if (
              event.lengthComputable &&
              event.total > 0
            ) {
              const percentage =
                Math.round(
                  (
                    event.loaded /
                    event.total
                  ) *
                  100
                );

              status.textContent =
                `Loading ${percentage}%`;
            } else {
              const megabytes =
                (
                  event.loaded /
                  1024 /
                  1024
                ).toFixed(1);

              status.textContent =
                `Loading ${megabytes} MB`;
            }
          },

          (error) => {
            console.error(
              `OBJ loading failed for ${objFile}:`,
              error
            );

            status.textContent =
              `${objFile} unavailable`;
          }
        );
      },

      (event) => {
        if (
          event.lengthComputable &&
          event.total > 0
        ) {
          const percentage =
            Math.round(
              (
                event.loaded /
                event.total
              ) *
              100
            );

          status.textContent =
            `Loading materials ${percentage}%`;
        }
      },

      (error) => {
        console.error(
          `MTL loading failed for ${mtlFile}:`,
          error
        );

        status.textContent =
          `${mtlFile} unavailable`;
      }
    );
  }

  /* =========================================================
     RESPONSIVE RESIZING
  ========================================================= */

  function resize() {
    const width =
      Math.max(
        container.clientWidth,
        1
      );

    const height =
      Math.max(
        container.clientHeight,
        1
      );

    camera.aspect =
      width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(
      width,
      height,
      false
    );
  }

  const resizeObserver =
    new ResizeObserver(
      resize
    );

  resizeObserver.observe(
    container
  );

  resize();

  /* =========================================================
     USER INTERACTION
  ========================================================= */

  let rotationTimer =
    null;

  controls.addEventListener(
    "start",
    () => {
      controls.autoRotate =
        false;

      if (rotationTimer) {
        window.clearTimeout(
          rotationTimer
        );
      }
    }
  );

  controls.addEventListener(
    "end",
    () => {
      rotationTimer =
        window.setTimeout(
          () => {
            controls.autoRotate =
              true;
          },
          2500
        );
    }
  );

  /* =========================================================
     RENDER LOOP
  ========================================================= */

  renderer.setAnimationLoop(
    () => {
      controls.update();

      renderer.render(
        scene,
        camera
      );
    }
  );

  loadModel();

  return {
    scene,
    camera,
    renderer,
    controls,

    get activeModel() {
      return activeModel;
    },
  };
}