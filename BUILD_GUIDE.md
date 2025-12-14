# Build Guide - Elderly Data Management System

## Prerequisites
- Node.js installed
- All dependencies installed (`npm install`)

## Build Steps

### 1. Prepare the Database
```bash
# Ensure your local database is up to date with all data
npm run db:fresh
npm run db:seed
```

### 2. Create Assets Folder
Create an `assets` folder in the project root:
```
/assets
  - icon.ico (256x256 or higher)
  - icon.png (for development)
```

### 3. Build for Production

#### Option A: Simple EXE (Portable)
```bash
npm run make:exe
```
This creates a portable executable in `out/make/`.

#### Option B: Installer (Recommended for Distribution)
```bash
npm run make:installer
```
This creates an installer in `out/make/`.

#### Option C: Full Distribution Package
```bash
npm run dist
```

### 4. Output Location
After building, you'll find:
- Portable EXE: `out/elderly-data-system-win32-x64/elderly-data-system.exe`
- Installer: `out/make/squirrel.windows/x64/Setup.exe`
- ZIP Archive: `out/make/zip/win32/x64/elderly-data-management-system-1.0.0.zip`

## Database Handling

The application automatically:
1. Creates a new SQLite database on first run
2. Runs all migrations
3. Seeds initial data
4. Stores the database in the user's app data directory

Database location: `%APPDATA%/elderly-data-system/database.sqlite`

## Supabase Configuration

The Supabase configuration is baked into the build from your `.env` file:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_SUPABASE_SERVICE_KEY`

Ensure these are set correctly before building.

## Offline Functionality

The application works fully offline for:
- Viewing and managing senior citizens
- All CRUD operations
- Local data storage

Online features:
- Sync to Supabase (requires internet)
- Online Database viewer (requires Supabase access)

## Distribution

To distribute to another PC:
1. Copy the entire `out` folder
2. Or use the installer (Setup.exe)
3. The app will create its database automatically on first run

## Troubleshooting

- If the app fails to start, check the console for database errors
- Ensure all native modules are properly rebuilt: `npm run rebuild:electron`
- Windows may show a security warning - this is normal for unsigned executables
