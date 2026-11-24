# Reviewable Cline setup

## Workspace and installation

From the repository root, open the app folder as the VS Code workspace:

```bash
code K2F
```

Record the absolute path to this folder for the demonstration. It contains the app manifest, project instructions, workspace rules, and extension recommendations.

Install Cline (`saoudrizwan.claude-dev`) from the workspace recommendations. In a WSL or remote window, confirm the extension is enabled on that host.

For a new checkout, follow the [app setup](../README.md#quick-start) and [Android guide](android-setup.md). An existing app installation needs no dependency changes for Cline.

## Active project instructions

- [Engineering standards and required skills](../AGENTS.md)
- [Review workflow](../.clinerules/01-review-workflow.md)
- **Ponytail:** [the workspace rule](../.clinerules/02-ponytail.md) favors the smallest complete change. Check that it is enabled in Cline's Rules panel. The project engineering and verification requirements still apply.
- **Supporting context:** the project/app READMEs and relevant existing architecture, theme, and feature-verification documents. These are references, not additional copies of the engineering rules.

Cline's official Rules documentation describes `AGENTS.md` and `.clinerules/` as supported instruction sources and provides a Rules panel with enable/disable controls. Verify detection in the installed version rather than assuming files are active just because they exist. Global rules and custom instructions can also affect a session; record applicable local settings and resolve conflicts before the demonstration. The numbered workflow filename organizes the rule; it is not a substitute for checking activation.

If detection fails, confirm the workspace folder, extension enablement, installed version, and Rules toggles; reload the window and start a fresh task. Explicitly attaching the files can help diagnose a problem, but does **not** prove automatic instruction detection. Do not report detection as passed until it is observed.

## Provider/model configuration (local, not committed)

Open Cline settings, choose a team-approved provider and available model, and complete that provider's authentication locally. Record the exact model identifier, not a guess based on the assistant's response. If Plan and Act have separate configurations, record both. Review provider data handling, access, and spending limits before sending project context. Keep manual approval for edits/commands during the review demonstration; inspect commands before approving them.

Do not add API keys, passwords, tokens, or private endpoint credentials to this repository, prompts, screenshots, or task exports. No provider-specific dependency or committed API configuration is required by this documentation setup.

| Local setting | Observed value |
| --- | --- |
| Demonstrator, date/time and timezone | to be recorded |
| Absolute workspace path and local/WSL/remote extension host | to be recorded |
| VS Code and installed Cline versions / enabled state | to be recorded |
| Provider and exact model ID (Plan / Act if different) | to be recorded |
| Authentication method (no secret values) | to be recorded |
| Approval/auto-approve settings and spending controls | to be recorded |
| Global rules/custom instructions affecting the task | to be recorded |
| Project Rules panel entries and enabled states | to be recorded |

These values have not been verified through the demonstrator's local Cline UI.

## Short professor-reproducible demonstration

1. Open the application workspace above. Record `git status --short` and the revision with `git rev-parse HEAD`. Preserve pre-existing work; do not reset the checkout.
2. Open Cline's Rules panel. Verify that `AGENTS.md` and `.clinerules/01-review-workflow.md` are detected and enabled. Capture the genuine panel and the workspace Explorer, following the [evidence guidance](ai-evidence/README.md).
3. Start a **fresh task in Plan mode**, without manually attaching the instruction files initially. Use this prompt:

   > Do not change files. Identify the active project instruction files and read them. Explain which file owns engineering standards versus review workflow. Restate acceptance criteria and propose a minimal plan to review client workout progress behavior, following the existing architecture. Find the relevant source and tests and give the repository's verification commands. Do not claim checks have run or that a human has approved anything.

4. Compare the answer and visible file reads with the actual instruction files. It should identify both instruction sources, use the existing architecture, propose scoped verification, and respect the no-edit constraint. A model naming a file alone is not proof that it was active; retain both Rules-panel and task evidence.
5. For a short execution/check example, switch to Act mode and ask:

   > Run npm run test:workouts, npx tsc --noEmit, and npm run lint from the application workspace. Do not edit files or fix failures. Report each actual exit status and distinguish observed results from checks not run.

   Approve each command after review. These commands come from the manifest and existing project instructions. Lint may fail on existing code; retain the actual output, do not label it a pass, and do not treat older documentation's test counts as current results.
6. Review the response and `git status --short` against the starting state. Complete a copied [task record](ai-usage.md), linking genuine outputs and screenshots. A human reviewer must supply their own review decision. This no-edit demo needs no commit; record that explicitly rather than inventing a link. A later approved implementation task can demonstrate a small diff and PR review separately.

**Demonstration status:** pending. Instruction detection, provider configuration, screenshots, and human review are not established by this document. Automated checks of this setup patch are separate from a professor's local demonstration.

## References

- [App setup and check commands](../README.md)
- [Engineering standards](../AGENTS.md)
- [Review workflow](../.clinerules/01-review-workflow.md)
- [Workout architecture](workout-architecture.md)
- [AI task-record template](ai-usage.md)
- [Evidence collection](ai-evidence/README.md)

Official Cline references consulted for setup behavior (URLs supplied as text for reproducibility):

```text
https://docs.cline.bot/getting-started/installing-cline
https://docs.cline.bot/customization/cline-rules
https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev
```
