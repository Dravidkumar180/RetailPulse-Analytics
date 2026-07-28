import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'

const apiUrl = 'http://127.0.0.1:8000'

const isApiReady = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${apiUrl}/`, {
      signal: AbortSignal.timeout(1_000),
    })
    return response.ok
  } catch {
    return false
  }
}

const waitForApi = async (
  apiProcess: ChildProcess,
): Promise<void> => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (apiProcess.exitCode !== null) {
      throw new Error(
        `RetailPulse API exited during startup with code ${apiProcess.exitCode}.`,
      )
    }

    if (await isApiReady()) {
      return
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250))
  }

  apiProcess.kill()
  throw new Error(`RetailPulse API did not become ready at ${apiUrl}.`)
}

const ensureRetailPulseApi = (): Plugin => ({
  name: 'retailpulse-api',
  apply: 'serve',
  async configureServer(server) {
    if (await isApiReady()) {
      console.log(`RetailPulse API is ready at ${apiUrl}.`)
      return
    }

    const projectRoot = resolve(import.meta.dirname, '..')
    const pythonPath = resolve(projectRoot, 'venv', 'Scripts', 'python.exe')
    const backendPath = resolve(projectRoot, 'backend')

    console.log('Starting RetailPulse API...')
    const apiProcess = spawn(
      pythonPath,
      [
        '-m',
        'uvicorn',
        'app.main:app',
        '--host',
        '127.0.0.1',
        '--port',
        '8000',
      ],
      {
        cwd: backendPath,
        stdio: 'inherit',
        windowsHide: true,
      },
    )

    const stopApi = () => {
      if (apiProcess.exitCode === null) {
        apiProcess.kill()
      }
    }

    server.httpServer?.once('close', stopApi)
    process.once('exit', stopApi)

    await waitForApi(apiProcess)
    console.log(`RetailPulse API is ready at ${apiUrl}.`)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    ensureRetailPulseApi(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        // Uvicorn's default local port is 8000. Keep this configurable for
        // environments that expose the backend at another address.
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    // Always resolve hooks and the renderer through the frontend's React copy.
    dedupe: ['react', 'react-dom'],
  },
})
