import "./style.css";

import {
  initializeModelViewer,
} from "./model-viewer.js";

/* =========================================================
   MODEL CONFIGURATION
========================================================= */

const modelViewers = [
  {
    containerId:
      "#motor-model-viewer",

    statusId:
      "#motor-model-status",

    objFile:
      "motor-driver.obj",

    mtlFile:
      "motor-driver.mtl",

    rotation: {
      x: -0.12,
      y: 0,
      z: 0,
    },

    position: {
      x: 0,
      y: 0,
      z: 0.5,
    },
  },

  {
    containerId:
      "#interface-model-viewer",

    statusId:
      "#interface-model-status",

    objFile:
      "interface-board.obj",

    mtlFile:
      "interface-board.mtl",

    rotation: {
      x: -0.12,
      y: 0,
      z: 0,
    },

    position: {
      x: 0,
      y: 0,
      z: 0,
    },
  },

  {
    containerId:
      "#power-model-viewer",

    statusId:
      "#power-model-status",

    objFile:
      "power-board.obj",

    mtlFile:
      "power-board.mtl",

    rotation: {
      x: -0.12,
      y: 0,
      z: 0,
    },

    position: {
      x: 0,
      y: 0,
      z: 0,
    },
  },
];

/* =========================================================
   LOADED VIEWER TRACKING
========================================================= */

const loadedViewers =
  new Set();

/* =========================================================
   LOAD ONE VIEWER
========================================================= */

function loadViewer(
  viewerConfiguration
) {
  const {
    containerId,
    statusId,
  } = viewerConfiguration;

  if (
    loadedViewers.has(
      containerId
    )
  ) {
    return;
  }

  const container =
    document.querySelector(
      containerId
    );

  const status =
    document.querySelector(
      statusId
    );

  if (!container) {
    console.error(
      `Container was not found: ${containerId}`
    );

    return;
  }

  if (!status) {
    console.error(
      `Status element was not found: ${statusId}`
    );

    return;
  }

  loadedViewers.add(
    containerId
  );

  status.textContent =
    "Initializing viewer…";

  try {
    initializeModelViewer(
      viewerConfiguration
    );
  } catch (error) {
    console.error(
      `Viewer initialization failed for ${containerId}:`,
      error
    );

    status.textContent =
      "Viewer initialization failed";

    loadedViewers.delete(
      containerId
    );
  }
}

/* =========================================================
   MODEL LAZY LOADING
========================================================= */

if (
  "IntersectionObserver" in window
) {
  const modelObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            const projectCard =
              entry.target;

            const modelContainer =
              projectCard.querySelector(
                ".project-model-viewer"
              );

            if (!modelContainer) {
              modelObserver.unobserve(
                projectCard
              );

              return;
            }

            const viewerConfiguration =
              modelViewers.find(
                (viewer) =>
                  viewer.containerId ===
                  `#${modelContainer.id}`
              );

            if (!viewerConfiguration) {
              console.error(
                `No model configuration exists for #${modelContainer.id}`
              );

              modelObserver.unobserve(
                projectCard
              );

              return;
            }

            loadViewer(
              viewerConfiguration
            );

            modelObserver.unobserve(
              projectCard
            );
          }
        );
      },

      {
        root:
          null,

        rootMargin:
          "250px 0px",

        threshold:
          0.01,
      }
    );

  document
    .querySelectorAll(
      ".project-card"
    )
    .forEach(
      (projectCard) => {
        const modelContainer =
          projectCard.querySelector(
            ".project-model-viewer"
          );

        if (!modelContainer) {
          return;
        }

        modelObserver.observe(
          projectCard
        );
      }
    );
} else {
  modelViewers.forEach(
    loadViewer
  );
}

/* =========================================================
   MANUAL RETRY
========================================================= */

document
  .querySelectorAll(
    ".project-model-panel"
  )
  .forEach(
    (panel) => {
      panel.addEventListener(
        "dblclick",
        () => {
          const modelContainer =
            panel.querySelector(
              ".project-model-viewer"
            );

          if (!modelContainer) {
            return;
          }

          const viewerConfiguration =
            modelViewers.find(
              (viewer) =>
                viewer.containerId ===
                `#${modelContainer.id}`
            );

          if (!viewerConfiguration) {
            return;
          }

          loadViewer(
            viewerConfiguration
          );
        }
      );
    }
  );

/* =========================================================
   CURRENT YEAR
========================================================= */

const yearElement =
  document.querySelector(
    "#year"
  );

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}

/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const menuButton =
  document.querySelector(
    ".menu-button"
  );

const navigation =
  document.querySelector(
    ".main-nav"
  );

menuButton?.addEventListener(
  "click",
  () => {
    const isOpen =
      menuButton.getAttribute(
        "aria-expanded"
      ) === "true";

    menuButton.setAttribute(
      "aria-expanded",
      String(!isOpen)
    );

    navigation?.classList.toggle(
      "is-open",
      !isOpen
    );
  }
);

navigation
  ?.querySelectorAll("a")
  .forEach(
    (link) => {
      link.addEventListener(
        "click",
        () => {
          menuButton?.setAttribute(
            "aria-expanded",
            "false"
          );

          navigation.classList.remove(
            "is-open"
          );
        }
      );
    }
  );

/* =========================================================
   REVEAL ANIMATION
========================================================= */

if (
  "IntersectionObserver" in window
) {
  const revealObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach(
          (entry) => {
            if (
              !entry.isIntersecting
            ) {
              return;
            }

            entry.target.classList.add(
              "is-visible"
            );

            revealObserver.unobserve(
              entry.target
            );
          }
        );
      },

      {
        threshold:
          0.12,
      }
    );

  document
    .querySelectorAll(
      ".reveal"
    )
    .forEach(
      (element) => {
        revealObserver.observe(
          element
        );
      }
    );
} else {
  document
    .querySelectorAll(
      ".reveal"
    )
    .forEach(
      (element) => {
        element.classList.add(
          "is-visible"
        );
      }
    );
}