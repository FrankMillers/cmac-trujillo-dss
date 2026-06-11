import Image from 'next/image'

export default function CmacLogo({ size = 36 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Caja Trujillo"
      width={size}
      height={size}
      className="shrink-0 rounded-md object-contain"
      priority
    />
  )
}

