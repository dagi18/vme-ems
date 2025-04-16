"use client"

import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"

interface BadgeTemplatePreviewProps {
  templateId: string
  showQrCode: boolean
  showLogo: boolean
  orientation: string
  fontSize: number
  primaryColor: string
  textColor: string
  previewType: "attendee" | "vip" | "speaker"
}

export function BadgeTemplatePreview({
  templateId,
  showQrCode,
  showLogo,
  orientation,
  fontSize,
  primaryColor,
  textColor,
  previewType,
}: BadgeTemplatePreviewProps) {
  // Sample data based on preview type
  const previewData = {
    attendee: {
      name: "John Smith",
      company: "Acme Corporation",
      title: "Marketing Manager",
      eventName: "Annual Technology Conference 2025",
    },
    vip: {
      name: "Sarah Johnson",
      company: "Tech Innovators",
      title: "Chief Marketing Officer",
      eventName: "Annual Technology Conference 2025",
    },
    speaker: {
      name: "Dr. Michael Brown",
      company: "Future Technologies",
      title: "AI Research Director",
      eventName: "Annual Technology Conference 2025",
    },
  }

  const data = previewData[previewType]

  return (
    <div
      className="relative border rounded-lg bg-white overflow-hidden"
      style={{
        width: orientation === "landscape" ? "3.375in" : "2.125in",
        height: orientation === "landscape" ? "2.125in" : "3.375in",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Background color strip */}
      <div className="absolute top-0 left-0 right-0 h-12 rounded-t-lg" style={{ backgroundColor: primaryColor }}></div>

      {/* Logo */}
      {showLogo && (
        <div className="absolute top-4 left-4">
          <Image src="/images/validity-logo.png" alt="Logo" width={100} height={30} />
        </div>
      )}

      {/* Event name */}
      <div
        className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full"
        style={{ backgroundColor: `${primaryColor}30`, color: textColor }}
      >
        {data.eventName}
      </div>

      {/* Attendee info */}
      <div
        className="absolute"
        style={{
          left: "20px",
          top: showLogo ? "60px" : "20px",
          color: textColor,
        }}
      >
        <div style={{ fontSize: `${fontSize}px`, fontWeight: "bold" }}>{data.name}</div>
        <div style={{ fontSize: `${fontSize - 2}px`, marginTop: "4px" }}>{data.company}</div>
        <div style={{ fontSize: `${fontSize - 2}px` }}>{data.title}</div>
      </div>

      {/* QR Code */}
      {showQrCode && (
        <div
          className="absolute"
          style={{
            right: "20px",
            top: orientation === "landscape" ? "50px" : "120px",
          }}
        >
          <div className="p-1 bg-white rounded-lg border">
            <QRCodeSVG value="sample-id-12345" size={80} />
          </div>
        </div>
      )}

      {/* Badge type indicator */}
      {previewType !== "attendee" && (
        <div
          className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: previewType === "vip" ? "#FFD700" : "#9333EA",
            color: previewType === "vip" ? "#000000" : "#FFFFFF",
          }}
        >
          {previewType.toUpperCase()}
        </div>
      )}

      {/* Badge ID */}
      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">ID: SAMPLE-12345</div>
    </div>
  )
}
