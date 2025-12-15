# CostSense Backend API

Backend API server for CostSense Budget Coach mobile application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod


## Setup

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. (Optional) Seed the database:
```bash
npm run prisma:seed
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Run migrations
npx prisma migrate dev

# Seed database (optional - creates test user)
npx prisma db seed
```

**Test User Credentials (after seeding):**
- Email: `test@example.com`
- Password: `password123`

### 3. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:8000`

### 4. View Database (Optional)
```bash
npx prisma studio
```

Opens at `http://localhost:5555`
