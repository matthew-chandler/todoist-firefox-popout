# addons.mozilla.org listing (draft)

Copy these into the AMO Developer Hub when submitting. Fields are listed in the order the submission form asks for them.

## Name

Pop Out for Todoist

## Add-on URL slug

pop-out-for-todoist

## Summary (250 characters max)

Pop a Todoist task into a small always-on-top window and check it off from there. Not created by, affiliated with, or supported by Todoist.

## Description

Keep the task you're working on in view. Pop Out for Todoist adds a **Pop out** button to Todoist on the web. Click it (or press Shift+P) on an open task and the task appears in a small window that stays on top of your other apps. Click the circle to complete it.

**Features**
- Pop out button next to "Add sub-task" on any open task, plus a Shift+P shortcut
- Always-on-top window using Firefox's picture-in-picture support
- Pop out several tasks; they stack in the same window
- Shows priority, due date (including recurring tasks) and description
- Light and dark themes follow your system

**Setup**
You'll need your Todoist API token: in Todoist, go to Settings → Integrations → Developer and copy it. The settings page opens when you install the extension; paste the token and click Save and test.

**Privacy**
Your API token is stored only in your Firefox profile. The extension talks only to api.todoist.com, and only when you pop out or complete a task, or test your token. It sends nothing to the developer and has no analytics or tracking. Full policy: https://github.com/matthew-chandler/todoist-firefox-popout/blob/main/PRIVACY.md

**Requirements**
Firefox 151 or newer on desktop. Works with the Todoist web app at app.todoist.com.

Pop Out for Todoist is open source under the MIT License: https://github.com/matthew-chandler/todoist-firefox-popout

Pop Out for Todoist is not created by, affiliated with, or supported by Todoist or Doist. Todoist is a trademark of Doist.

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
