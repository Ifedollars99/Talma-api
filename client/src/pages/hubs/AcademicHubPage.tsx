import HubLayout from '../../components/hubs/HubLayout'
import { academicCategories } from '../../data/hubs/academic'

/** Academic hub — course materials, past questions and study groups. */
export default function AcademicHubPage() {
  return (
    <HubLayout
      title="Academic Hub"
      heroTitle="Learn together, pass together"
      heroDescription="Course materials, past questions, study groups, lecturer announcements and exam guidance for OOU students."
      searchPlaceholder="Search materials, past questions, study groups..."
      emptyMessage="No academic topics match"
      categories={academicCategories}
    />
  )
}
