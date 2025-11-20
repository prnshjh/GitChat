import Image from "next/image"

export function Logo() {
  return (
    <div className="relative h-8 w-8">
      <Image src="/favicon.ico" alt="GitChat Logo" fill className="object-contain" priority />
    </div>
  )
}

