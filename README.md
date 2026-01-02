# Task Manager Application

A full-stack task management application similar to Trello and Jira, built with modern web technologies.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Boards**: Create and manage multiple boards
- **Lists**: Organize tasks into lists (columns)
- **Cards**: Create, edit, and manage task cards
- **Drag & Drop**: Intuitive drag-and-drop interface for moving cards between lists
- **Real-time Collaboration**: WebSocket-based real-time updates for multiple users
- **Comments**: Add comments to cards for collaboration
- **Assignees**: Assign team members to cards
- **Labels**: Organize cards with color-coded labels
- **Due Dates**: Set and track due dates for cards
- **Markdown Support**: Rich text descriptions with markdown support
- **Email Notifications**: Welcome emails and notifications via nodemailer
- **Modern UI**: Beautiful, responsive interface with TailwindCSS 4

## Tech Stack

### Frontend
- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Routing
- **Zustand** - State management
- **@dnd-kit** - Drag and drop
- **Socket.io-client** - Real-time communication
- **Axios** - HTTP client
- **TailwindCSS 4** - Styling
- **React Markdown** - Markdown rendering
- **date-fns** - Date utilities

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service
- **express-validator** - Input validation

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Clone the repository:
```bash
cd task-manager
```

2. Install dependencies for both frontend and backend:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@taskmanager.com
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000
```

## Running the Application

### Development Mode

1. Start MongoDB (if running locally):
```bash
mongod
```

2. Start the backend server:
```bash
cd backend
npm run dev
```

3. Start the frontend dev server:
```bash
cd frontend
npm run dev
```

4. Open your browser and navigate to:
```
http://localhost:5173
```

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Build the backend:
```bash
cd backend
npm run build
```

3. Start the backend:
```bash
cd backend
npm start
```

## Project Structure

```
task-manager/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── store/         # Zustand state management
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # Express backend API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic services
│   │   ├── socket/        # WebSocket handlers
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── tsconfig.json
│
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Boards
- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get board by ID
- `POST /api/boards` - Create a new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/members` - Add member to board
- `DELETE /api/boards/:id/members/:memberId` - Remove member from board

### Lists
- `POST /api/lists` - Create a new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `POST /api/lists/reorder` - Reorder lists

### Cards
- `POST /api/cards` - Create a new card
- `GET /api/cards/:id` - Get card by ID
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/move` - Move card to different list

### Comments
- `POST /api/comments` - Create a new comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:id` - Get user by ID

## WebSocket Events

### Client to Server
- `join-board` - Join a board room
- `leave-board` - Leave a board room
- `card-moved` - Card moved event
- `card-created` - Card created event
- `card-updated` - Card updated event
- `card-deleted` - Card deleted event
- `comment-added` - Comment added event
- `comment-updated` - Comment updated event
- `comment-deleted` - Comment deleted event

### Server to Client
- `user-joined` - User joined board
- `user-left` - User left board
- `card-moved` - Card moved notification
- `card-created` - Card created notification
- `card-updated` - Card updated notification
- `card-deleted` - Card deleted notification
- `comment-added` - Comment added notification
- `comment-updated` - Comment updated notification
- `comment-deleted` - Comment deleted notification

## License

MIT

