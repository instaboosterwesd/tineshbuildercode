<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Reset copied migration history as a directory and use the migration tool to regenerate its metadata; never hand-edit journals or snapshots, so Drizzle remains the metadata owner.
- Mount profile completion inside the root auth provider and key its Firebase read by user ID; this covers every sign-in provider and avoids cross-account cached details.
- Verify Firebase ID tokens with jose and Google's remote JWK set; X.509 certificates cannot be imported by merely relabeling their PEM header as an SPKI public key.
- Account-page queries use bounded requests, explicit failure/retry feedback, and user-scoped query keys; failed requests must not remain indistinguishable from loading or leak cached account data.
- Keep website identity and visitor announcements in Firebase settings/main, expose only public fields through the shared site-settings query, and authorize every settings write server-side; one source keeps admin changes consistent across visitor pages.
- Upload build logos through authenticated ImgBB server calls and store owner-scoped path-to-URL mappings in Firebase mediaFiles; resolve those mappings for orders and build callbacks because the configured Cloud Storage bucket is unavailable.
- Shared surface and glass utilities own card/control treatment across routes; legacy clay classes are glass aliases to keep existing views consistent, with standard backdrop-filter only for production compatibility.
- Keep decorative animations in reusable effects components with browser work inside effects and reduced-motion handling; user backgrounds mount in AppShell, while login media stays on the auth page so authentication and admin behavior remain unchanged.
- Use shared HackerLoader/LoadingPanel for loading feedback, with scoped timers and reduced-motion support; consistent states must not block navigation or alter unrelated text.
- Choose new build package names server-side using the shared package-name module; ignore client package overrides and retain stored names for retries.
