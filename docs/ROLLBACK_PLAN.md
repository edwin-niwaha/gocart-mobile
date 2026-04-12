# Mobile Rollback Plan

## When to rollback
- auth is broken in production builds
- checkout is failing broadly
- branded configuration points to the wrong tenant
- push notifications crash the app or fail for all users

## Rollback steps
1. Stop rollout in the store console.
2. Rebuild or re-promote the last known good release.
3. Point users to the previous backend environment if required.
4. Verify login, home, checkout, and order history on the restored release.
5. Publish a hotfix only after reproducing and fixing the issue in staging.
