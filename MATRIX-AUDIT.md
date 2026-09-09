# Matrix CI Audit Report

## Matrix Configuration

| OS | Node Version | Status | Failure Type | Fix Applied |
|----|--------------|--------|--------------|-------------|
| ubuntu-latest | 18 | ✅ Pass | N/A | N/A |
| ubuntu-latest | 20 | ✅ Pass | N/A | N/A |
| ubuntu-latest | 22 | ❌ Fail | Runtime Version | Replaced deprecated crypto.createCipher/createDecipher with crypto.createCipheriv/createDecipheriv |
| ubuntu-latest | 24 | ⚠️ Experimental | N/A | continue-on-error: true |
| windows-latest | 18 | ❌ Fail | OS-Specific (Path) | Replaced forward-slash string concatenation with path.join() |
| windows-latest | 20 | ❌ Fail | OS-Specific (Path) | Replaced forward-slash string concatenation with path.join() |
| windows-latest | 22 | ❌ Fail | OS-Specific (Path) + Runtime Version | Replaced forward-slash string concatenation with path.join() AND replaced deprecated crypto API |
| windows-latest | 24 | ⚠️ Experimental | N/A | continue-on-error: true |

## Detailed Failure Analysis

### 1. Windows + Node 18 (and 20)

**OS:** windows-latest
**Node Version:** 18 (and 20)
**Step:** npm test → Jest test suite
**Error Line:** `expect(result).toBe(path.join(__dirname, 'output', 'report.txt'))`
**Failure Type:** OS-Specific - Path String Concatenation
**Description:** The `fileUtils.js` file used forward-slash string concatenation (`__dirname + '/output/' + filename`) to build file paths. On Windows, this produces paths with mixed separators that don't match `path.join()` output. The test assertion in `fileUtils.test.js` compares against `path.join(__dirname, 'output', 'report.txt')` which produces backslash paths on Windows.
**Fix Applied:** Replaced all string concatenation path building in `fileUtils.js` with `path.join()` to ensure cross-platform path compatibility.

### 2. Ubuntu + Node 22

**OS:** ubuntu-latest
**Node Version:** 22
**Step:** npm test → Jest test suite
**Error Line:** `Error: crypto.createCipher is not a function` (or similar deprecation error)
**Failure Type:** Runtime Version Incompatibility
**Description:** Node.js 22 removed the deprecated `crypto.createCipher()` and `crypto.createDecipher()` functions. These were legacy APIs that were deprecated since Node.js 10 due to security concerns (they derive the key internally without a proper IV). The functions `encryptValue()` and `decryptValue()` in `cryptoUtils.js` used these removed APIs.
**Fix Applied:** Updated `cryptoUtils.js` to use `crypto.createCipheriv()` and `crypto.createDecipheriv()` with proper initialization vectors (IV). The IV is generated randomly for encryption and prepended to the ciphertext (hex-encoded, separated by ':') for decryption.

### 3. Windows + Node 22

**OS:** windows-latest
**Node Version:** 22
**Step:** npm test → Jest test suite
**Error Line:** Multiple errors - path concatenation AND crypto API errors
**Failure Type:** OS-Specific + Runtime Version (Combined)
**Description:** This combination experienced both failure types: the Windows path separator issue AND the Node 22 crypto API removal.
**Fix Applied:** Both fixes applied - `path.join()` for paths and updated crypto API with IV.

### 4. Windows + Node 18/20 - Line Ending Test

**OS:** windows-latest
**Node Version:** 18, 20
**Step:** npm test → Jest test suite
**Error Line:** `expect(normalizedContent).toBe('line one\nline two\nline three\n')`
**Failure Type:** OS-Specific - Line Endings
**Description:** The test `readTextFile returns file content with expected line endings` compares file content with hardcoded Unix line endings (`\n`). On Windows, files may have CRLF (`\r\n`) line endings depending on git configuration and file system behavior.
**Fix Applied:** Updated the test to normalize line endings by replacing `\r\n` with `\n` before comparison.

## Fixes Summary

### File: `src/fileUtils.js`
- Added `const path = require('path');`
- Changed `readConfig()` to use `path.join(__dirname, 'configs', configName + '.json')`
- Changed `getOutputPath()` to use `path.join(__dirname, 'output', filename)`

### File: `src/cryptoUtils.js`
- Added IV generation with `crypto.randomBytes(16)`
- Changed `encryptValue()` to use `crypto.createCipheriv('aes-256-cbc', key, iv)`
- Changed `decryptValue()` to use `crypto.createDecipheriv('aes-256-cbc', key, iv)`
- Modified return format to include IV: `iv.toString('hex') + ':' + encrypted`

### File: `src/fileUtils.test.js`
- Added line ending normalization: `content.replace(/\r\n/g, '\n')` before comparison

### File: `.github/workflows/ci.yml`
- Added `fail-fast: false` to matrix strategy with explanatory comment
- Added Node 24 to matrix with `experimental: true` using `include:`
- Added `continue-on-error: ${{ matrix.experimental }}` to job

## Verification

After applying all fixes:
- All Ubuntu combinations (Node 18, 20, 22) should pass ✅
- All Windows combinations (Node 18, 20, 22) should pass ✅
- Node 24 combinations (Ubuntu and Windows) should show as continue-on-error ⚠️
- No combination should be red-failing the overall workflow
