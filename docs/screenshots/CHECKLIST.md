# Screenshot Checklist

Use this checklist before replacing placeholder images in the README gallery.

## Target Spec

- Resolution: 1600x900
- Aspect ratio: 16:9
- Format: `.png` preferred for real captures (SVG placeholders also supported)
- Filenames:
  - `dashboard.png`
  - `transactions.png`
  - `budgets.png`
  - `reports.png`
  - `recurring.png`

## Capture Guidelines

- Use desktop viewport only for README shots.
- Use the same browser zoom (100%).
- Capture the same visual density each time (sidebar open/closed consistently).
- Avoid exposing sensitive data in screenshots.
- Keep theme consistent across all images.

## Replace Workflow

1. Capture and save each image in `docs/screenshots` using the exact filenames above.
2. Keep dimensions at 1600x900 for all files.
3. Run validation:

```bash
npm run screenshots:check
```

4. Confirm README image rendering on GitHub and locally.

## Notes

- If both `name.png` and `name.svg` exist, the checker validates the `.png` file first.
- README currently points to `.svg` placeholders. If you want to switch to `.png` images, update links in `README.md`.
