import Link from "next/link"

type LegalSection = {
  title: string
  paragraphs: string[]
}

type LegalDocumentProps = {
  title: string
  updated: string
  sections: LegalSection[]
}

export function LegalDocument({ title, updated, sections }: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-[#edf1f4] px-4 py-10 text-black sm:px-6">
      <main className="mx-auto max-w-4xl rounded-xl border border-[#d7dde3] bg-white p-6 shadow-sm sm:p-10">
        <header className="border-b border-[#e6ebf0] pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-black">{title}</h1>
          <p className="mt-2 text-sm text-[#4c5560]">Last updated: {updated}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/privacy" className="rounded-md border border-[#cfd7df] px-3 py-1.5 text-sm font-medium text-[#1f2937] hover:bg-[#f8fafc]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="rounded-md border border-[#cfd7df] px-3 py-1.5 text-sm font-medium text-[#1f2937] hover:bg-[#f8fafc]">
              Terms of Service
            </Link>
            <Link href="/dmca" className="rounded-md border border-[#cfd7df] px-3 py-1.5 text-sm font-medium text-[#1f2937] hover:bg-[#f8fafc]">
              DMCA
            </Link>
          </div>
        </header>

        <div className="space-y-8 pt-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-black">{section.title}</h2>
              <div className="space-y-3 text-[15px] leading-7 text-[#1f2937]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

