import "./style.css";
import { initializeModelViewer } from "./model-viewer.js";


const viewers = [
  {
      containerId: "#interface-model-viewer",
          statusId: "#interface-model-status",
              objFile: "interface-board.obj",
                  mtlFile: "interface-board.mtl",
                    },
                      {
                          containerId: "#power-model-viewer",
                              statusId: "#power-model-status",
                                  objFile: "power-board.obj",
                                      mtlFile: "power-board.mtl",
                                        },
                                          {
                                              containerId: "#motor-model-viewer",
                                                  statusId: "#motor-model-status",
                                                      objFile: "motor-driver.obj",
                                                          mtlFile: "motor-driver.mtl",
                                                            },
                                                            ];

viewers.forEach((viewer) => {
  initializeModelViewer(viewer);
});

document.querySelector("#year").textContent =
  new Date().getFullYear();

const menuButton =
  document.querySelector(".menu-button");

const navigation =
  document.querySelector(".main-nav");

menuButton?.addEventListener("click", () => {
  const isOpen =
    menuButton.getAttribute("aria-expanded") === "true";

  menuButton.setAttribute(
    "aria-expanded",
    String(!isOpen)
  );

  navigation?.classList.toggle(
    "is-open",
    !isOpen
  );
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute(
      "aria-expanded",
      "false"
    );

    navigation.classList.remove("is-open");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.12,
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  observer.observe(element);
});
