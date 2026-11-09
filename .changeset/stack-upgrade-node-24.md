---
"@web3auth/auth": major
---

Require Node.js 24.22 or later and npm 12. Development and CI run on Node 26. Build with Vite+ into the existing `dist/lib.esm` and `dist/lib.cjs` paths for every subpath export, targeting ES2022 so `Object.hasOwn` stays native. Type declarations move from `dist/lib.cjs/types/` to sit next to the CommonJS files, for example `dist/lib.cjs/index.d.ts`; the `exports` map points at the new paths. Drop the `@babel/runtime` peer dependency. Depend on `@toruslabs/ffjavascript` 7. `getHashQueryParams` now returns only the known redirect keys.
