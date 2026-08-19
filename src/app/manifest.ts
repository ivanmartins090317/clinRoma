import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClinRoma",
    short_name: "ClinRoma",
    description: "Agenda, prontuário e estoque da clínica odontológica.",
    start_url: "/hoje",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6B2737",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Scan estoque",
        short_name: "Scan",
        url: "/estoque/scan",
        icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
