import { calendarSchema, type Calendar } from '../domain/schema';
export function seasonOf(month: number): string {
  calendarSchema.shape.month.parse(month);
  return ['Xuân', 'Hạ', 'Thu', 'Đông'][Math.floor((month - 1) / 3)]!;
}
// Calendar primitive only. Monthly simulation is Phase 3, not a dummy tick.
export function nextMonth(date: Calendar): Calendar {
  calendarSchema.parse(date);
  return date.month === 12 ? { year: date.year + 1, month: 1 } : { ...date, month: date.month + 1 };
}
