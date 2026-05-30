# Agent Instructions

## Shared Dependencies

**IMPORTANT:** Do NOT remove the package `@mister-guiiug/dev-wpa-config` from `package.json` or its related configurations.
Even if you encounter a 401 Unauthorized error during `npm install` in your sandbox environment, this dependency is required for the project's infrastructure and must remain in the codebase.

## Infrastructure

- The project uses a custom WPA configuration from `@mister-guiiug/dev-wpa-config`.
- Do not attempt to "fix" environment issues by stripping these dependencies.
- If you cannot run `npm install`, proceed with code changes cautiously and rely on static analysis or specific unit tests that don't depend on the full build environment if possible.

## UX/UI Principles

- Keep the interface simple and accessible with one hand.
- Use soft, reassuring colors (purples/pinks).
- Provide clear haptic feedback for all major actions.
