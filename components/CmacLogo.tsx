export default function CmacLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CMAC Trujillo"
    >
      {/* Fondo naranja corporativo */}
      <rect width="36" height="36" rx="8" fill="#f47920" />

      {/* Frontón / techo del edificio */}
      <path d="M5 15 L18 6.5 L31 15 Z" fill="white" />

      {/* Cuerpo del edificio */}
      <rect x="7" y="15" width="22" height="11" fill="white" />

      {/* Columnas */}
      <rect x="9"  y="15" width="3" height="11" fill="#f47920" opacity="0.25" />
      <rect x="16.5" y="15" width="3" height="11" fill="#f47920" opacity="0.25" />
      <rect x="24" y="15" width="3" height="11" fill="#f47920" opacity="0.25" />

      {/* Puerta central arco */}
      <path d="M15 26 L15 21 Q18 18 21 21 L21 26 Z" fill="#f47920" />

      {/* Base / escalones */}
      <rect x="5"  y="26" width="26" height="2.5" rx="0.5" fill="white" />
      <rect x="3.5" y="28.5" width="29" height="2" rx="0.5" fill="white" opacity="0.7" />
    </svg>
  )
}
