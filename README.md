# Family Sign Studio

A small web app (installable PWA) for designing and aligning **hanging family welcome signs**: a big card on top with figure cut-outs hanging from it on ball chains.

- The **shop** loads the card and the figures, arranges them (rows, generations or a family tree), checks the layout for production problems, and exports a spec.
- The **customer** opens the project the shop sent, moves the figures around in a simple editor, and sends the finished layout back.
- Works offline once opened, runs entirely in the browser (nothing is uploaded anywhere), and has a **Taglish / English** language switch.

## Deploy: GitHub, then Vercel

1. Create a new GitHub repository and upload everything in this folder (on github.com: *Add file, Upload files*, drag the folder contents in; or use git: `git init && git add . && git commit -m "Family Sign Studio" && git remote add origin <your-repo-url> && git push -u origin main`).
2. In Vercel: *Add New, Project*, import the repository, and press **Deploy**. No settings to change; `vercel.json` already sets the build command (`node build.mjs`) and the output folder (`public`).
3. Open the Vercel URL. In Chrome/Edge use the **Install app** button (or the install icon in the address bar). On iPhone/iPad use Safari, *Share, Add to Home Screen*. On Android Chrome use *Add to Home screen / Install app*.

Share the URL with customers. Add `?lang=en` or `?lang=tl` to the URL to open it in English or Taglish (for example `https://your-app.vercel.app/?lang=en`). The choice is remembered on that device.

## Shop and customer flow

1. **Shop mode:** choose the card, add the figures (one by one, or a *Multi-figure sheet* that gets split automatically), and arrange them. Fix anything shown in *Production check*.
2. **Export, Project for the customer:** send that `.json` file to the customer (Messenger, Viber, email).
3. **Customer:** open the app, *Open project*, pick the file. The app switches to Customer mode, where they can drag figures, use the align tools or Auto-arrange, then **Send to shop**. They send back the project file (and the preview PNG).
4. **Shop:** *Open project* with the returned file, turn on *Show the original layout* to compare against your layout, and export the spec sheet for production.

## Develop

Needs Node 18 or newer. There are no dependencies.

```bash
node build.mjs        # builds public/index.html and stamps public/sw.js   (npm run make)
node dev-server.mjs   # serves public/ at http://localhost:5173            (npm run dev)
```

- `src/` holds the source: `body.html`, `style.css`, the `p1` to `p5` scripts, `i18n.js` (all text, in both languages) and `sw.template.js` (service worker).
- `public/` is what gets deployed. `public/index.html` and `public/sw.js` are generated; edit `src/` and run the build. Vercel runs the build itself on every deploy.
- To change or add text, edit `src/i18n.js` (each entry is `key: [Taglish, English]`) and reference the key in `body.html` (`data-i18n="key"`) or code (`tr('key')`).
- The service worker cache version changes automatically whenever the files change, so installed copies update on the next visit while online. A toast tells the user to refresh.

## Notes

- Fonts (Figtree, Bricolage Grotesque) are self-hosted in `public/fonts` under the SIL Open Font License, so the app works offline and makes no Google requests.
- `vercel.json` adds a Content-Security-Policy and other security headers. If you later add third-party scripts or services, update the policy there.
- A transparent PNG works best for figures and sheets. Photos with plain white backgrounds are cut out automatically but may need a quick check.

## Members, card size & pictures

- **Up to 20 members.** Set the number in *Members* (stepper). Empty slots show a gray silhouette so the shop and the customer can see the arrangement and chain alignment right away, before any picture exists.
- **Card size.** Type the real width × height in cm (or pick a common size). *Blank card* generates a card with the family name; *Choose card image* stretches your own artwork to the size you set (tick "match image ratio" to keep its proportions).
- **Pictures.** Upload per member (tap the thumbnail), upload many at once (fills empty slots in order, then adds members up to 20), or drag & drop onto a member or the stage. Raw photos are fine for now: a photo is cropped into a rounded portrait card; a transparent PNG or a plain-background cutout is used as a figure. The *When a picture has no transparent background* option forces one or the other. Replacing a picture later keeps the chain position.
- **Shop option:** "The customer cannot change the number of members" locks the count in the customer file.
- **Autosave.** The current work is saved automatically in this browser (IndexedDB) and restored on the next visit. Nothing is uploaded anywhere. *New project* starts blank; *Demo* loads the sample.
