import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["__tests__/setup.ts"],
    testTimeout: 10000,
  },
  resolve: {
    conditions: ["node", "import", "default"],
    alias: {
      "@noble/curves/ed25519": path.resolve("node_modules/@noble/curves/ed25519.js"),
      "@noble/curves/secp256k1": path.resolve("node_modules/@noble/curves/secp256k1.js"),
      "@noble/hashes/hkdf": path.resolve("node_modules/@noble/hashes/hkdf.js"),
      "@noble/hashes/sha256": path.resolve("node_modules/@noble/hashes/sha256.js"),
      "@noble/hashes/sha2": path.resolve("node_modules/@noble/hashes/sha2.js"),
      "@noble/hashes/sha3": path.resolve("node_modules/@noble/hashes/sha3.js"),
      "@noble/hashes/scrypt": path.resolve("node_modules/@noble/hashes/scrypt.js"),
      "@noble/hashes/utils": path.resolve("node_modules/@noble/hashes/utils.js"),
      "@noble/ciphers/aes": path.resolve("node_modules/@noble/ciphers/aes.js"),
      "@noble/ciphers/utils": path.resolve("node_modules/@noble/ciphers/utils.js"),
      "@noble/ciphers/webcrypto": path.resolve("node_modules/@noble/ciphers/webcrypto.js"),
    },
  },
});
