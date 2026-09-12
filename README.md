# SVG Token Owlbear Extension

A standalone Owlbear Rodeo extension for creating simple alphabet-letter SVG tokens with one required letter, up to two optional extra letters, color, font, quantity, optional Owlbear text label, and Pathfinder-style creature size.
When quantity is greater than one, generated token art keeps the letter layout and draws the copy number as a subscript (`Ac` with `1`, `2`, `3`); a single token remains unnumbered.

## Development

```sh
npm install
npm run dev:owlbear
```

Load `http://localhost:5197/manifest.json` in Owlbear Rodeo during local development.

## Production

The intended production host is `https://svgtoken.unwhelm.online/`.

Production hosting must serve the Vite static build and provide the generated token endpoints:

- `POST /generated-tokens`
- `GET /generated-tokens/{id}.png`

The built `manifest.json` points Owlbear to `https://svgtoken.unwhelm.online/app`.
The production server also serves the manifest from `/` and `/manifest` so accidental root install URLs do not return the HTML app shell.
The manifest uses `favicon.svg` for the extension listing and `action-line.svg` for the Owlbear toolbar action icon.
The production server sends `Cache-Control: no-store` for the extension shell, manifest, and JS/CSS assets so Owlbear picks up UI changes after redeploys.

For a simple Node deployment:

```sh
npm run build
npm start
```

For PM2:

```sh
npm run build
pm2 start ecosystem.config.cjs
```
