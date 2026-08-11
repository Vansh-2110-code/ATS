const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/src/controllers/dashboard.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// Check for remaining conflicts
const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>> [^\r\n]+\r?\n?/g;

let matchCount = 0;
const newContent = content.replace(conflictRegex, (match, headContent, incomingContent) => {
  matchCount++;
  console.log(`\n--- Conflict ${matchCount} ---`);
  console.log('HEAD side:');
  console.log(headContent.substring(0, 200));
  console.log('INCOMING side:');
  console.log(incomingContent.substring(0, 200));
  // Take the INCOMING side (d278b7f - the fix commit)
  return incomingContent;
});

if (matchCount > 0) {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`\nResolved ${matchCount} conflicts in dashboard.controller.js`);
} else {
  console.log('No conflicts found!');
}
