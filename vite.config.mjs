import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

function copyPortfolioAssets() {
  return {
    name: "copy-portfolio-assets",
    closeBundle() {
      const root = process.cwd();
      const assetsDir = path.join(root, "dist", "assets");
      mkdirSync(assetsDir, { recursive: true });

      const optimizedAssets = path.join(root, "assets");
      if (existsSync(optimizedAssets)) {
        cpSync(optimizedAssets, assetsDir, { recursive: true });
      }

      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isFile() && /\.(?:gif|svg|pdf)$/i.test(entry.name)) {
          copyFileSync(path.join(root, entry.name), path.join(assetsDir, entry.name));
        }
      }
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/liu-xinyue-portfolio-3/" : "/",
  plugins: [react(), copyPortfolioAssets()],
});
