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

## Project rules
- Orchest Studio app code lives in `src/orchest/` (ported from the r7-yn/orchest-studio repo); product docs are in `docs/` (PRD, ARCHITECTURE, DESIGN_SYSTEM) — read them before changes.
- The original Express API runs through `src/orchest/server/shim.ts` behind the `/api/$` catch-all route, so the frontend's `/api/*` fetch calls stay unchanged.
- AI calls go through the Lovable AI Gateway inside the shim; handlers keep their rule-based fallbacks when AI fails.
- Orchest colors are `o-*` tokens in `src/styles.css`; light is the default theme, `.dark` overrides.
