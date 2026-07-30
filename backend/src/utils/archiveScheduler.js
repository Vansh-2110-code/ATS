const fs = require('fs');
const path = require('path');
const Candidate = require('../models/Candidate');
const { createLog } = require('./auditLogger');

// Runs the archiver check
async function runArchiver() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Find candidates older than 1 year
    const oldCandidates = await Candidate.find({
      createdAt: { $lt: oneYearAgo }
    }).lean();
    
    if (oldCandidates.length === 0) {
      console.log('Archiver: No candidates older than 1 year found.');
      return;
    }
    
    console.log(`Archiver: Found ${oldCandidates.length} candidates older than 1 year. Archiving...`);
    
    // Ensure archives directory exists
    const archivesDir = path.join(__dirname, '../../uploads/archives');
    if (!fs.existsSync(archivesDir)) {
      fs.mkdirSync(archivesDir, { recursive: true });
    }
    
    // Generate filename
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `archived_candidates_${dateStr}_${Date.now()}.csv`;
    const filePath = path.join(archivesDir, filename);
    
    // Define headers
    const headers = [
      'Candidate ID', 'Name', 'Email', 'Phone', 'Skills', 'Experience',
      'Location', 'Current Company', 'Notice Period', 'Status', 'Sourced By',
      'Created At', 'Updated At'
    ];
    
    // Convert candidate records to CSV format
    const csvRows = [headers.join(',')];
    for (const c of oldCandidates) {
      const row = [
        `"${c.candidateId || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${(c.skills || []).join('; ').replace(/"/g, '""')}"`,
        `"${c.experience || ''}"`,
        `"${(c.location || c.city || '').replace(/"/g, '""')}"`,
        `"${(c.currentCompany || '').replace(/"/g, '""')}"`,
        `"${c.noticePeriod || ''}"`,
        `"${c.status || ''}"`,
        `"${c.sourcedBy || ''}"`,
        `"${c.createdAt ? new Date(c.createdAt).toISOString() : ''}"`,
        `"${c.updatedAt ? new Date(c.updatedAt).toISOString() : ''}"`
      ];
      csvRows.push(row.join(','));
    }
    
    // Save backup file
    fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
    console.log(`Archiver: Saved backup file at ${filePath}`);
    
    // Delete candidates from the live database
    const deleteIds = oldCandidates.map(c => c._id);
    const deleteResult = await Candidate.deleteMany({ _id: { $in: deleteIds } });
    
    console.log(`Archiver: Successfully deleted ${deleteResult.deletedCount} old candidates from database.`);
    
    // Log the archive event in System Audit Logs
    await createLog({
      type: 'system',
      user: null,
      userName: 'System Archiver',
      role: 'admin',
      action: `Archived & Wiped ${deleteResult.deletedCount} candidates older than 1 year. Backup saved as ${filename}`,
      ip: '127.0.0.1'
    }).catch(() => {});
    
  } catch (err) {
    console.error('Error during candidate archiving:', err);
  }
}

// Start daily check (runs once every 24 hours)
function startArchiveScheduler() {
  console.log('Archiver: Candidate Archiving Scheduler initialized.');
  
  // Run on startup
  setTimeout(() => {
    runArchiver();
  }, 10000); // Wait 10 seconds after server start
  
  // Schedule to run every 24 hours
  setInterval(() => {
    runArchiver();
  }, 24 * 60 * 60 * 1000);
}

module.exports = { startArchiveScheduler, runArchiver };
