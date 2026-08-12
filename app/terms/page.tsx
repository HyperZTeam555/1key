import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"

export const metadata: Metadata = {
  title: "Terms of Service | 1key",
}

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      updated="February 28, 2026"
      sections={[
        {
          title: "Acceptance of Terms",
          paragraphs: [
            "By accessing or using 1key, you agree to these Terms of Service and all applicable laws and regulations.",
            "If you do not agree, do not access or use the service.",
          ],
        },
        {
          title: "Eligibility",
          paragraphs: [
            "You must be at least 13 years old to use 1key.",
            "1key is not intended for use in schools or workplaces. You are fully responsible for your own compliance with local rules, institutional policies, and network policies.",
          ],
        },
        {
          title: "User Conduct",
          paragraphs: [
            "You agree not to use 1key for illegal activity, malicious activity, harassment, or attempts to disrupt service operations.",
            "You agree not to attempt unauthorized access to infrastructure, accounts, systems, or data.",
          ],
        },
        {
          title: "Third Party Games and Services",
          paragraphs: [
            "Most games, game assets, and related content available through 1key are third party content.",
            "1key does not endorse third party games or claim authorship of third party content unless explicitly identified.",
            "Third party content may change, break, or be removed at any time without notice.",
          ],
        },
        {
          title: "No Warranty and Limitation of Liability",
          paragraphs: [
            "The service is provided on an as available and as is basis without warranties of any kind.",
            "1key is not liable for direct or indirect loss, school or employment consequences, account actions, data loss, interruptions, or any other damages resulting from your use of the service.",
          ],
        },
        {
          title: "Intellectual Property",
          paragraphs: [
            "All trademarks, game marks, and third party assets remain the property of their respective owners.",
            "If you are a rights holder and need content reviewed or removed, use the DMCA process published by 1key.",
          ],
        },
        {
          title: "Enforcement and Suspension",
          paragraphs: [
            "1key may restrict access, remove content, or suspend use at any time where abuse, legal risk, or operational risk is identified.",
          ],
        },
        {
          title: "Changes to Terms",
          paragraphs: [
            "These terms may be updated at any time. Continued use of 1key after updates constitutes acceptance of the revised terms.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "For legal or policy questions, contact frankprice437@gmail.com.",
          ],
        },
      ]}
    />
  )
}

