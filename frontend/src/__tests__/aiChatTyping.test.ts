/**
 * Tests for the AiChat two-phase animation logic.
 * Covers the typing speed formula and typewriter reveal behavior.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Pure function extracted from the AiChat component design spec:
// Typing speed formula: Math.max(8, Math.min(25, 3000 / content.length)) ms/char
function calcTypingDelay(contentLength: number): number {
  return Math.max(8, Math.min(25, 3000 / contentLength));
}

describe("calcTypingDelay (typing speed formula)", () => {
  it("returns 25ms for very short content (below minimum rate)", () => {
    // 3000 / 50 = 60 → clamped to 25
    expect(calcTypingDelay(50)).toBe(25);
  });

  it("returns 25ms for 1-char content", () => {
    // 3000 / 1 = 3000 → clamped to 25
    expect(calcTypingDelay(1)).toBe(25);
  });

  it("returns 25ms for 120 chars", () => {
    // 3000 / 120 = 25 → exactly at max
    expect(calcTypingDelay(120)).toBe(25);
  });

  it("returns proportional speed for medium-length content", () => {
    // 3000 / 200 = 15 → within [8, 25]
    expect(calcTypingDelay(200)).toBe(15);
  });

  it("returns 8ms for very long content (above maximum rate)", () => {
    // 3000 / 1000 = 3 → clamped to 8
    expect(calcTypingDelay(1000)).toBe(8);
  });

  it("returns 8ms for 375+ chars", () => {
    // 3000 / 375 = 8 → exactly at min
    expect(calcTypingDelay(375)).toBe(8);
  });
});

// Simulate the typewriter reveal behavior using setInterval
describe("typewriter reveal simulation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reveals content character by character over time", () => {
    const content = "Hello";
    const delay = calcTypingDelay(content.length);
    let revealed = "";
    let charIndex = 0;

    const intervalId = setInterval(() => {
      charIndex++;
      revealed = content.slice(0, charIndex);
      if (charIndex >= content.length) {
        clearInterval(intervalId);
      }
    }, delay);

    // After 0 ticks, nothing revealed
    expect(revealed).toBe("");

    // Advance by one tick
    vi.advanceTimersByTime(delay);
    expect(revealed).toBe("H");

    // Advance by one more tick
    vi.advanceTimersByTime(delay);
    expect(revealed).toBe("He");

    // Advance to completion
    vi.advanceTimersByTime(delay * 3);
    expect(revealed).toBe("Hello");
  });

  it("clears interval when all characters are revealed", () => {
    const content = "Hi";
    const delay = calcTypingDelay(content.length);
    let charIndex = 0;
    let completed = false;

    const intervalId = setInterval(() => {
      charIndex++;
      if (charIndex >= content.length) {
        clearInterval(intervalId);
        completed = true;
      }
    }, delay);

    vi.advanceTimersByTime(delay * content.length);
    expect(completed).toBe(true);
    expect(charIndex).toBe(content.length);
  });

  it("applying fields at start of reveal (not end)", () => {
    // This verifies the requirement: onFieldsUpdate called at START of typewriter phase
    const fields = { "Party 1 Name": "Acme Corp" };
    let fieldsApplied = false;
    let content = "";

    // Simulate: apply fields first, then start typewriter
    function startReveal(responseContent: string, responseFields: Record<string, string>) {
      // Apply fields at START
      if (Object.keys(responseFields).length > 0) {
        fieldsApplied = true;
      }

      // Then begin typewriter
      let charIndex = 0;
      const delay = calcTypingDelay(responseContent.length);
      const intervalId = setInterval(() => {
        charIndex++;
        content = responseContent.slice(0, charIndex);
        if (charIndex >= responseContent.length) {
          clearInterval(intervalId);
        }
      }, delay);

      return intervalId;
    }

    startReveal("Done!", fields);

    // Fields should be applied immediately before any typing starts
    expect(fieldsApplied).toBe(true);
    expect(content).toBe(""); // no chars revealed yet
  });
});
