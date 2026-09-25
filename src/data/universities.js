// Course catalog browser data: Country → University → Campus/Branch → Faculty → Department → Level → Course.
// Department levels: Nigerian & Saudi schools use 100–400 Level (plus 500 Level where the
// programme runs longer); US schools use Year 1–4. Confirm offerings per session on each
// school portal — entries marked `lastUpdate: 'school catalog'` are starter catalog data.

const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const c = (id, code, title) => ({
    id,
    code,
    title,
    lecturer: 'TBA — see department board',
    students: 0,
    lastUpdate: 'school catalog',
    fileName: `${slug(code + '-' + title)}.pdf`,
    pdfUrl: null
})

const lvl = (id, label, courses) => ({ id, label, courses })

// Nigerian / Saudi style: 100–400 Level, optional 500 Level
const deptN = (id, name, l100, l200, l300, l400, l500) => ({
    id,
    name,
    levels: [
        lvl('100', '100 Level', l100),
        lvl('200', '200 Level', l200),
        lvl('300', '300 Level', l300),
        lvl('400', '400 Level', l400),
        ...(l500 ? [lvl('500', '500 Level', l500)] : [])
    ]
})

// US style: Year 1–4
const deptY = (id, name, y1, y2, y3, y4) => ({
    id,
    name,
    levels: [
        lvl('y1', 'Year 1', y1),
        lvl('y2', 'Year 2', y2),
        lvl('y3', 'Year 3', y3),
        lvl('y4', 'Year 4', y4)
    ]
})

const f = (id, name, departments) => ({ id, name, departments })

