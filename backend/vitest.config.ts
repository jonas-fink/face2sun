import { defineConfig } from 'vitest/config';

export default defineConfig({
    // The #-imports resolve to src/*.ts only under the "dev" condition, the same
    // one `npm run dev` passes to node.
    resolve: { conditions: ['dev'] },
    ssr: { resolve: { conditions: ['dev'] } },
    test: {
        environment: 'node',
        globals: true,
        fileParallelism: false,
        env: {
            NODE_ENV: 'test',
            MONGO_URI: 'mongodb://127.0.0.1:27017/test',
            CLIENT_URL: 'http://localhost:5173',
        },
    },
});
