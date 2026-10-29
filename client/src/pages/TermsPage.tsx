import LegalPageLayout, {
  LegalList,
  LegalSection,
} from '../components/legal/LegalPageLayout'

const LAST_UPDATED = '29 October 2026'

/** Public terms of service, linked from the landing page and the Google OAuth consent screen. */
export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <LegalSection heading="1. Acceptance of these terms">
        <p>
          These Terms of Service (“Terms”) govern your use of Talma, a social learning platform
          for students and lecturers. By creating an account, accessing or using Talma, you agree
          to these Terms and to our Privacy Policy. If you do not agree, do not use the service.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligibility and accounts">
        <p>
          You must be old enough to use the service under the laws that apply to you. You are
          responsible for the information you provide, for keeping your login credentials secure,
          and for all activity on your account. Do not share your account or impersonate another
          person. Tell us promptly if you believe your account has been compromised.
        </p>
      </LegalSection>

      <LegalSection heading="3. User content and conduct">
        <p>
          You keep ownership of the content you create and upload. By posting content, you grant
          Talma a non-exclusive, worldwide licence to host, store, reproduce, display and
          distribute that content as needed to operate and promote the service. You confirm that
          you have the rights needed to grant this licence and that your content does not infringe
          anyone else’s rights.
        </p>
        <p>You must not post or upload content that is unlawful, harmful, hateful, harassing, deceptive, sexually exploitative, or that infringes copyright, trade marks or other rights. We may remove content and suspend or terminate accounts that violate these Terms.</p>
      </LegalSection>

      <LegalSection heading="4. Creator lessons, prices and payments">
        <p>
          Approved creators may upload lessons to Talma’s YouTube channel. The creator chooses the
          price students pay for lifetime access, using a suggested amount, a custom amount, or
          the free option. Talma reviews uploads before they are listed in the library.
        </p>
        <LegalList>
          <li>
            Paid lessons are sold through Paystack. The price displayed in Talma at checkout is
            the price stored on our servers; the browser cannot change it.
          </li>
          <li>
            By default, the creator receives 70% of each sale and Talma retains 30%, unless a
            different split is agreed in writing. Paystack’s processing fee is borne by the
            platform as configured. Creator payouts are made through the creator’s Paystack
            subaccount.
          </li>
          <li>
            Creators are responsible for the accuracy of their payout details, for their own
            taxes, and for resolving refunds, chargebacks and payment disputes with Talma.
          </li>
          <li>
            Talma may reject, unpublish or remove a lesson that violates these Terms, infringes
            rights, or is reported as unlawful. Rejected uploads may be deleted from YouTube.
          </li>
          <li>
            Creators confirm that they own or have permission to use every part of their lesson,
            including video, audio, music, images and text, and that the lesson is not made for
            children.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="5. Paid video licence">
        <p>
          When you pay for a lesson, you receive a personal, non-exclusive, non-transferable
          licence to watch it for as long as Talma makes it available. You may not share, resell,
          redistribute, download, record or publicly perform the lesson, or share the YouTube link
          with anyone else. Access is granted to the purchasing account only.
        </p>
      </LegalSection>

      <LegalSection heading="6. YouTube integration">
        <p>
          Talma uses YouTube API Services to host creator lessons. By using Talma’s video
          features, you agree to be bound by the{' '}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#2f6b3d] underline"
          >
            YouTube Terms of Service
          </a>{' '}
          and acknowledge the{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#2f6b3d] underline"
          >
            Google Privacy Policy
          </a>
          .
        </p>
        <p>
          YouTube is a third-party service, not part of Talma. YouTube may change, restrict or
          remove videos, and may suspend channels, in line with its own policies. Talma does not
          control YouTube and is not responsible for interruptions or removals caused by YouTube.
          Unlisted YouTube links are not a technical DRM lock; Talma withholds the link until
          payment, but cannot prevent a viewer who receives the link from sharing it.
        </p>
      </LegalSection>

      <LegalSection heading="7. Intellectual property">
        <p>
          The Talma name, logo, interface, software and original content are owned by Talma or its
          licensors and are protected by intellectual-property laws. These Terms do not grant you
          any right to use Talma’s branding or software except as needed to use the service
          normally.
        </p>
      </LegalSection>

      <LegalSection heading="8. Acceptable use">
        <p>You must not:</p>
        <LegalList>
          <li>Use Talma for unlawful, fraudulent or abusive purposes.</li>
          <li>Attempt to access another user’s account, data or private content.</li>
          <li>Interfere with the service, bypass payment or access controls, or probe its security.</li>
          <li>Scrape, copy or resell Talma content or other users’ content without permission.</li>
          <li>Upload malware, spam or content that violates these Terms or applicable law.</li>
        </LegalList>
      </LegalSection>

      <LegalSection heading="9. Suspension and termination">
        <p>
          We may suspend or terminate your account if you violate these Terms, if required by law,
          or if your account creates risk for other users or for Talma. You may stop using Talma
          at any time and may delete your account from the settings screen. Provisions that by
          their nature should survive termination, including payment obligations and
          intellectual-property terms, will continue to apply.
        </p>
      </LegalSection>

      <LegalSection heading="10. Disclaimers">
        <p>
          Talma is provided on an “as available” basis. To the extent permitted by law, we do not
          warrant that the service will be uninterrupted, error-free or secure, or that content
          will be accurate or available. Lessons are created by users; Talma does not guarantee
          their quality or completeness.
        </p>
      </LegalSection>

      <LegalSection heading="11. Limitation of liability">
        <p>
          To the extent permitted by law, Talma will not be liable for indirect, incidental,
          special, consequential or punitive damages, or for lost profits, data or goodwill,
          arising from your use of the service. Where liability cannot be excluded, our total
          liability for a claim will not exceed the greater of the amount you paid Talma in the
          twelve months before the claim or the minimum amount required by applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="12. Governing law">
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria, without regard
          to conflict-of-law rules. The courts of Nigeria will have jurisdiction over disputes,
          unless applicable consumer law gives you the right to bring a claim elsewhere.
        </p>
      </LegalSection>

      <LegalSection heading="13. Changes to these terms">
        <p>
          We may update these Terms from time to time. When we do, we will change the “Last
          updated” date at the top of this page. Continued use of Talma after an update means you
          accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection heading="14. Contact us">
        <p>
          Questions about these Terms? Email{' '}
          <a href="mailto:taofeeqifedollar@gmail.com" className="font-semibold text-[#2f6b3d] underline">
            taofeeqifedollar@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
