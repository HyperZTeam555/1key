import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"

export const metadata: Metadata = {
  title: "DMCA Policy | 1key",
}

export default function DmcaPage() {
  return (
    <LegalDocument
      title="DMCA Policy"
      updated="February 28, 2026"
      sections={[
        {
          title: "DMCA Notice Process",
          paragraphs: [
            "1key responds to valid copyright notices under applicable law. If you believe copyrighted content is being used without authorization, submit a complete DMCA notice.",
            "Incomplete, abusive, misleading, or fraudulent submissions may be rejected or ignored.",
          ],
        },
        {
          title: "Required Notice Elements",
          paragraphs: [
            "Your notice must include all of the following: your full legal name, your contact email address, identification of the copyrighted work, and the exact URL or URLs where the material appears on 1key.",
            "Your notice must also include a good faith statement that the disputed use is not authorized by the copyright owner, agent, or law.",
            "Your notice must include a statement under penalty of perjury that the information in the notice is accurate and that you are authorized to act for the rights holder.",
            "Your notice must include your physical or electronic signature.",
          ],
        },
        {
          title: "Submission Address",
          paragraphs: [
            "Send DMCA notices to frankprice437@gmail.com with the subject line DMCA Notice.",
          ],
        },
        {
          title: "Review and Action",
          paragraphs: [
            "If a notice is complete and appears valid, 1key may remove or disable access to the referenced content and may notify the uploader or source where applicable.",
          ],
        },
        {
          title: "Counter Notice",
          paragraphs: [
            "If your content is removed and you believe removal was in error, you may submit a counter notice with sufficient legal detail. 1key may forward valid counter notices to the original complainant as required by law.",
          ],
        },
        {
          title: "Bad Faith and Abuse",
          paragraphs: [
            "False, troll, spam, or bad faith notices are prohibited. Notices that do not meet requirements or appear abusive may be ignored without response.",
            "Submitting knowingly false claims can create legal liability.",
          ],
        },
        {
          title: "Additional Notes",
          paragraphs: [
            "Most games on 1key are third party assets and are not represented as original works of 1key unless clearly stated.",
            "Use of 1key is not intended for school or workplace activity, and users are responsible for their own usage decisions.",
          ],
        },
      ]}
    />
  )
}

