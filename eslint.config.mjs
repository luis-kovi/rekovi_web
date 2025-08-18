import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Regras de qualidade de código
      "@next/next/no-img-element": "warn",
      "@next/next/no-page-custom-font": "warn",
      "react-hooks/exhaustive-deps": "warn",
      
      // Prevenir console.logs em produção
      "no-console": ["error", { 
        allow: ["warn", "error"] 
      }],
      
      // TypeScript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      
      // React
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/no-children-prop": "error",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "warn",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "error",
      "react/no-unknown-property": "error",
      "react/require-render-return": "error",
      
      // Imports
      "no-duplicate-imports": "error",
      "sort-imports": ["warn", {
        "ignoreCase": true,
        "ignoreDeclarationSort": true
      }]
    }
  }
];

export default eslintConfig;
