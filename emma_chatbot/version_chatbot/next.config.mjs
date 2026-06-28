import path from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const projectRoot = path.dirname(fileURLToPath(import.meta.url))
// Dans ton setup, `node_modules/next` semble être installé au niveau parent.
// On force donc Turbopack à utiliser ce dossier comme root pour pouvoir résoudre `next`.
const turbopackRoot = path.resolve(projectRoot, "..")

const nextConfig = {
  turbopack: {
    // Force Turbopack to treat this directory as root (prevents wrong root inference
    // when multiple lockfiles exist in parent folders).
    root: turbopackRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
