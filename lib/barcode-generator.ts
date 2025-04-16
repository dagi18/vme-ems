/**
 * Utility function to generate barcode SVG
 */
export function generateBarcodeSVG(
  value: string,
  options: {
    height?: number
    width?: number
    displayValue?: boolean
    fontSize?: number
    margin?: number
    background?: string
    lineColor?: string
    format?: string
  } = {},
): string {
  // Default options with black and yellow theme
  const {
    height = 100,
    displayValue = true,
    fontSize = 16,
    margin = 10,
    background = "#ffffff",
    lineColor = "#000000", // Black lines for better contrast
    format = "CODE128",
  } = options

  // Calculate width based on the length of the value
  const width = options.width || Math.max(value.length * 14, 200)

  // Create bars (simplified representation)
  let bars = ""
  const barWidth = 2
  const spacing = 1
  let x = margin

  // Generate random-looking bars based on the value
  // This is just for visualization - not a real barcode algorithm
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i)
    const barHeight = height - (displayValue ? 20 : 0)

    // Generate a bar with height based on character code
    bars += `<rect x="${x}" y="${margin}" width="${barWidth}" height="${barHeight}" fill="${lineColor}" />`
    x += barWidth + spacing

    // Add varying width bars
    const wideBar = (charCode % 3) + 1
    bars += `<rect x="${x}" y="${margin}" width="${barWidth * wideBar}" height="${barHeight}" fill="${lineColor}" />`
    x += barWidth * wideBar + spacing
  }

  // Add text if displayValue is true
  const text = displayValue
    ? `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-family="Arial" font-size="${fontSize}" fill="#000000">${value}</text>`
    : ""

  // Create the SVG with a yellow border
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="${background}" />
      <rect x="0" y="0" width="100%" height="100%" fill="none" stroke="#FFDC00" stroke-width="2" />
      ${bars}
      ${text}
    </svg>
  `

  return svg
}
