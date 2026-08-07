# Surachet Panto — Portfolio

[![Live portfolio](https://img.shields.io/badge/LIVE_PORTFOLIO-39ff14?style=for-the-badge&logo=netlify&logoColor=0a0a0f)](https://surachetresume.netlify.app/)
[![React](https://img.shields.io/badge/React_19-00f3ff?style=for-the-badge&logo=react&logoColor=0a0a0f)](https://react.dev/)
[![Netlify](https://img.shields.io/badge/Deployed_on_Netlify-ff35a2?style=for-the-badge&logo=netlify&logoColor=ffffff)](https://www.netlify.com/)

An interactive bilingual portfolio for an enterprise Software Engineer. The interface combines a cyberpunk visual system with accessible motion, measurable engineering outcomes, and focused recruiter-facing content.

![Surachet Panto portfolio preview](https://raw.githubusercontent.com/Surasinz/ResumeReact/main/public/og.png)

## Experience the site

- [Portfolio](https://surachetresume.netlify.app/) — experience, education, skills, and featured project
- [Impact Dashboard](https://surachetresume.netlify.app/impact) — measurable system, database, automation, and AI outcomes
- [Interview Terminal](https://surachetresume.netlify.app/interview-me) — interactive answers to common interview questions
- [Component Documentation](https://surachetresume.netlify.app/components) — implementation notes and live UI patterns
- [Review Terminal](https://surachetresume.netlify.app/review) — Formspree-powered visitor and recruiter feedback

## Highlights

- Cinematic WebM intro with session-aware playback and reduced-motion support
- Adaptive light/dark theme with green-to-pink Matrix rain
- English/Thai localization with Thai-optimized typography
- Mouse spotlight avatar reveal, magnetic controls, scroll reveals, counters, and subtle parallax
- Canvas liquid trail, custom theme-aware cursors, and draggable Web Shimeji mascot
- Interactive Three.js helmet model and accessible animation controls
- React Router data routing, lazy-loaded secondary pages, route metadata, and error boundaries
- Responsive layouts with keyboard, touch, reduced-motion, and local preference support

## Stack

| Area | Technology |
| --- | --- |
| UI | React 19, React Router 7, CSS |
| 3D and motion | Three.js, React Three Fiber, Drei, React Spring, Canvas |
| Forms | React Router actions, Formspree |
| Localization | Custom EN/TH dictionary, Noto Sans Thai Variable |
| Testing | Testing Library, Jest |
| Hosting | Netlify |

## Run locally

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/Surasinz/ResumeReact.git
cd ResumeReact
npm install
npm start
```

The development server runs at `http://localhost:3000`.

## Verify a change

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

Netlify serves the Create React App production output from `build/`. The SPA redirect in `public/_redirects` keeps direct links such as `/impact` and `/interview-me` working after deployment.

## Design principles

1. **Content before effects** — animation supports hierarchy and interaction without obscuring the resume.
2. **Progressive enhancement** — the portfolio remains navigable when WebGL, canvas, or motion is unavailable.
3. **Accessibility by default** — semantic controls, focus states, readable contrast, and `prefers-reduced-motion` behavior are part of the interface.
4. **Measured engineering** — impact is described through outcomes rather than an unstructured technology list.

## Contact

- Portfolio: [surachetresume.netlify.app](https://surachetresume.netlify.app/)
- LinkedIn: [surachet-panto](https://www.linkedin.com/in/surachet-panto/)
- Email: [surachetpan@hotmail.com](mailto:surachetpan@hotmail.com)

---

Designed and engineered by **Surachet Panto**.
