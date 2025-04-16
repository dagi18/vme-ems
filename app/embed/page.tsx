"use client"

import { EmbeddedRegistrationForm } from "@/components/embedded-registration-form"

export default function EmbedPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Embedded Registration Form Example</h1>
        <p className="text-muted-foreground mb-8 text-center">
          This form can be embedded on any website to allow guests to register for your events.
        </p>

        <EmbeddedRegistrationForm />
      </div>
    </div>
  )
}
