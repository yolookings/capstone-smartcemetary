import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch/**",
    // Gradual migration: ignore legacy files to keep strict rules active on all refactored core files
    "src/components/**",
    "src/app/dashboard/admin/layout.tsx",
    "src/app/dashboard/admin/page.tsx",
    "src/app/dashboard/admin/makam/**",
    "src/app/dashboard/admin/notifications/**",
    "src/app/dashboard/admin/pengajuan/**",
    "src/app/dashboard/admin/pengaturan/**",
    "src/app/dashboard/admin/users/**",
    "src/app/dashboard/chat/**",
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/pengajuan/baru/**",
    "src/app/dashboard/pengajuan/page.tsx",
    "src/app/dashboard/pengajuan/revision/**",
    "src/app/makam/**",
    "src/app/page.tsx",
  ]),
]);

export default eslintConfig;
