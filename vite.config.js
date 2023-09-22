// Settings
import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
    base: '/lab',
    assetsInclude: ['**/*.glb', '**/*.hdr'],
    build:
    {
        chunkSizeWarningLimit: 2000,
        rollupOptions:
        {
            input:
            {
                main: resolve(__dirname, 'index.html'),
                nested: resolve(__dirname, 'en/index.html'),
            },
        },
    },
    server:
    {
        host: true,
        open: true,
    }
});