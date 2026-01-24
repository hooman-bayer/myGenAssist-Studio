import { describe, it, expect } from 'vitest';
import { formatWelcomeName } from '@/lib/formatName';

describe('formatWelcomeName', () => {
  it('returns empty string for empty input', () => {
    expect(formatWelcomeName("")).toBe("");
  });

  it('formats gmail with dots: john.doe@gmail.com -> "John Doe"', () => {
    expect(formatWelcomeName("john.doe@gmail.com")).toBe("John Doe");
  });

  it('formats gmail with underscores: john_doe@gmail.com -> "John Doe"', () => {
    expect(formatWelcomeName("john_doe@gmail.com")).toBe("John Doe");
  });

  it('formats gmail with hyphens: john-doe@gmail.com -> "John Doe"', () => {
    expect(formatWelcomeName("john-doe@gmail.com")).toBe("John Doe");
  });

  it('formats gmail with mixed separators: john.doe_smith@gmail.com -> "John Doe Smith"', () => {
    expect(formatWelcomeName("john.doe_smith@gmail.com")).toBe("John Doe Smith");
  });

  it('handles uppercase gmail: JOHN.DOE@GMAIL.COM -> "John Doe"', () => {
    expect(formatWelcomeName("JOHN.DOE@GMAIL.COM")).toBe("John Doe");
  });

  it('returns non-gmail email as-is: john.doe@bayer.com', () => {
    expect(formatWelcomeName("john.doe@bayer.com")).toBe("john.doe@bayer.com");
  });

  it('returns name without @ as-is: johndoe', () => {
    expect(formatWelcomeName("johndoe")).toBe("johndoe");
  });

  it('handles single character local part: j@gmail.com -> "J"', () => {
    expect(formatWelcomeName("j@gmail.com")).toBe("J");
  });

  it('handles numbers in name: john123@gmail.com -> "John123"', () => {
    expect(formatWelcomeName("john123@gmail.com")).toBe("John123");
  });
});
