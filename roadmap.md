# Roadmap

## Current task
- [ ] Apply uploaded hacker loader to page, skeleton and action loading; match hacker glass colors; remove splash cursor; stabilize navigation; add suitable animated emoji.
- [ ] Randomize new APK packages from com.tineshmod.a1 to com.tineshmod.a10 and run rule tests.
- [ ] Apply separate Google button artwork when supplied (waiting for asset).
- [ ] Add uploaded login video, inline emoji, user-page hacker background and splash cursor; verify transparent glass and working controls.
- [x] Replace all five remix secrets through the secure form (latest remix).
- [x] Clear copied Drizzle migration history and regenerate an empty baseline for this remix without changing stored data; verified one generated journal entry, empty schema snapshot, and no executable SQL.
- [ ] Replace clay UI with consistent glass cards and controls throughout user/admin pages; verify both themes and narrow screens.
- [x] Fix build-logo upload 404 with authenticated ImgBB upload; real signup/free build tested in preview and live Vercel, saved image returned HTTP 200, live Orders displayed logo. APK completion remains unverified.
- [x] Removed favicon and visible Lovable branding; deployed to Vercel tineshbuildercode, live page verified clean.
- [x] Add admin-editable website name and visitor announcements; verified real admin save/readback, fresh visitor display, dismiss/return, disabled state and mobile layout; six targeted tests passed. Vercel not updated in this task.
- [x] Create root agent_memory.md with safe project context; deploy latest fixes to Vercel and verify live signup, profile saving, wallet, leaderboard and orders.
- [x] Fix endless loading on profile, wallet, leaderboard and orders; verified real signed-in data and failed-request retry recovery on all four pages.
- [x] Require missing name and Telegram username after any sign-in and save the Firebase profile.
- [x] Test profile completion, persistence, complete-profile bypass, and visibility in admin Users; verified with a real Firebase signup in the preview.

## Done
- Database reset for the copied project: users, wallets, deposits, templates, orders, login history, site settings, media storage
- Claymorphism look (soft, squishy, playful) across buttons, inputs, cards, light + dark
- Login page simplified: no navigation, no "Builder" logo/icon
- Admin panel at /admin: dashboard, builds, deposits, users, templates, settings
- Capsule dock navigation (floating pill, active item highlighted, works light/dark/mobile)
- Remix migration history cleared and rescaffolded with an empty baseline; existing database data preserved.
- Remix ImgBB, GitHub, and Vercel secrets replaced through the secure form.
- Latest source uploaded to instaboosterwesd/tineshbuildercode main; verified GitHub commit and inspected Vercel's failed deployment.
- Current remix uploaded to instaboosterwesd/tineshbuildercode main; commit 5b6f8918e25ec36a46d38745b32e6c928dbd0658 verified. Its Vercel production deployment failed before build logs were produced.
- Vercel production retry on October 17 succeeded: deployment dpl_5YPUjaZVMk5YUdMuTZ1ouEhmCXP7 reached READY and received production aliases.

- Live Vercel site fixed: unlinked the extra Vercel database add-on that overrode the app's database address, corrected the private key, server moved to Paris; home page loads.

## Open
- Funded build/logo upload/GitHub callback/download flow: requires a configured template and funded test account; not verified in the latest account-page checks.
- APK/video/template storage remains unavailable: both configured Google Storage bucket names returned 404; build logos now use ImgBB, but this does not repair APK output uploads or old missing images.
- Admin password: currently opens with the default "devdev" until a private one is set
- Admin templates: allow uploading a new photo/video for a template (edits today keep the pictures a template already has)
