import { describe, it, expect } from 'vitest';
import { elementRegistry } from '@/components/elements/ElementRegistry';

describe('Element Defaults', () => {
  it('Rectangle should have Transparent mode by default', () => {
    const rectangle = elementRegistry.createElement('rectangle');
    expect(rectangle.type).toBe('rectangle');
    expect(rectangle.mode).toBe('Transparent');
    expect(rectangle.backcolor).toBeUndefined();
  });

  it('Ellipse should have Transparent mode by default', () => {
    const ellipse = elementRegistry.createElement('ellipse');
    expect(ellipse.type).toBe('ellipse');
    expect(ellipse.mode).toBe('Transparent');
    expect(ellipse.backcolor).toBeUndefined();
  });

  it('Frame should have Transparent mode by default', () => {
    const frame = elementRegistry.createElement('frame');
    expect(frame.type).toBe('frame');
    expect(frame.mode).toBe('Transparent');
    expect(frame.backcolor).toBe('#FFFFFF'); // Frame keeps default white background but transparent mode
  });
});
