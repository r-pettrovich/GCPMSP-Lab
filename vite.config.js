//settings
export default {
    base: '/lab',
    assetsInclude: ['**/*.glb', '**/*.hdr'],
    build:
    {
        chunkSizeWarningLimit: 2000,
    },
    server:
    {
        host: true,
        open: true,
    }
}