export const universityCatalog = [
    {
        id: 'nigeria',
        name: 'Nigeria',
        flag: '🇳🇬',
        universities: [
            {
                id: 'oou',
                name: 'OOU',
                fullName: 'Olabisi Onabanjo University',
                location: 'Ogun State',
                campuses: [
                    {
                        id: 'oou-main',
                        name: 'Main Campus',
                        location: 'Ago-Iwoye',
                        faculties: [
                            f('oou-m-sci', 'Faculty of Science', [
                                deptN('oou-m-csc', 'Computer Science',
                                    [c('oou-m-csc-101', 'CSC 101', 'Introduction to Computer Science'), c('oou-m-csc-102', 'CSC 102', 'Introduction to Programming')],
                                    [c('oou-m-csc-201', 'CSC 201', 'Data Structures & Algorithms'), c('oou-m-csc-202', 'CSC 202', 'Object-Oriented Programming')],
                                    [c('oou-m-csc-301', 'CSC 301', 'Operating Systems'), c('oou-m-csc-302', 'CSC 302', 'Database Systems')],
                                    [c('oou-m-csc-401', 'CSC 401', 'Compiler Construction'), c('oou-m-csc-499', 'CSC 499', 'Final Year Project')]),
                                deptN('oou-m-mcb', 'Microbiology',
                                    [c('oou-m-mcb-101', 'MCB 101', 'General Microbiology'), c('oou-m-mcb-102', 'MCB 102', 'Microbial Techniques')],
                                    [c('oou-m-mcb-201', 'MCB 201', 'Bacteriology'), c('oou-m-mcb-202', 'MCB 202', 'Mycology')],
                                    [c('oou-m-mcb-301', 'MCB 301', 'Immunology'), c('oou-m-mcb-302', 'MCB 302', 'Virology')],
                                    [c('oou-m-mcb-401', 'MCB 401', 'Food Microbiology'), c('oou-m-mcb-499', 'MCB 499', 'Research Project')])
                            ]),
                            f('oou-m-soc', 'Faculty of Social Sciences', [
                                deptN('oou-m-mac', 'Mass Communication',
                                    [c('oou-m-mac-101', 'MAC 101', 'Introduction to Mass Communication'), c('oou-m-mac-102', 'MAC 102', 'History of Nigerian Media')],
                                    [c('oou-m-mac-201', 'MAC 201', 'News Writing & Reporting'), c('oou-m-mac-202', 'MAC 202', 'Broadcast Presentation')],
                                    [c('oou-m-mac-301', 'MAC 301', 'Media Law & Ethics'), c('oou-m-mac-302', 'MAC 302', 'Advertising & Public Relations')],
                                    [c('oou-m-mac-401', 'MAC 401', 'Development Communication'), c('oou-m-mac-499', 'MAC 499', 'Final Year Project')]),
                                deptN('oou-m-eco', 'Economics',
                                    [c('oou-m-eco-101', 'ECO 101', 'Principles of Economics'), c('oou-m-eco-102', 'ECO 102', 'Mathematics for Economists')],
                                    [c('oou-m-eco-201', 'ECO 201', 'Microeconomics I'), c('oou-m-eco-202', 'ECO 202', 'Microeconomics II')],
                                    [c('oou-m-eco-301', 'ECO 301', 'Econometrics I'), c('oou-m-eco-302', 'ECO 302', 'Monetary Economics')],
                                    [c('oou-m-eco-401', 'ECO 401', 'Development Economics'), c('oou-m-eco-499', 'ECO 499', 'Research Project')])
                            ]),
                            f('oou-m-art', 'Faculty of Arts', [
                                deptN('oou-m-eng', 'English',
                                    [c('oou-m-eng-101', 'ENG 101', 'Introduction to English & Literature'), c('oou-m-eng-102', 'ENG 102', 'Grammar & Composition')],
                                    [c('oou-m-eng-201', 'ENG 201', 'African Literature'), c('oou-m-eng-202', 'ENG 202', 'Phonology')],
                                    [c('oou-m-eng-301', 'ENG 301', 'Literary Criticism'), c('oou-m-eng-302', 'ENG 302', 'Syntax')],
                                    [c('oou-m-eng-401', 'ENG 401', 'Research Methods'), c('oou-m-eng-499', 'ENG 499', 'Long Essay / Project')]),
                                deptN('oou-m-his', 'History & Diplomatic Studies',
                                    [c('oou-m-his-101', 'HIS 101', 'Nigerian History to 1800'), c('oou-m-his-102', 'HIS 102', 'Introduction to Historical Studies')],
                                    [c('oou-m-his-201', 'HIS 201', 'Nigerian History Since 1800'), c('oou-m-his-202', 'HIS 202', 'African History')],
                                    [c('oou-m-his-301', 'HIS 301', 'Diplomatic History'), c('oou-m-his-302', 'HIS 302', 'Economic History')],
                                    [c('oou-m-his-401', 'HIS 401', 'Historiography'), c('oou-m-his-499', 'HIS 499', 'Research Project')])
                            ]),
                            f('oou-m-mgt', 'Faculty of Management Sciences', [
                                deptN('oou-m-acc', 'Accounting',
                                    [c('oou-m-acc-101', 'ACC 101', 'Financial Accounting I'), c('oou-m-acc-102', 'ACC 102', 'Financial Accounting II')],
                                    [c('oou-m-acc-201', 'ACC 201', 'Financial Accounting III'), c('oou-m-acc-202', 'ACC 202', 'Cost Accounting')],
                                    [c('oou-m-acc-301', 'ACC 301', 'Management Accounting'), c('oou-m-acc-302', 'ACC 302', 'Taxation')],
                                    [c('oou-m-acc-401', 'ACC 401', 'Auditing & Assurance'), c('oou-m-acc-499', 'ACC 499', 'Research Project')]),
                                deptN('oou-m-bus', 'Business Administration',
                                    [c('oou-m-bus-101', 'BUS 101', 'Introduction to Business'), c('oou-m-bus-102', 'BUS 102', 'Business Mathematics')],
                                    [c('oou-m-bus-201', 'BUS 201', 'Organisational Behaviour'), c('oou-m-bus-202', 'BUS 202', 'Marketing Principles')],
                                    [c('oou-m-bus-301', 'BUS 301', 'Human Resource Management'), c('oou-m-bus-302', 'BUS 302', 'Operations Management')],
                                    [c('oou-m-bus-401', 'BUS 401', 'Strategic Management'), c('oou-m-bus-499', 'BUS 499', 'Research Project')])
                            ])
                        ]
                    },
                    {
                        id: 'oou-sagamu',
                        name: 'Sagamu Campus',
                        location: 'Sagamu (Medicine & Pharmacy)',
                        faculties: [
                            f('oou-s-med', 'College of Medicine', [
                                deptN('oou-s-mbs', 'Medicine & Surgery',
                                    [c('oou-s-ana-101', 'ANA 101', 'Human Anatomy I'), c('oou-s-bch-101', 'BCH 101', 'Medical Biochemistry I')],
                                    [c('oou-s-ana-201', 'ANA 201', 'Neuroanatomy'), c('oou-s-phs-201', 'PHS 201', 'Systems Physiology')],
                                    [c('oou-s-pth-301', 'PTH 301', 'General Pathology'), c('oou-s-pha-301', 'PHA 301', 'Pharmacology I')],
                                    [c('oou-s-med-401', 'MED 401', 'Clinical Medicine I'), c('oou-s-med-402', 'MED 402', 'Paediatrics Rotation')]),
                                deptN('oou-s-mls', 'Medical Laboratory Science',
                                    [c('oou-s-mls-101', 'MLS 101', 'Introduction to Medical Laboratory Science'), c('oou-s-mls-102', 'MLS 102', 'Laboratory Safety & Practice')],
                                    [c('oou-s-mls-201', 'MLS 201', 'Haematology I'), c('oou-s-mls-202', 'MLS 202', 'Chemical Pathology I')],
                                    [c('oou-s-mls-301', 'MLS 301', 'Medical Microbiology I'), c('oou-s-mls-302', 'MLS 302', 'Histopathology I')],
                                    [c('oou-s-mls-401', 'MLS 401', 'MLS Practicum'), c('oou-s-mls-499', 'MLS 499', 'Research Project')])
                            ]),
                            f('oou-s-pha', 'Faculty of Pharmacy', [
                                deptN('oou-s-pce', 'Pharmaceutics',
                                    [c('oou-s-pce-101', 'PCE 101', 'Pharmaceutical Calculations'), c('oou-s-pce-102', 'PCE 102', 'Dispensing I')],
                                    [c('oou-s-pce-201', 'PCE 201', 'Physical Pharmaceutics'), c('oou-s-pce-202', 'PCE 202', 'Pharmaceutics II')],
                                    [c('oou-s-pce-301', 'PCE 301', 'Industrial Pharmacy'), c('oou-s-pce-302', 'PCE 302', 'Biopharmaceutics')],
                                    [c('oou-s-pce-401', 'PCE 401', 'Clinical Pharmacy Practice'), c('oou-s-pce-499', 'PCE 499', 'Research Project')]),
                                deptN('oou-s-pcl', 'Pharmacology',
                                    [c('oou-s-pcl-101', 'PCL 101', 'Introduction to Pharmacology'), c('oou-s-pcl-102', 'PCL 102', 'Drug Nomenclature & Dosage')],
                                    [c('oou-s-pcl-201', 'PCL 201', 'Autonomic Pharmacology'), c('oou-s-pcl-202', 'PCL 202', 'Chemotherapy')],
                                    [c('oou-s-pcl-301', 'PCL 301', 'Clinical Pharmacology'), c('oou-s-pcl-302', 'PCL 302', 'Toxicology')],
                                    [c('oou-s-pcl-401', 'PCL 401', 'Advanced Therapeutics'), c('oou-s-pcl-499', 'PCL 499', 'Research Project')])
                            ])
                        ]
                    },
                    {
                        id: 'oou-ayetoro',
                        name: 'Ayetoro Campus',
                        location: 'Ayetoro (Agriculture)',
                        faculties: [
                            f('oou-a-agr', 'Faculty of Agricultural Sciences', [
                                deptN('oou-a-crp', 'Crop Science',
                                    [c('oou-a-crp-101', 'CRP 101', 'Principles of Crop Production'), c('oou-a-crp-102', 'CRP 102', 'Field Crop Botany')],
                                    [c('oou-a-crp-201', 'CRP 201', 'Crop Physiology'), c('oou-a-crp-202', 'CRP 202', 'Weed Science')],
                                    [c('oou-a-crp-301', 'CRP 301', 'Plant Breeding'), c('oou-a-crp-302', 'CRP 302', 'Horticulture')],
                                    [c('oou-a-crp-401', 'CRP 401', 'Crop Protection'), c('oou-a-crp-499', 'CRP 499', 'Research Project')]),
                                deptN('oou-a-ans', 'Animal Science',
                                    [c('oou-a-ans-101', 'ANS 101', 'Introduction to Animal Science'), c('oou-a-ans-102', 'ANS 102', 'Animal Anatomy')],
                                    [c('oou-a-ans-201', 'ANS 201', 'Animal Nutrition I'), c('oou-a-ans-202', 'ANS 202', 'Ruminant Production')],
                                    [c('oou-a-ans-301', 'ANS 301', 'Poultry Production'), c('oou-a-ans-302', 'ANS 302', 'Animal Breeding')],
                                    [c('oou-a-ans-401', 'ANS 401', 'Range Management'), c('oou-a-ans-499', 'ANS 499', 'Research Project')]),
                                deptN('oou-a-aec', 'Agricultural Economics',
                                    [c('oou-a-aec-101', 'AEC 101', 'Introduction to Agricultural Economics'), c('oou-a-aec-102', 'AEC 102', 'Mathematics for Agriculture')],
                                    [c('oou-a-aec-201', 'AEC 201', 'Farm Management'), c('oou-a-aec-202', 'AEC 202', 'Agricultural Marketing')],
                                    [c('oou-a-aec-301', 'AEC 301', 'Econometrics for Agriculture'), c('oou-a-aec-302', 'AEC 302', 'Rural Development')],
                                    [c('oou-a-aec-401', 'AEC 401', 'Agricultural Policy'), c('oou-a-aec-499', 'AEC 499', 'Research Project')])
                            ])
                        ]
                    },
                    {
                        id: 'oou-ibogun',
                        name: 'Ibogun Campus',
                        location: 'Ibogun (Engineering)',
                        faculties: [
                            f('oou-i-eng', 'College of Engineering', [
                                deptN('oou-i-mee', 'Mechanical Engineering',
                                    [c('oou-i-mee-101', 'MEE 101', 'Engineering Drawing'), c('oou-i-mee-102', 'MEE 102', 'Workshop Practice')],
                                    [c('oou-i-mee-201', 'MEE 201', 'Thermodynamics I'), c('oou-i-mee-202', 'MEE 202', 'Mechanics of Machines I')],
                                    [c('oou-i-mee-301', 'MEE 301', 'Heat Transfer'), c('oou-i-mee-302', 'MEE 302', 'Machine Design I')],
                                    [c('oou-i-mee-401', 'MEE 401', 'Control Engineering'), c('oou-i-mee-402', 'MEE 402', 'Machine Design II')],
                                    [c('oou-i-mee-501', 'MEE 501', 'Advanced Thermofluids'), c('oou-i-mee-599', 'MEE 599', 'Final Year Project')]),
                                deptN('oou-i-eee', 'Electrical Engineering',
                                    [c('oou-i-eee-101', 'EEE 101', 'Circuit Theory I'), c('oou-i-eee-102', 'EEE 102', 'Basic Electronics')],
                                    [c('oou-i-eee-201', 'EEE 201', 'Electromagnetic Fields'), c('oou-i-eee-202', 'EEE 202', 'Digital Electronics')],
                                    [c('oou-i-eee-301', 'EEE 301', 'Power Systems I'), c('oou-i-eee-302', 'EEE 302', 'Control Systems')],
                                    [c('oou-i-eee-401', 'EEE 401', 'Power Electronics'), c('oou-i-eee-402', 'EEE 402', 'Electric Machines I')],
                                    [c('oou-i-eee-501', 'EEE 501', 'Electric Machines II'), c('oou-i-eee-599', 'EEE 599', 'Final Year Project')]),
                                deptN('oou-i-cve', 'Civil Engineering',
                                    [c('oou-i-cve-101', 'CVE 101', 'Engineering Mechanics'), c('oou-i-cve-102', 'CVE 102', 'Building Materials')],
                                    [c('oou-i-cve-201', 'CVE 201', 'Strength of Materials'), c('oou-i-cve-202', 'CVE 202', 'Fluid Mechanics')],
                                    [c('oou-i-cve-301', 'CVE 301', 'Structural Analysis I'), c('oou-i-cve-302', 'CVE 302', 'Geotechnics I')],
                                    [c('oou-i-cve-401', 'CVE 401', 'Reinforced Concrete Design'), c('oou-i-cve-402', 'CVE 402', 'Structural Analysis II')],
                                    [c('oou-i-cve-501', 'CVE 501', 'Highway Engineering'), c('oou-i-cve-599', 'CVE 599', 'Final Year Project')])
                            ])
                        ]
                    }
                ]
            },
            {
                id: 'unilag',
                name: 'UNILAG',
                fullName: 'University of Lagos',
                location: 'Akoka, Lagos',
                campuses: [
                    {
                        id: 'unilag-akoka',
                        name: 'Main Campus',
                        location: 'Akoka',
                        faculties: [
                            f('unl-sci', 'Faculty of Science', [
                                deptN('unl-csc', 'Computer Science',
                                    [c('unl-csc-101', 'CSC 101', 'Introduction to Computer Science'), c('unl-csc-102', 'CSC 102', 'Programming Fundamentals')],
                                    [c('unl-csc-201', 'CSC 201', 'Data Structures'), c('unl-csc-202', 'CSC 202', 'Discrete Structures')],
                                    [c('unl-csc-301', 'CSC 301', 'Operating Systems'), c('unl-csc-302', 'CSC 302', 'Database Systems')],
                                    [c('unl-csc-401', 'CSC 401', 'Software Engineering'), c('unl-csc-499', 'CSC 499', 'Final Year Project')]),
                                deptN('unl-mth', 'Mathematics',
                                    [c('unl-mth-101', 'MTH 101', 'Calculus I'), c('unl-mth-102', 'MTH 102', 'Linear Algebra I')],
                                    [c('unl-mth-201', 'MTH 201', 'Calculus II'), c('unl-mth-202', 'MTH 202', 'Differential Equations')],
                                    [c('unl-mth-301', 'MTH 301', 'Real Analysis'), c('unl-mth-302', 'MTH 302', 'Numerical Analysis')],
                                    [c('unl-mth-401', 'MTH 401', 'Complex Analysis'), c('unl-mth-499', 'MTH 499', 'Research Project')])
                            ]),
                            f('unl-art', 'Faculty of Arts', [
                                deptN('unl-eng', 'English',
                                    [c('unl-eng-101', 'ENG 101', 'Introduction to Literature'), c('unl-eng-102', 'ENG 102', 'Grammar & Usage')],
                                    [c('unl-eng-201', 'ENG 201', 'African Literature'), c('unl-eng-202', 'ENG 202', 'Phonetics')],
                                    [c('unl-eng-301', 'ENG 301', 'Literary Criticism'), c('unl-eng-302', 'ENG 302', 'Sociolinguistics')],
                                    [c('unl-eng-401', 'ENG 401', 'Research Methods'), c('unl-eng-499', 'ENG 499', 'Long Essay')]),
                                deptN('unl-lin', 'Linguistics',
                                    [c('unl-lin-101', 'LIN 101', 'Introduction to Linguistics'), c('unl-lin-102', 'LIN 102', 'Languages of Nigeria')],
                                    [c('unl-lin-201', 'LIN 201', 'Phonetics & Phonology'), c('unl-lin-202', 'LIN 202', 'Morphology')],
                                    [c('unl-lin-301', 'LIN 301', 'Syntax'), c('unl-lin-302', 'LIN 302', 'Semantics')],
                                    [c('unl-lin-401', 'LIN 401', 'Field Methods'), c('unl-lin-499', 'LIN 499', 'Research Project')])
                            ]),
                            f('unl-mgt', 'Faculty of Management Sciences', [
                                deptN('unl-acc', 'Accounting',
                                    [c('unl-acc-101', 'ACC 101', 'Financial Accounting I'), c('unl-acc-102', 'ACC 102', 'Business Mathematics')],
                                    [c('unl-acc-201', 'ACC 201', 'Financial Accounting II'), c('unl-acc-202', 'ACC 202', 'Cost Accounting')],
                                    [c('unl-acc-301', 'ACC 301', 'Management Accounting'), c('unl-acc-302', 'ACC 302', 'Taxation')],
                                    [c('unl-acc-401', 'ACC 401', 'Auditing'), c('unl-acc-499', 'ACC 499', 'Research Project')]),
                                deptN('unl-fin', 'Finance',
                                    [c('unl-fin-101', 'FIN 101', 'Introduction to Finance'), c('unl-fin-102', 'FIN 102', 'Financial Mathematics')],
                                    [c('unl-fin-201', 'FIN 201', 'Corporate Finance'), c('unl-fin-202', 'FIN 202', 'Financial Markets')],
                                    [c('unl-fin-301', 'FIN 301', 'Investment Analysis'), c('unl-fin-302', 'FIN 302', 'Risk Management')],
                                    [c('unl-fin-401', 'FIN 401', 'International Finance'), c('unl-fin-499', 'FIN 499', 'Research Project')])
                            ])
                        ]
                    }
                ]
            },
            {
                id: 'lasu',
                name: 'LASU',
                fullName: 'Lagos State University',
                location: 'Ojo, Lagos',
                campuses: [
                    {
                        id: 'lasu-ojo',
                        name: 'Main Campus',
                        location: 'Ojo',
                        faculties: [
                            f('las-sci', 'Faculty of Science', [
                                deptN('las-csc', 'Computer Science',
                                    [c('las-csc-101', 'CSC 101', 'Introduction to Computer Science'), c('las-csc-102', 'CSC 102', 'Programming I')],
                                    [c('las-csc-201', 'CSC 201', 'Data Structures'), c('las-csc-202', 'CSC 202', 'Computer Architecture')],
                                    [c('las-csc-301', 'CSC 301', 'Operating Systems'), c('las-csc-302', 'CSC 302', 'Web Technologies')],
                                    [c('las-csc-401', 'CSC 401', 'Artificial Intelligence'), c('las-csc-499', 'CSC 499', 'Final Year Project')]),
                                deptN('las-bch', 'Biochemistry',
                                    [c('las-bch-101', 'BCH 101', 'General Biochemistry I'), c('las-bch-102', 'BCH 102', 'Cell Biology')],
                                    [c('las-bch-201', 'BCH 201', 'Biomolecules'), c('las-bch-202', 'BCH 202', 'Enzymology')],
                                    [c('las-bch-301', 'BCH 301', 'Metabolism'), c('las-bch-302', 'BCH 302', 'Molecular Genetics')],
                                    [c('las-bch-401', 'BCH 401', 'Molecular Biology'), c('las-bch-499', 'BCH 499', 'Research Project')])
                            ]),
                            f('las-law', 'Faculty of Law', [
                                deptN('las-law-dept', 'Law',
                                    [c('las-law-101', 'LAW 101', 'Nigerian Legal System'), c('las-law-102', 'LAW 102', 'Law of Contract I')],
                                    [c('las-law-201', 'LAW 201', 'Constitutional Law I'), c('las-law-202', 'LAW 202', 'Criminal Law')],
                                    [c('las-law-301', 'LAW 301', 'Commercial Law'), c('las-law-302', 'LAW 302', 'Land Law I')],
                                    [c('las-law-401', 'LAW 401', 'Equity & Trusts'), c('las-law-402', 'LAW 402', 'Company Law')],
                                    [c('las-law-501', 'LAW 501', 'Jurisprudence'), c('las-law-599', 'LAW 599', 'Long Essay')])
                            ]),
                            f('las-edu', 'Faculty of Education', [
                                deptN('las-edm', 'Educational Management',
                                    [c('las-edm-101', 'EDM 101', 'Introduction to Educational Management'), c('las-edm-102', 'EDM 102', 'Psychology of Learning')],
                                    [c('las-edm-201', 'EDM 201', 'School Administration'), c('las-edm-202', 'EDM 202', 'Classroom Management')],
                                    [c('las-edm-301', 'EDM 301', 'Supervision of Instruction'), c('las-edm-302', 'EDM 302', 'School Finance')],
                                    [c('las-edm-401', 'EDM 401', 'Educational Planning'), c('las-edm-499', 'EDM 499', 'Research Project')])
                            ])
                        ]
                    }
                ]
            },
            {
                id: 'eksu',
                name: 'EKSU',
                fullName: 'Ekiti State University',
                location: 'Ado-Ekiti',
                campuses: [
                    {
                        id: 'eksu-ado',
                        name: 'Main Campus',
                        location: 'Ado-Ekiti',
                        faculties: [
                            f('eks-sci', 'Faculty of Science', [
                                deptN('eks-csc', 'Computer Science',
                                    [c('eks-csc-101', 'CSC 101', 'Introduction to Computer Science'), c('eks-csc-102', 'CSC 102', 'Programming I')],
                                    [c('eks-csc-201', 'CSC 201', 'Data Structures'), c('eks-csc-202', 'CSC 202', 'Digital Logic')],
                                    [c('eks-csc-301', 'CSC 301', 'Operating Systems'), c('eks-csc-302', 'CSC 302', 'Database Systems')],
                                    [c('eks-csc-401', 'CSC 401', 'Computer Networks'), c('eks-csc-499', 'CSC 499', 'Final Year Project')]),
                                deptN('eks-chm', 'Industrial Chemistry',
                                    [c('eks-chm-101', 'CHM 101', 'General Chemistry I'), c('eks-chm-102', 'CHM 102', 'Practical Chemistry')],
                                    [c('eks-chm-201', 'CHM 201', 'Organic Chemistry I'), c('eks-chm-202', 'CHM 202', 'Physical Chemistry I')],
                                    [c('eks-chm-301', 'CHM 301', 'Instrumental Analysis'), c('eks-chm-302', 'CHM 302', 'Industrial Chemistry')],
                                    [c('eks-chm-401', 'CHM 401', 'Polymer Chemistry'), c('eks-chm-499', 'CHM 499', 'Research Project')])
                            ]),
                            f('eks-edu', 'Faculty of Education', [
                                deptN('eks-edf', 'Educational Foundations',
                                    [c('eks-edf-101', 'EDF 101', 'Philosophy of Education'), c('eks-edf-102', 'EDF 102', 'Sociology of Education')],
                                    [c('eks-edf-201', 'EDF 201', 'History of Education'), c('eks-edf-202', 'EDF 202', 'Comparative Education')],
                                    [c('eks-edf-301', 'EDF 301', 'Curriculum Studies'), c('eks-edf-302', 'EDF 302', 'Measurement & Evaluation')],
                                    [c('eks-edf-401', 'EDF 401', 'Educational Research'), c('eks-edf-499', 'EDF 499', 'Research Project')])
                            ]),
                            f('eks-art', 'Faculty of Arts', [
                                deptN('eks-tha', 'Theatre & Media Arts',
                                    [c('eks-tha-101', 'THA 101', 'Introduction to Theatre Arts'), c('eks-tha-102', 'THA 102', 'African Dance & Drama')],
                                    [c('eks-tha-201', 'THA 201', 'Acting I'), c('eks-tha-202', 'THA 202', 'Directing I')],
                                    [c('eks-tha-301', 'THA 301', 'Playwriting'), c('eks-tha-302', 'THA 302', 'Media Production')],
                                    [c('eks-tha-401', 'THA 401', 'Theatre Management'), c('eks-tha-499', 'THA 499', 'Production Project')])
                            ])
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'usa',
        name: 'USA',
        flag: '🇺🇸',
        universities: [
            {
                id: 'harvard',
                name: 'Harvard',
                fullName: 'Harvard University',
                location: 'Cambridge, Massachusetts',
                campuses: [
                    {
                        id: 'harvard-cambridge',
                        name: 'Cambridge Campus',
                        location: 'Cambridge, MA',
                        faculties: [
                            f('hvd-fas', 'Faculty of Arts & Sciences', [
                                deptY('hvd-cs', 'Computer Science',
                                    [c('hvd-cs-50', 'CS 50', 'Introduction to Computer Science'), c('hvd-cs-51', 'CS 51', 'Abstraction & Design')],
                                    [c('hvd-cs-61', 'CS 61', 'Systems Programming & Organization'), c('hvd-cs-121', 'CS 121', 'Introduction to Theoretical Computer Science')],
                                    [c('hvd-cs-124', 'CS 124', 'Data Structures & Algorithms'), c('hvd-cs-182', 'CS 182', 'Artificial Intelligence')],
                                    [c('hvd-cs-141', 'CS 141', 'Computing Hardware'), c('hvd-cs-91r', 'CS 91R', 'Supervised Research')]),
                                deptY('hvd-econ', 'Economics',
                                    [c('hvd-econ-10a', 'ECON 10A', 'Principles of Economics: Micro'), c('hvd-econ-10b', 'ECON 10B', 'Principles of Economics: Macro')],
                                    [c('hvd-econ-1010a', 'ECON 1010A', 'Intermediate Microeconomics'), c('hvd-econ-1010b', 'ECON 1010B', 'Intermediate Macroeconomics')],
                                    [c('hvd-econ-1011a', 'ECON 1011A', 'Advanced Microeconomics'), c('hvd-econ-1123', 'ECON 1123', 'Econometrics')],
                                    [c('hvd-econ-985', 'ECON 985', 'Senior Thesis Seminar'), c('hvd-econ-1011b', 'ECON 1011B', 'Advanced Macroeconomics')])
                            ]),
                            f('hvd-law', 'Harvard Law School', [
                                deptY('hvd-law-dept', 'Law',
                                    [c('hvd-law-con', '1L', 'Contracts'), c('hvd-law-torts', '1L', 'Torts')],
                                    [c('hvd-law-civ', '2L', 'Civil Procedure'), c('hvd-law-crim', '2L', 'Criminal Law')],
                                    [c('hvd-law-const', '3L', 'Constitutional Law'), c('hvd-law-ev', '3L', 'Evidence')],
                                    [c('hvd-law-corp', '3L', 'Corporations'), c('hvd-law-eth', '3L', 'Legal Profession & Ethics')])
                            ])
                        ]
                    }
                ]
            },
            {
                id: 'mit',
                name: 'MIT',
                fullName: 'Massachusetts Institute of Technology',
                location: 'Cambridge, Massachusetts',
                campuses: [
                    {
                        id: 'mit-cambridge',
                        name: 'Cambridge Campus',
                        location: 'Cambridge, MA',
                        faculties: [
                            f('mit-eng', 'School of Engineering', [
                                deptY('mit-eecs', 'Electrical Engineering & Computer Science',
                                    [c('mit-6100', '6.100A', 'Introduction to Computer Science Programming in Python'), c('mit-6191', '6.191', 'Computation Structures')],
                                    [c('mit-61210', '6.1210', 'Design & Analysis of Algorithms'), c('mit-61020', '6.1020', 'Software Construction')],
                                    [c('mit-63900', '6.3900', 'Machine Learning'), c('mit-61810', '6.1810', 'Computer Systems Engineering')],
                                    [c('mit-6034', '6.034', 'Artificial Intelligence'), c('mit-6824', '6.824', 'Distributed Computer Systems')]),
                                deptY('mit-mech', 'Mechanical Engineering',
                                    [c('mit-2001', '2.001', 'Mechanics & Materials I'), c('mit-2002', '2.002', 'Mechanics & Materials II')],
                                    [c('mit-2005', '2.005', 'Thermal-Fluids Engineering I'), c('mit-2007', '2.007', 'Design & Manufacturing I')],
                                    [c('mit-2008', '2.008', 'Design & Manufacturing II'), c('mit-2009', '2.009', 'Product Engineering Processes')],
                                    [c('mit-2671', '2.671', 'Measurement & Instrumentation'), c('mit-2013', '2.013', 'Engineering Systems Design')])
                            ]),
                            f('mit-sci', 'School of Science', [
                                deptY('mit-math', 'Mathematics',
                                    [c('mit-1801', '18.01', 'Single Variable Calculus'), c('mit-1802', '18.02', 'Multivariable Calculus')],
                                    [c('mit-1803', '18.03', 'Differential Equations'), c('mit-1806', '18.06', 'Linear Algebra')],
                                    [c('mit-18100a', '18.100A', 'Real Analysis'), c('mit-18701', '18.701', 'Algebra I')],
                                    [c('mit-18404', '18.404', 'Theory of Computation'), c('mit-18785', '18.785', 'Number Theory I')]),
                                deptY('mit-phy', 'Physics',
                                    [c('mit-801', '8.01', 'Classical Mechanics'), c('mit-802', '8.02', 'Electricity & Magnetism')],
                                    [c('mit-803', '8.03', 'Waves & Vibrations'), c('mit-804', '8.04', 'Quantum Physics I')],
                                    [c('mit-805', '8.05', 'Quantum Physics II'), c('mit-806', '8.06', 'Quantum Physics III')],
                                    [c('mit-807', '8.07', 'Electromagnetism II'), c('mit-808', '8.08', 'Statistical Physics')])
                            ])
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: 'saudi',
        name: 'Saudi Arabia',
        flag: '🇸🇦',
        universities: [
            {
                id: 'ksu',
                name: 'KSU',
                fullName: 'King Saud University',
                location: 'Riyadh',
                campuses: [
                    {
                        id: 'ksu-riyadh',
                        name: 'Main Campus',
                        location: 'Riyadh',
                        faculties: [
                            f('ksu-cis', 'College of Computer & Information Sciences', [
                                deptN('ksu-cs', 'Computer Science',
                                    [c('ksu-cs-101', 'CSC 101', 'Computer Programming I'), c('ksu-cs-102', 'CSC 102', 'Computer Programming II')],
                                    [c('ksu-cs-201', 'CSC 201', 'Data Structures'), c('ksu-cs-212', 'CSC 212', 'Discrete Mathematics')],
                                    [c('ksu-cs-301', 'CSC 301', 'Database Systems'), c('ksu-cs-302', 'CSC 302', 'Operating Systems')],
                                    [c('ksu-cs-401', 'CSC 401', 'Artificial Intelligence'), c('ksu-cs-499', 'CSC 499', 'Graduation Project')]),
                                deptN('ksu-is', 'Information Systems',
                                    [c('ksu-is-101', 'IS 101', 'Introduction to Information Systems'), c('ksu-is-102', 'IS 102', 'Business Computing')],
                                    [c('ksu-is-201', 'IS 201', 'Systems Analysis & Design'), c('ksu-is-202', 'IS 202', 'E-Commerce')],
                                    [c('ksu-is-301', 'IS 301', 'IT Project Management'), c('ksu-is-302', 'IS 302', 'Decision Support Systems')],
                                    [c('ksu-is-401', 'IS 401', 'IS Strategy & Governance'), c('ksu-is-499', 'IS 499', 'Graduation Project')])
                            ]),
                            f('ksu-eng', 'College of Engineering', [
                                deptN('ksu-ee', 'Electrical Engineering',
                                    [c('ksu-ee-101', 'EE 101', 'Electric Circuits I'), c('ksu-ee-102', 'EE 102', 'Electronics I')],
                                    [c('ksu-ee-201', 'EE 201', 'Signals & Systems'), c('ksu-ee-202', 'EE 202', 'Electromagnetics')],
                                    [c('ksu-ee-301', 'EE 301', 'Power Systems'), c('ksu-ee-302', 'EE 302', 'Communication Systems')],
                                    [c('ksu-ee-401', 'EE 401', 'Control Systems'), c('ksu-ee-499', 'EE 499', 'Senior Design Project')]),
                                deptN('ksu-ce', 'Civil Engineering',
                                    [c('ksu-ce-101', 'CE 101', 'Statics'), c('ksu-ce-102', 'CE 102', 'Engineering Drawing')],
                                    [c('ksu-ce-201', 'CE 201', 'Mechanics of Materials'), c('ksu-ce-202', 'CE 202', 'Fluid Mechanics')],
                                    [c('ksu-ce-301', 'CE 301', 'Structural Analysis'), c('ksu-ce-302', 'CE 302', 'Transportation Engineering')],
                                    [c('ksu-ce-401', 'CE 401', 'Foundation Engineering'), c('ksu-ce-499', 'CE 499', 'Senior Design Project')])
                            ])
                        ]
                    }
                ]
            }
        ]
    }
]
