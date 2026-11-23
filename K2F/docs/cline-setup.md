# Reviewable Cline setup

## Workspace and installation

Open the application folder, not just its parent repository, as the VS Code workspace:

```bash
cd /root/workspace/github.com/DorkWitAFork/Keys2Fitness/K2F
code .
```

This is the path in the inspected environment; on another machine, use the equivalent absolute checkout path ending in `Keys2Fitness/K2F` and record it. The package manifest, project instructions, workspace rules, and VS Code recommendations are all in this folder. Opening only the parent folder is not the setup verified by the procedure below.

In VS Code Extensions, open workspace recommendations and install **Cline**, identifier `saoudrizwan.claude-dev`. Keep the existing Expo Tools recommendation (`expo.vscode-expo-tools`). A recommendation does not install or enable an extension automatically. In WSL/remote VS Code, confirm Cline is enabled in the window where this workspace is open; record the extension host actually used.

Use the app's documented Node.js 22.23+ or newer compatible LTS setup. For a fresh dependency installation and app launch:

```bash
cd /root/workspace/github.com/DorkWitAFork/Keys2Fitness/K2F
npm ci
npm start
```

For an existing installation, do not reinstall dependencies merely to demonstrate Cline. The package also provides `npm run android`, `npm run ios`, and `npm run web`. Follow the project README for Firebase access and compatible Expo Go requirements. The manifest currently specifies Expo SDK 58; the SDK 57 passages in the older Android setup guide are stale. Installing Cline does not configure Firebase or an emulator.

## Active project instructions

- **Engineering source of truth:** `/root/workspace/github.com/DorkWitAFork/Keys2Fitness/K2F/AGENTS.md` (unchanged by this setup).
- **Review workflow:** `/root/workspace/github.com/DorkWitAFork/Keys2Fitness/K2F/.clinerules/01-review-workflow.md`.
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
