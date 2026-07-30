const AtsRecord = require('../models/AtsRecord');
const XLSX = require('xlsx');

/* ─── Column definitions for Excel export (exact order) ─────── */
const EXCEL_COLUMNS = [
  { key: 'jobTitle',               header: 'Job Title' },
  { key: 'scanDate',               header: 'Date of Application' },
  { key: 'name',                   header: 'Name' },
  { key: 'email',                  header: 'Email ID' },
  { key: 'phone',                  header: 'Phone Number' },
  { key: 'currentLocation',        header: 'Current Location' },
  { key: 'preferredLocations',     header: 'Preferred Locations' },
  { key: 'totalExperience',        header: 'Total Experience' },
  { key: 'currentCompanyName',     header: 'Current Company Name' },
  { key: 'currentCompanyDesignation', header: 'Current Company Designation' },
  { key: 'department',             header: 'Department' },
  { key: 'role',                   header: 'Role' },
  { key: 'industry',               header: 'Industry' },
  { key: 'keySkills',              header: 'Key Skills' },
  { key: 'annualSalary',           header: 'Annual Salary' },
  { key: 'noticePeriod',           header: 'Notice Period / Availability to Join' },
  { key: 'resumeHeadline',         header: 'Resume Headline' },
  { key: 'summary',                header: 'Summary' },
  { key: 'ugDegree',               header: 'Under Graduation Degree' },
  { key: 'ugSpecialization',       header: 'UG Specialization' },
  { key: 'ugInstitute',            header: 'UG University/Institute Name' },
  { key: 'ugGraduationYear',       header: 'UG Graduation Year' },
  { key: 'pgDegree',               header: 'Post Graduation Degree' },
  { key: 'pgSpecialization',       header: 'PG Specialization' },
  { key: 'pgInstitute',            header: 'PG University/Institute Name' },
  { key: 'pgGraduationYear',       header: 'PG Graduation Year' },
  { key: 'doctorateDegree',        header: 'Doctorate Degree' },
  { key: 'doctorateSpecialization',header: 'Doctorate Specialization' },
  { key: 'doctorateInstitute',     header: 'Doctorate University/Institute Name' },
  { key: 'doctorateGraduationYear',header: 'Doctorate Graduation Year' },
  { key: 'gender',                 header: 'Gender' },
  { key: 'maritalStatus',          header: 'Marital Status' },
  { key: 'homeTownCity',           header: 'Home Town/City' },
  { key: 'pinCode',                header: 'Pin Code' },
  { key: 'workPermitUSA',          header: 'Work Permit for USA' },
  { key: 'dateOfBirth',            header: 'Date of Birth' },
  { key: 'permanentAddress',       header: 'Permanent Address' },
  // ATS-specific columns
  { key: 'atsScore',               header: 'ATS Score' },
  { key: 'atsStatus',              header: 'ATS Status' },
  { key: 'matchedSkills',          header: 'Matched Skills' },
  { key: 'missingSkills',          header: 'Missing Skills' },
  { key: 'keywordMatchPct',        header: 'Keyword Match %' },
  { key: 'experienceMatchScore',   header: 'Experience Match Score' },
  { key: 'educationMatchScore',    header: 'Education Match Score' },
  { key: 'resumeQualityScore',     header: 'Resume Quality Score' },
  { key: 'scanDate',               header: 'Scan Date' },
  { key: 'scannedBy',              header: 'Scanned By' },
  { key: 'source',                 header: 'Source' },
  { key: 'remarks',                header: 'Remarks / Feedback' },
];

/* ─── GET /api/ats-records ──────────────────────────────────── */
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      status, minScore, maxScore,
      startDate, endDate,
      search,
    } = req.query;

    const filter = {};

    if (status)   filter.atsStatus = status;
    if (minScore || maxScore) {
      filter.atsScore = {};
      if (minScore) filter.atsScore.$gte = parseInt(minScore, 10);
      if (maxScore) filter.atsScore.$lte = parseInt(maxScore, 10);
    }
    if (startDate || endDate) {
      filter.scanDate = {};
      if (startDate) filter.scanDate.$gte = new Date(startDate);
      if (endDate)   filter.scanDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    // RBAC: recruiters only see their own records, unless they search via keywords, in which case they can see others' records after 30 days
    if (req.user.role === 'recruiter' || req.user.role === 'spoc') {
      if (search) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const re = { $regex: search, $options: 'i' };
        filter.$and = [
          { $or: [{ name: re }, { email: re }, { phone: re }, { keySkills: re }] },
          {
            $or: [
              { scannedBy: req.user._id },
              { scanDate: { $lt: thirtyDaysAgo } }
            ]
          }
        ];
      } else {
        filter.scannedBy = req.user._id;
      }
    } else if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [{ name: re }, { email: re }, { phone: re }, { keySkills: re }];
    }

    const skip  = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await AtsRecord.countDocuments(filter);
    const records = await AtsRecord.find(filter)
      .sort({ scanDate: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({ total, page: parseInt(page, 10), limit: parseInt(limit, 10), records });
  } catch (err) {
    next(err);
  }
};

