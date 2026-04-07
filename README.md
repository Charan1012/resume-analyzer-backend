# HireAI - Server Documentation

## Overview

This repository is the backend server for the **HireAI** application.
It is built with **Node.js**, **Express**, and **MongoDB**, and exposes a REST API for authentication, file upload, resume parsing, and AI-driven analysis.

The server is designed to be deployed separately from the frontend, for example on **Render**.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Required Environment Variables](#required-environment-variables)
5. [Installation](#installation)
6. [Running the Server](#running-the-server)
7. [API Endpoints](#api-endpoints)
8. [Detailed File and Component Explanation](#detailed-file-and-component-explanation)
   - [server.js](#serverjs)
   - [config/db.js](#configdbjs)
   - [config/multer.js](#configmulterjs)
   - [models/User.js](#modelsuserjs)
   - [middleware/authMiddleware.js](#middlewareauthmiddlewarejs)
   - [middleware/errorMiddleware.js](#middlewareerrormiddlewarejs)
   - [routes/authRoutes.js](#routesauthroutesjs)
   - [routes/resumeRoutes.js](#routesresumeroutesjs)
   - [controllers/authController.js](#controllersauthcontrollerjs)
   - [controllers/resumeController.js](#controllersresumecontrollerjs)
   - [services/fileParser.js](#servicesfileparserjs)
   - [services/geminiService.js](#servicesgeminiservicejs)
9. [Deployment on Render](#deployment-on-render)
10. [Security Notes](#security-notes)
11. [Troubleshooting](#troubleshooting)

---

## Features

- JWT-based user authentication
- Password hashing with bcryptjs
- PDF and DOCX resume upload
- File validation and temporary storage
- Resume text extraction using `pdf-parse` and `mammoth`
- AI analysis using Google Generative AI (Gemini)
- Resume history storage in MongoDB
- Clean error handling and route protection

---

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Document database
- **Mongoose**: MongoDB object modeling
- **jsonwebtoken**: JWT tokens
- **bcryptjs**: Password hashing
- **multer**: File upload middleware
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX text extraction
- **@google/generative-ai**: Google Gemini AI integration
- **dotenv**: Environment variable loader
- **cors**: Cross-origin request handling
- **nodemon**: Dev-time auto-reload

---

## Folder Structure

```
server/
├── config/
│   ├── db.js
│   └── multer.js
├── controllers/
│   ├── authController.js
│   └── resumeController.js
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   └── resumeRoutes.js
├── services/
│   ├── fileParser.js
│   └── geminiService.js
├── uploads/
├── server.js
├── package.json
└── .env
```

---

## Required Environment Variables

Create a `.env` file in the server folder with the following values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_google_gemini_api_key
```

### Explanation

- `PORT`: The port the server listens on. Defaults to `5000` if not set.
- `MONGODB_URI`: MongoDB Atlas or local connection string.
- `JWT_SECRET`: Secret used to sign JWT tokens.
- `GEMINI_API_KEY`: API key for Google Generative AI, used for Gemini AI analysis.

---

## Installation

Install dependencies in the server folder:

```bash
cd server
npm install
```

---

## Running the Server

### Development

```bash
npm run dev
```

This uses `nodemon` and restarts automatically on file changes.

### Production

```bash
npm start
```

---

## API Endpoints

### Auth

- `POST /api/auth/register`
  - Body: `{ email, password }`
  - Returns: token and user data

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: token and user data

- `GET /api/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Returns: logged-in user data

### Resume

- `POST /api/resume/analyze`
  - Protected route
  - Body: Multipart form-data `{ resume: file, jobRole }`
  - Returns: AI analysis object

- `GET /api/resume/history`
  - Protected route
  - Returns: list of resumes and basic metadata

- `GET /api/resume/:id`
  - Protected route
  - Returns: analysis details for a specific resume

---

## Detailed File and Component Explanation

### server.js

**Purpose**: Bootstraps the Express server, sets up middleware, connects to MongoDB, and mounts routes.

**What it imports**:

- `express`: Creates the server and routes
- `cors`: Enables browser requests from the frontend
- `dotenv`: Loads `.env` variables
- `connectDB`: Connects to MongoDB
- `errorHandler`: Handles any error that propagates through Express
- `authRoutes` and `resumeRoutes`: Route modules

**How it works**:

1. Loads environment variables with `dotenv.config()`.
2. Connects to MongoDB via `connectDB()`.
3. Creates an Express app.
4. Registers middleware:
   - `cors()` allows frontend requests.
   - `express.json()` parses JSON request bodies.
   - `express.urlencoded({ extended: true })` parses URL-encoded form data.
5. Mounts API routes.
6. Adds a health check endpoint.
7. Handles 404 routes.
8. Uses global error handler to format error responses.
9. Starts listening on the configured port.

---

### config/db.js

**Purpose**: Connects to MongoDB using Mongoose.

**What it does**:

- Reads `MONGODB_URI` from `.env`
- Connects to the database with `mongoose.connect()`
- Prints success or failure messages

**Importance**:

- All user and resume data is stored in MongoDB.
- This module ensures the app can talk to the database before handling requests.

---

### config/multer.js

**Purpose**: Configures file uploads and validation.

**What it imports**:

- `multer`: Handles multipart file uploads
- `path`: Works with file extensions
- `fs`: Handles file system operations

**What it does**:

- Ensures `uploads/` folder exists
- Uses `diskStorage` to save files to `uploads/`
- Generates unique filenames with timestamps
- Restricts uploads to `.pdf`, `.docx`, `.doc`
- Limits file size to 5MB

**Why it is required**:

- Users must upload resumes before analysis.
- `multer` safely processes upload files and handles validation.

---

### models/User.js

**Purpose**: Defines the MongoDB schema for users and their resume analyses.

**Key fields**:

- `email`: unique, lowercase, trimmed
- `password`: hashed password
- `resumes`: array of embedded resume analysis objects

**Resume schema details**:

- `originalName`: original filename
- `fileName`: stored filename
- `extractedText`: extracted resume text
- `analysis`: object containing AI results
- `createdAt`: timestamp

**Why it is required**:

- Stores user credentials and analysis history.
- Provides a persistent record of previous resume scans.

---

### middleware/authMiddleware.js

**Purpose**: Protects routes by verifying JWT tokens.

**What it does**:

1. Reads `Authorization` header.
2. Expects format `Bearer <token>`.
3. Verifies JWT using `JWT_SECRET`.
4. Attaches `req.userId` if token is valid.
5. Rejects request with 401 if token is missing or invalid.

**Why it is required**:

- Ensures only authenticated users can analyze resumes.
- Prevents unauthorized data access.

---

### middleware/errorMiddleware.js

**Purpose**: Handles errors centrally.

**What it does**:

- Captures thrown errors in async controllers
- Sends JSON response with `message` and `statusCode`

**Why it is required**:

- Keeps error formatting consistent.
- Avoids exposing raw stack traces in production.

---

### routes/authRoutes.js

**Purpose**: Defines authentication endpoints.

**Routes**:

- `POST /register` → `register`
- `POST /login` → `login`
- `GET /me` → `getMe`

**How routing works**:

- Express router maps URL paths to controller functions.
- `authController.js` implements registration and login logic.

---

### routes/resumeRoutes.js

**Purpose**: Defines resume-related endpoints.

**Routes**:

- `POST /analyze` → protected, uploads file and analyzes resume
- `GET /history` → protected, returns resume history
- `GET /:id` → protected, returns single analysis

**How routing works**:

- Uses `authMiddleware` to protect routes
- Uses `upload.single('resume')` to parse file uploads
- Sends requests to resume controller functions

---

### controllers/authController.js

**Purpose**: Handles authentication logic.

**register()**:

- Receives `email` and `password`.
- Validates that email is not already used.
- Hashes password with bcryptjs.
- Creates a new user document.
- Generates JWT token.
- Returns success response with user and token.

**login()**:

- Receives `email` and `password`.
- Finds user by email.
- Compares hashed passwords.
- Generates JWT token.
- Returns success response with user and token.

**getMe()**:

- Uses `req.userId` from auth middleware.
- Returns user profile data.

---

### controllers/resumeController.js

**Purpose**: Handles resume upload, text extraction, AI analysis, and history retrieval.

**analyzeResume()**:

- Verifies file upload exists.
- Reads `jobRole` from request body.
- Extracts text using `extractText()`.
- Validates that extracted text has length >= 100.
- Sends data to `analyzeResumeWithGemini()`.
- Saves AI analysis under the authenticated user's record.
- Deletes temporary file after processing.
- Returns JSON analysis.

**getHistory()**:

- Fetches user resume history.
- Sorts by newest first.
- Returns metadata only (filename, atsScore, createdAt).

**getAnalysis()**:

- Finds a single resume analysis by ID.
- Returns detailed analysis for that resume.

---

### services/fileParser.js

**Purpose**: Extracts text from uploaded PDF or DOCX resumes.

**extractTextFromPDF(buffer)**:

- Uses `pdf-parse`.
- Instantiates `PDFParse` with `{ data: buffer }`.
- Calls `getText()`.
- Returns extracted text.

**extractTextFromDOCX(buffer)**:

- Uses `mammoth`.
- Calls `extractRawText({ buffer })`.
- Returns text content.

**extractText(filePath, mimetype)**:

- Reads file into buffer.
- Chooses parser based on MIME type.
- Throws error if unsupported.

**Why it is required**:

- File data must be converted to plain text before AI can analyze it.
- PDF and DOCX use different parsing strategies.

---

### services/geminiService.js

**Purpose**: Sends resume text and job role to Google Gemini AI and parses the returned JSON.

**How it works**:

1. Initializes Google Generative AI client using `GEMINI_API_KEY`.
2. Chooses model `gemini-2.5-flash`.
3. Builds a prompt with instructions and the resume text.
4. Calls `model.generateContent(prompt)`.
5. Reads response text.
6. Extracts JSON using regex to handle markdown code blocks.
7. Validates required fields:
   - `atsScore`
   - `strengths`
   - `improvements`
   - `missingKeywords`
   - `formattingTips`
   - `overallFeedback`
8. Returns parsed analysis.

**Why it is required**:

- This is the AI brain of the app.
- It converts resume text into actionable feedback.

---

## Deployment on Render

### Recommended Render settings

- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `GEMINI_API_KEY`

### Notes

- Make sure `uploads/` is writable by the server.
- Render can use the `PORT` environment variable automatically.
- Set `NODE_ENV=production` for production behavior.

---

## Security Notes

- Passwords are hashed before storage.
- JWT is used for authenticated routes.
- Only logged-in users can access resume endpoints.
- Temporary files are deleted after processing.
- Files are validated by extension and size.

---

## Troubleshooting

### `AI analysis failed: model not found`

- Ensure `GEMINI_API_KEY` is valid.
- Ensure the Generative Language API is enabled in Google Cloud.
- Use a model available to your API key, such as `gemini-2.5-flash`.

### `Could not extract sufficient text from file`

- Verify the file is a text-based PDF or DOCX.
- Image-only PDFs may fail.

### `Route not found`

- Backend routes are under `/api/auth` and `/api/resume`.
- Make sure client is calling the correct API base URL.

---

## Contact

If you need help deploying or changing the AI prompt, this server README is the place to start.
