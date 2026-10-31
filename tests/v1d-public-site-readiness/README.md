# V1d local public site

This harness starts the real nominal Next16.2.6 / React19.2.4 sources against a new read-only synthetic HTTP fixture. It exercises home, both directory aliases, detail, search, empty,404 and503 states at desktop1440×1000 and mobile390×844. It does not certify a backend integration, maps/CDN availability, native device, human UAT or production.

From the WEB repository, use a NEW private reserve outside the source tree for every attempt:

```sh
python3 tests/v1d-public-site-readiness/guard.py selftest
python3 tests/v1d-public-site-readiness/guard.py prepare "$PWD" /absolute/new/private/reserve --download
V1D_HEADED=1 node tests/v1d-public-site-readiness/run.mjs /absolute/new/private/reserve
```

`--download` requires prior technical approval for the exact lock/SRI allowlist and stated caps. It accesses only public registry tarballs, no metadata/lifecycle, no old node_modules/npmrc/private configuration. An optional `V1D_PRIOR_ROOT` supplies read-only indexed downloads; the root manifests must match the lock, every receipt URL/origin and SHA-512 is checked, and all archives are validated before any extraction.

The source manifest pins immutable BASE `f801b24df3e750f727dacc9cdc69dab75e5fbab9`, separately from the current runtime HEAD. Its candidate is exactly 105 BASE source blobs/modes plus one closed `OWN:normalizeAddress` source at `src/lib/public-church-utils.ts`, verified against the fixed BASE preimage and exact OWN SHA-256/blob/mode. Before T1 is committed, preparation accepts only current HEAD equal to BASE and captures the pinned OWN working-tree bytes. After T1 is committed, preparation accepts a current HEAD only when BASE is its ancestor and the current nominal source tree exactly matches that same 106-entry candidate. It does not pin a future commit hash; an unrelated HEAD, another source delta, changed preimage, or candidate hash aborts. The thirteen other pre-existing working-tree deltas are captured only as fixed preservation pins and are never admitted to the snapshot. Every source component is opened with O_NOFOLLOW after the tree-state guard; all source capture precedes snapshot writes/imports. Downloads, partials, failures, logs, traces and screenshots stay private and are never deleted. The snapshot has new HOME/tmp and dependency files0600; no package lifecycle runs. Existing installed Chrome is launched with a fresh temporary profile and fresh contexts; no browser download or existing auth profile. Real providers remain OFF and env is allowlisted.

Browser requests outside the own Next origin are aborted and counted, including tiles. Server sockets outside loopback are denied by a private Node preload and logged. A headed runner uses the same contexts as the checks, but stops after its run. A separate demonstration browser must be declared separately. No screenshots substitute for a visible browser. Setup is not a behavior sensor. T2 requires fresh independent QA after the final source commit; this T1 harness does not mark Verified.

Ten versioned OWN paths in WEB: nine new files (six in this directory and three feature docs) plus the single approved normalizeAddress hunk in src/lib/public-church-utils.ts. The three matching ROOT docs are nongit canonical mirrors. Preservation verifies nominal source hashes/modes and HEAD/index bytes before/after. The four forbidden suffixes are lexical strings only, never materialized or inspected. Git status/diff must prepend the four literal exclusions even when paths are nominal. Commit remains under ROOT coordination.

## Verified LOCAL closure, 2026-10-31

Independent QA1 PASS evaluated source commit6da91fa43c73ec6dacf0fcfaf9f2f696ec4e3a49; its immutable validation.md SHA-256 is ed2e6b815c987aeb7e8d96b174fab4d34bb577748a9eead86e54a05f1c3d86e2. The report was recorded by documentation commit ea56b7441b8e670e753230e6fb838ad7eef5887b. Earlier pending-QA sentences above describe historical T1 checkpoints and are superseded by this dated result.

QA Full:110 evaluations at39 assertion sites,42checks as a SUBSET,6journeys,zero skips/pageerrors. Additional optimized LOCAL build: TypeScript enabled,21generated pages,78evaluations/30checksSUBSET/2journeys. NODE_ENV=production was local; strict release configuration was absent. Seven discrimination focuses included9actual fault executions and18controls with preliminary runs preserved,zero survivors. Actual post-commit prepare passed for105BASE+1OWN sources;13inherited WT deltas stayed outside the candidate.

Synthetic HTTP backend and blocked map/CDN resources remain limitations. The separate visible IAB demonstration is not UAT. This does not certify native app execution,iOS,real backend/DB,strict release readiness,operations,R32,distribution or V1global/publication. Historical failures and IO/mode/bytecode incidents remain preserved without retroactive guarantees. Android emulator preflight/functional work is for the next ROOT-scoped task; no such work starts in this closure.
