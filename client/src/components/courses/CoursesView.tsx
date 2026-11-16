import DashboardFeed from '../dashboard/DashboardFeed'

interface ClassroomViewProps {
  onOpenSearch: () => void
  onUpload: () => void
}

/**
 * Classroom tab — the search, feed tabs and educational posts that used to sit
 * on the Home tab below the welcome card.
 */
export default function ClassroomView({ onOpenSearch, onUpload }: ClassroomViewProps) {
  return (
    <div className="space-y-8">
      <DashboardFeed onOpenSearch={onOpenSearch} onUpload={onUpload} />
    </div>
  )
}
