# Reviewable task workflow

- Read `AGENTS.md` at the workspace root before proposing changes. It remains the source of engineering standards; this file adds review workflow only. Follow its requirements and the relevant existing architecture/documentation rather than inventing parallel standards.
- Restate the acceptance criteria, scope, constraints, and planned verification. Inspect the relevant implementation, package scripts, and existing tests first; ask about material ambiguity instead of guessing.
- Propose a small, reviewable plan. Respect Plan mode and explicit read-only requests. Keep changes within the agreed scope; separate unrelated findings from the patch.
- Verify the diff and run the checks required by `AGENTS.md` plus task-relevant checks. Distinguish baseline failures from new failures using observed evidence, not assumptions. Do not fix unrelated issues silently.
- Report files changed, acceptance-criteria coverage, exact commands and actual results, limitations, and checks not run. Never invent passing checks, screenshots, human approval, or commit/PR links.
- Use `docs/ai-usage.md` for task records and `docs/ai-evidence/README.md` for evidence guidance. Leave human review and missing evidence pending until they occur. Do not commit credentials or private account data, and do not commit or publish changes unless requested.