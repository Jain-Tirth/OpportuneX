# UniStop - Multi-Platform Hackathon & Event Aggregator

A robust, full-stack application that automatically aggregates hackathons and tech events from multiple platforms including Devfolio, Unstop, Eventbrite, and Devpost. Features a modern React frontend with automated backend scraping and real-time scheduler management.

## Features

### Backend
- **Multi-Platform Scraping**: Automated data collection from 4 major platforms
  - **Devfolio** - Premium hackathon platform
  - **Unstop** - Competitions and hackathons  
  - **Eventbrite** - Event management platform
  - **Devpost** - Developer showcase platform
- **Intelligent Data Processing**: Event normalization, duplicate detection, and tag extraction
- **Automated Scheduler**: Node-cron based system with start/stop/manual trigger controls
- **REST API**: Full CRUD operations with filtering capabilities
- **Database Integration**: Supabase PostgreSQL with real-time capabilities
- **Error Handling**: Robust error management

### Frontend
- **Modern UI/UX**: Premium design with responsive layout
- **Event Dashboard**: Beautiful card-based event display
- **Scheduler Management**: Real-time scheduler status and controls
- **Advanced Filtering**: Search by tags, dates, and event types
- **Statistics Dashboard**: Event counts and platform insights
- **Mobile Responsive**: Optimized for all device sizes

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jain-Tirth/UniStop.git
   cd UniStop
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   
   # Create .env file
   cp .env.example .env
   # Add your Supabase credentials
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure Environment Variables**
   ```bash
   # In server/.env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   NODE_ENV=development
   ```

5. **Setup Database Schema**
   ```sql
   -- Run this in your Supabase SQL editor
   CREATE TABLE "Event" (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     type TEXT,
     "startDate" DATE,
     "endDate" DATE,
     deadline DATE,
     tags TEXT[],
     "hostedBy" TEXT,
     verified BOOLEAN DEFAULT false,
     "redirectURL" TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

6. **Run the Application**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend  
   cd client
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
UniStop/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── EventCard.jsx
│   │   │   └── SchedulerDashboard.jsx
│   │   ├── pages/          # Page components
│   │   │   └── Home.jsx
│   │   ├── services/       # API integration
│   │   │   └── api.js
│   │   └── lib/           # Utilities
│   │       └── supaBaseClient.js
│   └── package.json
├── server/                 # Node.js Backend
│   ├── controllers/        # Request handlers
│   │   └── eventController.js
│   ├── routes/            # API routes
│   │   ├── eventRoute.js
│   │   └── schedulerRoute.js
│   ├── scrappers/         # Web scrapers
│   │   ├── devfolioScraper.js
│   │   ├── unstopScrapper.js
│   │   ├── eventBriteScrapper.js
│   │   ├── devPostScrapper.js
│   │   └── mainScrapping.js
│   ├── supabase/          # Database config
│   │   └── client.js
│   ├── scheduler.js       # Cron job manager
│   ├── server.js         # Main server file
│   └── package.json
└─
```

### Scraped Data Points
- Event title and description
- Start/end dates and deadlines
- Host organization
- Event tags and categories
- Registration URLs
- Prize information (when available)

## Frontend Features

### Components
- **EventCard**: Displays event information with beautiful styling
- **SchedulerDashboard**: Real-time scheduler management interface
- **Home**: Main dashboard with hero section and event grid

### Styling
- Modern CSS with gradients and animations
- Responsive design for mobile/tablet/desktop
- Safari compatibility optimizations
- Dark theme elements

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Jain-Tirth**
- GitHub: [@Jain-Tirth](https://github.com/Jain-Tirth)
- Project: [UniStop](https://github.com/Jain-Tirth/UniStop)

**Star this repository if you find it helpful!**
