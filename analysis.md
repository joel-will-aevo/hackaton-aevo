# Kahoot Clone - Technical Analysis

## Overview
This document analyzes the technical approach for building a Kahoot clone using Next.js 16, PostgreSQL/Prisma, and Server-Sent Events (SSE) with username-only authentication.

## Key Decisions

### 1. Stack Selection
- **Frontend**: Next.js 16 (App Router) with TypeScript
  - Chosen for React 18 features, file-based routing, and SSR/SSG capabilities
  - App Router selected over Pages Router for improved data fetching and layouts
  - Custom UI components built with Tailwind CSS
    - Button, Input, Label, Card components
    - Game-specific components: AnswerOption, Timer, Scoreboard, PINDisplay
    - Kahoot-inspired color scheme with gradients
- **Backend**: Next.js API Routes (Node.js server)
  - Simplifies deployment (single process) vs separate API service
  - Sufficient for real-time quiz mechanics with SSE
- **Database**: PostgreSQL with Prisma ORM
  - Chosen for relational data structure (quizzes → questions → answers)
  - Provides type safety and migration management
- **Real-time**: Server-Sent Events (SSE)
  - Selected over WebSockets for simplicity (server→client only needed)
  - Built into browsers, no additional client library required
  - Adequate for quiz update frequency (question changes, score updates)

### 2. Authentication Approach
- **No traditional auth system**
- Players identify by **username only** per game session
- Host creates quiz without authentication (anyone can host)
- Username stored temporarily in `Player` record for session duration
- No password storage, session cookies, or token management
- Quiz persistence allows reuse (host can restart same quiz with new PIN)

### 3. Data Model
```mermaid
erDiagram
    Quiz ||||o Question : has
    Question ||||o Answer : has
    Quiz ||..o GameSession : uses
    GameSession ||..o Player : has
    
    Quiz {
        string id PK
        string title
        datetime createdAt
    }
    Question {
        string id PK
        string text
        int points
        int timeLimit
        string quizId FK
    }
    Answer {
        string id PK
        string text
        boolean isCorrect
        string questionId FK
    }
    GameSession {
        string id PK
        string pin UK
        string quizId FK
        string status
        int currentIndex
        datetime startedAt
        datetime endedAt
        datetime createdAt
    }
    Player {
        string id PK
        string sessionId FK
        string username
        int score
        boolean answered
        datetime joinedAt
    }
```

### 4. Real-time Communication (SSE)
#### Why SSE Fits This Use Case
- Unidirectional flow: Server (host actions) → Clients (players)
- No need for client-to-server real-time (answers use standard POST)
- Simpler implementation than WebSockets
- Automatic reconnection handling in browsers
- Low overhead for infrequent updates (every question change)

#### Implementation Approach
- Per-session listener map: `Map<string, Response[]>` (pin → array of SSE writers)
- Broadcast function sends `data: {JSON}\n\n` to all listeners for a session
- Initial state sent on connection
- Keep-alive comments (`: ping\n\n`) every 15 seconds
- Cleanup on client disconnect (abort signal)

#### State Transitions Triggering Broadcasts
1. Host starts game (`waiting` → `active`)
2. Player answers question (score update)
3. Host advances to next question
4. Timer expires (auto-advance)
5. Game finishes (`active` → `finished`)

### 5. Game Flow
#### Host Perspective
1. Creates quiz (title, questions with 4 options each, 1 correct)
2. Starts game → system generates 6-digit PIN
3. Shares PIN with players
4. Views lobby: list of joined usernames
5. Starts timer for first question
6. After time limit or all answers submitted:
   - Shows correct answer
   - Awards points
   - Advances to next question (or ends quiz)

#### Player Perspective
1. Enters PIN + username on home page
2. Joins lobby (sees waiting status)
3. When game starts:
   - Sees question + shuffled options
   - Submits answer (disables selection)
   - Waits for next question
4. Sees score updates after each question
5. Views final scoreboard at end

### 6. Key Implementation Considerations

#### Answer Shuffling for Anti-Cheating
- Answers stored in DB in host-created order
- Before sending to each player via SSE: shuffle the options array
- Backend maintains mapping between displayed option and correct answer ID
- Player submits by option ID (not position) → score validation unaffected

#### Time Limit Handling
- Server starts timer when question becomes active
- SSE sends initial `timeRemaining` and updates every second
- When timer hits 0:
  - Automatically mark unanswered players as incorrect
  - Broadcast final scores for question
  - Host (or auto-advance) moves to next question

#### Score Calculation
- Points per question configurable (default 100)
- Formula: `pointsAwarded = questionPoints * (timeRemaining / timeLimit)`
  - Encourages faster correct answers
  - Minimum 0 points for correct answer
  - Incorrect answer = 0 points

#### Error Handling & Validation
- Quiz creation: validate 4 options, exactly 1 correct
- Join session: validate PIN exists, session not finished
- Answer submit: validate player belongs to session, not already answered
- All API routes return appropriate HTTP status codes (400, 404, 409, etc.)

### 7. Open Questions & Risks
1. **Scalability of SSE**: 
   - Risk: Many concurrent sessions could exhaust server connections
   - Mitigation: For MVP acceptable; future switch to WebSocket + Redis PubSub if needed

2. **Host Cheating Detection**:
   - Risk: Host could manipulate answers after submission
   - Mitigation: Answers locked on submit; host only sees aggregate results until reveal

3. **Quiz Builder UX**:
   - Risk: Creating 4 options per question is tedious
   - Mitigation: Form validation, option duplication, keyboard navigation

4. **Mobile Experience**:
   - Risk: Small screens for answer buttons
   - Mitigation: Touch-friendly minimum size, vertical stacking

5. **Data Persistence**:
   - Risk: Quiz data survives server restart, but sessions do not
   - Accepted: Designed for ephemeral game sessions; quiz reuse via PIN regeneration

### 8. Next Steps
1. Initialize project with analysis decisions
2. Implement core data model and validation
3. Build API endpoints with SSE broadcaster
4. Create React components for quiz flow
5. Integrate styling and responsiveness
6. Test end-to-end game loop
