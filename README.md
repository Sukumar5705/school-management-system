# Student Management System

**Cloud Computing Practical — Roll Number: 23261A05D9**

A small MERN application for creating, viewing, updating and deleting student records. Student data is stored persistently in MongoDB Atlas.

## Features

- Add student records with a unique Student ID and email address.
- View the student directory and individual student details.
- Edit and delete student records.
- Search by Student ID, name, email or course.
- Filter records by course and year of study.
- Responsive interface with a simple, neutral colour palette.
- Backend validation and duplicate-record handling.

## Technology

- Frontend: React, Vite, Axios, Lucide icons and plain CSS.
- Backend: Node.js, Express and Mongoose.
- Database: MongoDB Atlas.

## Project structure

```text
student-management-system/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── models/Student.js
│   ├── routes/studentRoutes.js
│   ├── server.js
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Requirements

- Node.js 18 or later and npm.
- A MongoDB Atlas cluster or another MongoDB connection string.

## Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster and a database user.
2. In Atlas Network Access, allow the IP address of the computer or EC2 instance that will run the backend.
3. Copy the application's MongoDB connection string.
4. Copy `.env.example` to `.env` in the project root.
5. Replace the placeholder in `MONGODB_URI` with your actual connection string. Keep the URI private; do not place it in frontend files or commit `.env`.

Example configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/StudentManagementDB?retryWrites=true&w=majority
```

## Run locally

Open two terminals from the project root.

**Terminal 1 — backend:**

```bash
cd server
npm install
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd client
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The Vite development server forwards `/api` requests to the backend on port `5000`.

## Production build

Build the frontend:

```bash
cd client
npm install
npm run build
```

Start the backend from the server directory:

```bash
cd ../server
npm install
npm start
```

When `client/dist` exists, Express serves the built frontend as well as the API. Set the production `MONGODB_URI` and `PORT` in the project-root `.env` file before starting the server.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check API and database status |
| GET | `/api/students` | Get all students |
| GET | `/api/students/:id` | Get one student by MongoDB ID |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

### Student fields

| Field | Description |
|---|---|
| `studentId` | Required, unique student identifier |
| `name` | Required full name |
| `email` | Required, unique email address |
| `phone` | Optional phone number |
| `course` | CSE, ECE, EEE or DS |
| `year` | Year 1, 2, 3 or 4 |

The backend normalizes email addresses to lowercase and validates records before saving. Duplicate Student IDs or email addresses return HTTP `409`.

## Deployment note

For the Cloud Computing practical, build the React client and run the Express server on the target VM or Amazon EC2 instance. Configure the target environment's `.env` with the MongoDB Atlas URI and allow that machine's outbound IP in Atlas Network Access. The same Atlas database can be used from both environments; moving the application does not itself copy or migrate the database.
