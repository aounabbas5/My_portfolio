# Aoun Abbas — Portfolio

React + Vite + Three.js (react-three-fiber) portfolio.

## Run it

Easiest on Windows: double-click **run.bat** (installs on the first run, then opens the site).

Or from a terminal:

```bash
npm install     # first time only
npm start       # dev server, opens http://localhost:5173
```

Production build: `npm run build`, then `npm run preview`.

## Editing content

Everything (name, projects, skills, contact…) lives in `src/data/config.js`.

## How the 3D behaves

- The black-hole portal intro plays on every load. Skip it with the button, Escape, Enter or Space.
- 3D is turned off automatically for reduced-motion users, low-end devices and browsers without WebGL; the site still works fully.
- The background lowers its own quality if the frame rate drops.
