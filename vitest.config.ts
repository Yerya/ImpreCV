import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [react() as any],
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'text-summary'],
            include: ['lib/**/*.ts'],
            exclude: ['**/*.test.ts', '**/*.d.ts'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
})
