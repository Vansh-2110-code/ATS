const BusinessDevelopment = require('../models/BusinessDevelopment');
const ExcelJS = require('exceljs');

// Helper to get start and end of dates
const getDayRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/business-development
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      clientStatus,
      callStatus,
      serviceOffered,
      executiveName,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
      kpiFilter,
    } = req.query;

    const filter = {};

    if (clientStatus) filter.clientStatus = clientStatus;
    if (callStatus) filter.callStatus = callStatus;
    if (serviceOffered) filter.serviceOffered = serviceOffered;
    if (executiveName) filter.executiveName = { $regex: executiveName, $options: 'i' };

    if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [
        { companyName: re },
        { contactPerson: re },
        { executiveName: re },
        { city: re },
        { remarks: re },
      ];
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    if (kpiFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      switch (kpiFilter) {
        case 'callsToday':
          filter.date = { ...filter.date, $gte: today, $lt: tomorrow };
          break;
        case 'callsThisWeek':
          filter.date = { ...filter.date, $gte: startOfWeek, $lt: tomorrow };
          break;
        case 'connectedCalls':
          filter.callStatus = 'Connected';
          break;
        case 'followUpsDue':
          filter.followUpDate = { $lte: new Date() };
          filter.clientStatus = { $ne: 'Converted' };
          break;
        case 'meetingsScheduled':
          filter.meetingFixed = 'Yes';
          break;
        case 'proposalsPending':
          filter.$or = [
            { proposalSent: 'Pending' },
            { proposalSent: 'No', clientStatus: { $in: ['Hot', 'Warm'] } }
          ];
          break;
        case 'agreementsPending':
          filter.$or = [
            { agreementSent: 'Pending' },
            { agreementSent: 'No', clientStatus: { $in: ['Hot', 'Warm'] } }
          ];
          break;
        case 'hotLeads':
          filter.clientStatus = 'Hot';
          break;
        case 'convertedClients':
          filter.$or = [
            { clientStatus: 'Converted' },
            { callStatus: 'Converted' },
            { callStatus: 'Existing Client' }
          ];
          break;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const total = await BusinessDevelopment.countDocuments(filter);
    const records = await BusinessDevelopment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    res.json({
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      records,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/business-development/stats
exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Calls Today
    const callsToday = await BusinessDevelopment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    // Calls This Week
    const callsThisWeek = await BusinessDevelopment.countDocuments({
      date: { $gte: startOfWeek, $lt: tomorrow },
    });

    // Connected Calls
    const connectedCalls = await BusinessDevelopment.countDocuments({
      callStatus: 'Connected',
    });

    // Follow-ups Due
    const followUpsDue = await BusinessDevelopment.countDocuments({
      followUpDate: { $lte: new Date() },
      clientStatus: { $ne: 'Converted' },
    });

    // Meetings Scheduled
    const meetingsScheduled = await BusinessDevelopment.countDocuments({
      meetingFixed: 'Yes',
    });

    // Proposals Pending
    const proposalsPending = await BusinessDevelopment.countDocuments({
      $or: [
        { proposalSent: 'Pending' },
        { proposalSent: 'No', clientStatus: { $in: ['Hot', 'Warm'] } }
      ]
    });

    // Agreements Pending
    const agreementsPending = await BusinessDevelopment.countDocuments({
      $or: [
        { agreementSent: 'Pending' },
        { agreementSent: 'No', clientStatus: { $in: ['Hot', 'Warm'] } }
      ]
    });

    // Hot Leads
    const hotLeads = await BusinessDevelopment.countDocuments({
      clientStatus: 'Hot',
    });

    // Converted Clients
    const convertedClients = await BusinessDevelopment.countDocuments({
      $or: [
        { clientStatus: 'Converted' },
        { callStatus: 'Converted' },
        { callStatus: 'Existing Client' }
      ]
    });

    // Expected Revenue
    const expectedRevenueResult = await BusinessDevelopment.aggregate([
      { $match: { clientStatus: { $in: ['Hot', 'Warm'] } } },
      { $group: { _id: null, total: { $sum: '$expectedRevenue' } } },
    ]);
    const expectedRevenue = expectedRevenueResult[0]?.total || 0;

    // Total Leads
    const totalLeads = await BusinessDevelopment.countDocuments();

    // Conversion %
    const conversionPct = totalLeads > 0 ? Math.round((convertedClients / totalLeads) * 100) : 0;

    // Average Calls/Day
    const callsByDay = await BusinessDevelopment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalDays = callsByDay.length;
    const totalCalls = callsByDay.reduce((sum, day) => sum + day.count, 0);
    const avgCallsPerDay = totalDays > 0 ? Math.round((totalCalls / totalDays) * 10) / 10 : 0;

    res.json({
      callsToday,
      callsThisWeek,
      connectedCalls,
      followUpsDue,
      meetingsScheduled,
      proposalsPending,
      agreementsPending,
      hotLeads,
      convertedClients,
      expectedRevenue,
      conversionPct,
      avgCallsPerDay,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/business-development/:id
exports.getOne = async (req, res, next) => {
  try {
    const record = await BusinessDevelopment.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// POST /api/business-development
exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const record = await BusinessDevelopment.create(data);
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

// PUT /api/business-development/:id
exports.update = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.createdBy;

    const record = await BusinessDevelopment.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/business-development/:id
exports.delete = async (req, res, next) => {
  try {
    const record = await BusinessDevelopment.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/business-development/export
exports.exportExcel = async (req, res, next) => {
  try {
    const { search, clientStatus, callStatus, serviceOffered, executiveName, startDate, endDate } = req.query;
    const filter = {};

    if (clientStatus) filter.clientStatus = clientStatus;
    if (callStatus) filter.callStatus = callStatus;
    if (serviceOffered) filter.serviceOffered = serviceOffered;
    if (executiveName) filter.executiveName = { $regex: executiveName, $options: 'i' };

    if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [
        { companyName: re },
        { contactPerson: re },
        { executiveName: re },
        { city: re },
        { remarks: re },
      ];
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const records = await BusinessDevelopment.find(filter).sort({ date: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Business Development');

    const columns = [
      { header: 'Sl. No', key: 'slNo', width: 8 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Executive Name', key: 'executiveName', width: 20 },
      { header: 'Company Name', key: 'companyName', width: 25 },
      { header: 'Contact Person', key: 'contactPerson', width: 20 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'Mobile No', key: 'mobileNo', width: 15 },
      { header: 'Email ID', key: 'emailId', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'Industry', key: 'industry', width: 15 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Service Offered', key: 'serviceOffered', width: 25 },
      { header: 'Call Status', key: 'callStatus', width: 20 },
      { header: 'Interested', key: 'interested', width: 12 },
      { header: 'Requirement', key: 'requirement', width: 25 },
      { header: 'No. of Positions', key: 'noOfPositions', width: 15 },
      { header: 'Follow-up Date', key: 'followUpDate', width: 15 },
      { header: 'Meeting Fixed', key: 'meetingFixed', width: 15 },
      { header: 'Proposal Sent', key: 'proposalSent', width: 15 },
      { header: 'Agreement Sent', key: 'agreementSent', width: 15 },
      { header: 'Client Status', key: 'clientStatus', width: 15 },
      { header: 'Expected Revenue', key: 'expectedRevenue', width: 18 },
      { header: 'Remarks', key: 'remarks', width: 35 },
    ];

    worksheet.columns = columns;

    // Styling headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Dark Blue
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    records.forEach((rec, index) => {
      const rowData = {
        slNo: index + 1,
        date: formatDate(rec.date),
        executiveName: rec.executiveName,
        companyName: rec.companyName,
        contactPerson: rec.contactPerson,
        designation: rec.designation,
        mobileNo: rec.mobileNo,
        emailId: rec.emailId,
        city: rec.city,
        industry: rec.industry,
        source: rec.source,
        serviceOffered: rec.serviceOffered,
        callStatus: rec.callStatus,
        interested: rec.interested,
        requirement: rec.requirement,
        noOfPositions: rec.noOfPositions,
        followUpDate: formatDate(rec.followUpDate),
        meetingFixed: rec.meetingFixed,
        proposalSent: rec.proposalSent,
        agreementSent: rec.agreementSent,
        clientStatus: rec.clientStatus,
        expectedRevenue: rec.expectedRevenue || 0,
        remarks: rec.remarks,
      };

      // Replace falsy values with empty string or sensible default
      columns.forEach(col => {
        if (rowData[col.key] === null || rowData[col.key] === undefined) {
          rowData[col.key] = '';
        }
      });

      worksheet.addRow(rowData);
    });

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };

    const filename = `Business_Development_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
