
# Jawala Business Directory AI Assistant

This is a modern, searchable business directory for Jawala village, built with React, Tailwind CSS, Supabase, and powered by the Gemini API. It allows users to easily find local services, shops, and contact information through a clean, responsive, PWA-enabled interface.

## Features

- **Searchable Directory**: Instantly search for businesses by name, owner, or contact number.
- **Category Filtering**: Browse businesses by category with a dynamic and visually appealing grid.
- **AI-Powered Assistant**: Use natural language (in Marathi) to ask questions and find businesses, powered by the Gemini API.
- **PWA Ready**: Installable on mobile devices for an app-like experience with offline access to data.
- **Real-time Updates**: Data is synced in real-time from a Supabase backend.
- **Admin Panel**: Secure area for administrators to add, edit, and delete business listings.
- **Smart Caching**: An intelligent caching layer ensures the app is fast and works offline.

## Running the Project

**Prerequisites:**

*   Node.js and npm
*   A Supabase project with the required database schema
*   A Gemini API key

**Setup:**

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Variables**:
    This project requires the following environment variables to be set in your deployment environment (or in a `.env` file for local development):

    *   `VITE_SUPABASE_URL`: Your Supabase project URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase project's anonymous key.
    *   `API_KEY`: Your Google Gemini API key.

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.
