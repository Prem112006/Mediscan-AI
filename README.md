# MediScan AI

MediScan AI is a monorepo application that analyzes medical reports using Tesseract OCR and Google Gemini AI. Users can upload medical documents (images or PDFs), extract text, and receive AI-powered summaries and medical analysis.

## Repository Structure

The project is structured as a monorepo:

- **[frontend/](file:///d:/Medisacn-Ai/frontend)**: A React + Vite single-page application.
- **[backend/](file:///d:/Medisacn-Ai/backend)**: An Express server that handles user authentication, file uploads, Tesseract OCR processing, and Google Gemini AI analysis.
- **[api/](file:///d:/Medisacn-Ai/api)**: Entry point for Vercel Serverless Functions deployment.

## Features

- **User Authentication**: Secure sign-up, login, and password reset functionality.
- **Medical Report Upload**: Support for PDF and image report uploads.
- **Tesseract OCR Integration**: Automated text extraction from uploaded images.
- **Gemini AI Analysis**: Comprehensive medical summary, key metrics visualization, and advice powered by Google Gemini AI.
- **Vercel Deployment**: Configured for direct deployment on Vercel.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB instance
- Google Gemini API key

### Installation & Run

1. Clone the repository:
   ```bash
   git clone https://github.com/Prem112006/Mediscan-AI.git
   cd Mediscan-AI
   ```

2. Install dependencies for the entire workspace:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `backend` folder based on [backend/.env.example](file:///d:/Medisacn-Ai/backend/.env.example).
   - Configure your `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.

4. Run the application in development mode:
   ```bash
   npm run dev
   ```

## Deployment

This application is ready to be deployed on **Vercel**. The root [vercel.json](file:///d:/Medisacn-Ai/vercel.json) file handles serverless routing for the backend API and serving the static frontend assets.
