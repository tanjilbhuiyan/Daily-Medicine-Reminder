# 💊 Medicine Reminder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3.4+-4FC08D.svg)](https://vuejs.org/)
[![Security](https://img.shields.io/badge/Security-Audited-green.svg)](./SECURITY.md)

A secure, user-friendly Vue.js application with SQLite backend for tracking daily medicine intake. Built with privacy and security in mind - no login required, all data stays local.

## ✨ Features

### 📋 Medicine Management
- ✅ **Flexible Scheduling**: Preset times, equal intervals, or custom times
- ✅ **Smart Reminders**: Visual indicators for missed doses
- ✅ **Archive System**: Mark completed medicine courses as archived
- ✅ **Bulk Operations**: Manage multiple medicines efficiently

### 📊 Tracking & Analytics
- ✅ **Daily Tracking**: Simple checkbox interface for dose confirmation
- ✅ **Calendar View**: Visual progress tracking with monthly overview
- ✅ **Statistics**: Weekly/monthly adherence reports with percentages
- ✅ **Historical Data**: Complete dose history preservation

### 🔒 Privacy & Security
- ✅ **No Registration**: Start using immediately, no account needed
- ✅ **Local Data**: All information stored locally on your device
- ✅ **Secure API**: Input validation, rate limiting, SQL injection protection
- ✅ **Open Source**: Transparent, auditable codebase

### 📱 User Experience
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- ✅ **Intuitive Interface**: Clean, accessible design with clear navigation
- ✅ **Real-time Updates**: Instant feedback and notifications
- ✅ **Offline Ready**: Core functionality works without internet

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Run with Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <your-repo-url>
cd med-reminder
```

2. Start the application:
```bash
docker-compose up -d
```

3. Open your browser to `http://localhost:3000`

4. To stop the application:
```bash
docker-compose down
```

### Docker Commands

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes data)
docker-compose down -v
```

## Development Setup

### Prerequisites
- Node.js 18+ installed

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run client` - Start only frontend (Vite)
- `npm run server` - Start only backend (Node.js)

## Architecture

- **Frontend**: Vue 3 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Styling**: Custom CSS

## API Endpoints

- `GET /api/medicines` - Get active medicines for a date
- `GET /api/medicines/all` - Get all medicines (active + archived)
- `POST /api/medicines` - Add new medicine
- `PUT /api/medicines/:id/archive` - Archive medicine
- `PUT /api/medicines/:id/reactivate` - Reactivate medicine
- `DELETE /api/medicines/:id` - Delete medicine permanently
- `PUT /api/doses/:id` - Update dose status
- `GET /api/calendar/:year/:month` - Get calendar data
- `GET /api/stats` - Get statistics

## Data Persistence

- **Development**: SQLite database stored in `server/medicines.db`
- **Docker**: SQLite database stored in Docker volume `med-data`

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)

## Health Check

The application includes a health check endpoint that verifies the API is responding correctly.

## License

MIT License