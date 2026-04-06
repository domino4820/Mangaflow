# MangaFlow Project Theory Guide

## 1. Project Overview
MangaFlow is a monorepo using pnpm workspace with 3 main parts:
- apps/backend: NestJS API server
- apps/frontend: React + Vite web app
- packages/shared: shared code between apps

Main idea:
- Backend handles business logic, auth, data validation, and API contracts.
- Frontend handles UI, routing, client state, and user interaction.
- Shared package keeps types/constants/utils reused by both sides.

## 2. Monorepo and pnpm Workspace Theory
Core concepts:
- Workspace: multiple packages managed in one repository.
- Filter: run script for one package only.
- Shared lockfile: all dependencies are tracked in one lockfile at root.

Why it matters:
- Better consistency across backend/frontend.
- Easier type sharing.
- Faster installs with dependency reuse.

Useful commands:
- pnpm -r install
- pnpm --filter backend dev
- pnpm --filter frontend dev

## 3. NestJS Theory (Backend)
NestJS architecture is strongly inspired by modular and layered design.

Main building blocks:
- Module: feature boundary, groups providers/controllers.
- Controller: handles HTTP routes and request/response.
- Service (Provider): business logic, injected into controllers.
- Dependency Injection: Nest container resolves dependencies.

Request lifecycle:
- Middleware -> Guard -> Interceptor (before) -> Pipe -> Controller -> Service -> Interceptor (after) -> Exception Filter

Important backend theory to master:
- DTO and validation: validate incoming payload early.
- Pipes: transform and validate request data.
- Guards: authorization and access control.
- Interceptors: logging, response mapping, performance concerns.
- Exception filters: centralized error handling.
- Config module: environment driven configuration.

Testing model in NestJS:
- Unit test: service/controller logic in isolation.
- E2E test: full HTTP flow with app bootstrap.

## 4. ReactJS Theory (Frontend)
React is a declarative UI library based on components.

Core concepts:
- Component: reusable UI unit.
- Props: input data from parent.
- State: local mutable data.
- Re-render: UI updates when state/props change.
- Hooks: logic composition in function components.

Hooks to know deeply:
- useState: local state.
- useEffect: side effects and sync with external systems.
- useMemo/useCallback: performance optimization.
- custom hooks: reusable business/UI logic.

Mental model:
- Render should stay pure.
- Side effects belong in effects/events.
- Data flows down, events flow up.

## 5. Vite + TypeScript Theory
Vite focuses on fast dev startup and modern build pipeline.

Concepts:
- Dev server with native ESM.
- Production build with optimized bundling.
- Path alias for import readability (example: @/...).

TypeScript value:
- Strong typing for safer refactor.
- Better contracts between API and UI.
- Improved DX with autocomplete and compile-time checks.

## 6. Tailwind CSS v4 Theory
Tailwind v4 in this project is integrated via Vite plugin and CSS import.

Core idea:
- Utility-first styling: compose UI by atomic classes.
- Design tokens can be centralized with CSS variables.

v4 mindset:
- No old init flow required.
- Focus on CSS-first setup.
- Keep utility usage consistent with design system decisions.

## 7. shadcn/ui Theory
shadcn/ui is not a traditional component library package.
You generate/copy source components into your codebase and own them.

Important principles:
- Components are local code, fully editable.
- Built on accessible primitives (Radix UI pattern).
- Works very well with Tailwind utilities.

Why it is useful:
- Fast UI building without black-box dependencies.
- High customization for product design.
- Better long-term control over UI behavior.

## 8. Data Layer Theory (Axios + TanStack Query)
Recommended model:
- Axios: low-level HTTP client.
- TanStack Query: server state caching, refetch, stale management.

Concepts to learn:
- Query key design.
- Cache invalidation after mutation.
- Loading/error/success UI states.
- Background refetch and stale time.

## 9. Routing Theory (React Router)
Routing concepts:
- Route tree and nested routes.
- Layout routes for shared shell.
- Dynamic routes by params.
- Protected routes based on auth state.

## 10. Suggested Learning Path (4 Weeks)
Week 1:
- Monorepo basics, pnpm filters, NestJS module/controller/service.

Week 2:
- React core hooks, component composition, routing fundamentals.

Week 3:
- Tailwind v4 utilities, shadcn component structure, design consistency.

Week 4:
- TanStack Query patterns, API integration, error/loading strategy, testing basics.

## 11. Practice Checklist
- Build one CRUD feature end-to-end (backend + frontend).
- Add request validation with DTO in backend.
- Build form UI using shadcn components.
- Connect list/detail view with query caching.
- Add one unit test and one e2e test.

## 12. Quick Self-Check Questions
- Can you explain why service logic should not live in controllers?
- Can you distinguish client state vs server state?
- Can you explain when to invalidate a query key?
- Can you customize a shadcn component without breaking reuse?
- Can you trace one request from frontend button click to backend response?
