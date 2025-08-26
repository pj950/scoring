# Deployment Guide: AI Hackathon Scorer

This guide will walk you through deploying the application to Vercel with a Neon serverless Postgres database.

## Step 1: Set Up Neon Database

1.  **Create a Neon Account**: Go to [neon.tech](https://neon.tech/) and sign up for a free account.
2.  **Create a New Project**: Once logged in, create a new project. Give it a name like `hackathon-scorer`.
3.  **Get the Connection String**:
    *   On your project dashboard, find the **Connection Details** widget.
    *   Select the **Connection String** format (it should look like `postgres://...`).
    *   **Important**: Make sure you copy the string that includes your password.
    *   Keep this string safe; you'll need it for Vercel.
4.  **Initialize the Database Schema**:
    *   In the Neon console, go to the **SQL Editor**.
    *   Copy the entire content of the `schema.sql` file from this project.
    *   Paste the SQL content into the editor and click **Run**.
    *   This will create all the necessary tables (`teams`, `judges`, `criteria`, etc.) for the application to work.

## Step 2: Prepare Your Code

1.  **Push to a Git Repository**:
    *   Make sure your project code is pushed to a GitHub, GitLab, or Bitbucket repository. Vercel deploys directly from these services.
2.  **Environment Variables**:
    *   Create a file named `.env.local` in the root of your project. This file is for local development and should **not** be committed to Git (it's already in `.gitignore`).
    *   Add the following variables to `.env.local`:

    ```
    # Your Neon database connection string from Step 1.3
    DATABASE_URL="postgres://user:password@host/dbname?sslmode=require"

    # A long, random, secret string for signing session cookies (JWT)
    # You can generate one here: https://generate-secret.vercel.app/32
    JWT_SECRET="your_super_secret_random_string_here"

    # The access code for the admin user
    VITE_ADMIN_LOGIN_CODE="ADMIN-2024"
    ```

## Step 3: Deploy to Vercel

1.  **Create a Vercel Account**: Sign up at [vercel.com](https://vercel.com/), preferably using your Git provider account (e.g., GitHub).
2.  **Import Your Project**:
    *   From your Vercel dashboard, click **Add New...** > **Project**.
    *   Select your Git repository.
    *   Vercel should automatically detect that it's a Vite project. The default settings are usually correct.
3.  **Configure Environment Variables**:
    *   Before deploying, expand the **Environment Variables** section.
    *   Add the **exact same** key-value pairs from your `.env.local` file:
        *   `DATABASE_URL`
        *   `JWT_SECRET`
        *   `VITE_ADMIN_LOGIN_CODE`
    *   **This is a crucial step**. Your deployed application needs these variables to connect to the database and manage authentication.
4.  **Deploy**:
    *   Click the **Deploy** button.
    *   Vercel will build your project and deploy it. The process includes installing dependencies, running the Vite build, and setting up the serverless functions from the `api/` directory.

## Step 4: Local Development (Optional but Recommended)

To run the full-stack application on your local machine, you need to run both the frontend dev server and the backend serverless functions.

1.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```
2.  **Link Your Project**:
    ```bash
    vercel link
    ```
3.  **Pull Environment Variables**:
    ```bash
    vercel env pull .env.local
    ```
    This command pulls the environment variables you set in the Vercel dashboard into your `.env.local` file.
4.  **Run the Development Server**:
    *   Open **two** terminal windows.
    *   In the **first terminal**, run the Vercel development server which hosts your API functions:
        ```bash
        vercel dev
        ```
        This will typically start on port `3000`.
    *   In the **second terminal**, run the Vite frontend development server:
        ```bash
        npm run dev
        ```
        This will start on a different port (e.g., `5173`). Your `vite.config.ts` is already configured to proxy API requests from `/api` to the Vercel server running on port 3000.

Now you can open your browser to the Vite dev server address (e.g., `http://localhost:5173`) and use the application locally, connected to your live Neon database.
