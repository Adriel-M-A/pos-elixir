import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        // Alias Base
        '@': resolve('src/renderer/src'),
        '@types': resolve('src/shared/types'),
        '@shared': resolve('src/shared'),

        // Modulos
        '@core': resolve('src/renderer/src/modules/core'),

        // Alias de Utilidades Comunes
        '@ui': resolve('src/renderer/src/components/ui'),
        '@lib': resolve('src/renderer/src/lib'),
        '@config': resolve('src/renderer/src/config')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
