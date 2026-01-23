/// <reference types="vite/client" />

interface Window {
    api: {
        invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
        window: {
            minimize: () => void
            maximize: () => void
            close: () => void
            setLoginSize: () => void
            setAppSize: () => void
        }
    }
}
