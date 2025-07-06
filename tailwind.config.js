/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./script-*.js",
    "./api/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        reslife: {
          "primary": "#22c55e",          // Green 500
          "primary-content": "#ffffff",   // White
          
          "secondary": "#16a34a",         // Green 600
          "secondary-content": "#ffffff", // White
          
          "accent": "#84cc16",            // Lime 500
          "accent-content": "#000000",    // Black
          
          "neutral": "#f3f4f6",           // Gray 100
          "neutral-content": "#1f2937",   // Gray 800
          
          "base-100": "#ffffff",          // White
          "base-200": "#f9fafb",          // Gray 50
          "base-300": "#f3f4f6",          // Gray 100
          "base-content": "#1f2937",      // Gray 800
          
          "info": "#3b82f6",              // Blue 500
          "info-content": "#ffffff",      // White
          
          "success": "#22c55e",           // Green 500
          "success-content": "#ffffff",   // White
          
          "warning": "#f59e0b",           // Amber 500
          "warning-content": "#000000",   // Black
          
          "error": "#ef4444",             // Red 500
          "error-content": "#ffffff",     // White

          "--rounded-box": "0.5rem",
          "--rounded-btn": "0.375rem",
          "--rounded-badge": "1.5rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
      "light",
      "dark"
    ],
  },
}