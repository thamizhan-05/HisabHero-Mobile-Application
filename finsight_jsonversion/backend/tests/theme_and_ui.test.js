import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('UI & Theme Design System Verification', () => {
  const webIndexPath = path.join(__dirname, '..', 'public', 'index.html');
  const mobileThemePath = path.join(__dirname, '..', '..', '..', 'mobile', 'src', 'theme', 'themeSystem.tsx');
  const mobileSettingsPath = path.join(__dirname, '..', '..', '..', 'mobile', 'src', 'components', 'SettingsModal.tsx');

  it('Web Client - index.html exists and is readable', () => {
    assert.ok(fs.existsSync(webIndexPath), 'Web index.html must exist');
    const content = fs.readFileSync(webIndexPath, 'utf8');
    assert.ok(content.length > 1000, 'index.html should have substantial content');
  });

  it('Web Client - Light theme is default (:root, body, body.theme-light)', () => {
    const content = fs.readFileSync(webIndexPath, 'utf8');
    assert.ok(content.includes(':root, body, body.theme-light'), 'Light theme must be root and body default');
    assert.ok(content.includes('--background: #F8FAFC;'), 'Primary background must be #F8FAFC');
    assert.ok(content.includes('--surface: #FFFFFF;'), 'Card/surface background must be #FFFFFF');
    assert.ok(content.includes('--primary: #173F35;'), 'Brand primary must be #173F35');
    assert.ok(content.includes('--secondary-soft: #DCEFE5;'), 'Secondary soft accent must be #DCEFE5');
    assert.ok(content.includes('--text: #17212B;'), 'Primary text must be #17212B');
    assert.ok(content.includes('--text-muted: #64748B;'), 'Secondary text must be #64748B');
    assert.ok(content.includes('--border: #E2E8F0;'), 'Border must be #E2E8F0');
    assert.ok(content.includes('--success: #15803D;'), 'Success positive indicator must be accessible green #15803D');
    assert.ok(content.includes('--warning: #B45309;'), 'Warning indicator must be restrained amber #B45309');
    assert.ok(content.includes('--danger: #B91C1C;'), 'Destructive indicator must be accessible red #B91C1C');
  });

  it('Web Client - Centralized motion tokens and reduced-motion preference defined', () => {
    const content = fs.readFileSync(webIndexPath, 'utf8');
    assert.ok(content.includes('--transition-fast: 150ms'), 'Must have fast motion token');
    assert.ok(content.includes('--transition-normal: 250ms'), 'Must have normal motion token');
    assert.ok(content.includes('--transition-slow: 350ms'), 'Must have slow motion token');
    assert.ok(content.includes('@media (prefers-reduced-motion: reduce)'), 'Must respect prefers-reduced-motion');
  });

  it('Web Client - LocalStorage defaults to light theme when unset', () => {
    const content = fs.readFileSync(webIndexPath, 'utf8');
    assert.ok(
      content.includes("localStorage.getItem('hisabhero_active_theme') || 'light'"),
      'Must fallback to light theme for first-time visitors'
    );
  });

  it('Mobile Client - themeSystem.tsx contains hisabhero_light with brand palette tokens', () => {
    assert.ok(fs.existsSync(mobileThemePath), 'mobile/src/theme/themeSystem.tsx must exist');
    const content = fs.readFileSync(mobileThemePath, 'utf8');
    assert.ok(content.includes("id: 'hisabhero_light'"), 'hisabhero_light must be defined');
    assert.ok(content.includes("bg: '#F8FAFC'"), 'Mobile bg token must be #F8FAFC');
    assert.ok(content.includes("card: '#FFFFFF'"), 'Mobile card token must be #FFFFFF');
    assert.ok(content.includes("primary: '#173F35'"), 'Mobile primary token must be #173F35');
    assert.ok(content.includes("accent: '#DCEFE5'"), 'Mobile accent token must be #DCEFE5');
    assert.ok(content.includes("text: '#17212B'"), 'Mobile text token must be #17212B');
    assert.ok(content.includes("textSecondary: '#64748B'"), 'Mobile textSecondary token must be #64748B');
    assert.ok(content.includes("cardBorder: '#E2E8F0'"), 'Mobile cardBorder token must be #E2E8F0');
  });

  it('Mobile Client - ThemeProvider defaults to hisabhero_light', () => {
    const content = fs.readFileSync(mobileThemePath, 'utf8');
    assert.ok(
      content.includes("useState<string>('hisabhero_light')"),
      'Mobile ThemeProvider state must default to hisabhero_light'
    );
    assert.ok(
      content.includes("themeId: 'hisabhero_light'"),
      'ThemeContext default value must be hisabhero_light'
    );
  });

  it('Mobile Client - SettingsModal displays hisabhero_light as first default choice', () => {
    assert.ok(fs.existsSync(mobileSettingsPath), 'mobile SettingsModal.tsx must exist');
    const content = fs.readFileSync(mobileSettingsPath, 'utf8');
    assert.ok(
      content.includes("{ id: 'hisabhero_light', title: 'HisabHero Light 🌿 (Default)'"),
      'SettingsModal must list hisabhero_light first with (Default) label'
    );
  });
});