/* ─── GET /api/ats-records/export ───────────────────────────── */
exports.exportExcel = async (req, res, next) => {
  try {
    const { status, minScore, maxScore, startDate, endDate, search } = req.query;
    const filter = {};

    if (status) filter.atsStatus = status;
    if (minScore || maxScore) {
      filter.atsScore = {};
      if (minScore) filter.atsScore.$gte = parseInt(minScore, 10);
      if (maxScore) filter.atsScore.$lte = parseInt(maxScore, 10);
    }
    if (startDate || endDate) {
      filter.scanDate = {};
      if (startDate) filter.scanDate.$gte = new Date(startDate);
      if (endDate)   filter.scanDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59));
    }
    // RBAC: Recruiters only export their own scanned records, unless they search via keywords, in which case they can export others' records after 30 days
    if (req.user.role === 'recruiter' || req.user.role === 'spoc') {
      if (search) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const re = { $regex: search, $options: 'i' };
        filter.$and = [
          { $or: [{ name: re }, { email: re }, { phone: re }] },
          {
            $or: [
              { scannedBy: req.user._id },
              { scanDate: { $lt: thirtyDaysAgo } }
            ]
          }
        ];
      } else {
        filter.scannedBy = req.user._id;
      }
    } else if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    const records = await AtsRecord.find(filter).sort({ scanDate: -1 }).lean();

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ATS Records');

    // Define Columns (Matching the 37-column requirement where possible + ATS fields)
    const columns = [
      { header: 'Job Title', key: 'jobTitle', width: 25 },
      { header: 'Date of application', key: 'dateOfApplication', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email ID', key: 'email', width: 30 },
      { header: 'Phone Number', key: 'phone', width: 20 },
      { header: 'Current Location', key: 'currentLocation', width: 20 },
      { header: 'Preferred Locations', key: 'preferredLocations', width: 25 },
      { header: 'Total Experience', key: 'totalExperience', width: 15 },
      { header: 'Curr. Company name', key: 'currentCompanyName', width: 30 },
      { header: 'Curr. Company Designation', key: 'currentCompanyDesignation', width: 30 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Industry', key: 'industry', width: 20 },
      { header: 'Key Skills', key: 'keySkills', width: 40 },
      { header: 'Annual Salary', key: 'annualSalary', width: 15 },
      { header: 'Notice period/ Availability to join', key: 'noticePeriod', width: 25 },
      { header: 'Resume Headline', key: 'resumeHeadline', width: 40 },
      { header: 'Summary', key: 'summary', width: 50 },
      { header: 'Under Graduation degree', key: 'ugDegree', width: 25 },
      { header: 'UG Specialization', key: 'ugSpecialization', width: 25 },
      { header: 'UG University/institute Name', key: 'ugInstitute', width: 30 },
      { header: 'UG Graduation year', key: 'ugGraduationYear', width: 15 },
      { header: 'Post graduation degree', key: 'pgDegree', width: 25 },
      { header: 'PG specialization', key: 'pgSpecialization', width: 25 },
      { header: 'PG university/institute name', key: 'pgInstitute', width: 30 },
      { header: 'PG graduation year', key: 'pgGraduationYear', width: 15 },
      { header: 'Doctorate degree', key: 'doctorateDegree', width: 25 },
      { header: 'Doctorate specialization', key: 'doctorateSpecialization', width: 25 },
      { header: 'Doctorate university/institute name', key: 'doctorateInstitute', width: 30 },
      { header: 'Doctorate graduation year', key: 'doctorateGraduationYear', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Marital Status', key: 'maritalStatus', width: 15 },
      { header: 'Home Town/City', key: 'homeTownCity', width: 20 },
      { header: 'Pin Code', key: 'pinCode', width: 10 },
      { header: 'Work Permit for USA', key: 'workPermitUSA', width: 15 },
      { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
      { header: 'Permanent Address', key: 'permanentAddress', width: 40 },
      // ATS Specific
      { header: 'ATS Score', key: 'atsScore', width: 12 },
      { header: 'ATS Status', key: 'atsStatus', width: 20 },
      { header: 'Matched Skills', key: 'matchedSkills', width: 30 },
      { header: 'Missing Skills', key: 'missingSkills', width: 30 },
      { header: 'Keyword Match %', key: 'keywordMatchPct', width: 15 },
      { header: 'Scan Date', key: 'scanDate', width: 20 },
      { header: 'Scanned By', key: 'scannedByName', width: 25 },
      { header: 'Remarks', key: 'remarks', width: 40 },
    ];

    worksheet.columns = columns;

    // Bold Headers with subtle background
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF166534' } // Green-800
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    records.forEach(rec => {
      const rowData = {};
      columns.forEach(col => {
        let val = rec[col.key];
        
        // Specialized formatting
        if (col.key === 'dateOfApplication' || col.key === 'scanDate') {
          val = formatDate(rec.scanDate);
        } else if (col.key === 'scannedByName') {
          val = rec.scannedByName ? `${rec.scannedByName} (${rec.scannedByRole || 'User'})` : 'N/A';
        } else if (col.key === 'atsScore') {
          val = rec.atsScore || 0;
        } else if (col.key === 'keywordMatchPct') {
          val = rec.keywordMatchPct ? `${rec.keywordMatchPct}%` : '0%';
        }
        
        rowData[col.key] = (val === null || val === undefined || val === '') ? 'N/A' : val;
      });
      worksheet.addRow(rowData);
    });

    // Auto-filter for better usability
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };

    const filename = `ATS_Records_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

/* ─── GET /api/ats-records/:id ──────────────────────────────── */
exports.getOne = async (req, res, next) => {
  try {
    const record = await AtsRecord.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ message: 'ATS record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

/* ─── PATCH /api/ats-records/:id ────────────────────── */
exports.updateRecord = async (req, res, next) => {
  try {
    // We allow updating any provided fields (e.g., name, email, phone, experience, etc.)
    const update = { ...req.body };

    // Prevent updating protected fields if any (like _id, scanDate, atsScore)
    delete update._id;
    delete update.scanDate;

    // Optional: Recalculate keywords/status if needed, but for now we trust manual edits.

    const record = await AtsRecord.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!record) return res.status(404).json({ message: 'ATS record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
};
