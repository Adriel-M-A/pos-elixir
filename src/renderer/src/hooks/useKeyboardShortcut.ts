import { useEffect } from 'react'

type Key = string
type Options = {
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    metaKey?: boolean
}

export function useKeyboardShortcut(
    key: Key,
    callback: (e: KeyboardEvent) => void,
    options: Options = {}
) {
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const { ctrlKey = false, shiftKey = false, altKey = false, metaKey = false } = options

            if (
                event.key.toLowerCase() === key.toLowerCase() &&
                event.ctrlKey === ctrlKey &&
                event.shiftKey === shiftKey &&
                event.altKey === altKey &&
                event.metaKey === metaKey
            ) {
                event.preventDefault()
                callback(event)
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [key, callback, options])
}
