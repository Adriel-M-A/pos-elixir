export { }

declare global {
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
    // Remove if electron property is not actually exposed in preload.ts
    // If it WAS exposed by default by @electron-toolkit/preload, keep it, but our manual check showed only 'api' exposed in src/preload/index.ts
  }
}
