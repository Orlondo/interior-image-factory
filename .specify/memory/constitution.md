<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.0.1
- Modified principles:
	- I. Clean Code First -> I. Clean Code First
- Added sections:
	- None
- Removed sections:
	- None
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md
	- ✅ .specify/templates/spec-template.md
	- ✅ .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/commands/*.md (directory not present)
- Deferred items:
	- None
-->

# Interior Image Factory Constitution

## Core Principles

### I. Clean Code First
All production code MUST be readable, intentionally named, and bounded in
complexity. Functions and components MUST have a clear single responsibility,
and dead code or speculative abstractions MUST NOT be merged. Modules MUST be
organized around cohesive responsibilities and reuse common logic rather than
duplicating behavior.

When implementing in this repository, code MUST follow current Next.js best
practices for App Router structure, data fetching, server/client boundaries,
and route-handler conventions.

Rationale: This project evolves quickly; maintainability and safe iteration
depend on code clarity and low cognitive load.

### II. Simple UI By Default
UI changes MUST prioritize clarity and task completion over novelty. New
controls MUST be understandable without documentation, and defaults MUST be
safe for first-time users.

Rationale: The product is configuration-heavy. Simple UI decisions reduce user
error and support faster experimentation.

### III. Responsive Design Required
All user-facing layouts MUST remain functional on common mobile and desktop
viewport sizes. New features MUST preserve tap targets, readable text, and
usable control flow at small widths.

Rationale: Users run image-generation workflows from mixed devices; broken
responsive behavior directly reduces feature usefulness.

### IV. Minimal Dependencies Policy
New dependencies MUST be justified by clear value that cannot be met by the
existing stack or small internal utilities. Dependency additions MUST include
scope impact review and MUST avoid redundant libraries.

Rationale: Smaller dependency surface reduces security risk, upgrade churn, and
runtime complexity.

## Engineering Standards

- TypeScript strictness and lint cleanliness are required gates for completion.
- API payload validation MUST be explicit for user-provided options.
- Prompt or generation logic changes MUST preserve deterministic defaults where
	possible.
- Next.js changes MUST use framework-native patterns before introducing custom
	abstractions.

## Workflow And Quality Gates

- Every feature task MUST map to a user-visible outcome and include validation.
- PR review MUST confirm compliance with all four core principles.
- Responsive checks and dependency impact checks MUST be included in review
	notes when relevant.

## Governance

This constitution supersedes local conventions when conflicts occur.

Amendment process:
- Propose a change in a PR with rationale and impacted templates/files.
- Obtain maintainer approval before merge.
- Record semantic version updates in this file.

Versioning policy:
- MAJOR: incompatible governance changes or principle removals/redefinitions.
- MINOR: new principle/section or materially expanded guidance.
- PATCH: clarifications and editorial improvements without policy change.

Compliance review expectations:
- Plan, spec, and tasks artifacts MUST reflect current principles.
- Runtime implementation reviews MUST check clean code, simple UI,
	responsiveness, and dependency minimalism.

**Version**: 1.0.1 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-10
