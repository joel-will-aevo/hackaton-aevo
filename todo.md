# Kahoot Clone - Implementation TODO List

## Project Setup
- [x] Initialize Next.js 16 TypeScript project
- [x] Set up PostgreSQL database (Docker/local)
- [x] Install dependencies: prisma, @prisma/client, zod
- [x] Initialize Prisma with PostgreSQL provider
- [x] Configure Tailwind CSS for styling
- [x] Set up ESLint and Prettier for code quality
- [x] Install clsx and tailwind-merge for utility functions

## Database Layer
- [x] Define Prisma schema (Quiz, Question, Answer, GameSession, Player)
- [ ] Create initial migration (`npx prisma migrate dev --name init`)
- [ ] Generate Prisma client (`npx prisma generate`)
- [x] Set up Prisma client singleton utility

## API Routes
### Quiz Management
- [x] Implement POST /api/quizzes (create quiz)
- [ ] Implement GET /api/quizzes/:id (get quiz details)
- [ ] Implement GET /api/quizzes (list quizzes)
- [ ] Implement PUT /api/quizzes/:id (update quiz - optional)
- [ ] Implement DELETE /api/quizzes/:id (delete quiz - optional)

### Session Management
- [x] Implement POST /api/sessions (create game session with PIN)
- [x] Implement GET /api/sessions (get session by PIN)
- [x] Implement POST /api/sessions/[pin]/join (player joins with username)
- [x] Implement POST /api/sessions/[pin]/answer (submit answer)
- [x] Implement POST /api/sessions/[pin]/next (host advances question)
- [x] Implement POST /api/sessions/[pin]/start (host starts game)

### Real-time Updates (SSE)
- [x] Implement SSE broadcaster utility (per-pin listener map)
- [x] Implement GET /api/sessions/[pin]/events (SSE endpoint)
- [x] Add keep-alive mechanism (ping every 30s)
- [x] Implement cleanup on client disconnect
- [x] Create broadcast functions for different event types:
  - [x] Game state update (player scores)
  - [x] Player joined notifications
  - [x] Game start/end signals
  - [x] Question advancement

## Frontend Components
### Layout & Navigation
- [x] Create root layout (app/layout.tsx)
- [x] Create global styles with Tailwind
- [x] Implement responsive container component

### Pages
#### Home Page (app/page.tsx)
- [x] Create quiz creation section
- [x] Create game join section (PIN + username input)
- [x] Add navigation to quiz builder

#### Quiz Builder (app/create-quiz/page.tsx)
- [x] Quiz title input
- [x] Dynamic question builder:
  - [x] Question text input
  - [x] 4 answer options inputs (with correct answer selection)
  - [x] Points per question input
  - [x] Time limit per question input
  - [x] Add/remove question buttons
- [x] Validation: exactly 4 options, 1 correct per question
- [x] "Start Game" button to create session

#### Game Lobby (app/game/[pin]/page.tsx)
- [x] Display PIN prominently
- [x] Show list of joined usernames
- [x] Host controls: Start Game button
- [x] Auto-update player list via SSE
- [x] Show waiting for host to start

#### Game Play (app/game/[pin]/page.tsx)
- [x] Display current question text
- [x] Show 4 answer options (shuffled order per player)
- [x] Display timer counting down
- [x] Disable options after selection
- [x] Submit answer button (or auto-submit on select)
- [x] Show correctness feedback after submission/wait
- [x] Display current score
- [x] Show waiting for next question indicator

#### Game Results (app/game/[pin]/page.tsx)
- [x] Display final scoreboard (ranked by score)
- [x] "Play Again" button (resets to lobby with new PIN)
- [x] "Create New Quiz" button

### Components & Hooks
- [x] Create AnswerOption component (button with state)
- [x] Create Timer component (circular countdown display)
- [x] Create Scoreboard component (ranked list)
- [x] Create PINDisplay component (large, readable code)
- [ ] Create LoadingSpinner component
- [ ] Create ErrorBoundary component

## Game Logic
- [x] Implement question shuffling per player (anti-cheating)
- [ ] Implement timer logic (server-side countdown)
- [x] Implement score calculation (simple points without time bonus)
- [x] Implement answer validation (check isCorrect by ID)
- [ ] Implement auto-advance on timer expiry
- [x] Implement host manual advance functionality
- [x] Implement game state transitions (waiting→active→finished)
- [ ] Implement session cleanup (optional: delete old sessions)

## Styling & UI/UX
- [x] Implement responsive design (mobile-first)
- [x] Create Kahoot-inspired color scheme (gradients, bright colors)
- [x] Add gradient backgrounds
- [x] Ensure accessible color contrast
- [x] Add touch-friendly minimum sizes for buttons
- [x] Implement proper loading states
- [x] Add form validation feedback

## Testing & Validation
- [ ] Manual testing of:
  - [ ] Quiz creation flow
  - [ ] Join game flow
  - [ ] Full game play (host + multiple players)
  - [ ] Answer submission and scoring
  - [ ] Timer expiration handling
  - [ ] Shuffled answer verification
  - [ ] SSE reconnection handling
- [ ] Edge case testing:
  - [ ] Duplicate usernames in same session
  - [ ] Invalid PIN entry
  - [ ] Answer submission after time limit
  - [ ] Host advancing before time limit
  - [ ] Multiple rapid answer submissions
- [ ] Performance testing:
  - [ ] SSE connection handling
  - [ ] Database query optimization
  - [ ] Payload size minimization

## Deployment Preparation
- [x] Create docker-compose.yml for PostgreSQL
- [x] Create .env.example file
- [ ] Document setup instructions
- [ ] Create vercel.json for Vercel deployment (if applicable)
- [ ] Add build and start scripts to package.json

## Optional Enhancements (Post-MVP)
- [ ] Quiz sharing via direct link
- [ ] Sound effects (correct/incorrect, timer)
- [ ] Background music options
- [ ] Customizable themes/colors
- [ ] Image support in questions/answers
- [ ] Team mode (split players into teams)
- [ ] Ghost mode (play against previous scores)
- [ ] Public quiz directory
- [ ] Quiz duplication/favoriting
- [ ] Detailed analytics/reports for hosts
