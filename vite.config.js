// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import { VitePWA } from "vite-plugin-pwa";
// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    vuetify({
      autoImport: true,
    }),
    ViteFonts({
      google: {
        families: ["Nanum Gothic", "Inder", "Do Hyeon",{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "AI무드등",
        short_name: "AI무드등",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        theme_color: "#595959",
        background_color: "#595959",
        display: "standalone",
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
})
