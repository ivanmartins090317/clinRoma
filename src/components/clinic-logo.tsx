import Image from "next/image";

interface ClinicLogoProps {
  /** Fundo claro → logo preta. Fundo escuro → logo branca. */
  variant?: "on-light" | "on-dark";
  className?: string;
  priority?: boolean;
}

const LOGO = {
  "on-light": {
    src: "/brand/logo-black.webp",
    alt: "Clínica Neo Roma",
  },
  "on-dark": {
    src: "/brand/logo-white.webp",
    alt: "Clínica Neo Roma",
  },
} as const;

export function ClinicLogo({
  variant = "on-light",
  className = "h-10 w-auto",
  priority = false,
}: ClinicLogoProps) {
  const { src, alt } = LOGO[variant];

  return (
    <Image
      src={src}
      alt={alt}
      width={180}
      height={48}
      priority={priority}
      className={className}
    />
  );
}
