# Real application screenshots

Capture these views after starting `npm run demo` and signing in with the demo account:

- `dashboard.jpg`: `/dashboard`, desktop viewport; simulated label visible.
- `alert.jpg`: an alert after running the demo analysis.
- `map.jpg`: `/threat-map`.
- `incident.jpg`: an incident with evidence and an analyst note.

The committed images are real 1280×720 viewport captures, exported from the integrated browser and visually inspected. Numbers reflect the database at capture time and change as the simulator runs.

To refresh them on a machine that permits Playwright Chromium to launch, run the capture script below. Do not substitute an AI-generated mockup for a screenshot.

```bash
npx playwright install chromium
npm run screenshots
```

The main README embeds these four files. Keep the simulated-data labels visible.
