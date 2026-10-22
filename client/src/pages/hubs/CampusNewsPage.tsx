import HubLayout from '../../components/hubs/HubLayout'
import { campusNewsCategories } from '../../data/hubs/campusNews'

/** Campus News & Announcements hub. */
export default function CampusNewsPage() {
  return (
    <HubLayout
      title="Campus News & Announcements"
      heroTitle="OOU & Nigeria student updates in one place"
      heroDescription="Official announcements, admissions, calendar, scholarships and NYSC guidance. Always confirm dates on the OOU portal and notice boards — this hub summarises what to check."
      searchPlaceholder="Search announcements, deadlines, scholarships..."
      emptyMessage="No announcements match"
      categories={campusNewsCategories}
      after={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white border border-[#e6e9e6] rounded-2xl p-5 lg:p-8">
            <h3 className="font-semibold text-lg text-[#0a0a0a] mb-1">OOU student essentials</h3>
            <p className="text-sm text-[#7b857b] mb-4">
              Olabisi Onabanjo University, Ago-Iwoye, Ogun State
            </p>
            <ul className="text-sm text-[#4d554d] space-y-2.5 leading-relaxed">
              <li>
                <i className="bi bi-globe text-[#8a6d00] mr-2" />
                Official portal: <span className="font-medium text-[#0a0a0a]">oouagoiwoye.edu.ng</span> —
                admission lists, fees, registration, results.
              </li>
              <li>
                <i className="bi bi-envelope text-[#8a6d00] mr-2" />
                Use your OOU student email for official complaints and clearance.
              </li>
              <li>
                <i className="bi bi-building text-[#8a6d00] mr-2" />
                Faculties include Arts, Education, Law, Science, Social Sciences, Management
                Sciences, Engineering, Pharmacy, Medicine, Environmental Studies — confirm
                departmental notices on faculty boards.
              </li>
              <li>
                <i className="bi bi-card-checklist text-[#8a6d00] mr-2" />
                Keep printed + digital copies of admission letter, school-fee receipts, course
                forms and ID card.
              </li>
              <li>
                <i className="bi bi-shield-check text-[#8a6d00] mr-2" />
                Beware of fake admission/fee links — pay only via the official OOU portal.
              </li>
            </ul>
          </div>
          <div className="bg-white border border-[#e6e9e6] rounded-2xl p-5 lg:p-8">
            <h3 className="font-semibold text-lg text-[#0a0a0a] mb-1">
              Nigeria students essentials
            </h3>
            <p className="text-sm text-[#7b857b] mb-4">
              Applies to OOU and all Nigerian tertiary students
            </p>
            <ul className="text-sm text-[#4d554d] space-y-2.5 leading-relaxed">
              <li>
                <i className="bi bi-patch-check text-[#15803d] mr-2" />
                JAMB CAPS: accept admission on{' '}
                <span className="font-medium text-[#0a0a0a]">caps.jamb.gov.ng</span> or risk losing
                the slot.
              </li>
              <li>
                <i className="bi bi-bank text-[#15803d] mr-2" />
                NELFUND student loan: check eligibility and application windows on the official
                NELFUND portal.
              </li>
              <li>
                <i className="bi bi-award text-[#15803d] mr-2" />
                Scholarships: PTDF, MTN Foundation, NNPC/TotalEnergies, state bursaries — watch
                eligibility (CGPA, level, indigene status).
              </li>
              <li>
                <i className="bi bi-person-badge text-[#15803d] mr-2" />
                NYSC: JAMB regularisation, correct name/DOB on certificates, and Senate-list
                appearance are required for mobilisation.
              </li>
              <li>
                <i className="bi bi-file-earmark-text text-[#15803d] mr-2" />
                WAEC/NECO O'level: keep original result checker cards and ensure 5-credit
                requirements for your course.
              </li>
            </ul>
          </div>
        </div>
      }
    >
      {/* Deadline reminders banner */}
      <div className="bg-[#fdf5d7] border border-[#e8ece8] rounded-2xl p-5 lg:p-6 mb-4 lg:mb-6 flex gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#f5c842] flex items-center justify-center flex-shrink-0">
          <i className="bi bi-alarm text-xl text-[#0a0a0a]" />
        </div>
        <div>
          <h3 className="font-semibold text-[#0a0a0a]">Important deadline reminders</h3>
          <ul className="text-sm text-[#4d554d] mt-1.5 space-y-1 leading-relaxed">
            <li>· Course registration &amp; school-fees deadlines come before exams — pay and register early.</li>
            <li>· Post-UTME screening has a short window — check OOU portal + JAMB CAPS regularly.</li>
            <li>· Final-year clearance, NYSC mobilisation and JAMB regularisation have strict cut-offs.</li>
          </ul>
        </div>
      </div>
    </HubLayout>
  )
}
