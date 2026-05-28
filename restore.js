const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\deepj\\.gemini\\antigravity\\brain\\f9ac874c-bbf0-4bbd-bc19-742d9f3619d2\\.system_generated\\logs\\transcript.jsonl';

const filesToRestore = [
  'c:/Project/backend/backend/socket.js',
  'c:/Project/backend/backend/routes/ride.routes.js',
  'c:/Project/backend/backend/controllers/driverController.js',
  'c:/Project/backend/backend/routes/driver/driver.routes.js',
  'c:/Project/backend/frontend/src/context/SocketContext.js',
  'c:/Project/backend/frontend/src/pages/Ride/LookingForDriver.jsx',
  'c:/Project/backend/frontend/src/pages/Driver/DriverDashboard.jsx'
];

async function run() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream });

  let fileContents = {};

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      // Tool responses are typically sent as messages or similar. But I can just regex search the raw text if JSON parsing misses it.
      // Actually, my tools are 'default_api:view_file' which means the response is a TOOL_RESPONSE.
      // Let's just string match the whole line for 'File Path: ile:///'
      
      let text = line;
      if (text.includes('File Path: ile:///')) {
        let content = '';
        if (entry.content) content = entry.content;
        else if (entry.tool_responses) content = JSON.stringify(entry.tool_responses);
        else content = text; // Just fallback to raw string

        // Use regex to find File Path
        const match = content.match(/File Path: \x60file:\/\/\/(.+?)\x60/);
        if (match) {
          const fp = match[1].toLowerCase();
          const targetPath = filesToRestore.find(t => t.toLowerCase() === fp);
          if (targetPath) {
            // Find the code block. It starts with "The following code has been modified..."
            // But JSON escaping means we need to process it properly.
            // Let's just extract it from the actual content if we can parse it.
            let actualStr = '';
            if (entry.tool_responses && entry.tool_responses.length > 0) {
                actualStr = entry.tool_responses[0].response.output || '';
            } else if (entry.tool_calls && entry.tool_calls.length > 0 && entry.tool_calls[0].response) {
                actualStr = entry.tool_calls[0].response.output || '';
            } else {
                // regex extract output: "output":"..."
                const outMatch = text.match(/"output":"(.*?[^\\])"/);
                if (outMatch) {
                    actualStr = JSON.parse('"' + outMatch[1] + '"');
                }
            }
            
            if (actualStr) {
                let lines = actualStr.split('\\n');
                let isCode = false;
                let codeLines = [];
                for (let l of lines) {
                  if (l.includes('The following code has been modified')) {
                    isCode = true;
                    continue;
                  }
                  if (l.includes('The above content shows the entire') || l.includes('The above content does NOT show the entire')) {
                    isCode = false;
                    break;
                  }
                  if (isCode) {
                    let stripped = l.replace(/^\\d+:\\s/, '');
                    if (l.match(/^\\d+:$/)) stripped = '';
                    codeLines.push(stripped);
                  }
                }
                if (!fileContents[targetPath]) fileContents[targetPath] = [];
                fileContents[targetPath] = fileContents[targetPath].concat(codeLines);
            }
          }
        }
      }
    } catch(e) {}
  }

  for (const fp of Object.keys(fileContents)) {
    fs.writeFileSync(fp, fileContents[fp].join('\\n'));
    console.log('Restored: ' + fp);
  }
}
run();
