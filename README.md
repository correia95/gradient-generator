# CSS Gradient Generator

Build linear, radial and conic CSS gradients in the browser.

- Any number of colour stops (colour + 0–100% position), add/remove freely.
- Linear & conic: angle slider. Radial: circle / ellipse. Repeating toggle.
- Live preview, a colour-stop bar, eight presets.
- Copy the `background:` declaration or the bare gradient value.
- The whole gradient is encoded in the URL (`?g=`) — share the link, get the exact gradient.

## Develop

```
npm install
npm run dev
npm run build
```

Model & serialisation: [`src/gradient.ts`](src/gradient.ts). Static site on Cloudflare Workers.

Part of [Tiny Tools](https://tinytools.correia95.workers.dev).
