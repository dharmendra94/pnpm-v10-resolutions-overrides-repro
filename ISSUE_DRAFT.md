# Root `package.json#resolutions` masks `pnpm-workspace.yaml#overrides` in pnpm v10

## Summary

In pnpm v10, a root `package.json#resolutions` field appears to mask
`pnpm-workspace.yaml#overrides` during install.

This is confusing because `pnpm config get overrides` shows the full merged
workspace override config, but `pnpm install` writes a lockfile using only the
root `resolutions` entries.

## Environment

- pnpm: `10.33.4`
- Node: reproducible with current Node LTS/current
- OS: reproducible on macOS

## Reproduction

Minimal repo:

```sh
git clone <REPRO_REPO_URL>
cd pnpm-v10-resolutions-overrides-repro
pnpm run repro
```

The repro intentionally exits with `1` when the bug is reproduced.

## Relevant Files

Root `package.json` has a Yarn-style `resolutions` field:

```json
{
  "resolutions": {
    "is-odd": "3.0.1"
  }
}
```

`pnpm-workspace.yaml` has pnpm workspace overrides:

```yaml
packages:
  - "packages/*"

overrides:
  is-number: 7.0.0
  is-odd: 3.0.1
```

`packages/app/package.json` depends on `is-even@^1.0.0`.
That package depends on `is-odd`, which depends on `is-number`.

## Expected Behavior

`pnpm install --lockfile-only` should respect the workspace override config from
`pnpm-workspace.yaml`.

The generated `pnpm-lock.yaml` should include both overrides:

```yaml
overrides:
  is-number: 7.0.0
  is-odd: 3.0.1
```

The transitive `is-number` dependency should resolve to `7.0.0`.

## Actual Behavior

`pnpm config get overrides` correctly prints both overrides:

```text
is-number=7.0.0
is-odd=3.0.1
```

But `pnpm install --lockfile-only` writes only the root `resolutions` entry into
`pnpm-lock.yaml`:

```yaml
overrides:
  is-odd: 3.0.1
```

The transitive `is-number` dependency resolves to `6.0.0`, not the workspace
override `7.0.0`.

Observed repro output:

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

## Why This Seems Like a Bug

The root `resolutions` field is Yarn compatibility input, while
`pnpm-workspace.yaml#overrides` is pnpm's workspace-level override config.

The documentation and adjacent source history both point users toward expecting
these settings to be merged or, at minimum, warned about:

- `overrides` is documented as the pnpm mechanism for overriding dependencies.
- Workspace settings, including `overrides`, are documented in
  `pnpm-workspace.yaml`.
- pnpm's changelog says root manifest `resolutions` and root manifest
  `pnpm.overrides` are merged to make Yarn migrations easier.
- pnpm also has a separate fix for reading `overrides` from
  `pnpm-workspace.yaml`.

Those fixes are adjacent, but this repro combines both behaviors:

- root `package.json#resolutions`
- workspace-level `pnpm-workspace.yaml#overrides`
- `pnpm install` lockfile generation

If both are present, pnpm should either:

- merge both sets of overrides during install, or
- warn that root `resolutions` will mask `pnpm-workspace.yaml#overrides`.

The current behavior is hard to detect because config inspection shows both
overrides, while install resolution silently uses only the root `resolutions`
entries.

## Additional Notes

Removing root `package.json#resolutions` makes the workspace override apply.

This matters during Yarn-to-pnpm migrations where repos may temporarily keep
root `resolutions` while moving pnpm-specific policy into
`pnpm-workspace.yaml`.

If the intended behavior is that root `resolutions` takes precedence over
`pnpm-workspace.yaml#overrides`, the documentation should say that explicitly.
It would also help to emit a warning during `pnpm install`, because the current
behavior is silent and the config command shows both overrides.

## References

- pnpm v10 settings docs: `pnpm-workspace.yaml` is listed as the per-project
  configuration file, and `overrides` is documented as the field for overriding
  any dependency in the dependency graph:
  https://pnpm.io/10.x/settings#overrides
- pnpm v10 settings docs: `overrides` examples are shown under
  `pnpm-workspace.yaml`:
  https://pnpm.io/10.x/settings#overrides
- pnpm changelog/source history: root manifest `resolutions` and root manifest
  `pnpm.overrides` were changed to merge for Yarn migration compatibility:
  https://github.com/pnpm/pnpm/commit/b1dd0ee58f
- pnpm changelog/source history: setting `overrides` in
  `pnpm-workspace.yaml` was explicitly fixed:
  https://github.com/pnpm/pnpm/commit/1c2eb8c311
