import fs from 'fs';
import path from 'path';

describe('production security headers', () => {
  test('allows GLTFLoader to decode embedded textures through blob URLs', () => {
    const headers = fs.readFileSync(
      path.join(process.cwd(), 'public', '_headers'),
      'utf8'
    );
    const cspLine = headers
      .split(/\r?\n/)
      .find((line) => line.includes('Content-Security-Policy:'));
    const directives = Object.fromEntries(
      cspLine
        .split('Content-Security-Policy:')[1]
        .trim()
        .split(';')
        .map((directive) => directive.trim().split(/\s+/))
        .filter(([name]) => name)
        .map(([name, ...sources]) => [name, sources])
    );

    expect(directives['img-src']).toContain('blob:');
    expect(directives['connect-src']).toContain('blob:');
    expect(directives['object-src']).toEqual(["'none'"]);
  });
});
