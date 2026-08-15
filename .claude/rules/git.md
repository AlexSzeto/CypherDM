## Git Workflow

- **Never commit directly to `main`.** Every commit lands on a feature branch. The remote blocks non-PR merges to `main` anyway, so a direct commit there is always a dead end — cut or switch to the relevant feature branch (`implement-feature`) before committing, and let uncommitted changes carry over onto it rather than committing them on `main` first.
- This applies to every skill and every direct git action, not just `stage-and-commit`'s branch guard — no skill, prompt, or user request overrides it. If asked to commit while `main` is checked out, stop and name the correct branch to switch to instead.
