# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Added a new repository skill at `.github/skills/github-actions-updater/SKILL.md` to automate GitHub Actions reference maintenance.
- The skill defines a full workflow to:
  - Discover all workflow `uses:` references.
  - Upgrade and/or pin actions to immutable commit SHAs with version comments.
  - Validate updated workflows.
  - Update this `CHANGELOG.md` with a concise summary of action reference changes.

### Changed

- 2026-06-30: GitHub Actions reference maintenance across workflows.
- Updated 66 action references across 14 workflow files.
- Upgraded and pinned: 66
- Pin-only updates: 0
- Updated actions (old ref -> new ref):
  - actions/cache: v4 -> 55cc8345863c7cc4c66a329aec7e433d2d1c52a9 (# v6.1.0)
    - Affected files: .github/workflows/pre-commit.yml, .github/workflows/publish-image-benchmark-runner.yml, .github/workflows/publish-image-k6-runner.yml, .github/workflows/publish-image-keycloak-benchmark.yml, .github/workflows/publish-image-keycloak.yml, .github/workflows/publish-image-maintenance.yml, .github/workflows/publish-image-rhbk-dev.yml, .github/workflows/siteminder-fetch-attributes.yml, .github/workflows/siteminder-tests.yml
  - actions/checkout: v3, v4 -> 9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 (# v7.0.0)
    - Affected files: .github/workflows/pre-commit.yml, .github/workflows/publish-devhub.yml, .github/workflows/publish-image-backup-storage-gold.yml, .github/workflows/publish-image-benchmark-runner.yml, .github/workflows/publish-image-k6-runner.yml, .github/workflows/publish-image-kc-cron-job.yml, .github/workflows/publish-image-keycloak-benchmark.yml, .github/workflows/publish-image-keycloak.yml, .github/workflows/publish-image-maintenance.yml, .github/workflows/publish-image-rhbk-dev.yml, .github/workflows/publish-kc-cron-production.yml, .github/workflows/siteminder-fetch-attributes.yml, .github/workflows/siteminder-tests.yml, .github/workflows/unit-test.yml
  - actions/setup-node: v4 -> 48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e (# v6.4.0)
    - Affected files: .github/workflows/siteminder-fetch-attributes.yml, .github/workflows/siteminder-tests.yml, .github/workflows/unit-test.yml
  - actions/upload-artifact: v4 -> 043fb46d1a93c77aae656e7c1c64a875d1fc6a0a (# v7.0.1)
    - Affected files: .github/workflows/siteminder-tests.yml
  - asdf-vm/actions/install: v4 -> b7bcd026f18772e44fe1026d729e1611cc435d47 (# v4.0.1)
    - Affected files: .github/workflows/pre-commit.yml
  - asdf-vm/actions/setup: v4 -> b7bcd026f18772e44fe1026d729e1611cc435d47 (# v4.0.1)
    - Affected files: .github/workflows/pre-commit.yml
  - bcgov/devhub-techdocs-publish: stable -> 80990c38c4d919f017f49721d857f99c052e6abb (# v0.2.1)
    - Affected files: .github/workflows/publish-devhub.yml
  - docker/build-push-action: v3, v5 -> f9f3042f7e2789586610d6e8b85c8f03e5195baf (# v7.2.0)
    - Affected files: .github/workflows/publish-image-backup-storage-gold.yml, .github/workflows/publish-image-benchmark-runner.yml, .github/workflows/publish-image-k6-runner.yml, .github/workflows/publish-image-kc-cron-job.yml, .github/workflows/publish-image-keycloak-benchmark.yml, .github/workflows/publish-image-keycloak.yml, .github/workflows/publish-image-maintenance.yml, .github/workflows/publish-image-rhbk-dev.yml, .github/workflows/siteminder-fetch-attributes.yml, .github/workflows/siteminder-tests.yml
  - docker/login-action: v2, v3 -> 650006c6eb7dba73a995cc03b0b2d7f5ca915bee (# v4.2.0)
    - Affected files: .github/workflows/publish-image-backup-storage-gold.yml, .github/workflows/publish-image-benchmark-runner.yml, .github/workflows/publish-image-k6-runner.yml, .github/workflows/publish-image-kc-cron-job.yml, .github/workflows/publish-image-keycloak-benchmark.yml, .github/workflows/publish-image-keycloak.yml, .github/workflows/publish-image-maintenance.yml, .github/workflows/publish-image-rhbk-dev.yml, .github/workflows/publish-kc-cron-production.yml
  - docker/metadata-action: v5 -> 80c7e94dd9b9319bd5eb7a0e0fe9291e23a2a2e9 (# v6.1.0)
    - Affected files: .github/workflows/publish-image-kc-cron-job.yml, .github/workflows/publish-image-maintenance.yml
  - docker/setup-buildx-action: v1, v3 -> d7f5e7f509e45cec5c76c4d5afdd7de93d0b3df5 (# v4.1.0)
    - Affected files: .github/workflows/publish-image-benchmark-runner.yml, .github/workflows/publish-image-k6-runner.yml, .github/workflows/publish-image-keycloak-benchmark.yml, .github/workflows/publish-image-keycloak.yml, .github/workflows/publish-image-maintenance.yml, .github/workflows/publish-image-rhbk-dev.yml, .github/workflows/siteminder-fetch-attributes.yml, .github/workflows/siteminder-tests.yml
  - fjogeleit/http-request-action: v1 -> 551353b829c3646756b2ec2b3694f819d7957495 (# v2.0.0)
    - Affected files: .github/workflows/siteminder-tests.yml
  - softprops/action-gh-release: v2 -> 718ea10b132b3b2eba29c1007bb80653f286566b (# v3.0.1)
    - Affected files: .github/workflows/publish-image-keycloak.yml
  - wagoid/commitlint-github-action: v5 -> b948419dd99f3fd78a6548d48f94e3df7f6bf3ed (# v6.2.1)
    - Affected files: .github/workflows/pre-commit.yml
