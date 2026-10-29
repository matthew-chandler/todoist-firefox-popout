# Privacy Policy

_Last updated: October 28, 2026_

Pop Out for Todoist ("the extension") is a Firefox add-on that shows a Todoist task in an always-on-top window and lets you complete it from there. This policy explains what data the extension handles. In short: **the developer receives nothing.** The extension only talks to Todoist, on your behalf, when you ask it to.

## Data the extension handles

| Data | Where it comes from | Where it is stored | Where it is sent |
| --- | --- | --- | --- |
| Your Todoist API token | You paste it into the settings page | `browser.storage.local` in your Firefox profile | `api.todoist.com` only, in the `Authorization` header of API requests |
| The ID of the task you pop out | The address of the Todoist page you have open (`app.todoist.com/.../task/<id>`) | In memory, while the pop-out window is open | `api.todoist.com` only, to load or complete that task |
| Task title, description, priority and due date | Returned by the Todoist API | In memory, while the pop-out window is open | Nowhere. It is only displayed |

## When data is sent

Requests to `api.todoist.com` happen only as a direct result of something you do:

- **Save and test** on the settings page checks that your token works.
- **Pop out** (button or Shift+P) loads the task you have open.
- **Clicking the circle** in the pop-out window marks that task complete.

The extension does not run in the background, track your browsing, read pages other than `app.todoist.com`, or read the content of Todoist pages beyond the task ID in the address bar.

## What the extension does not do

- It does not send any data to the developer or to anyone other than Todoist.
- It has no analytics, telemetry, advertising, or crash reporting.
- It does not sell or share data.
- It does not load remote code.

## Todoist

Data sent to Todoist is handled under [Doist's privacy policy](https://doist.com/privacy). Pop Out for Todoist is not created by, affiliated with, or supported by Todoist or Doist.

## Removing your data

Clear the token field on the settings page and save, or remove the extension. Removing the extension deletes everything it stored. You can also revoke the token at any time in Todoist under **Settings → Integrations → Developer**.

## Changes

Changes to this policy are published in this file in the [project repository](https://github.com/matthew-chandler/todoist-firefox-popout), with the date above updated.

## Contact

Open an issue at <https://github.com/matthew-chandler/todoist-firefox-popout/issues>.
