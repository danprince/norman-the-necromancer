import { defineConfig } from "vite";

export default defineConfig({
  build: {
    polyfillModulePreload: false,
    reportCompressedSize: false,
    assetsInlineLimit: 0,
    minify: "terser",
    terserOptions: {
      mangle: {
        properties: true,
      },
    },
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
});
