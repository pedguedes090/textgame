# Text RPG Game

A text-based RPG game with creatures, dungeons, gacha, PvP, and more. Built with NestJS backend and Next.js frontend.

## Features

- 🎮 **Hunt System**: Capture creatures in the wild
- 🏰 **Dungeons**: Challenge bosses and earn rewards
- 🎲 **Gacha System**: Pull for rare creatures and items with pity system
- ⚔️ **PvP**: Battle other players with ELO rating system
- 🎯 **Quest System**: Complete daily, weekly, and story quests
- 🛒 **Shop**: Buy and sell items
- 🎁 **Daily Login Rewards**: Streak-based rewards
- ⚡ **Item Enhancement**: Upgrade your equipment (+0 to +15)
- 👥 **Party System**: Build and manage your creature teams

## Tech Stack

### Backend (API)
- **Framework**: NestJS
- **Database**: SQLite with TypeORM
- **Cache**: Redis (for rate limiting, distributed locks)
- **Authentication**: JWT with Argon2 password hashing
- **Documentation**: Swagger/OpenAPI

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: react-hot-toast, lucide-react

## Getting Started

### Prerequisites

- Node.js 18+ 
- Redis server
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/pedguedes090/textgame.git
cd textgame
```

2. **Set up the Backend (API)**

```bash
cd api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Make sure Redis is running on localhost:6379

# Create data directory
mkdir -p data

# Run migrations
npm run migration:run

# Seed initial data
npm run seed

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api`

3. **Set up the Frontend (Web)**

```bash
cd ../web

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF

# Start development server
npm run dev
```

The web app will be available at `http://localhost:3001`

### Using Docker Compose

For a quick setup with all services:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This will start:
- Redis on port 6379
- API on port 3000
- Web on port 3001

## Project Structure

```
.
├── api/                    # Backend NestJS application
│   ├── src/
│   │   ├── common/        # Shared services (battle, loot, etc.)
│   │   ├── config/        # Configuration files
│   │   ├── entities/      # TypeORM entities
│   │   ├── migrations/    # Database migrations
│   │   └── modules/       # Feature modules
│   ├── test/              # Test files
│   └── package.json
│
├── web/                   # Frontend Next.js application
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable React components
│   ├── lib/              # Utilities and API client
│   ├── store/            # Zustand stores
│   └── package.json
│
├── docker-compose.yml    # Docker compose configuration
└── README.md
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile

### Hunt
- `POST /hunt/start` - Start hunting for creatures

### Creatures
- `GET /creatures` - List user's creatures
- `GET /creatures/:id` - Get creature details
- `POST /creatures/:id/level-up` - Level up creature

### Dungeons
- `GET /dungeons` - List available dungeons
- `POST /dungeons/enter` - Enter a dungeon

### Gacha
- `POST /gacha/pull` - Pull from gacha banner

### PvP
- `GET /pvp/queue` - Queue for PvP match
- `POST /pvp/result` - Submit match result

### Shop
- `GET /shop` - List shop items
- `POST /shop/buy` - Buy item from shop
- `POST /shop/sell` - Sell item

### Items
- `GET /items/inventory` - Get user inventory
- `POST /items/:id/enhance` - Enhance item
- `POST /items/equip` - Equip item to creature
- `POST /items/unequip` - Unequip item

### Quests
- `GET /quests` - List active quests
- `POST /quests/:id/claim` - Claim quest reward

### Party
- `GET /party` - List user parties
- `POST /party` - Create new party
- `PATCH /party/:id` - Update party composition
- `POST /party/:id/set-active` - Set active party

### User
- `POST /user/daily-reward` - Claim daily login reward
- `GET /user/stamina` - Check stamina status

For complete API documentation, visit `http://localhost:3000/api` after starting the backend.

## Development

### Backend Commands

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger

# Build
npm run build              # Build for production
npm run start:prod         # Run production build

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Generate coverage report

# Database
npm run migration:generate # Generate migration from entities
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed               # Seed database with initial data

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with prettier
```

### Frontend Commands

```bash
# Development
npm run dev                # Start development server

# Build
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Lint code
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/game.db
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Game Mechanics

### Stamina System
- Maximum stamina: 100
- Regenerates 1 stamina every 5 minutes
- Hunt costs: 10 stamina
- Dungeon costs: 10-30 stamina (depends on difficulty)

### Element System
- Elements: Fire, Water, Wood, Light, Dark, Neutral
- Advantage bonuses: ±10% damage
- Fire > Wood > Water > Fire
- Light ⇄ Dark

### Rarity Tiers
1. Common (55%)
2. Uncommon (25%)
3. Rare (12%)
4. Epic (6%)
5. Legendary (2%)
6. Mythic (0.8%)
7. Ancient (0.2%)

### Pity System
- Pity activates after 50 rolls without Legendary+
- Each roll adds +0.3% to Legendary+ rate
- Pity resets when Legendary+ is obtained

### Enhancement System
- Items can be enhanced from +0 to +15
- Each level adds +10% to item stats
- Success rate decreases at higher levels
- Failed enhancement does not destroy item

### PvP Rating
- Initial rating: 1500
- ELO-based matchmaking
- K-factor: 32
- Seasonal leaderboards

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
