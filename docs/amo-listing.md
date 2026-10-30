# addons.mozilla.org listing (draft)

Copy these into the AMO Developer Hub when submitting. Fields are listed in the order the submission form asks for them.

## Name

Pop Out for Todoist

## Add-on URL slug

pop-out-for-todoist

## Summary (250 characters max)

Pop a task out of your Todoist tab into an always-on-top window, so you stay focused on the task at hand while you work in other apps. Not created by, affiliated with, or supported by Todoist.

## Description

```
Keep the task you're working on in front of you. Pop Out for Todoist adds a "Pop out" button to Todoist on the web. Open a task, click the button (or press Shift+P), and the task appears in a small window that stays on top of everything else, even when you switch to other apps. When you're done, click the circle to complete it.

Features
- "Pop out" button next to "Add sub-task" on any open task, plus a Shift+P shortcut
- An always-on-top window that floats over your other apps
- Pop out several tasks and they stack in the same window
- Shows each task's priority, due date (including recurring tasks) and description
- Remove a task from the window without completing it
- Follows your system's light or dark theme

Setup
You'll need your Todoist API token. In Todoist, go to Settings → Integrations → Developer and copy it. The extension's settings page opens when you install it; paste the token and click "Save and test".

Privacy
Your API token is stored only in your Firefox profile. The extension talks only to api.todoist.com, and only when you test your token, pop out a task, or complete one. It sends nothing to the developer and has no analytics or tracking. Full privacy policy: https://github.com/matthew-chandler/todoist-firefox-popout/blob/main/PRIVACY.md

Requirements
Firefox 151 or newer on desktop, and the Todoist web app at app.todoist.com.

Open source under the MIT License: https://github.com/matthew-chandler/todoist-firefox-popout

Pop Out for Todoist is not created by, affiliated with, or supported by Todoist or Doist. Todoist is a trademark of Doist.
```

## Categories

- Firefox: Tabs, Other
- (Not available on Android: Document Picture-in-Picture is desktop only.)

## Support

- Website: https://github.com/matthew-chandler/todoist-firefox-popout
- Support site: https://github.com/matthew-chandler/todoist-firefox-popout/issues

## License

MIT License

## Privacy policy

Paste the contents of `PRIVACY.md`.

## Notes to reviewer

To test, you need a Todoist account (free is fine) and its API token (Todoist → Settings → Integrations → Developer).

1. Install the add-on; the settings page opens. Paste the token, click "Save and test", and grant site access if asked.
2. Go to https://app.todoist.com, create a task, and click it to open it.
3. Click the red "Pop out" button next to "Add sub-task" (or press Shift+P). An always-on-top window shows the task.
4. Click the circle to complete the task.

There is no build step: the submitted files are the source. Network requests go only to https://api.todoist.com/api/v1 from background.js.

Data collection declaration: `authenticationInfo` (the user's Todoist API token, sent to api.todoist.com to authenticate) and `websiteContent` (the ID of the task open on app.todoist.com, sent to api.todoist.com to load and complete it). Nothing is sent to the developer.
