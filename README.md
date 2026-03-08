# Judge Properly

Judge Properly is a Manifest V3 browser extension for Hack Club Flavortown. It cleans up the voting page by renaming the score card panel to `Judge` and keeps your in-progress vote saved in local extension storage so a refresh or navigation hiccup does not wipe your draft.

## What it does

- Renames the Flavortown score card panel label from its default text to `Judge`
- Watches the vote form on `https://flavortown.hackclub.com/votes/new*`
- Saves radio button and text field input to `chrome.storage.local`
- Restores saved drafts when the same suggestion is opened again
- Clears old dynamic header rules and can register the extension with Flavortown through a project-specific request header

## Requirements

- Google Chrome, Microsoft Edge, or another Chromium-based browser with extension developer mode
- Access to Hack Club Flavortown

## Project structure

- `manifest.json` - extension manifest and permissions
- `content.js` - voting page UI tweaks and draft persistence
- `service-worker.js` - background worker and Flavortown registration header rule
- `icons/` - packaged extension icons
- `build.bat` - creates a distributable zip in the repo root

## Local setup

1. Clone or download this repository.
2. Open `service-worker.js`.
3. Set `FLAVORTOWN_PROJECT_ID` to your numeric Flavortown project id if you need extension registration enabled.
4. Open `chrome://extensions` in your browser.
5. Turn on Developer mode.
6. Click Load unpacked.
7. Select this repository folder.

If `FLAVORTOWN_PROJECT_ID` is left blank, the extension still loads and draft persistence still works. Only the Flavortown registration header is skipped.

## Packaging

Run:

```bat
build.bat
```

This script:

- recreates the `dist/` folder
- copies the extension source into `dist/`
- excludes repo-only files such as `.git`, `README.md`, `LICENSE`, and previous zip output
- writes `judgeproperly.zip` in the repository root

The generated zip is suitable for manual distribution or upload to whatever internal workflow you use for Flavortown extensions.

## How draft persistence works

Judge Properly builds a storage key from the hidden Flavortown suggestion token. When possible, it extracts a stable id from the decoded token payload, such as `ship_event_id` or `user_id`. That lets the extension keep separate drafts for different submissions.

Saved data stays in `chrome.storage.local` on your machine and is restored the next time you open the same vote page.

## Notes

- The extension only runs on `flavortown.hackclub.com`.
- The content script only injects on `/votes/new` pages.
- Draft saving is automatic. There is no manual save button.
- Submit events also trigger a final save pass before the page changes.

## License

This project is licensed under the terms in [LICENSE](LICENSE).