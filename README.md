# Ali Engineering Portfolio Starter V2

This version includes:

- Portrait in the hero section
- Three independent OBJ + MTL project viewers
- Interface Board viewer
- Power Board viewer
- PMSM Motor Drive viewer
- Coherent expertise-card background artwork
- Responsive desktop, tablet, and mobile layout
- GitHub Pages deployment workflow

## 1. Open the project

Extract the ZIP file.

In Visual Studio Code:

```text
File → Open Folder
```

Select:

```text
ali-engineering-portfolio-starter_V2
```

## 2. Install packages

When using Command Prompt:

```cmd
npm install
```

When using PowerShell and scripts are blocked:

```powershell
npm.cmd install
```

## 3. Run locally

Command Prompt:

```cmd
npm run dev
```

PowerShell:

```powershell
npm.cmd run dev
```

Open the local address shown by Vite.

## 4. Add the portrait

Put the portrait here:

```text
public/images/ali-portrait.webp
```

The placeholder remains visible until the real file is added.

## 5. Replace the demonstration 3D models

Put your OBJ, MTL, and texture files in:

```text
public/models/
```

Keep these exact main filenames:

```text
interface-board.obj
interface-board.mtl

power-board.obj
power-board.mtl

motor-driver.obj
motor-driver.mtl
```

## 6. Add the CV

Put the PDF here:

```text
public/documents/Ali-Mohajeri-CV.pdf
```

## 7. Important files

```text
index.html
src/style.css
src/main.js
src/model-viewer.js
```

`model-viewer.js` uses OBJLoader and MTLLoader. It creates one independent Three.js scene for each project.

## 8. Build test

```cmd
npm run build
npm run preview
```

## 9. GitHub repository

Create a public repository named exactly:

```text
YOUR-GITHUB-USERNAME.github.io
```

Then run:

```cmd
git init
git add .
git commit -m "Create portfolio V2"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/YOUR-GITHUB-USERNAME.github.io.git
git push -u origin main
```

In GitHub:

```text
Settings → Pages → Source → GitHub Actions
```

Your website address will be:

```text
https://YOUR-GITHUB-USERNAME.github.io/
```
