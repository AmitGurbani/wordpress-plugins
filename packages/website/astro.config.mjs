import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	site: "https://amitgurbani.github.io",
	base: "/wordpress-plugins",
	vite: { plugins: [tailwindcss()] },
});
