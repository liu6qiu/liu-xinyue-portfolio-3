import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

function copyPortfolioAssets() {
  return {
    name: "copy-portfolio-assets",
    closeBundle() {
      const root = process.cwd();
      const assetsDir = path.join(root, "dist", "assets");
      mkdirSync(assetsDir, { recursive: true });

      for (const directory of ["about", "cases"]) {
        cpSync(path.join(root, directory), path.join(assetsDir, directory), { recursive: true });
      }

      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isFile() && /\.(?:png|jpe?g|webp|gif|svg|pdf)$/i.test(entry.name)) {
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
