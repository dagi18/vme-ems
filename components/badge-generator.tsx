"use client"

import { useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import Image from "next/image"
import type { Guest } from "@/lib/types"

interface BadgeGeneratorProps {
  guest: Guest
  eventName: string
  onPrint?: () => void
}

export function BadgeGenerator({ guest, eventName, onPrint }: BadgeGeneratorProps) {
  const badgeRef = useRef<HTMLDivElement>(null)

  const printBadge = () => {
    const printContent = document.createElement("div")
    if (badgeRef.current) {
      printContent.innerHTML = badgeRef.current.innerHTML

      const originalBody = document.body.innerHTML
      document.body.innerHTML = printContent.innerHTML

      window.print()
      document.body.innerHTML = originalBody

      // Call the onPrint callback if provided
      if (onPrint) {
        onPrint()
      }
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={badgeRef}
        className="w-[3.375in] h-[2.125in] p-4 border-2 border-primary rounded-xl bg-white shadow-sm mx-auto"
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <Image src="/images/validity-logo.png" alt="Validity Events" width={100} height={30} />
            <div className="text-xs text-right text-secondary bg-primary/20 px-2 py-1 rounded-full">{eventName}</div>
          </div>
          <div className="flex-1 flex">
            <div className="flex-1">
              <div className="text-xl font-bold text-secondary">
                {guest.first_name} {guest.last_name}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{guest.company || "Guest"}</div>
              <div className="text-sm text-muted-foreground">{guest.job_title || ""}</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="p-1 bg-white rounded-lg border-2 border-primary">
                <QRCodeSVG value={guest.id} size={80} level="H" includeMargin={false} />
              </div>
            </div>
          </div>
          <div className="text-xs text-center text-secondary mt-2 bg-primary/20 py-1 rounded-full">
            Badge ID: {guest.badge_id || guest.id}
          </div>
        </div>
      </div>
      <Button onClick={printBadge} className="w-full bg-secondary text-white hover:bg-secondary/80">
        <Printer className="mr-2 h-4 w-4" /> Print Badge
      </Button>
    </div>
  )
}
