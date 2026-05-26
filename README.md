# PNPM v10 Root Resolutions vs Workspace Overrides Repro

This is a minimal PNPM workspace showing that PNPM v10 lets root
`package.json#resolutions` mask `pnpm-workspace.yaml#overrides` during install.

## Repro

```sh
npm_config_yes=true npx -p pnpm@10.33.4 pnpm run repro
```

The command exits with `1` when the bug is reproduced.

Expected behavior:

```yaml
overrides:
  is-number: 7.0.0
  is-odd: 3.0.1
```

Actual behavior with `pnpm@10.33.4`:

```yaml
overrides:
  is-odd: 3.0.1
```

The workspace override for `left-pad` is visible in config:

```sh
npm_config_yes=true npx -p pnpm@10.33.4 pnpm run show-config
```

Output:

```text
is-number=7.0.0
is-odd=3.0.1
```

But after `pnpm install --lockfile-only`, `pnpm-lock.yaml` resolves
transitive dependency `is-number` to `6.0.0` instead of the workspace override
`7.0.0`.

Removing root `package.json#resolutions` makes the workspace override apply.

## Observed Output

```text
Expected lockfile override block:
overrides:
  is-number: 7.0.0
  is-odd: 3.0.1

Actual PNPM v10 lockfile override block:
overrides:
  is-odd: 3.0.1

Reproduced: root package.json#resolutions masked pnpm-workspace.yaml#overrides.
is-number resolved to 6.0.0 instead of the workspace override 7.0.0.
```

## Files

- `package.json` has a root Yarn-style `resolutions` field.
- `pnpm-workspace.yaml` has PNPM workspace `overrides`.
- `packages/app/package.json` depends on `is-even@^1.0.0`.
