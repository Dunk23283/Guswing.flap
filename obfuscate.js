const obfuscator = require('javascript-obfuscator');
const fs = require('fs');

const code = fs.readFileSync('game.js', 'utf8');
const result = obfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    debugProtection: true,
    debugProtectionInterval: 100,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: true,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
});

fs.writeFileSync('game.obfuscated.js', result.getObfuscatedCode());
