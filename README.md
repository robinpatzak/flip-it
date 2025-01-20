# Flip It

A real-time multiplayer memory card game built with React, Express and Socket.IO. Players can create rooms, join existing ones, and play against each other by matching pairs of cards. Players can also create their own sets of memory cards to play with.

## Table of Contents
- [Flip It](#flip-it)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Roadmap](#roadmap)
    - [Coming Soon](#coming-soon)
    - [Future Features](#future-features)
    - [Under Consideration](#under-consideration)
  - [Project Structure](#project-structure)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Game Features](#game-features)
    - [Host](#host)
    - [Players](#players)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
  - [License](#license)

## Features

- Real-time multiplayer gameplay
- Custom card sets
- Room-based gameplay
- Host controls and player management
- Dark/Light mode support
- Responsive design
  
## Roadmap

### Coming Soon
- Custom Card Sets
  - Create your own card pairs
  - Save custom sets for reuse
  - Share card sets with other players

- ✨ Animations and Visual Enhancements
  - Card flip animations
  - Match celebration effects
  - Room transition animations
  - Player join/leave animations
  - Turn indicator animations
  - Victory celebration sequence

### Future Features
- Player Statistics
  - Track win/loss records
  - Personal best times
  - Most matched pairs

### Under Consideration
- 🌐 Public Rooms
- 🗣️ In-game Chat
- 🎵 Sound Effects
- 📱 Mobile App Version

## Project Structure

```
memory-game/
├── frontend/            # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # Socket.IO client setup
│   │   └── types/       # TypeScript interfaces
│   └── package.json
├── backend/             # Backend Node.js server
│   ├── src/
│   │   └── index.ts     # Express and Socket.IO server
│   └── package.json
└── package.json         # Root package.json
```

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/robinpatzak/flip-it.git
cd flip-it
```

2. Install dependencies:
```bash
npm install
```

This will install dependencies. Please do this for the parent folder, frontend and backend seperately.

## Development

Start both the client and server in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Start frontend only
npm run start:frontend

# Start backend only
npm run start:backend
```

The client will be available at `http://localhost:5173` and the server at `http://localhost:4000`.

## Game Features

### Host
- Create a room
- Start the game
- Kick players
- Create custom card sets

### Players
- Join rooms via invite link
- Play turns
- Match card pairs
- See other players' moves in real-time

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Socket.IO Client
- Tailwind CSS
- shadcn/ui
- Lucide React

### Backend
- Node.js
- Express
- Socket.IO
- TypeScript

## License

This project is licensed under the MIT License - see the LICENSE file for details.
