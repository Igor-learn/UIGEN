# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and the AI generates React components using a virtual file system (no files written to disk). The app provides a split-view interface with chat, code editor, and live preview.

## Development Commands

```bash
# Setup (install deps, generate Prisma client, run migrations)
npm run setup

# Start dev server with Turbopack
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Reset database (destructive)
npm run db:reset

# Generate Prisma client after schema changes
npx prisma generate

# Create and apply database migrations
npx prisma migrate dev
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TypeScript, Tailwind CSS v4, shadcn/ui (New York style)
- **Database**: Prisma with SQLite (schema in `prisma/schema.prisma`)
- **AI**: Anthropic Claude via Vercel AI SDK, with mock provider fallback
- **Testing**: Vitest with React Testing Library

### Key Architectural Concepts

#### Virtual File System (`src/lib/file-system.ts`)
- The `VirtualFileSystem` class manages an in-memory file tree
- Files are stored as `FileNode` objects with type, name, path, content, and children
- No actual files are written to disk during component generation
- Serializes/deserializes to JSON for database persistence

#### AI Integration (`src/lib/provider.ts` and `src/app/api/chat/route.ts`)
- Uses `streamText` from Vercel AI SDK for streaming responses
- Two provider modes:
  - **Real**: Uses Claude (Haiku 4.5) when `ANTHROPIC_API_KEY` is set
  - **Mock**: Returns static code examples when no API key is present
- Tools provided to AI:
  - `file_manager`: Create, read, update, delete files in virtual FS
  - `str_replace_editor`: Make precise edits to file contents
- System prompt in `src/lib/prompts/generation.tsx`

#### JSX Transformation (`src/lib/transform/jsx-transformer.ts`)
- Transforms TypeScript/JSX code to executable JavaScript using Babel
- Handles missing imports by creating placeholder modules
- Detects CSS imports for styling support
- Used by preview frame to render generated components in real-time

#### Authentication (`src/lib/auth.ts`)
- JWT-based session management using `jose` library
- Anonymous users can create projects (tracked by `src/lib/anon-work-tracker.ts`)
- Registered users get persistent project storage
- Passwords hashed with bcrypt

#### Database Schema
- **User**: id, email, password, timestamps
- **Project**: id, name, userId (nullable), messages (JSON), data (JSON), timestamps
- Projects can belong to users or be anonymous
- Prisma client generated to `src/generated/prisma/`

### Directory Structure

```
src/
├── actions/           # Server actions for CRUD operations (create-project, get-project, get-projects)
├── app/              # Next.js App Router pages and API routes
│   ├── api/chat/     # Chat API endpoint (POST handler for AI streaming)
│   ├── [projectId]/  # Dynamic project page
│   └── page.tsx      # Home page
├── components/
│   ├── auth/         # Authentication dialogs and forms
│   ├── chat/         # Chat interface, message list, input, markdown renderer
│   ├── editor/       # Code editor (Monaco), file tree
│   ├── preview/      # Preview frame (renders generated components)
│   └── ui/           # shadcn/ui components
├── hooks/
│   └── use-auth.ts   # Authentication state management
├── lib/
│   ├── auth.ts           # JWT session management
│   ├── file-system.ts    # Virtual file system implementation
│   ├── provider.ts       # AI provider (real/mock) selection
│   ├── prisma.ts         # Prisma client singleton
│   ├── anon-work-tracker.ts  # Anonymous user project tracking
│   ├── contexts/         # React contexts
│   ├── prompts/          # AI system prompts
│   ├── tools/            # AI tools (file-manager, str-replace)
│   └── transform/        # JSX transformation for preview
└── generated/prisma/     # Generated Prisma client (do not edit)
```

## Development Guidelines

### Code Style
- Use comments sparingly. Only comment complex code where the logic isn't self-evident.

### Working with Database
- The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the data structure stored in the database.
- After modifying `prisma/schema.prisma`, always run:
  1. `npx prisma generate` (regenerate client)
  2. `npx prisma migrate dev` (create and apply migration)
- The Prisma client is generated to `src/generated/prisma/` (configured in schema)

### Working with AI Features
- System prompt is in `src/lib/prompts/generation.tsx` - modify to change AI behavior
- Tools are defined in `src/lib/tools/` - each returns a Vercel AI SDK tool definition
- The mock provider (`MockLanguageModel`) simulates AI behavior without API calls
- To test with real AI, set `ANTHROPIC_API_KEY` in `.env`

### Working with Virtual File System
- Use `VirtualFileSystem` methods: `createFile`, `readFile`, `updateFile`, `deleteFile`
- File paths must start with `/` (automatically normalized)
- Serialize with `serializeToNodes()` for JSON storage
- Deserialize with `deserializeFromNodes()` to reconstruct

### Working with Preview
- Preview frame (`src/components/preview/PreviewFrame.tsx`) uses an iframe
- JSX is transformed via `transformJSX()` before rendering
- Missing imports are auto-generated as placeholder components
- CSS imports are tracked but not processed (Tailwind is available in iframe)

### Adding UI Components
- Use shadcn/ui CLI: `npx shadcn@latest add <component-name>`
- Components install to `src/components/ui/`
- Path aliases configured in `components.json` (@/components, @/lib, etc.)

### Testing
- Tests use Vitest + React Testing Library + jsdom
- Test files: `*.test.tsx` or `*.test.ts` in `__tests__/` directories
- Run single test file: `npm test -- path/to/file.test.tsx`
- Run in watch mode: `npm test -- --watch`

## Important Notes

- The app uses a Node.js compatibility shim (`node-compat.cjs`) for Next.js - this is required for dev/build/start scripts
- All database interactions use server actions (in `src/actions/`) or API routes - never call Prisma from client components
- File system operations are synchronous in-memory - no async needed
- Anonymous users lose projects on logout (tracked in memory/cookies, not persisted)
- Tailwind CSS v4 is used (different from v3 - check official docs for breaking changes)
