export function ipcInvoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return window.api.invoke(channel, ...args)
}
