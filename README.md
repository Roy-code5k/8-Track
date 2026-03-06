# 8Track ♾️ 

8Track is a unified academic management Progressive Web App (PWA) for college students. It provides predictive attendance tracking, assignment management, offline support, and performance analytics to organize your academic journey safely and securely.

## 🚀 Tech Stack

**Frontend (Client)**
- React 18 + Vite
- React Router v6
- Tailwind CSS v4 + Shadcn UI (Custom Dark/Glassmorphism Theme)
- Zustand (Global State)
- TanStack React Query (Server State)
- Axios (API Client)
- *Upcoming: Dexie.js (Offline IndexedDB), Recharts*

**Backend (Server)**
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT via `httpOnly` cookies)
- bcryptjs (Password Hashing)
- Helmet & Express Rate Limit (Security)

**Deployment Infrastructure**
- Monorepo structure setup for **Vercel**
- Backend runs as Vercel Serverless Functions

## 📁 Project Structure

This is a Monorepo containing both the frontend and backend.

```text
8-Track/
├── client/                  # React frontend codebase
│   ├── src/                 
│   │   ├── components/      # Reusable UI components (Buttons, Inputs, Cards)
│   │   ├── layouts/         # Shared layouts (AuthLayout, DashboardLayout)
│   │   ├── pages/           # Route-level components (Login, Dashboard, etc.)
│   │   ├── lib/             # Utility functions & Axios config
│   │   ├── store/           # Zustand stores (useAuthStore)
│   │   └── routes/          # Protected/Public Route wrappers
│   └── index.css            # Global Tailwind & Theme definitions
├── server/                  # Express backend codebase
│   ├── api/                 # Vercel entrypoint (`index.js`)
│   ├── config/              # Database connection (`db.js`)
│   ├── controllers/         # Business logic for routes
│   ├── middleware/          # JWT Auth Guard, Global Error Handler
│   ├── models/              # Mongoose Data Schemas
│   └── routes/              # Express API Route definitions
├── vercel.json              # Vercel deployment routing configuration
└── package.json             # Root monorepo workspace configuration
```

## 🛠️ Local Development Setup

Follow these steps to get the project running locally. 

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas cluster URI (or local MongoDB instance)

### 1. Install Dependencies
From the root directory, install dependencies for both the client and server using npm workspaces:
```bash
npm install
```

### 2. Environment Variables
You need to set up the `.env` file in the `server/` directory.

Navigate to `server/` and copy the example environment file:
```bash
cd server
cp .env.example .env
```
Open `server/.env` and replace the placeholder `MONGODB_URI` with a valid connection string.
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0...
JWT_SECRET=your_super_secret_dev_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### 3. Run the Development Servers
You will need to run the client and the server simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev -- --port 5173
```

The frontend will be available at `http://localhost:5173`. The backend will run on `http://localhost:5000`.

## 🔒 Authentication Flow
This app uses a highly secure authentication pattern to prevent XSS and CSRF attacks:
1. When a user logs in, the backend generates a JWT and attaches it to the HTTP response as an `httpOnly`, `SameSite=Strict` cookie.
2. The frontend **never** touches or stores the JWT in `localStorage` or memory.
3. Every protected API request from Axios automatically includes `withCredentials: true` to pass the cookie to the backend.
4. The `authMiddleware` on the backend validates the token from the cookie before allowing access to private routes.

## 🤝 Next Steps for Development (Current Focus)
The project is being built feature-by-feature. Currently finished: Phase 1 (Scaffolding and Auth) and Phase 2 Frontend (Dashboard UI).

**Next up to build:**
- Backend models and controllers for Subjects, Attendance, Assignments.
- Frontend data integration to make the Dashboard UI dynamic.
- Adding remaining CRUD interfaces (Subjects list, Assignment Tracker).
