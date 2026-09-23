import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compra / sugestão de planilha: JPEG/PNG/WebP até 10 MB via Server Action.
  // Default do Next é 1 MB; multipart precisa de folga além do arquivo.
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
