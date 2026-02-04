import {
  generateSnapshotFileName,
  generateSnapshotDirectory,
  sanitizeForFilename,
  formatTimestamp
} from '../../src/utils/fileNaming';

describe('File Naming Utilities', () => {
  describe('sanitizeForFilename', () => {
    it('should remove invalid characters', () => {
      const result = sanitizeForFilename('test<>:|*?"\\with/invalid');
      expect(result).not.toMatch(/[<>:|*?"\\]/);
      expect(result).toBe('test-with-invalid');
    });

    it('should replace spaces with hyphens', () => {
      const result = sanitizeForFilename('test with spaces');
      expect(result).toBe('test-with-spaces');
    });

    it('should collapse multiple hyphens', () => {
      const result = sanitizeForFilename('test---multiple---hyphens');
      expect(result).toBe('test-multiple-hyphens');
    });

    it('should remove leading and trailing hyphens', () => {
      const result = sanitizeForFilename('-test-');
      expect(result).toBe('test');
    });

    it('should limit length to 100 characters', () => {
      const longString = 'a'.repeat(150);
      const result = sanitizeForFilename(longString);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date('2026-02-04T14:30:25.123Z').getTime();
      const result = formatTimestamp(timestamp);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}/);
    });
  });

  describe('generateSnapshotFileName', () => {
    it('should generate valid filenames', () => {
      const fileName = generateSnapshotFileName(
        {
          testTitle: 'should login successfully',
          testTitlePath: ['Authentication', 'Login Flow'],
          specFile: 'login.cy.ts',
          timestamp: new Date('2026-02-04T14:30:25.123Z').getTime()
        },
        'html'
      );

      expect(fileName).toMatch(/\.html$/);
      expect(fileName).toContain('should-login-successfully');
      expect(fileName).not.toContain(' ');
    });

    it('should handle name collisions with index', () => {
      const fileName = generateSnapshotFileName(
        {
          testTitle: 'duplicate test',
          testTitlePath: ['Suite'],
          specFile: 'test.cy.ts',
          timestamp: Date.now(),
          index: 2
        },
        'html'
      );

      expect(fileName).toContain('_2.html');
    });

    it('should include test hierarchy in path', () => {
      const fileName = generateSnapshotFileName(
        {
          testTitle: 'test',
          testTitlePath: ['Suite 1', 'Suite 2', 'test'],
          specFile: 'test.cy.ts',
          timestamp: Date.now()
        },
        'json'
      );

      expect(fileName).toContain('Suite-1');
      expect(fileName).toContain('Suite-2');
    });
  });

  describe('generateSnapshotDirectory', () => {
    it('should generate directory from spec path', () => {
      const dir = generateSnapshotDirectory('/base/snapshots', 'e2e/login.cy.ts');
      expect(dir).toContain('snapshots');
      expect(dir).toContain('login');
    });

    it('should sanitize spec name', () => {
      const dir = generateSnapshotDirectory('/base', 'test<invalid>.cy.ts');
      expect(dir).not.toContain('<');
      expect(dir).not.toContain('>');
    });
  });
});
