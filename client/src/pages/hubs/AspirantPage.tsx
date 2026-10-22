import HubLayout from '../../components/hubs/HubLayout'
import { aspirantCategories } from '../../data/hubs/aspirant'

/** Aspirant / Admission hub. */
export default function AspirantPage() {
  return (
    <HubLayout
      title="Aspirant / Admission Hub"
      heroTitle="I'm an Aspirant"
      heroDescription="Everything from choosing OOU to clearance — requirements, aggregate, CAPS and the mistakes that cost admission. Always confirm cut-offs and dates on the OOU portal and JAMB brochure."
      searchPlaceholder="Search courses, CAPS, aggregate, cut-off..."
      emptyMessage="No admission topics match"
      categories={aspirantCategories}
    />
  )
}
