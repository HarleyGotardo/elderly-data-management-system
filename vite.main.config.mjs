import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: (id) => {
        // Externalize all imports from app/ directory
        return id.includes('../app/') || id.includes('app/');
      }
    }
  }
});
