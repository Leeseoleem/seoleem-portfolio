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
  ]),
  {
    // 3D 씬 레이어.
    // react-three-fiber는 three.js 객체(Mesh, Material, Vector3, Texture 등)를
    // 렌더/useFrame 안에서 직접 변형하는 것이 정상 사용법이다.
    // 매 프레임 새 객체를 만들면 GC가 돌아 프레임이 끊기므로 React Compiler의
    // 불변성/ref 규칙은 이 폴더에서만 끈다. 여기 밖의 React 코드에는 그대로 적용된다.
    files: ["components/desk/scene/**/*.tsx", "lib/desk/**/*.ts"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
