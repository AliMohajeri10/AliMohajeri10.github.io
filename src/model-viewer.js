import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function initializeModelViewer({
  containerId,
  statusId,
  objFile,
  mtlFile,
}) {
  const container = document.querySelector(containerId);
  const status = document.querySelector(statusId);

  if (!container || !status) {
    console.warn(
      `Model viewer was not created because ${containerId} or ${statusId} was not found.`
    );
    return null;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf1f3f5);

  const camera = new THREE.PerspectiveCamera(
    34,
    1,
    0.01,
    500
  );

  camera.position.set(5, 3.7, 6.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2.5)
  );

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.sortObjects = true;

  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;

  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.32;

  controls.minDistance = 1;
  controls.maxDistance = 30;

  const roomEnvironment = new RoomEnvironment();

  const pmremGenerator =
    new THREE.PMREMGenerator(renderer);

  const environmentMap =
    pmremGenerator.fromScene(
      roomEnvironment,
      0.04
    ).texture;

  scene.environment = environmentMap;

  roomEnvironment.dispose();
  pmremGenerator.dispose();

  const keyLight = new THREE.DirectionalLight(
    0xffffff,
    1.8
  );

  keyLight.position.set(5, 8, 6);
  keyLight.castShadow = true;

  keyLight.shadow.mapSize.set(2048, 2048);

  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 50;

  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;

  keyLight.shadow.bias = -0.0001;
  keyLight.shadow.normalBias = 0.02;

  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(
    0xd7e5ff,
    0.45
  );

  fillLight.position.set(-5, 4, -4);
  scene.add(fillLight);

  const hemisphereLight =
    new THREE.HemisphereLight(
      0xffffff,
      0x6d747c,
      0.32
    );

  scene.add(hemisphereLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 128),
    new THREE.MeshStandardMaterial({
      color: 0xe5e8ec,
      roughness: 0.84,
      metalness: 0,
    })
  );

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.4;
  floor.receiveShadow = true;

  scene.add(floor);

  const grid = new THREE.GridHelper(
    11,
    22,
    0xb5bdc6,
    0xd4d9df
  );

  grid.position.y = -1.395;
  grid.material.transparent = true;
  grid.material.opacity = 0.1;

  scene.add(grid);

  let activeModel = null;

  function configureAltiumMaterial(material) {
    if (!material) {
      return;
    }

    const materialName =
      String(material.name || "").toLowerCase();

    material.side = THREE.DoubleSide;

    material.depthTest = true;
    material.depthWrite = true;

    material.alphaTest = 0;
    material.polygonOffset = false;

    if (materialName === "core") {
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;

      if (material.color) {
        material.color.setRGB(
          0.018,
          0.028,
          0.024
        );
      }
    }

    if (materialName === "copper") {
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;

      if ("shininess" in material) {
        material.shininess = 18;
      }

      if (material.specular) {
        material.specular.setRGB(
          0.22,
          0.16,
          0.08
        );
      }

      material.polygonOffset = true;
      material.polygonOffsetFactor = 2;
      material.polygonOffsetUnits = 4;
    }

    if (
      materialName === "solder_t" ||
      materialName === "solder_b"
    ) {
      material.transparent = true;
      material.opacity = 0.72;

      material.depthWrite = false;
      material.depthTest = true;

      material.polygonOffset = true;
      material.polygonOffsetFactor = -2;
      material.polygonOffsetUnits = -4;

      material.alphaTest = 0.01;

      if ("shininess" in material) {
        material.shininess = 28;
      }

      if (material.specular) {
        material.specular.setRGB(
          0.18,
          0.22,
          0.18
        );
      }
    }

    if (
      materialName === "silk_t" ||
      materialName === "silk_b"
    ) {
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;

      material.polygonOffset = true;
      material.polygonOffsetFactor = -4;
      material.polygonOffsetUnits = -8;

      if ("shininess" in material) {
        material.shininess = 6;
      }
    }

    if (
      materialName.startsWith("mat_") ||
      materialName === "default"
    ) {
      material.transparent = false;
      material.opacity = 1;
      material.depthWrite = true;

      if ("shininess" in material) {
        material.shininess = Math.min(
          material.shininess ?? 5,
          24
        );
      }
    }

    const textureProperties = [
      "map",
      "normalMap",
      "bumpMap",
      "specularMap",
      "alphaMap",
    ];

    textureProperties.forEach((property) => {
      const texture = material[property];

      if (!texture) {
        return;
      }

      if (property === "map") {
        texture.colorSpace =
          THREE.SRGBColorSpace;
      }

      texture.anisotropy =
        renderer.capabilities.getMaxAnisotropy();

      texture.needsUpdate = true;
    });

    material.needsUpdate = true;
  }

  function splitMultiMaterialMeshes(rootObject) {
    const replacements = [];

    rootObject.traverse((child) => {
      if (
        !child.isMesh ||
        !Array.isArray(child.material) ||
        child.material.length <= 1 ||
        !child.geometry.groups.length
      ) {
        return;
      }

      const groupContainer = new THREE.Group();

      groupContainer.name =
        `${child.name || "mesh"}_material_groups`;

      groupContainer.position.copy(child.position);
      groupContainer.rotation.copy(child.rotation);
      groupContainer.scale.copy(child.scale);

      child.geometry.groups.forEach(
        (group, groupIndex) => {
          const material =
            child.material[group.materialIndex];

          if (!material) {
            return;
          }

          const geometry = child.geometry.clone();

          geometry.clearGroups();

          geometry.setDrawRange(
            group.start,
            group.count
          );

          const mesh = new THREE.Mesh(
            geometry,
            material
          );

          mesh.name =
            `${child.name || "mesh"}_${material.name || groupIndex}`;

          mesh.castShadow = child.castShadow;
          mesh.receiveShadow = child.receiveShadow;

          const name =
            String(material.name || "")
              .toLowerCase();

          if (name === "core") {
            mesh.renderOrder = 0;
          } else if (name === "copper") {
            mesh.renderOrder = 1;
          } else if (
            name === "solder_t" ||
            name === "solder_b"
          ) {
            mesh.renderOrder = 2;
          } else if (
            name === "silk_t" ||
            name === "silk_b"
          ) {
            mesh.renderOrder = 3;
          } else {
            mesh.renderOrder = 4;
          }

          groupContainer.add(mesh);
        }
      );

      replacements.push({
        original: child,
        replacement: groupContainer,
      });
    });

    replacements.forEach(
      ({ original, replacement }) => {
        const parent = original.parent;

        if (!parent) {
          return;
        }

        parent.add(replacement);
        parent.remove(original);
      }
    );
  }

  function prepareObject(object) {
    object.traverse((child) => {
      if (!child.isMesh) {
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      const materials =
        Array.isArray(child.material)
          ? child.material
          : [child.material];

      materials.forEach(
        configureAltiumMaterial
      );
    });

    splitMultiMaterialMeshes(object);

    const initialBox =
      new THREE.Box3().setFromObject(object);

    const initialSize =
      initialBox.getSize(
        new THREE.Vector3()
      );

    const largestDimension = Math.max(
      initialSize.x,
      initialSize.y,
      initialSize.z
    );

    if (
      !Number.isFinite(largestDimension) ||
      largestDimension <= 0
    ) {
      throw new Error(
        "The OBJ model has invalid dimensions."
      );
    }

    const targetSize = 3.6;
    const scale =
      targetSize / largestDimension;

    object.scale.setScalar(scale);

    const scaledBox =
      new THREE.Box3().setFromObject(object);

    const center =
      scaledBox.getCenter(
        new THREE.Vector3()
      );

    object.position.sub(center);

    const centeredBox =
      new THREE.Box3().setFromObject(object);

    object.position.y +=
      -1.4 -
      centeredBox.min.y +
      0.06;

    scene.add(object);

    activeModel = object;

    fitCameraToObject(object);
  }

  function fitCameraToObject(object) {
    const box =
      new THREE.Box3().setFromObject(object);

    const size =
      box.getSize(
        new THREE.Vector3()
      );

    const center =
      box.getCenter(
        new THREE.Vector3()
      );

    const maximumSize = Math.max(
      size.x,
      size.y,
      size.z
    );

    const verticalFov =
      THREE.MathUtils.degToRad(
        camera.fov
      );

    let distance =
      maximumSize /
      (
        2 *
        Math.tan(
          verticalFov / 2
        )
      );

    distance *= 1.55;

    const direction =
      new THREE.Vector3(
        1,
        0.72,
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
        distance * 30,
        100
      );

    camera.updateProjectionMatrix();

    controls.target.copy(center);

    controls.minDistance =
      Math.max(
        distance * 0.35,
        0.5
      );

    controls.maxDistance =
      distance * 4;

    controls.update();
  }

  function loadModel() {
    const modelPath =
      `${import.meta.env.BASE_URL}models/`;

    status.textContent =
      `Loading ${objFile}…`;

    const materialLoader =
      new MTLLoader();

    materialLoader.setPath(modelPath);
    materialLoader.setResourcePath(
      modelPath
    );

    materialLoader.setMaterialOptions({
      normalizeRGB: false,
      ignoreZeroRGBs: false,
      invertTrProperty: false,
      side: THREE.DoubleSide,
      wrap: THREE.RepeatWrapping,
    });

    materialLoader.load(
      mtlFile,

      (materials) => {
        materials.preload();

        Object.values(
          materials.materials
        ).forEach(
          configureAltiumMaterial
        );

        const objectLoader =
          new OBJLoader();

        objectLoader.setMaterials(materials);
        objectLoader.setPath(modelPath);

        objectLoader.load(
          objFile,

          (object) => {
            try {
              prepareObject(object);

              status.textContent =
                "OBJ + MTL loaded";
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
              event.total &&
              Number.isFinite(event.total)
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
            }
          },

          (error) => {
            console.error(
              `OBJ loading failed for ${objFile}:`,
              error
            );

            status.textContent =
              `${objFile} not found`;
          }
        );
      },

      undefined,

      (error) => {
        console.error(
          `MTL loading failed for ${mtlFile}:`,
          error
        );

        status.textContent =
          `${mtlFile} not found`;
      }
    );
  }

  function resizeRenderer() {
    const width = Math.max(
      container.clientWidth,
      1
    );

    const height = Math.max(
      container.clientHeight,
      1
    );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(
      width,
      height,
      false
    );
  }

  const resizeObserver =
    new ResizeObserver(resizeRenderer);

  resizeObserver.observe(container);
  resizeRenderer();

  let rotationTimer = null;

  controls.addEventListener(
    "start",
    () => {
      controls.autoRotate = false;

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
            controls.autoRotate = true;
          },
          2500
        );
    }
  );

  renderer.setAnimationLoop(() => {
    controls.update();

    renderer.render(
      scene,
      camera
    );
  });

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