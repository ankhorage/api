# AGENTS.md

## Repository

Package: `@ankhorage/api`

Framework-neutral executable API runtime for Ankhorage. It consumes portable API definitions from `@ankhorage/contracts` and owns request/response normalization, handler registration, operation dispatch, and transport-adapter contracts.

## Current architecture only

Only the current Ankhorage architecture is valid. Do not add deprecated APIs, compatibility aliases, shims, dual old/new paths, or framework-specific behavior to the core runtime.

Cross-package usage must go through published public APIs and declared dependencies.

## Required repository instructions

Before changing any file, inspect `.agents/skills/` when present. Load the Ankhorage coding rules and project-structure rules for implementation work, plus hexagonal architecture for boundary changes.

## Scope

This package must not import Fastify, Next.js, React, filesystem, process, or provider SDKs. Portable serializable API definitions remain owned by `@ankhorage/contracts`. Framework adapters belong in dedicated packages such as `@ankhorage/api-fastify` and `@ankhorage/api-nextjs`.
