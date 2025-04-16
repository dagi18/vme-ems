import { jsPDF } from "jspdf"
import "jspdf-autotable"

interface RegistrationPDFData {
  guestId: string
  badgeId: string
  eventName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  jobTitle?: string
  barcodeDataUrl?: string | null
}

export async function generateRegistrationPDF(data: RegistrationPDFData): Promise<void> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Define colors for black and yellow theme
  const yellowColor = [255, 220, 0] // RGB for yellow
  const blackColor = [0, 0, 0] // RGB for black
  const whiteColor = [255, 255, 255] // RGB for white

  // Add yellow header background
  doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
  doc.rect(0, 0, 210, 40, "F")

  // Add title
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.text("Event Registration Confirmation", 105, 20, { align: "center" })

  // Add event name
  doc.setFontSize(16)
  doc.setFont("helvetica", "normal")
  doc.text(data.eventName, 105, 30, { align: "center" })

  // Reset text color for the rest of the document
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])

  // Add date
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  doc.setFontSize(10)
  doc.text(`Generated on: ${currentDate}`, 105, 50, { align: "center" })

  // Add attendee information section
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Attendee Information", 20, 65)

  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")

  // Attendee details
  const attendeeDetails = [
    ["Name:", `${data.firstName} ${data.lastName}`],
    ["Email:", data.email],
    ["Phone:", data.phone],
    ["Badge ID:", data.badgeId],
  ]

  if (data.company) {
    attendeeDetails.push(["Company:", data.company])
  }

  if (data.jobTitle) {
    attendeeDetails.push(["Job Title:", data.jobTitle])
  }
  // Add attendee details table with yellow highlights
  ;(doc as any).autoTable({
    startY: 70,
    head: [],
    body: attendeeDetails,
    theme: "plain",
    styles: {
      fontSize: 12,
      cellPadding: 4,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 30,
        fillColor: [255, 250, 230], // Light yellow background
      },
      1: {
        cellWidth: 100,
      },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255], // White background
    },
    tableLineColor: [255, 220, 0], // Yellow border
    tableLineWidth: 0.1,
  })

  // Add barcode section with yellow background
  doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
  doc.rect(50, 120, 110, 40, "F")

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.text("Your Barcode", 105, 130, { align: "center" })

  // Add barcode to PDF
  try {
    if (data.barcodeDataUrl) {
      // If a barcode data URL is provided, use it
      // Add white background for barcode
      doc.setFillColor(whiteColor[0], whiteColor[1], whiteColor[2])
      doc.roundedRect(65, 135, 80, 20, 2, 2, "F")

      // Add the image with  whiteColor[2])
      doc.roundedRect(65, 135, 80, 20, 2, 2, "F")

      // Add the image with proper dimensions to fit the barcode properly
      const maxWidth = 70 // Maximum width in mm
      const maxHeight = 15 // Maximum height in mm

      // Add the image with proper dimensions
      doc.addImage(data.barcodeDataUrl, "PNG", 70, 137, maxWidth, maxHeight)

      // Add badge ID below the barcode
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Badge ID:", 105, 165, { align: "center" })
      doc.text(data.badgeId, 105, 172, { align: "center" })
    } else {
      // Otherwise, create a simple representation
      // Add white background for barcode
      doc.setFillColor(whiteColor[0], whiteColor[1], whiteColor[2])
      doc.roundedRect(65, 135, 80, 20, 2, 2, "F")

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Guest ID:", 70, 145)
      doc.setFont("helvetica", "bold")
      doc.text(data.guestId, 95, 145)

      // Draw a simple barcode representation
      const barWidth = 0.8
      let x = 70
      for (let i = 0; i < data.guestId.length; i++) {
        const charCode = data.guestId.charCodeAt(i)
        if (charCode % 2 === 0) {
          const barHeight = 10 + (charCode % 5)
          doc.setFillColor(0, 0, 0)
          doc.rect(x, 150, barWidth, barHeight, "F")
        }
        x += barWidth * 2
      }

      // Add badge ID below the barcode
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Badge ID:", 105, 165, { align: "center" })
      doc.setFont("helvetica", "bold")
      doc.text(data.badgeId, 105, 172, { align: "center" })
    }
  } catch (error) {
    console.error("Error adding barcode to PDF:", error)
    // Fallback if barcode generation fails
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text("Guest ID:", 105, 145, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.text(data.guestId, 105, 152, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.text("Badge ID:", 105, 165, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.text(data.badgeId, 105, 172, { align: "center" })
  }

  // Add black background for instructions
  doc.setFillColor(blackColor[0], blackColor[1], blackColor[2])
  doc.rect(20, 185, 170, 25, "F")

  // Add instructions in white text
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2])
  doc.text("Please present this confirmation at the event entrance to print your badge.", 105, 195, { align: "center" })
  doc.text("You can also show the barcode on your mobile device.", 105, 202, { align: "center" })

  // Add yellow footer
  doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2])
  doc.rect(0, 270, 210, 27, "F")

  // Add footer text
  doc.setFontSize(10)
  doc.setTextColor(blackColor[0], blackColor[1], blackColor[2])
  doc.text("Validity Events Management System", 105, 280, { align: "center" })
  doc.text("This is an automatically generated document.", 105, 285, { align: "center" })

  // Save the PDF
  doc.save(`event-registration-${data.badgeId}.pdf`)
}
