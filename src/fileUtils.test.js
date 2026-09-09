const { getOutputPath, readTextFile } = require('./fileUtils');
const path = require('path');

test('getOutputPath returns correct path', () => {
  const result = getOutputPath('report.txt');
  expect(result).toContain('report.txt');
  expect(result).toBe(path.join(__dirname, 'output', 'report.txt'));
});

test('readTextFile returns file content with expected line endings', () => {
  const testFile = path.join(__dirname, 'test-data', 'sample.txt');
  const content = readTextFile(testFile);
  // Normalize line endings to handle Windows CRLF vs Unix LF
  const normalizedContent = content.replace(/\r\n/g, '\n');
  expect(normalizedContent).toBe('line one\nline two\nline three\n');
});
