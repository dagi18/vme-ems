"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Type, ImageIcon, QrCode } from "lucide-react"

interface BadgeTemplateEditorProps {
  templateId: string
  showQrCode: boolean
  showLogo: boolean
  orientation: string
  fontSize: number
  primaryColor: string
  textColor: string
}

interface BadgeElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  content?: string
  fontSize?: number
  fontWeight?: string
}

export function BadgeTemplateEditor({
  templateId,
  showQrCode,
  showLogo,
  orientation,
  fontSize,
  primaryColor,
  textColor,
}: BadgeTemplateEditorProps) {
  const [elements, setElements] = useState<BadgeElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const editorRef = useRef<HTMLDivElement>(null)

  // Initialize with default elements based on template
  useEffect(() => {
    const defaultElements: BadgeElement[] = [
      {
        id: "name",
        type: "text",
        x: 20,
        y: 60,
        width: 200,
        height: 30,
        content: "Full Name",
        fontSize: fontSize,
        fontWeight: "bold",
      },
      {
        id: "company",
        type: "text",
        x: 20,
        y: 90,
        width: 200,
        height: 20,
        content: "Company Name",
        fontSize: fontSize - 2,
      },
      {
        id: "title",
        type: "text",
        x: 20,
        y: 110,
        width: 200,
        height: 20,
        content: "Job Title",
        fontSize: fontSize - 2,
      },
    ]

    if (showLogo) {
      defaultElements.push({
        id: "logo",
        type: "logo",
        x: 20,
        y: 20,
        width: 100,
        height: 30,
      })
    }

    if (showQrCode) {
      defaultElements.push({
        id: "qrcode",
        type: "qrcode",
        x: orientation === "landscape" ? 250 : 150,
        y: 50,
        width: 80,
        height: 80,
      })
    }

    setElements(defaultElements)
  }, [templateId, showQrCode, showLogo, orientation, fontSize])

  // Handle mouse down on element
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    const element = elements.find((el) => el.id === elementId)
    if (!element) return

    setSelectedElement(elementId)
    setIsDragging(true)

    // Calculate offset from mouse position to element position
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !editorRef.current) return

    const editorRect = editorRef.current.getBoundingClientRect()
    const newX = e.clientX - editorRect.left - dragOffset.x
    const newY = e.clientY - editorRect.top - dragOffset.y

    // Update element position
    setElements(
      elements.map((el) => {
        if (el.id === selectedElement) {
          return {
            ...el,
            x: Math.max(0, Math.min(newX, editorRef.current!.clientWidth - el.width)),
            y: Math.max(0, Math.min(newY, editorRef.current!.clientHeight - el.height)),
          }
        }
        return el
      }),
    )
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add new element
  const addElement = (type: string) => {
    const newElement: BadgeElement = {
      id: `${type}-${Date.now()}`,
      type,
      x: 50,
      y: 50,
      width: type === "qrcode" ? 80 : type === "logo" ? 100 : 200,
      height: type === "qrcode" ? 80 : type === "logo" ? 30 : 20,
      content: type === "text" ? "New Text" : undefined,
      fontSize: type === "text" ? fontSize : undefined,
    }

    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
  }

  // Render element based on type
  const renderElement = (element: BadgeElement) => {
    const isSelected = selectedElement === element.id
    const elementStyle = {
      position: "absolute" as const,
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      cursor: "move",
      border: isSelected ? `2px solid ${primaryColor}` : "1px dashed transparent",
      padding: "2px",
      fontSize: element.fontSize ? `${element.fontSize}px` : undefined,
      fontWeight: element.fontWeight || undefined,
      color: textColor,
      backgroundColor: isSelected ? "rgba(0, 0, 0, 0.05)" : "transparent",
      zIndex: isSelected ? 10 : 1,
    }

    switch (element.type) {
      case "text":
        return (
          <div
            key={element.id}
            style={elementStyle}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            className="flex items-center"
          >
            {element.content}
          </div>
        )
      case "logo":
        return (
          <div
            key={element.id}
            style={elementStyle}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            className="flex items-center"
          >
            <Image src="/images/validity-logo.png" alt="Logo" width={100} height={30} />
          </div>
        )
      case "qrcode":
        return (
          <div
            key={element.id}
            style={elementStyle}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
            className="flex items-center justify-center"
          >
            <QRCodeSVG value="sample-id-12345" size={element.width - 4} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={() => addElement("text")}>
          <Type className="h-4 w-4 mr-1" /> Add Text
        </Button>
        <Button variant="outline" size="sm" onClick={() => addElement("logo")}>
          <ImageIcon className="h-4 w-4 mr-1" /> Add Logo
        </Button>
        <Button variant="outline" size="sm" onClick={() => addElement("qrcode")}>
          <QrCode className="h-4 w-4 mr-1" /> Add QR Code
        </Button>
      </div>

      <div
        ref={editorRef}
        className="relative border rounded-lg mx-auto bg-white"
        style={{
          width: orientation === "landscape" ? "3.375in" : "2.125in",
          height: orientation === "landscape" ? "2.125in" : "3.375in",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background color strip */}
        <div
          className="absolute top-0 left-0 right-0 h-12 rounded-t-lg"
          style={{ backgroundColor: primaryColor }}
        ></div>

        {/* Render all elements */}
        {elements.map(renderElement)}
      </div>
    </div>
  )
}
