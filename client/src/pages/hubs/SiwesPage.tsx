import HubLayout from '../../components/hubs/HubLayout'
import { siwesCategories } from '../../data/hubs/siwes'

/** SIWES / Industrial Training hub. */
export default function SiwesPage() {
  return (
    <HubLayout
      title="SIWES / IT Hub"
      heroTitle="I'm going for SIWES"
      heroDescription="Eligibility, placement, ITF forms, logbook, report and defence — the full industrial training path for OOU students. Confirm timelines with your departmental SIWES coordinator."
      searchPlaceholder="Search placement, logbook, ITF forms, report..."
      emptyMessage="No SIWES topics match"
      categories={siwesCategories}
    />
  )
}
