# SVG Token Owlbear Extension Plan

## Summary
Build a new standalone Owlbear extension at `D:\repos\edmund-landgraf\svgtoken-owlbear-extension`, initialized as its own Git repo. Use the current `amba-owlbear-extension` as the template, remove all AMBA auth/API/import behavior, and host the production extension at `https://svgtoken.unwhelm.online`.

## Key Changes
- Initialize the empty target folder as a Git repository after copying the needed project skeleton from the current repo.
- Keep Vite, `@owlbear-rodeo/sdk`, `index.html`, basic styling, Owlbear scene readiness helpers, token SVG/rasterization helpers, and manifest patterns.
- Remove AMBA-specific modules and UI: auth bridge, AMBA tests, PC/module loaders, encounter import, AMBA API calls, AMBA metadata names, and PF2/monster/stat-card flows.
- Rename package and UI branding to `svgtoken-owlbear-extension` / `SVG Token Owlbear`.
- Rename metadata namespace to `com.edmundlandgraf.svgtoken.owlbear`.
- Configure production manifest URLs to use `https://svgtoken.unwhelm.online/`, including icon, popover, and generated token image URLs.

## UI And Behavior
- Render one compact panel with one required letter input, two optional letter inputs, an 8-font dropdown, PF2e size dropdown, quantity input, optional Owlbear text-label checkbox, 16-color palette, create button, and status line.
- The `Add text label to token?` checkbox defaults off. When off, generated Owlbear image items use blank plain text; when on, they use the generated token label like `TH`.
- Size defaults to Medium and maps PF2e creature spaces as Tiny 0.5, Small/Medium 1, Large 2, Huge 3, and Gargantuan 4 grid cells.
- Use `Cinzel Decorative` as the default bundled font from `public/fonts/CinzelDecorative-Bold.ttf`.
- Quantity creates repeated copies of the same selected 1-3 letter label, named like `A 1`, `AB 1`, or `ABC 1`.
- Tokens are added to the current Owlbear scene on the `CHARACTER` layer in a simple grid starting near `{ x: 200, y: 200 }`; selected size controls the token image grid DPI so Owlbear displays the right creature footprint.
- Each token is a 512x512 circular token with selected fill color, high-contrast label fill/stroke, and metadata containing kind, first letter, full label, color, font key, and copy index.

## Hosting And Runtime
- Keep the current repo's generated-token server approach, renamed from `/amba-generated-tokens` to `/generated-tokens`.
- Local development serves the extension through Vite and stores generated token PNGs in `.generated-tokens`.
- Production hosting at `svgtoken.unwhelm.online` must serve static Vite build output, `manifest.json`, `POST /generated-tokens`, and `GET /generated-tokens/{id}.png`.
- Production can run `npm run build` followed by `npm start`; `server.js` serves `dist` and the generated-token endpoints.
- Production CORS must allow Owlbear origins and private-network preflight behavior matching the current extension's Vite middleware pattern.
- Do not rely on AMBA or any AMBA-hosted endpoint for generated image storage.

## Test Plan
- Run `npm install` in the new project if dependencies are absent.
- Run `npm run build` and fix any module/import errors.
- Run `npm run dev:owlbear` and load the local manifest in Owlbear.
- Confirm invalid letters, zero quantity, and quantity over 100 show clear validation errors.
- Confirm default token uses Cinzel Decorative, all 8 fonts render, all 16 colors select, quantity `3` creates three `A` tokens, generated token URLs are reachable by Owlbear, and no AMBA network calls remain.

## Assumptions
- The target directory is intentionally empty and may be populated.
- The current repo's modified `README.md` is unrelated and should not be changed.
- Font dropdown uses lightweight system/browser stacks except for the bundled Cinzel Decorative default.
- `svgtoken.unwhelm.online` is the intended production host unless deployment access or DNS constraints require a later adjustment.
