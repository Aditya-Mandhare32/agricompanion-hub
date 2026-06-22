import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { CalendarDayContent } from '@/components/calendar/CalendarDayContent';
import type { CropEvent } from '@/lib/types';

const SUPPORTED: CropEvent['eventType'][] = ['sowing', 'fertilizing', 'irrigation', 'harvest'];

describe('CalendarDayContent icon mapping', () => {
  it('renders without crashing for every supported event type', () => {
    for (const type of SUPPORTED) {
      const event: CropEvent = {
        id: type, cropName: 'Test', eventType: type, date: new Date(),
        completed: false,
      };
      const { container } = render(<CalendarDayContent date={new Date()} events={[event]} />);
      expect(container.querySelector('svg')).toBeTruthy();
    }
  });

  it('gracefully handles an unknown event type without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const event = {
      id: 'x', cropName: 'Mystery', eventType: 'mystery-activity' as any,
      date: new Date(), completed: false,
    } as CropEvent;
    expect(() => render(<CalendarDayContent date={new Date()} events={[event]} />)).not.toThrow();
    warn.mockRestore();
  });

  it('shows just the date when no events are provided', () => {
    const date = new Date('2026-06-15');
    const { getByText } = render(<CalendarDayContent date={date} events={[]} />);
    expect(getByText('15')).toBeTruthy();
  });
});
