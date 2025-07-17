const fs = require('fs');
const path = require('path');

// Read the sample VWorks log file
const logPath = path.join(__dirname, 'sample_logs', 'vworks_log(3_31_2020 3_28_34 PM).log');
if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath);
    process.exit(1);
}
const content = fs.readFileSync(logPath, 'utf8');
if (!content || content.length === 0) {
    console.error('Log file is empty:', logPath);
    process.exit(1);
}

console.log('VWorks log file loaded, size:', content.length, 'characters');
console.log('First 500 characters:');
console.log(content.substring(0, 500));

// Parse the content manually to test the format
const lines = content.split('\n').filter(line => line.trim());
console.log('\nTotal lines:', lines.length);

// Show first few parsed lines
console.log('\nFirst 5 lines parsed:');
for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const parts = line.split('\t');
    console.log(`Line ${i + 1}:`, {
        timestamp: parts[0]?.trim(),
        level: parts[1]?.trim(),
        device: parts[2]?.trim(),
        location: parts[3]?.trim(),
        process: parts[4]?.trim(),
        task: parts[5]?.trim(),
        description: parts[6]?.trim(),
        protocol: parts[7]?.trim(),
        file: parts[8]?.trim(),
        session: parts[9]?.trim(),
    });
}

// Count relevant events
const relevantKeywords = [
    'aspirate', 'dispense', 'mix', 'move plate', 'place plate',
    'clamp', 'shake', 'centrifuge', 'seal', 'peel', 'read', 'scan',
    'protocol', 'process', 'scheduler'
];

let relevantCount = 0;
const relevantLines = [];

lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    if (relevantKeywords.some(keyword => lowerLine.includes(keyword))) {
        relevantCount++;
        if (relevantLines.length < 10) {
            relevantLines.push({ index: index + 1, line: line.trim() });
        }
    }
});

console.log(`\nRelevant events found: ${relevantCount} out of ${lines.length}`);
console.log('\nSample relevant events:');
relevantLines.forEach(({ index, line }) => {
    console.log(`${index}: ${line}`);
}); 