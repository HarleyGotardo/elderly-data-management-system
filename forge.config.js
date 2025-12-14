const { VitePlugin } = require('@electron-forge/plugin-vite');

module.exports = {
  packagerConfig: {
    name: 'Elderly Data Management System',
    executableName: 'elderly-data-system',
    // icon: './assets/icon', // Temporarily disabled
    extraResource: [
      './database/database.sqlite', // Include the database file
      './database/migrations',
      './database/seeders'
    ],
    asar: true, // Enable asar with proper native module handling
    overwrite: true,
    prune: false, // Keep all dependencies
  },
  rebuildConfig: {
    // Disable automatic rebuild to avoid path issues
    // better-sqlite3 should already be compiled
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'elderly_data_management_system',
        authors: 'Harley Gothard',
        description: 'Elderly Data Management System - Offline Application',
        // loadingGif: './assets/loading.gif', // Temporarily disabled
        // setupIcon: './assets/icon.ico', // Temporarily disabled
        // certificateFile: './cert.p12', // Optional: for code signing
        // certificatePassword: '', // Optional: certificate password
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        skipNativeModulesPlugin: true,
        // `build` can specify multiple entry builds
        build: [
          {
            // `entry` is an alias for `build.lib.entry`
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
  ],
};
