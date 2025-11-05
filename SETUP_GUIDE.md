# Quick Setup Guide

This guide will help you get the Text RPG Game running on your local machine.

## Prerequisites

Make sure you have the following installed:
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **Redis** server ([Installation guide](https://redis.io/docs/getting-started/))
- **Git**

## Quick Start (5 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/pedguedes090/textgame.git
cd textgame

# Install backend dependencies
cd api
npm install
cd ..

# Install frontend dependencies
cd web
npm install
cd ..
```

### Step 2: Start Redis

**On Linux/Mac:**
```bash
redis-server
```

**On Windows:**
- Download Redis from [https://github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases)
- Or use WSL2 and run `redis-server`

### Step 3: Set up Backend

```bash
cd api

# Create data directory
mkdir -p data

# Copy environment file (already done, but verify it exists)
cp .env.example .env

# Run database migrations
npm run migration:run

# Seed the database with initial data
npm run seed

# Start the backend server
npm run start:dev
```

The backend will start on **http://localhost:3000**
API documentation available at **http://localhost:3000/api**

### Step 4: Set up Frontend

Open a new terminal window:

```bash
cd web

# Verify .env.local exists (should contain NEXT_PUBLIC_API_URL=http://localhost:3000)
cat .env.local

# Start the frontend server
npm run dev
```

The frontend will start on **http://localhost:3001**

### Step 5: Test the Application

1. Open your browser and go to **http://localhost:3001**
2. Click "Register" to create a new account
3. Fill in the registration form:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
4. After registration, you'll be automatically logged in
5. Try the following features:
   - **Hunt**: Capture creatures
   - **Creatures**: View your captured creatures
   - **Gacha**: Pull for rare creatures
   - **Dungeons**: Challenge bosses
   - **Shop**: Buy and sell items

## Troubleshooting

### Redis Connection Error

**Error:** `Redis connection error: connect ECONNREFUSED`

**Solution:** Make sure Redis is running:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:** Change the port in `api/.env`:
```env
PORT=3001  # or any available port
```

Also update `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Errors

**Error:** `Migration errors` or `Database connection failed`

**Solution:**
```bash
cd api
rm -rf data/game.db*  # Delete existing database
npm run migration:run  # Re-run migrations
npm run seed          # Re-seed data
```

### Frontend Build Errors

**Error:** `Module not found` or dependency errors

**Solution:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Using Docker (Alternative Setup)

If you prefer Docker, you can run everything with a single command:

```bash
# Make sure Docker is installed and running
docker --version

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Redis: localhost:6379

## Next Steps

After successfully running the application:

1. **Explore the API**: Visit http://localhost:3000/api to see all available endpoints
2. **Check the README**: Read the full README.md for detailed documentation
3. **Review the Code**: Explore the codebase to understand the architecture:
   - `api/src/modules/` - Feature modules (auth, creatures, dungeons, etc.)
   - `web/app/` - Frontend pages
   - `api/src/entities/` - Database models

## Development Workflow

### Backend Development

```bash
cd api

# Watch mode - auto-restart on changes
npm run start:dev

# Run tests
npm run test

# Check code style
npm run lint
```

### Frontend Development

```bash
cd web

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Check code style
npm run lint
```

## Getting Help

- **Issues**: Open an issue on GitHub
- **API Documentation**: http://localhost:3000/api
- **Full Documentation**: See README.md in the root directory

## Success Indicators

You'll know everything is working when:

✅ Backend starts without errors and shows:
```
🚀 API running on http://localhost:3000
📚 Swagger docs: http://localhost:3000/api
```

✅ Frontend starts without errors and shows:
```
▲ Next.js 14.0.4
✓ Ready in X.Xs
○ Local: http://localhost:3001
```

✅ You can register, login, and perform game actions

Enjoy playing! 🎮
