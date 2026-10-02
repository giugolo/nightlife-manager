import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to copy landing folder to dist
function copyLandingPlugin() {
  return {
    name: 'copy-landing',
    writeBundle() {
      const srcDir = path.resolve(__dirname, 'landing');
      const destDir = path.resolve(__dirname, 'dist/landing');

      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.readdirSync(srcDir).forEach(file => {
          fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
        });
        console.log('✅ Landing folder copied to dist/landing');
      }
    }
  };
}

// Read the app version from package.json so the UI can display a single source of truth
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      strictPort: true,
      host: '0.0.0.0',
    },
    // Rewrite /app to serve the React app (index.html)
    appType: 'spa',
    plugins: [
      react(),
      copyLandingPlugin(),
      // Middleware to handle /app routes in development
      {
        name: 'spa-fallback-app',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Rewrite /app and /app/* to serve index.html
            if (req.url && (req.url === '/app' || req.url.startsWith('/app/'))) {
              req.url = '/index.html';
            }
            next();
          });
        }
      }
    ],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
