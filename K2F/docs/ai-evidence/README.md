# Genuine AI-workflow evidence

This directory is for evidence collected during real team tasks and the demonstration in `../cline-setup.md`. **Collection status: pending.** This README is guidance, not proof that screenshots, a demonstration, or human review already exist. Existing app screenshots elsewhere in the project do not prove Cline setup or instruction use.

## What to collect

For each task, create a clearly named subdirectory (task/story ID and actual capture date) and include a copied, completed task record from `../ai-usage.md` plus the relevant artifacts:

1. **Workspace and installation:** VS Code Explorer showing the application workspace, `AGENTS.md`, and `.clinerules/01-review-workflow.md`; Cline's installed/enabled extension and version.
2. **Instruction activation:** the real Rules panel showing the detected project files and enabled states. Capture relevant global/custom instruction state without exposing personal content. A file visible in Explorer alone does not prove activation.
3. **Configuration:** provider and model identifiers, relevant Plan/Act and approval settings, with secret values excluded. Unobserved values remain “to be recorded.”
4. **Task interaction:** the actual prompt, acceptance criteria, plan, relevant file reads, approvals, and final response. A sanitized task export can supplement screenshots; it must not replace missing execution evidence with a narrative assertion.
5. **Changes and checks:** the actual diff (or before/after Git status for a no-edit task), exact check commands, exit statuses, and output. Include failed checks and skipped checks honestly. Capture an emulator only when UI behavior was actually tested, identifying mock/local/Firebase data and the device configuration.
6. **Human review and traceability:** the named reviewer's actual feedback and decision, linked task record, and real commit/PR link when one exists. Leave these pending until they occur. For a verified no-edit demo, explain why no commit is applicable.

## Integrity and privacy

- Capture the running tools and real outputs. Do not fabricate screenshots, terminal output, approval, timestamps, test results, or reviewer comments. Do not relabel older screenshots as evidence of a new task.
- Name artifacts descriptively and record capture date/time/timezone, capturer, branch/revision, workspace, tool versions, and the claim each artifact supports. Keep links from the task record to each artifact.
- Do not capture passwords, API keys, auth tokens, private messages, client health information, or personal account details. Check exports and logs as well as images before committing. If redaction/cropping is necessary, mark it and preserve enough non-sensitive context to evaluate the claim; follow team policy for any originals kept outside Git.
- A screenshot of passing tests proves only that captured run, not human approval or every platform. A model saying it followed instructions is not sufficient alone; retain the activation and behavior evidence together.
- Keep evidence focused and reasonably sized. Do not commit entire chat/storage directories, dependency folders, billing records, or unrelated emulator data. Add no placeholder screenshots or fake sample logs.

## Pending collection checklist

- [ ] Workspace, installed Cline version, and enabled project rules captured.
- [ ] Provider/model and relevant local settings recorded without secrets.
- [ ] Genuine prompt/plan/task interaction saved.
- [ ] Actual diff/status and check results saved, including failures.
- [ ] Human reviewer completed the review fields.
- [ ] Task record links resolve; commit/PR linked only if it exists.

Do not tick items merely because these instructions were written.