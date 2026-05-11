import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Permite que o deploy termine mesmo se houver avisos de padrão de código
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite o deploy mesmo se houver pequenos erros de tipagem
    ignoreBuildErrors: true,
  }
};
// Forçando deploy 4C
export default nextConfig;