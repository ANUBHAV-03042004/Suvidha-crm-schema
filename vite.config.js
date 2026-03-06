import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️  IMPORTANT: Set `base` to your exact GitHub repository name
// e.g. if your repo URL is https://github.com/alice/suvidha-crm-schema
// then base should be '/suvidha-crm-schema/'
export default defineConfig({
  plugins: [react()],
  base: '/suvidha-crm-schema/',   // ← change this to your repo name
})
