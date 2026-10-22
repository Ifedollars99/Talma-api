import HubLayout from '../../components/hubs/HubLayout'
import { finalYearCategories } from '../../data/hubs/finalYear'

/** Final-year project hub. */
export default function FinalYearPage() {
  return (
    <HubLayout
      title="Final-Year Hub"
      heroTitle="I'm a Final-Year Student"
      heroDescription="Topic to defence — proposal, chapters, documentation, implementation and viva prep for OOU finalists. Your department's project handbook overrides everything here."
      searchPlaceholder="Search proposal, chapters, UML, defence..."
      emptyMessage="No final-year topics match"
      categories={finalYearCategories}
    />
  )
}
