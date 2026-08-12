import type { Metadata } from "next"
import { LegalDocument } from "@/components/legal-document"

export const metadata: Metadata = {
  title: "Privacy Policy | 1key",
}

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="February 28, 2026"
      sections={[
        {
          title: "Scope and Consent",
          paragraphs: [
            "This Privacy Policy explains how 1key handles information when you access or use the website. By using 1key, you acknowledge and agree to the data practices described in this policy.",
            "If you do not agree with this policy, do not use 1key.",
          ],
        },
        {
          title: "Information We Collect",
          paragraphs: [
            "We collect limited technical and usage information needed to operate and protect the service. This may include device type, browser type, approximate region, page interactions, referral data, and basic performance events.",
            "We may also process limited ad related and analytics related identifiers through third party services.",
          ],
        },
        {
          title: "Analytics and Advertising",
          paragraphs: [
            "1key uses analytics to understand site performance and usage trends.",
            "1key may display advertising through Adsterra and related ad delivery systems. These services may use cookies, local storage, and similar technologies to serve and measure ads, detect abuse, and improve delivery.",
          ],
        },
        {
          title: "How We Use Information",
          paragraphs: [
            "Information may be used to operate the website, maintain uptime, improve performance, prevent abuse, support moderation and legal compliance, and understand aggregate usage patterns.",
            "We do not sell personal profile data as a standalone product.",
          ],
        },
        {
          title: "Third Party Games and Content",
          paragraphs: [
            "Most games and related assets on 1key are provided by third party sources. 1key does not claim ownership of third party game content unless explicitly stated.",
            "Use of third party content may be subject to additional external terms and policies controlled by those providers.",
          ],
        },
        {
          title: "Hosting and Data Location",
          paragraphs: [
            "Core hosting infrastructure is operated in France, Gravelines. Technical logs and related service data may be processed in that region and in other regions used by essential infrastructure providers.",
          ],
        },
        {
          title: "Children",
          paragraphs: [
            "1key is not intended for children under 13 years of age. If you are under 13, do not use this service.",
          ],
        },
        {
          title: "Intended Use and Responsibility",
          paragraphs: [
            "1key is not intended for use at school or in workplaces. You are solely responsible for how and where you access the service.",
            "1key is not responsible for disciplinary, legal, employment, school, network, or device consequences related to user activity.",
          ],
        },
        {
          title: "Policy Updates and Contact",
          paragraphs: [
            "We may update this policy at any time. Continued access or use of 1key after updates means you accept the revised policy.",
            "Privacy or legal questions can be sent to frankprice437@gmail.com.",
          ],
        },
      ]}
    />
  )
}

