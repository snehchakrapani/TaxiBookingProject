# TaxiBookingProject Deployment Guide

This file is for the `hosted-demo` branch only. Your original `main` branch can stay unchanged for mentor submission and local demos.

## 1. Branches you will use

- `main`: your original project, unchanged
- `hosted-demo`: deployment version

To switch between them:

```powershell
git checkout main
git checkout hosted-demo
```

## 2. What was changed in `hosted-demo`

- The backend can still use local SQL Server by default.
- The backend can switch to hosted PostgreSQL when `DatabaseProvider=Postgres`.
- CORS is now controlled by an `AllowedOrigins` setting.
- Netlify SPA redirects are enabled with `taxi-booking-frontend/public/_redirects`.
- A Dockerfile was added at `TaxiBookingService/Dockerfile` for Render.

## 3. What I already did for you

- Created the `hosted-demo` branch locally
- Updated backend config for local-or-hosted database support
- Added frontend redirect support for Netlify
- Added a Dockerfile for Render

## 4. What I cannot do from here

- Create your Netlify account/site
- Create your Render service
- Create your Neon database
- Paste secrets/env vars into those dashboards
- Push this new branch to GitHub unless you want me to do that too

## 5. Push the hosted branch to GitHub

Run this from `c:\TaxiBookingProject`:

```powershell
git add .
git commit -m "Prepare hosted deployment branch"
git push -u origin hosted-demo
```

## 6. Netlify frontend steps

Use branch `hosted-demo`.

In Netlify, set:

- Repository: `TaxiBookingProject`
- Branch: `hosted-demo`
- Base directory: `taxi-booking-frontend`
- Build command: `npm run build`
- Publish directory: `dist`

Add this environment variable in Netlify after you get your backend URL:

- `VITE_API_BASE_URL` = `https://your-render-service.onrender.com`

Then redeploy the site.

## 7. Neon database steps

Create a free Neon PostgreSQL database and copy the full connection string.

You will use that connection string in Render as:

- `ConnectionStrings__DefaultConnection`

## 8. Render backend steps

Create a new Web Service from the same GitHub repo and branch `hosted-demo`.

Use these settings:

- Root directory: `TaxiBookingService`
- Environment: `Docker`

Add these environment variables in Render:

- `DatabaseProvider` = `Postgres`
- `ConnectionStrings__DefaultConnection` = your Neon PostgreSQL connection string in `Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true` format
- `AllowedOrigins` = your Netlify site URL
- `JwtSettings__SecretKey` = any strong secret key
- `JwtSettings__Issuer` = `TaxiBookingService`
- `JwtSettings__Audience` = `TaxiBookingUsers`

Deploy, then copy the Render public URL.

After deploy, verify the backend directly:

- `https://your-render-service.onrender.com/`
- `https://your-render-service.onrender.com/health`
- `https://your-render-service.onrender.com/swagger`

If the service is correct, the first two return JSON and `/swagger` opens.

## 9. Finish frontend connection

Go back to Netlify and set:

- `VITE_API_BASE_URL` = your Render URL

Important:

- use only the Render origin, for example `https://your-render-service.onrender.com`
- do not add `/api`
- do not add a trailing slash

Redeploy the Netlify site.

If login or register returns `404` from `/api/Auth/...`, the usual cause is that Render is still serving the wrong branch, wrong root directory, or an older deployment.

## 10. How to run locally later exactly like before

Switch back to your original branch:

```powershell
git checkout main
```

Then run the backend:

```powershell
dotnet run --project TaxiBookingService/TaxiBookingService.csproj
```

Then run the frontend:

```powershell
cd taxi-booking-frontend
npm run dev
```

## 11. If you want to test the hosted branch locally

You can also run `hosted-demo` locally with your old SQL Server setup because it still defaults to:

- `DatabaseProvider=SqlServer`
- local connection string in `appsettings.json`

That means `hosted-demo` is deployment-ready, but it can still behave like a local project unless you override env vars on Render.
