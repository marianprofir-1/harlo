/// <reference types="nativewind/types" />

// Allow CSS side-effect imports (used by NativeWind global.css)
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
