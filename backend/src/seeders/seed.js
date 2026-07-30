const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Candidate = require('../models/Candidate');
const CallLog = require('../models/CallLog');
const Interview = require('../models/Interview');
const WalkIn = require('../models/WalkIn');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');
const AuditLog = require('../models/AuditLog');
const Permission = require('../models/Permission');
const Invoice = require('../models/Invoice');
const TeamMember = require('../models/TeamMember');
const BusinessDevelopment = require('../models/BusinessDevelopment');

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ats_db';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear all collections
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    CallLog.deleteMany({}),
    Interview.deleteMany({}),
    WalkIn.deleteMany({}),
    Attendance.deleteMany({}),
    Holiday.deleteMany({}),
    AuditLog.deleteMany({}),
    Permission.deleteMany({}),
    Invoice.deleteMany({}),
    TeamMember.deleteMany({}),
    BusinessDevelopment.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // ── Users ──
  const users = await User.create([
    { name: 'System Administrator', email: 'admin@whitehorsemanpower.in', employeeId: 'EMP001', password: 'Password2026!', role: 'admin', isWFH: false },
    { name: 'Priya Sharma', email: 'priya@whm.com', employeeId: 'EMP002', password: 'password123', role: 'recruiter', isWFH: true },
    { name: 'Amit Singh', email: 'amit@whm.com', employeeId: 'EMP003', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Neha Patel', email: 'neha@whm.com', employeeId: 'EMP004', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Vikram Desai', email: 'vikram@whm.com', employeeId: 'EMP005', password: 'password123', role: 'recruiter', isWFH: true },
    { name: 'Suresh Menon', email: 'suresh@whm.com', employeeId: 'EMP006', password: 'password123', role: 'tl', isWFH: false },
    { name: 'Kavita Nair', email: 'kavita@whm.com', employeeId: 'EMP007', password: 'password123', role: 'manager', isWFH: false },
    { name: 'Rajesh Iyer', email: 'rajesh@whm.com', employeeId: 'EMP008', password: 'password123', role: 'admin', isWFH: false },
    { name: 'Deepak Verma', email: 'deepak@whm.com', employeeId: 'EMP009', password: 'password123', role: 'recruiter', isWFH: false },
    { name: 'Anita Reddy', email: 'anita@whm.com', employeeId: 'EMP010', password: 'password123', role: 'recruiter', isWFH: true },
    { name: 'Rahul Kumar', email: 'rahul@whm.com', employeeId: 'EMP011', password: 'password123', role: 'recruiter', isWFH: false },
  ]);
  console.log(`Created ${users.length} users`);

  // Seed TL - Recruiter relationships
  const tlUser = users.find(u => u.role === 'tl');
  const recruitersList = users.filter(u => u.role === 'recruiter');
  const teamMembersData = recruitersList.map(rec => ({
    teamLeaderId: tlUser._id,
    memberId: rec._id,
    role: 'recruiter',
  }));
  await TeamMember.create(teamMembersData);
  console.log(`Assigned ${teamMembersData.length} recruiters to Team Leader ${tlUser.name}`);

  const recruiter1 = users[10]; // Rahul Kumar (EMP011)
  const recruiter2 = users[1]; // Priya Sharma (EMP002)
  const recruiter3 = users[2]; // Amit Singh (EMP003)
  const recruiter4 = users[3]; // Neha Patel (EMP004)
  const recruiter5 = users[4]; // Vikram Desai (EMP005)

  // ── Candidates ──
  const candidateData = [
    {
      name: 'Rahul vijay khurasane',
      email: 'rahulkhurasane80@gmail.com',
      phone: '8208148767',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '06-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Pune, Mumbai, Kolhapur',
      experience: '1 Year(s) 1 Month(s)',
      currentCompany: 'Globe Caliber',
      currentRole: 'Desktop Support Engineer',
      department: 'IT & Information Security',
      eligibleRole: 'Desktop Engineer',
      industry: 'IT Services & Consulting',
      skills: ['Desktop Engineering', 'Desktop Administration', 'Hardware Networking', 'Troubleshooting', 'System Administration', 'Remote Troubleshooting'],
      currentCTC: 'Rs 2.70 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'with BCA in Computer Applications (General), MS Office, and end-user support',
      comments: 'NA',
      qualification: 'Bachelor of Computer Applications (BCA)',
      ugSpecialization: 'Computer Applications (General)',
      university: 'Shivaji University, Maharashtra',
      yearOfGraduation: '2025',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Male',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'shirgaon',
      pinCode: '415303',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('2004-10-23'),
      permanentAddress: 'sangli',
      assignedRecruiter: recruiter1._id,
      assignedRecruiterName: recruiter1.name,
      status: 'Interested'
    },
    {
      name: 'Saurav Patil',
      email: 'sauravpofficial77@gmail.com',
      phone: '9860613537',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '09-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Pune, Mumbai (All Areas), Hyderabad, Bengaluru, Remote',
      experience: '3 Year(s) 0 Month(s)',
      currentCompany: 'WNS GLOBAL SOLUTIONS',
      currentRole: 'Operations Analyst',
      department: 'Customer Success, Service & Operations',
      eligibleRole: 'Operations (Tech Ops)',
      industry: 'BPM / BPO',
      skills: ['L1', 'Technical Voice Process', 'Outlook Configuration', 'International Voice Process', 'Hardware Troubleshooting', 'Troubleshooting', 'Software Installation', 'Application Support'],
      currentCTC: 'Rs 4.50 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'Expert in Technical Support, Software Support',
      comments: 'NA',
      qualification: 'Bachelor of Computer Applications (BCA)',
      ugSpecialization: 'Computer Applications (General)',
      university: 'K K Wagh College of Engineering, Nashik',
      yearOfGraduation: '2021',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Male',
      maritalStatus: 'NA',
      homeTownCity: 'NA',
      pinCode: 'NA',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('2000-10-19'),
      permanentAddress: 'NA',
      assignedRecruiter: recruiter1._id,
      assignedRecruiterName: recruiter1.name,
      status: 'Interview Scheduled'
    },
    {
      name: 'Punam Uddhav Karad',
      email: 'punamkarad1611@gmail.com',
      phone: '9172769351',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '10-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Pune',
      experience: '3 Year(s) 0 Month(s)',
      currentCompany: 'iProtecs',
      currentRole: 'Service Desk Engineer 2',
      department: 'IT & Information Security',
      eligibleRole: 'Incident Management',
      industry: 'IT Services & Consulting',
      skills: ['Service Desk', 'Service Desk', 'Remote Support', 'Outlook Configuration', 'Windows Installation', 'Active Directory', 'Networking'],
      currentCTC: 'Rs 4.00 Lakhs',
      noticePeriod: 'Serving Notice Period',
      resumeHeadline: 'Industrial Experience As a Service Desk Analyst',
      comments: 'Skilled in handling service request',
      qualification: 'Bachelor of Computer Applications (BCA)',
      ugSpecialization: 'Computer Applications (General)',
      university: 'Shivaji University, Kolhapur',
      yearOfGraduation: '2022',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Female',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'borgaon',
      pinCode: '415413',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('1999-11-16'),
      permanentAddress: 'Banewadi, Tal - Walwa, Dist - Sangli',
      assignedRecruiter: recruiter2._id,
      assignedRecruiterName: recruiter2.name,
      status: 'New'
    },
    {
      name: 'Lavanya',
      email: 'ralavanya0218@gmail.com',
      phone: '7386358015',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '10-Feb-2026',
      currentLocation: 'Hyderabad',
      preferredLocation: 'Hyderabad',
      experience: '1 Year(s) 5 Month(s)',
      currentCompany: 'Clari5',
      currentRole: 'Service Desk Engineer',
      department: 'Engineering - Hardware & Networks',
      eligibleRole: 'Networks - Other',
      industry: 'Hardware & Networking',
      skills: ['OS Installation', 'Outlook Configuration', 'LAN Configuration', 'Troubleshooting', 'DHCP', 'VPN Configuration', 'DNS Configuration', 'Desktop Support'],
      currentCTC: 'Rs 2.20 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'Looking for a service desk engineer job role',
      comments: 'Checking whether the user is a member of the VPN group, then add remove to the VPN group',
      qualification: 'MCA',
      ugSpecialization: 'Computers',
      university: 'International School of Technology and Sciences for Women, Rajamahendravaram',
      yearOfGraduation: '2024',
      pgDegree: 'MCA',
      pgSpecialization: 'Computers',
      pgUniversity: 'International School of Technology and Sciences for Women, Rajamahendravaram',
      pgGraduationYear: '2024',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Female',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'NA',
      pinCode: 'NA',
      usaWorkPermit: 'Need H1 Visa',
      dateOfBirth: new Date('2002-02-18'),
      permanentAddress: 'NA',
      assignedRecruiter: recruiter2._id,
      assignedRecruiterName: recruiter2.name,
      status: 'Selected'
    },
    {
      name: 'rajesh Tripathy',
      email: 'tripathyrajesh015@gmail.com',
      phone: '8341586381',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '05-Feb-2026',
      currentLocation: 'Hyderabad',
      preferredLocation: 'Bengaluru, Hyderabad, Gurugram, Ahmedabad, Delhi / NCR, Remote, Chennai, Noida',
      experience: '2 Year(s) 5 Month(s)',
      currentCompany: 'Future Focus Infotech',
      currentRole: 'Service Desk Engineer&Desktop Support Engineer',
      department: 'IT & Information Security',
      eligibleRole: 'Desktop Engineer',
      industry: 'IT Services & Consulting',
      skills: ['Technical Support', 'Servicenow', 'Technical Helpdesk', 'ITIL Framework', 'VPN Configuration', 'VPN Troubleshooting'],
      currentCTC: 'Rs 4 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'Experienced in active Directory user management, VPN systems, Microsoft 365 administration',
      comments: 'Experienced in active Directory user management, VPN systems, Microsoft 365 administration, Active Directory user management',
      qualification: 'Bachelor of Engineering (B.Tech/B.E.)',
      ugSpecialization: 'Mechanical Engineering',
      university: 'Biju Patnaik University of Technology (BPUT)',
      yearOfGraduation: '2019',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Male',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'khorda',
      pinCode: '751002',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('1995-07-03'),
      permanentAddress: 'Bhubaneswar',
      assignedRecruiter: recruiter3._id,
      assignedRecruiterName: recruiter3.name,
      status: 'Contacted'
    },
    {
      name: 'Rashmi Ashtankar',
      email: 'rashmit344@gmail.com',
      phone: '8605937493',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '06-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Noida, Gurugram, Pune, Nagpur, Remote, Mumbai',
      experience: '2 Year(s) 3 Month(s)',
      currentCompany: 'Orient Technologies',
      currentRole: 'Service Desk Executive',
      department: 'IT & Information Security',
      eligibleRole: 'Information Security - Other',
      industry: 'IT Services & Consulting',
      skills: ['O365 F&O', 'Windows Server', 'Linux', 'CCNA', 'ITIL', 'Troubleshooting', 'Networking', 'SLA Management', 'Incident Management', 'Windows OS', 'Pivot Table', 'gsuite'],
      currentCTC: 'Rs 3 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'Currently working in Kirloskar support team and users till close',
      comments: 'Currently working in Kirloskar support team and users till close',
      qualification: 'Bachelor of Science (B.Sc)',
      ugSpecialization: 'Computer Science and Technology',
      university: 'Tai Golwalkar Mahavidyalaya, Ramtek',
      yearOfGraduation: '2022',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Female',
      maritalStatus: 'NA',
      homeTownCity: 'nagpur maharashtra',
      pinCode: 'NA',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('2001-07-19'),
      permanentAddress: 'NA',
      assignedRecruiter: recruiter3._id,
      assignedRecruiterName: recruiter3.name,
      status: 'HR Shortlist'
    },
    {
      name: 'Rahil Inamdar',
      email: 'dev.rahilinamdar@gmail.com',
      phone: '8192066874',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '05-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Remote, Bengaluru, Mumbai, Pune, Chennai, Hyderabad, Kolkata',
      experience: '1 Year(s) 0 Month(s)',
      currentCompany: 'ANUTHAM TECHNOLOGIES PRIVATE LIMITED',
      currentRole: 'IT Service Desk',
      department: 'IT & Information Security',
      eligibleRole: 'IT Support - Other',
      industry: 'Financial Services',
      skills: ['Remote Support', 'Remote Desktop', 'IT Services', 'System Support', 'Desktop Engineering', 'Remote Infrastructure', 'System Administration', 'Jamf', 'Intune'],
      currentCTC: 'Rs 4 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'Administration, and enterprise infrastructure management',
      comments: 'Active Directory, with strong troubleshooting',
      qualification: 'Bachelor of Science (B.Sc)',
      ugSpecialization: 'Computer Science and Engineering (CSE)',
      university: 'SAVITRIBAI PHULE PUNE UNIVERSITY',
      yearOfGraduation: '2024',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Male',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'pcmc',
      pinCode: '411044',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('2000-04-24'),
      permanentAddress: 'PUNE',
      assignedRecruiter: recruiter1._id,
      assignedRecruiterName: recruiter1.name,
      status: 'Joined',
      isWalkIn: true
    },
    {
      name: 'Umesh Patil',
      email: 'eshppatil02@gmail.com',
      phone: '9921594300',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '09-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Nagpur, Noida, Gurugram, Hyderabad, Indore, Ahmedabad, Delhi / NCR, Bengaluru',
      experience: '2 Year(s) 2 Month(s)',
      currentCompany: 'Cybrowse Digital Solutions PVT.LTD',
      currentRole: 'L1 IT Support Engineer',
      department: 'Customer Success, Service & Operations',
      eligibleRole: 'Operations (Tech Ops)',
      industry: 'IT Services & Consulting',
      skills: ['Support (Voice & Email)', 'Outlook Troubleshooting', 'Active Directory', 'Incident Management', 'Microsoft 365', 'Office 365', 'ServiceNow (Ticketing Tool)', 'L1 IT Support'],
      currentCTC: 'Rs 3.80 Lakhs',
      noticePeriod: 'Serving Notice Period',
      resumeHeadline: 'Service Desk | Active Directory | O365 | ServiceNow | Teams | OneDrive | Sharepoint',
      comments: 'L1 support, handling incidents and service requests',
      qualification: 'Bachelor of Science (B.Sc)',
      ugSpecialization: 'Information Technology (IT)',
      university: 'Rashtrasant Tukadoji Maharaj (RTMNU), Nagpur',
      yearOfGraduation: '2023',
      pgDegree: 'MS/M.Sc(Science)',
      pgSpecialization: 'Computers',
      pgUniversity: 'Shri Shivaji College of Science, Nagpur',
      pgGraduationYear: '2024',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Male',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'Waygaon Haldya',
      pinCode: '442305',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('2002-05-22'),
      permanentAddress: 'Waygaon Haldya , T. Samudrapur, D. Wardha',
      assignedRecruiter: recruiter4._id,
      assignedRecruiterName: recruiter4.name,
      status: 'Call Back'
    },
    {
      name: 'Mahesh Macha',
      email: 'maheshtrml599@gmail.com',
      phone: '9110551818',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '07-Feb-2026',
      currentLocation: 'Hyderabad',
      preferredLocation: 'Hyderabad, Remote',
      experience: '4 Year(s) 6 Month(s)',
      currentCompany: 'Concentrix',
      currentRole: 'IT Service Desk Engineer',
      department: 'IT & Information Security',
      eligibleRole: 'IT Support - Other',
      industry: 'IT Services & Consulting',
      skills: ['Windows Troubleshooting', 'L2 Support', 'Active Directory', 'Incident Management', 'O365 Admin', 'ServiceNow'],
      currentCTC: 'Rs 5 Lakhs',
      noticePeriod: '15 Days or less',
      resumeHeadline: 'L2 Desktop Support | O365 Admin | Active Directory',
      comments: 'Experience in incident management, Active Directory',
      qualification: 'Bachelor of Engineering (B.Tech/B.E.)',
      ugSpecialization: 'Electronics And Computer Engineering',
      university: 'Jawaharlal Nehru Technological University (JNTU)',
      yearOfGraduation: '2018',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Male',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'Hyderabad',
      pinCode: '500087',
      usaWorkPermit: 'Authorized to work in US',
      dateOfBirth: new Date('1993-06-04'),
      permanentAddress: '7-85, Balajinagar',
      assignedRecruiter: recruiter4._id,
      assignedRecruiterName: recruiter4.name,
      status: 'Documentation'
    },
    {
      name: 'Vaibhavi Manal',
      email: 'vaibhavimanal92@gmail.com',
      phone: '8799897954',
      positionApplied: 'Service Desk Executives',
      dateOfApplication: '05-Feb-2026',
      currentLocation: 'Pune',
      preferredLocation: 'Mumbai (All Areas), Remote, Pune',
      experience: '2 Year(s) 6 Month(s)',
      currentCompany: 'Fujitsu',
      currentRole: 'IT Service Desk Agent',
      department: 'IT & Information Security',
      eligibleRole: 'IT Support - Other',
      industry: 'IT Services & Consulting',
      skills: ['Configuration', 'Troubleshooting', 'Software Installation', 'Active Directory', 'ITIL Framework', 'Incident Management', 'ITSM', 'SLA Management', 'Entra ID'],
      currentCTC: 'Rs 4 Lakhs',
      noticePeriod: 'Serving Notice Period',
      resumeHeadline: 'Service Desk Agent | Skilled in Incident Management',
      comments: 'Incident management and delivering remote technical support',
      qualification: 'Bachelor of Computer Applications (BCA)',
      ugSpecialization: 'Computer Applications (General)',
      university: 'Deogiri College, Aurangabad',
      yearOfGraduation: '2024',
      pgDegree: 'NA',
      pgSpecialization: 'NA',
      pgUniversity: 'NA',
      pgGraduationYear: 'NA',
      doctorateDegree: 'NA',
      doctorateSpecialization: 'NA',
      doctorateUniversity: 'NA',
      doctorateGraduationYear: 'NA',
      gender: 'Female',
      maritalStatus: 'Single/unmarried',
      homeTownCity: 'wahegaon',
      pinCode: '431109',
      usaWorkPermit: 'NA',
      dateOfBirth: new Date('2003-07-05'),
      permanentAddress: 'wahegaon Dist-Aurangabad State-Maharashtra',
      assignedRecruiter: recruiter5._id,
      assignedRecruiterName: recruiter5.name,
      status: 'Wrong Number'
    }
  ];

  // Add notes and flag some
  candidateData[2].flagged = true;
  candidateData[2].flagReason = 'Phone number may be incorrect';
  candidateData[5].flagged = true;
  candidateData[5].flagReason = 'Skills mismatch with resume';
  candidateData[8].flagged = true;
  candidateData[8].flagReason = 'Duplicate entry suspected';

  candidateData[0].notes = [
    { text: 'Very interested in the position. Good communication.', addedBy: recruiter1._id, addedByName: recruiter1.name, followUpDate: new Date(Date.now() + 86400000) },
    { text: 'Sent JD via email.', addedBy: recruiter1._id, addedByName: recruiter1.name },
  ];
  candidateData[1].notes = [
    { text: 'Interview scheduled for next week.', addedBy: recruiter1._id, addedByName: recruiter1.name, followUpDate: new Date(Date.now() + 172800000) },
  ];

  const candidates = await Candidate.create(candidateData);
  console.log(`Created ${candidates.length} candidates`);

  // ── Jobs ──
  const Job = require('../models/Job');
  await Job.deleteMany({});
  const jobs = await Job.create([
    { companyName: 'TCS', jrNumber: 'JR-2026-001', jobTitle: 'React Developer', department: 'IT', jobType: 'Full Time', experience: '2-4 years', location: 'Mumbai', positions: 3, skills: ['React', 'TypeScript', 'Node.js'], description: 'Looking for experienced React developers for enterprise app development.', requirements: 'Strong knowledge of React hooks, Redux, REST APIs.', status: 'Open', createdBy: users[5]._id },
    { companyName: 'Infosys', jrNumber: 'JR-2026-002', jobTitle: 'Python Backend Engineer', department: 'Engineering', jobType: 'Full Time', experience: '3-5 years', location: 'Bangalore', positions: 2, skills: ['Python', 'Django', 'AWS', 'PostgreSQL'], description: 'Backend engineer to build scalable microservices.', requirements: 'Proficiency in Python, Django/Flask, AWS services.', status: 'Open', createdBy: users[5]._id },
    { companyName: 'Wipro', jrNumber: 'JR-2026-003', jobTitle: 'HR Executive', department: 'Human Resources', jobType: 'Full Time', experience: '1-3 years', location: 'Pune', positions: 1, skills: ['Recruitment', 'Sourcing', 'HR Operations'], description: 'HR executive to manage end-to-end recruitment cycle.', requirements: 'Experience in recruitment, sourcing, and HRIS tools.', status: 'Open', createdBy: users[7]._id },
    { companyName: 'HCL', jrNumber: 'JR-2026-004', jobTitle: 'DevOps Engineer', department: 'Infrastructure', jobType: 'Full Time', experience: '4-6 years', location: 'Noida', positions: 2, skills: ['Docker', 'Kubernetes', 'Jenkins', 'AWS'], description: 'DevOps engineer for CI/CD pipeline management.', requirements: 'Hands-on with Docker, K8s, Terraform, and CI/CD tools.', status: 'Open', createdBy: users[7]._id },
    { companyName: 'Tech Mahindra', jrNumber: 'JR-2026-005', jobTitle: 'Customer Support Executive', department: 'BPO', jobType: 'Full Time', experience: '0-2 years', location: 'Chennai', positions: 10, skills: ['English', 'Customer Service', 'Communication'], description: 'Support executives for international voice process.', requirements: 'Good English communication, willingness to work in shifts.', status: 'Open', createdBy: users[5]._id },
    { companyName: 'Accenture', jrNumber: 'JR-2026-006', jobTitle: 'UI/UX Designer', department: 'Design', jobType: 'Contract', experience: '2-4 years', location: 'Hyderabad', positions: 1, skills: ['Figma', 'Photoshop', 'UI/UX', 'Prototyping'], description: 'Designer for enterprise dashboard and mobile apps.', requirements: 'Portfolio required. Proficiency in Figma and design systems.', status: 'Closed', createdBy: users[7]._id },
  ]);
  console.log(`Created ${jobs.length} jobs`);

  // ── Call Logs ──
  const callLogData = [];
  const outcomes = ['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Busy', 'Wrong Number'];
  for (let i = 0; i < 40; i++) {
    const cand = candidates[i % candidates.length];
    const rec = users[i % 5];
    callLogData.push({
      candidate: cand._id,
      candidateName: cand.name,
      candidatePhone: cand.phone,
      recruiter: rec._id,
      recruiterName: rec.name,
      startTime: new Date(Date.now() - Math.random() * 7 * 86400000),
      endTime: new Date(Date.now() - Math.random() * 7 * 86400000 + 300000),
      duration: Math.floor(Math.random() * 600) + 30,
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      notes: 'Follow-up call regarding position',
      completed: true,
    });
  }
  await CallLog.create(callLogData);
  console.log(`Created ${callLogData.length} call logs`);

  // ── Interviews ──
  const interviewData = [];
  const modes = ['In-Person', 'Video', 'Telephonic'];
  const statuses = ['Scheduled', 'Completed', 'Cancelled', 'No Show'];
  for (let i = 0; i < 10; i++) {
    const cand = candidates[i];
    const rec = users[i % 5];
    interviewData.push({
      candidate: cand._id,
      candidateName: cand.name,
      role: 'Software Engineer',
      recruiter: rec._id,
      recruiterName: rec.name,
      date: new Date(Date.now() + (i - 3) * 86400000),
      time: `${10 + (i % 8)}:00`,
      mode: modes[i % 3],
      status: statuses[i % 4],
      round: `Round ${(i % 3) + 1}`,
      location: i % 3 === 0 ? 'White Horse Office, Mumbai' : '',
      notes: 'Technical interview',
    });
  }
  await Interview.create(interviewData);
  console.log(`Created ${interviewData.length} interviews`);

  // ── Walk-Ins ──
  const walkInData = [];
  const walkInStatuses = ['Waiting', 'In Review', 'Interviewed', 'Selected', 'Rejected'];
  for (let i = 0; i < 8; i++) {
    walkInData.push({
      referenceId: `WHM/WI/26/0000${i + 1}`,
      token: `WI-${1001 + i}`,
      name: candidateData[i].name,
      phone: candidateData[i].phone,
      experience: candidateData[i].experience,
      resumeUploaded: i % 2 === 0,
      status: walkInStatuses[i % 5],
      assignedTo: i < 5 ? users[i % 5]._id : undefined,
      assignedToName: i < 5 ? users[i % 5].name : undefined,
      candidate: candidates[i]._id,
      registeredAt: new Date(),
    });
  }
  await WalkIn.create(walkInData);
  console.log(`Created ${walkInData.length} walk-in entries`);

  // ── Attendance (last 7 days) ──
  const attendanceData = [];
  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    for (const user of users) {
      const isPresent = Math.random() > 0.15;
      if (isPresent) {
        const loginHour = 9 + Math.floor(Math.random() * 2);
        const loginTime = new Date(date);
        loginTime.setHours(loginHour, Math.floor(Math.random() * 30), 0);

        const logoutTime = new Date(date);
        logoutTime.setHours(loginHour + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

        attendanceData.push({
          user: user._id,
          name: user.name,
          role: user.role,
          date,
          loginTime,
          logoutTime: day > 0 ? logoutTime : undefined,
          isWFH: user.isWFH,
          status: user.isWFH ? 'WFH' : 'Present',
          totalHours: day > 0 ? Math.round(((logoutTime - loginTime) / 3600000) * 100) / 100 : 0,
        });
      }
    }
  }
  await Attendance.create(attendanceData);
  console.log(`Created ${attendanceData.length} attendance records`);

  // ── Holidays ──
  const holidays2026 = [
    { date: new Date(2026, 0, 26), name: 'Republic Day', type: 'National', year: 2026 },
    { date: new Date(2026, 2, 10), name: 'Holi', type: 'Festival', year: 2026 },
    { date: new Date(2026, 3, 6), name: 'Ram Navami', type: 'Festival', year: 2026 },
    { date: new Date(2026, 3, 14), name: 'Ambedkar Jayanti', type: 'National', year: 2026 },
    { date: new Date(2026, 4, 1), name: 'May Day', type: 'National', year: 2026 },
    { date: new Date(2026, 7, 15), name: 'Independence Day', type: 'National', year: 2026 },
    { date: new Date(2026, 9, 2), name: 'Gandhi Jayanti', type: 'National', year: 2026 },
    { date: new Date(2026, 9, 20), name: 'Dussehra', type: 'Festival', year: 2026 },
    { date: new Date(2026, 10, 9), name: 'Diwali', type: 'Festival', year: 2026 },
    { date: new Date(2026, 11, 25), name: 'Christmas', type: 'Optional', year: 2026 },
  ];
  await Holiday.create(holidays2026);
  console.log(`Created ${holidays2026.length} holidays`);

  // ── Permissions ──
  await Permission.create([
    { role: 'recruiter', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: false, export_reports: false, manage_team: false, correction: false, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'tl', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: false, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: false, manage_team: true, correction: true, view_salary: false, view_revenue: false, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'manager', permissions: { view_resumes: true, add_resumes: false, edit_resumes: false, delete_resumes: false, make_calls: false, view_call_history: true, walkin_register: false, view_reports: true, export_reports: true, manage_team: true, correction: false, view_salary: true, view_revenue: true, manage_users: false, access_control: false, view_logs: false, manage_attendance: false } },
    { role: 'admin', permissions: { view_resumes: true, add_resumes: true, edit_resumes: true, delete_resumes: true, make_calls: true, view_call_history: true, walkin_register: true, view_reports: true, export_reports: true, manage_team: true, correction: true, view_salary: true, view_revenue: true, manage_users: true, access_control: true, view_logs: true, manage_attendance: true } },
  ]);
  console.log('Created permissions');

  // ── Audit Logs ──
  const logTypes = ['call', 'status', 'login', 'edit', 'create', 'system'];
  const logData = [];
  for (let i = 0; i < 30; i++) {
    const u = users[i % users.length];
    logData.push({
      type: logTypes[i % logTypes.length],
      user: u._id,
      userName: u.name,
      role: u.role,
      action: [
        'User logged in',
        'Called candidate Arjun Mehta',
        'Status changed: New → Contacted',
        'Added candidate Sneha Gupta',
        'Updated candidate profile',
        'System health check',
        'Exported reports',
        'Created new user',
        'Modified permissions',
        'Generated salary report',
      ][i % 10],
      target: candidates[i % candidates.length]?._id?.toString() || '',
      ip: '192.168.1.' + (10 + i),
      timestamp: new Date(Date.now() - i * 3600000),
    });
  }
  await AuditLog.create(logData);
  console.log(`Created ${logData.length} audit logs`);

  // ── Invoices ──
  const invoiceStatuses = ['Paid', 'Pending', 'Overdue', 'Due Soon'];
  const invoiceData = [];
  const clients = ['TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Accenture', 'IBM', 'Cognizant'];
  for (let i = 0; i < 8; i++) {
    invoiceData.push({
      client: clients[i],
      amount: 50000 + Math.floor(Math.random() * 200000),
      dueDate: new Date(Date.now() + (i - 3) * 7 * 86400000),
      status: invoiceStatuses[i % 4],
      description: `Placement fee for ${candidates[i]?.name || 'candidate'}`,
      candidateRef: candidates[i]?._id,
      recruiterRef: users[i % 5]._id,
    });
  }
  await Invoice.create(invoiceData);
  console.log(`Created ${invoiceData.length} invoices`);

  // ── Business Development (Mock Spreadsheet Data) ──
  const todayDate = new Date();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(todayDate.getDate() - 1);
  const threeDaysAgoDate = new Date();
  threeDaysAgoDate.setDate(todayDate.getDate() - 3);
  const fiveDaysAgoDate = new Date();
  fiveDaysAgoDate.setDate(todayDate.getDate() - 5);

  const bizDevData = [
    {
      date: todayDate,
      executiveName: 'System Administrator',
      companyName: 'Whitehorse Tech',
      contactPerson: 'John Doe',
      designation: 'CTO',
      mobileNo: '9876543231',
      emailId: 'john@whitehorsetech.com',
      city: 'Bangalore',
      industry: 'Software',
      source: 'LinkedIn',
      serviceOffered: 'NEXORA ATS',
      callStatus: 'Converted',
      interested: 'Yes',
      requirement: 'ATS Software deployment',
      noOfPositions: 1,
      followUpDate: null,
      meetingFixed: 'Yes',
      proposalSent: 'Yes',
      agreementSent: 'Yes',
      clientStatus: 'Converted',
      expectedRevenue: 150000,
      remarks: 'Signed agreement and fully onboarded.',
      createdBy: users[0]._id,
    },
    {
      date: yesterdayDate,
      executiveName: 'Rajesh Iyer',
      companyName: 'Acme Corp',
      contactPerson: 'Jane Smith',
      designation: 'HR Manager',
      mobileNo: '9876543232',
      emailId: 'jane@acme.com',
      city: 'Mumbai',
      industry: 'Manufacturing',
      source: 'Naukri',
      serviceOffered: 'Permanent Recruitment',
      callStatus: 'Meeting Fixed',
      interested: 'Yes',
      requirement: 'Need 5 mechanical engineers',
      noOfPositions: 5,
      followUpDate: todayDate,
      meetingFixed: 'Yes',
      proposalSent: 'No',
      agreementSent: 'No',
      clientStatus: 'Hot',
      expectedRevenue: 80000,
      remarks: 'Meeting fixed for today at 3 PM to align on job requirements.',
      createdBy: users[7]._id,
    },
    {
      date: yesterdayDate,
      executiveName: 'Priya Sharma',
      companyName: 'Globex Ltd',
      contactPerson: 'Bob Johnson',
      designation: 'Operations Head',
      mobileNo: '9876543233',
      emailId: 'bob@globex.com',
      city: 'Delhi',
      industry: 'Logistics',
      source: 'Reference',
      serviceOffered: 'Contract Staffing',
      callStatus: 'Call Back Later',
      interested: 'Yes',
      requirement: '15 delivery executives',
      noOfPositions: 15,
      followUpDate: new Date(todayDate.getTime() + 86400000), // tomorrow
      meetingFixed: 'No',
      proposalSent: 'Pending',
      agreementSent: 'No',
      clientStatus: 'Warm',
      expectedRevenue: 50000,
      remarks: 'Interested in contract staffing. Asked to call back tomorrow morning.',
      createdBy: users[1]._id,
    },
    {
      date: todayDate,
      executiveName: 'Amit Singh',
      companyName: 'Cyberdyne Systems',
      contactPerson: 'Sarah Connor',
      designation: 'Talent Acquisition',
      mobileNo: '9876543234',
      emailId: 'sarah@cyberdyne.com',
      city: 'Pune',
      industry: 'Robotics',
      source: 'Website',
      serviceOffered: 'RPO',
      callStatus: 'Switched Off',
      interested: 'No',
      requirement: '',
      noOfPositions: 0,
      followUpDate: null,
      meetingFixed: 'No',
      proposalSent: 'No',
      agreementSent: 'No',
      clientStatus: 'Cold',
      expectedRevenue: 0,
      remarks: 'Attempted to call, phone was switched off.',
      createdBy: users[2]._id,
    },
    {
      date: fiveDaysAgoDate,
      executiveName: 'Kavita Nair',
      companyName: 'Initech Corp',
      contactPerson: 'Bill Lumbergh',
      designation: 'VP Sales',
      mobileNo: '9876543235',
      emailId: 'bill@initech.com',
      city: 'Chennai',
      industry: 'IT Services',
      source: 'LinkedIn',
      serviceOffered: 'Multiple Services',
      callStatus: 'Converted',
      interested: 'Yes',
      requirement: 'Recruitment & HRMS bundle',
      noOfPositions: 10,
      followUpDate: null,
      meetingFixed: 'Yes',
      proposalSent: 'Yes',
      agreementSent: 'Yes',
      clientStatus: 'Converted',
      expectedRevenue: 200000,
      remarks: 'Existing client. Extended their contract to support multiple services.',
      createdBy: users[6]._id,
    },
    {
      date: threeDaysAgoDate,
      executiveName: 'System Administrator',
      companyName: 'Hooli Inc',
      contactPerson: 'Gavin Belson',
      designation: 'CEO',
      mobileNo: '9876543236',
      emailId: 'gavin@hooli.xyz',
      city: 'Bangalore',
      industry: 'Internet',
      source: 'LinkedIn',
      serviceOffered: 'IT Recruitment',
      callStatus: 'Proposal Sent',
      interested: 'Yes',
      requirement: 'Need 12 senior engineering hires',
      noOfPositions: 12,
      followUpDate: todayDate,
      meetingFixed: 'Yes',
      proposalSent: 'Yes',
      agreementSent: 'No',
      clientStatus: 'Hot',
      expectedRevenue: 120000,
      remarks: 'Proposal sent two days ago. Follow up today regarding agreement draft.',
      createdBy: users[0]._id,
    },
    {
      date: todayDate,
      executiveName: 'System Administrator',
      companyName: 'Stark Industries',
      contactPerson: 'Pepper Potts',
      designation: 'CEO Spoc',
      mobileNo: '9876543237',
      emailId: 'pepper@stark.com',
      city: 'Hyderabad',
      industry: 'Defence',
      source: 'Website',
      serviceOffered: 'HRMS',
      callStatus: 'Connected',
      interested: 'Yes',
      requirement: 'HRMS trial setup',
      noOfPositions: 1,
      followUpDate: new Date(todayDate.getTime() + 4 * 86400000),
      meetingFixed: 'No',
      proposalSent: 'No',
      agreementSent: 'No',
      clientStatus: 'Warm',
      expectedRevenue: 30000,
      remarks: 'Connected with Spoc. Scheduling demo presentation next week.',
      createdBy: users[0]._id,
    },
    {
      date: todayDate,
      executiveName: 'Neha Patel',
      companyName: 'Umbrella Corp',
      contactPerson: 'Albert Wesker',
      designation: 'Security Director',
      mobileNo: '9876543238',
      emailId: 'albert@umbrella.com',
      city: 'Gurgaon',
      industry: 'BioTech',
      source: 'Naukri',
      serviceOffered: 'Payroll',
      callStatus: 'No Answer',
      interested: 'No',
      requirement: '',
      noOfPositions: 0,
      followUpDate: null,
      meetingFixed: 'No',
      proposalSent: 'No',
      agreementSent: 'No',
      clientStatus: 'Cold',
      expectedRevenue: 0,
      remarks: 'No response after multiple calls.',
      createdBy: users[3]._id,
    }
  ];

  await BusinessDevelopment.create(bizDevData);
  console.log(`Created ${bizDevData.length} business development entries`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nTest Accounts:');
  console.log('──────────────────────────────────');
  console.log('Recruiter: EMP001 / password123');
  console.log('Recruiter (WFH): EMP002 / password123');
  console.log('Team Lead: EMP006 / password123');
  console.log('Manager: EMP007 / password123');
  console.log('Admin: EMP008 / password123');
  console.log('──────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
