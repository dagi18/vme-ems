"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BadgeTemplateEditor } from "@/components/badge-template-editor"
import { BadgeTemplatePreview } from "@/components/badge-template-preview"
import { Plus, Save, Undo, Redo, Copy, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BadgeTemplatesPage() {
  const [activeTemplate, setActiveTemplate] = useState("standard")
  const [templateName, setTemplateName] = useState("Standard Badge")
  const [badgeSize, setBadgeSize] = useState("cr80")
  const [orientation, setOrientation] = useState("landscape")
  const [showQrCode, setShowQrCode] = useState(true)
  const [showLogo, setShowLogo] = useState(true)
  const [fontSize, setFontSize] = useState([14])
  const [primaryColor, setPrimaryColor] = useState("#FFDC00")
  const [textColor, setTextColor] = useState("#000000")

  const templates = [
    { id: "standard", name: "Standard Badge", default: true },
    { id: "vip", name: "VIP Badge", default: false },
    { id: "staff", name: "Staff Badge", default: false },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/badges">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Badge Templates</h1>
              <p className="text-muted-foreground">Create and customize badge templates</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-1">
              <Plus className="h-4 w-4" /> New Template
            </Button>
            <Button className="flex items-center gap-1">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>Select a template to edit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        activeTemplate === template.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveTemplate(template.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          {template.default && <span className="text-xs text-muted-foreground">Default</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Copy className="h-4 w-4" />
                          </Button>
                          {!template.default && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Configure badge template properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="badge-size">Badge Size</Label>
                    <Select value={badgeSize} onValueChange={setBadgeSize}>
                      <SelectTrigger id="badge-size">
                        <SelectValue placeholder="Select badge size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cr80">CR80 (3.375" x 2.125")</SelectItem>
                        <SelectItem value="cr79">CR79 (3.303" x 2.051")</SelectItem>
                        <SelectItem value="custom">Custom Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select value={orientation} onValueChange={setOrientation}>
                      <SelectTrigger id="orientation">
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Landscape</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-qr">Show QR Code</Label>
                    <Switch id="show-qr" checked={showQrCode} onCheckedChange={setShowQrCode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-logo">Show Logo</Label>
                    <Switch id="show-logo" checked={showLogo} onCheckedChange={setShowLogo} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Style Settings</CardTitle>
                <CardDescription>Customize badge appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <span className="text-sm">{fontSize[0]}px</span>
                  </div>
                  <Slider id="font-size" min={10} max={24} step={1} value={fontSize} onValueChange={setFontSize} />
                </div>

                <div>
                  <Label htmlFor="primary-color" className="block mb-2">
                    Primary Color
                  </Label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: primaryColor }}></div>
                    <Input
                      id="primary-color"
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="text-color" className="block mb-2">
                    Text Color
                  </Label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: textColor }}></div>
                    <Input
                      id="text-color"
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Badge Editor</CardTitle>
                <CardDescription>Drag and drop elements to customize your badge</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center mb-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Undo className="h-4 w-4 mr-1" /> Undo
                    </Button>
                    <Button variant="outline" size="sm">
                      <Redo className="h-4 w-4 mr-1" /> Redo
                    </Button>
                  </div>
                </div>
                <BadgeTemplateEditor
                  templateId={activeTemplate}
                  showQrCode={showQrCode}
                  showLogo={showLogo}
                  orientation={orientation}
                  fontSize={fontSize[0]}
                  primaryColor={primaryColor}
                  textColor={textColor}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>Preview how the badge will look with sample data</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="attendee">
                  <TabsList className="mb-4">
                    <TabsTrigger value="attendee">Attendee</TabsTrigger>
                    <TabsTrigger value="vip">VIP</TabsTrigger>
                    <TabsTrigger value="speaker">Speaker</TabsTrigger>
                  </TabsList>
                  <div className="flex justify-center">
                    <BadgeTemplatePreview
                      templateId={activeTemplate}
                      showQrCode={showQrCode}
                      showLogo={showLogo}
                      orientation={orientation}
                      fontSize={fontSize[0]}
                      primaryColor={primaryColor}
                      textColor={textColor}
                      previewType="attendee"
                    />
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
