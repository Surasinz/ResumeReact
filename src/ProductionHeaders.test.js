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

  test('serves hashed Unreal intro renders as immutable WebM media', () => {
    const netlify = fs.readFileSync(
      path.join(process.cwd(), 'netlify.toml'),
      'utf8'
    );

    expect(netlify).toContain('for = "/static/media/*.webm"');
    expect(netlify).toContain('Content-Type = "video/webm"');
    expect(netlify).toContain(
      'Cache-Control = "public, max-age=31536000, immutable"'
    );
  });
});
