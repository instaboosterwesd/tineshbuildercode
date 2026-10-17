# Roadmap

## Done
- Database reset for the copied project: users, wallets, deposits, templates, orders, login history, site settings, media storage
- Claymorphism look (soft, squishy, playful) across buttons, inputs, cards, light + dark
- Login page simplified: no navigation, no "Builder" logo/icon
- Admin panel at /admin: dashboard, builds, deposits, users, templates, settings
- Capsule dock navigation (floating pill, active item highlighted, works light/dark/mobile)
- Remix migration history cleared and rescaffolded with an empty baseline; existing database data preserved.
- Remix ImgBB, GitHub, and Vercel secrets replaced through the secure form.
- Latest source uploaded to instaboosterwesd/tineshbuildercode main; verified GitHub commit and inspected Vercel's failed deployment.

## Open
- Upload the current remix source to instaboosterwesd/tineshbuildercode and verify its latest Vercel deployment.
- Vercel automatically deployed the uploaded tineshbuildercode commit but failed with BUILD_FAILED / Resource provisioning failed; hosting provisioning must be resolved before a live deployment can be verified.
- Orders page (/orders): show the user's own builds with status, app name, price paid, download links — currently "coming soon"
- Leaderboard page (/leaderboard): rank, name, build count only (no usernames) — currently "coming soon"
- Profile page (/profile): edit profile, change password, logout, recent history, login history, contact us / help & support — currently "coming soon"
- Admin password: currently opens with the default "devdev" until a private one is set
- Admin templates: allow uploading a new photo/video for a template (edits today keep the pictures a template already has)
