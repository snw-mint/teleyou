# Contributing to TeleYou

Thanks for your interest in contributing! Here's everything you need to know.

## Ways to contribute

- **Report a bug** — use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- **Report a wrong theme color** — use the [theme color template](.github/ISSUE_TEMPLATE/theme_color.yml)
- **Suggest a feature** — use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- **Submit a fix or improvement** — open a pull request (see below)

## Development setup

```bash
git clone https://github.com/snw-mint/teleyou.git
cd teleyou
npm install
npm run dev
```

Requires Node.js `^20.19.0` or `>=22.12.0`.

## Project structure

The most relevant files for contributors:

| File | Responsibility |
|---|---|
| `src/js/theme-mobile.js` | Maps Material You tokens → `.attheme` values |
| `src/js/theme-desktop.js` | Maps Material You tokens → `.tdesktop-theme` values |
| `src/js/hct-picker.js` | HCT color picker UI |
| `src/js/hct-constraints.js` | Per-role color validation rules |
| `src/js/export-modal.js` | Export flow modal |
| `src/js/main.js` | App entry — extraction, preview, wiring |

## Fixing a theme color

Most contributions will be color mapping corrections in `theme-mobile.js` or `theme-desktop.js`.

Each token in those files maps to a Material You role from the `scheme` object. The available roles are documented in the [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities) package.

When changing a mapping, please:

1. Test with at least three different seed colors (warm, cool, neutral)
2. Test Light, Dark, and AMOLED modes
3. Import the exported theme into actual Telegram to verify the visual result
4. Describe the before/after in your PR

## Pull request guidelines

- One fix or feature per PR
- Keep commit messages clear: `fix: chat_inBubble maps to wrong surface token`
- If your change affects exported theme output, update both `theme-mobile.js` and `theme-desktop.js` where relevant
- Fill in the PR template checklist before requesting review

## Code style

The project uses Prettier. Run `npx prettier --write .` before committing, or configure your editor to format on save using the `.prettierrc` config at the repo root.

## License

By contributing, you agree that your changes will be licensed under the [MIT License](LICENSE).
