const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = argv.slice(2);
  const ticketId = args.find((arg) => !arg.startsWith('--'));
  const mockFlag = args.includes('--mock');
  const outDirArg = args.find((arg) => arg.startsWith('--outDir='));
  const mockFileArg = args.find((arg) => arg.startsWith('--mockFile='));

  return {
    ticketId,
    mockFlag,
    outDir: outDirArg ? outDirArg.split('=')[1] : 'generated-features',
    mockFile: mockFileArg ? mockFileArg.split('=')[1] : null,
  };
}

function toKebab(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureVerbLedTitle(title) {
  const firstWord = title.trim().split(/\s+/)[0] || '';
  const verbLike = /^(accept|decline|refer|show|display|pre-populate|leave|use|calculate|validate|submit|allow|prevent|update|create|fetch|load|start|complete)$/i;

  if (verbLike.test(firstWord)) {
    return title;
  }

  return `Validate ${title.charAt(0).toLowerCase()}${title.slice(1)}`;
}

function buildFeature(payload) {
  const ticketTag = `@ticket-${payload.ticketId}`;
  const tags = `${ticketTag} @generated @draft`;

  const persona = payload.persona || 'mortgage applicant';
  const goal = payload.goal || 'complete the DIP journey';
  const benefit = payload.benefit || 'receive a clear decision';

  const lines = [];
  lines.push(tags);
  lines.push(`Feature: ${payload.title}`);
  lines.push(`  # Source: mock Jira payload for ${payload.ticketId}`);
  lines.push(`  As a ${persona}`);
  lines.push(`  I want to ${goal}`);
  lines.push(`  So that I can ${benefit}`);
  lines.push('');

  const scenarios = Array.isArray(payload.scenarios) ? payload.scenarios : [];
  scenarios.forEach((scenario) => {
    lines.push(`  Scenario: ${ensureVerbLedTitle(scenario.title)}`);

    (scenario.given || []).forEach((step, index) => {
      lines.push(`    ${index === 0 ? 'Given' : 'And'} ${step}`);
    });

    (scenario.when || []).forEach((step, index) => {
      lines.push(`    ${index === 0 ? 'When' : 'And'} ${step}`);
    });

    (scenario.then || []).forEach((step, index) => {
      lines.push(`    ${index === 0 ? 'Then' : 'And'} ${step}`);
    });

    lines.push('');
  });

  return lines.join('\n').trimEnd() + '\n';
}

function loadMockPayload(ticketId, mockFileArg) {
  const defaultPath = path.join(process.cwd(), 'test-data', 'mock-jira', `${ticketId}.json`);
  const payloadPath = mockFileArg
    ? path.resolve(process.cwd(), mockFileArg)
    : defaultPath;

  if (!fs.existsSync(payloadPath)) {
    throw new Error(`Mock Jira payload not found at ${payloadPath}`);
  }

  const json = fs.readFileSync(payloadPath, 'utf8');
  return JSON.parse(json);
}

function main() {
  const { ticketId, mockFlag, outDir, mockFile } = parseArgs(process.argv);

  if (!ticketId) {
    console.error('Usage: npm run generate:ticket -- <TICKET-ID> [--mock] [--mockFile=path] [--outDir=generated-features]');
    process.exit(1);
  }

  if (!mockFlag) {
    console.error('This scaffold currently supports --mock mode only. Configure MCP and extend this script to fetch live Jira data.');
    process.exit(1);
  }

  const payload = loadMockPayload(ticketId, mockFile);
  if (!payload.ticketId) {
    payload.ticketId = ticketId;
  }

  const featureText = buildFeature(payload);
  const fileName = `${toKebab(ticketId)}.feature`;
  const outputDir = path.resolve(process.cwd(), outDir);
  const outputPath = path.join(outputDir, fileName);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, featureText, 'utf8');

  console.log(`Generated feature: ${outputPath}`);
}

main();
