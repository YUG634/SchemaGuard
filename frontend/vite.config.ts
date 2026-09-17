import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-analyze-handler',
        configureServer(server) {
          server.middlewares.use('/api/analyze', async (req, res) => {
            if (req.method === 'POST') {
              let bodyStr = '';
              req.on('data', (chunk) => {
                bodyStr += chunk;
              });
              req.on('end', async () => {
                try {
                  const { runAnalysis } = await import('./src/lib/analyze');
                  let parsed = {};
                  try {
                    parsed = JSON.parse(bodyStr);
                  } catch {
                    parsed = {};
                  }
                  const result = await runAnalysis(parsed as any);
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(result));
                } catch {
                  const { mockAnalysis } = await import('./src/lib/demo');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ ...mockAnalysis, source: 'mock', timestamp: Date.now() }));
                }
              });
            } else {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method not allowed' }));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
