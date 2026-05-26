I hit this while preparing a Yarn-to-pnpm migration and put together a minimal repro:

https://github.com/dharmendra94/pnpm-v10-resolutions-overrides-repro

Run:

```sh
git clone https://github.com/dharmendra94/pnpm-v10-resolutions-overrides-repro.git
cd pnpm-v10-resolutions-overrides-repro
pnpm run repro
```

This reproduces on the latest v10 line:

```text
pnpm 10.33.4
```

The confusing part is that config inspection sees both values from `pnpm-workspace.yaml`:

```text
is-number=7.0.0
is-odd=3.0.1
```

But `pnpm install --lockfile-only` writes only the root `package.json#resolutions` entry into `pnpm-lock.yaml`:

```yaml
overrides:
  is-odd: 3.0.1
```

The transitive `is-number` dependency then resolves to `6.0.0` instead of the workspace override `7.0.0`.

So in this v10 install path, the effective behavior is:

- root `package.json#resolutions` is read as override input
- `pnpm config get overrides` shows the merged workspace override config
- `pnpm install` still generates a lockfile using only the root `resolutions` entries

Removing root `package.json#resolutions` makes the workspace override apply.

If root `resolutions` and `pnpm-workspace.yaml#overrides` are not intended to be merged in v10, it would help to document that explicitly and emit a warning during `pnpm install`, because the current behavior is silent and `pnpm config get overrides` suggests both overrides are active.
