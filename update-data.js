const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const latestPath = 'c:\\Users\\user\\Desktop\\latest.txt';
const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));

// 1. Pipeline A
if (data.pipeline_a) {
  for (const date in data.pipeline_a) {
    const filePath = path.join(__dirname, 'public', 'data', 'daily', `${date}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data.pipeline_a[date], null, 2));
    console.log(`Updated ${filePath}`);
  }
}

// 2. Pipeline B
if (data.pipeline_b) {
  for (const date in data.pipeline_b) {
    const filePath = path.join(__dirname, 'public', 'data', 'petrobangla', 'daily', `${date}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data.pipeline_b[date], null, 2));
    console.log(`Updated ${filePath}`);
  }
}

// 3. Update lib/available-dates.json
if (data.new_dates_to_publish && data.new_dates_to_publish.length > 0) {
  const datesPath = path.join(__dirname, 'lib', 'available-dates.json');
  let availableDates = [];
  if (fs.existsSync(datesPath)) {
    availableDates = JSON.parse(fs.readFileSync(datesPath, 'utf8'));
  }
  const newDates = data.new_dates_to_publish;
  for (const d of newDates) {
    if (!availableDates.includes(d)) {
      availableDates.push(d);
    }
  }
  availableDates.sort();
  fs.writeFileSync(datesPath, JSON.stringify(availableDates, null, 2));
  console.log(`Updated ${datesPath}`);
}
