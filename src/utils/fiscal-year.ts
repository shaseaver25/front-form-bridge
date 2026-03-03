import { addMonths, differenceInMonths, format, startOfMonth, getMonth, getYear, isBefore, isAfter, isSameDay } from 'date-fns';

export interface FiscalYear { start: Date; end: Date; label: string; }
export interface FiscalYearInfo { fiscalYear: FiscalYear; currentQuarter: number; monthsRemaining: number; monthsElapsed: number; }

export const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const;
export const COMMON_FISCAL_STARTS = [
  { month: 1, label: 'January (Calendar Year)', description: 'Jan 1 - Dec 31' },
  { month: 7, label: 'July (Common for Schools)', description: 'Jul 1 - Jun 30' },
  { month: 10, label: 'October (Federal Fiscal Year)', description: 'Oct 1 - Sep 30' },
] as const;

export function getFiscalYearStart(date: Date, fiscalStartMonth: number): Date {
  const dateMonth = getMonth(date) + 1;
  const dateYear = getYear(date);
  if (dateMonth < fiscalStartMonth) return new Date(dateYear - 1, fiscalStartMonth - 1, 1);
  return new Date(dateYear, fiscalStartMonth - 1, 1);
}

export function getFiscalYearEnd(date: Date, fiscalStartMonth: number): Date {
  const fyStart = getFiscalYearStart(date, fiscalStartMonth);
  const nextFYStart = addMonths(fyStart, 12);
  return new Date(nextFYStart.getTime() - 1);
}

export function getCurrentFiscalYear(fiscalStartMonth: number): FiscalYear {
  const today = new Date();
  return { start: getFiscalYearStart(today, fiscalStartMonth), end: getFiscalYearEnd(today, fiscalStartMonth), label: getFiscalYearLabel(today, fiscalStartMonth) };
}

export function getFiscalYearLabel(date: Date, fiscalStartMonth: number): string {
  return `FY${getYear(getFiscalYearEnd(date, fiscalStartMonth))}`;
}

export function getFiscalQuarter(date: Date, fiscalStartMonth: number): number {
  const fyStart = getFiscalYearStart(date, fiscalStartMonth);
  return Math.floor(differenceInMonths(startOfMonth(date), fyStart) / 3) + 1;
}

export function getFiscalQuarterLabel(date: Date, fiscalStartMonth: number): string {
  return `Q${getFiscalQuarter(date, fiscalStartMonth)} ${getFiscalYearLabel(date, fiscalStartMonth)}`;
}

export function getMonthsRemainingInFiscalYear(fiscalStartMonth: number): number {
  const today = new Date();
  return Math.max(1, differenceInMonths(getFiscalYearEnd(today, fiscalStartMonth), startOfMonth(today)) + 1);
}

export function getMonthsElapsedInFiscalYear(fiscalStartMonth: number): number {
  const today = new Date();
  return differenceInMonths(startOfMonth(today), getFiscalYearStart(today, fiscalStartMonth));
}

export function getFiscalYearInfo(fiscalStartMonth: number): FiscalYearInfo {
  const today = new Date();
  return {
    fiscalYear: { start: getFiscalYearStart(today, fiscalStartMonth), end: getFiscalYearEnd(today, fiscalStartMonth), label: getFiscalYearLabel(today, fiscalStartMonth) },
    currentQuarter: getFiscalQuarter(today, fiscalStartMonth),
    monthsRemaining: getMonthsRemainingInFiscalYear(fiscalStartMonth),
    monthsElapsed: getMonthsElapsedInFiscalYear(fiscalStartMonth),
  };
}

export function getFiscalYearOptions(fiscalStartMonth: number, yearsBack: number = 2, yearsForward: number = 1) {
  const currentFY = getCurrentFiscalYear(fiscalStartMonth);
  const currentFYStartYear = getYear(currentFY.start);
  const options: Array<{ value: string; label: string; startDate: string; endDate: string }> = [];
  for (let offset = -yearsBack; offset <= yearsForward; offset++) {
    const fyStartYear = currentFYStartYear + offset;
    const fyStart = new Date(fyStartYear, fiscalStartMonth - 1, 1);
    const fyEnd = new Date(fyStartYear + 1, fiscalStartMonth - 1, 0);
    const label = fiscalStartMonth === 1 ? `FY ${fyStartYear}` : `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
    options.push({ value: fyStartYear.toString(), label, startDate: format(fyStart, 'yyyy-MM-dd'), endDate: format(fyEnd, 'yyyy-MM-dd') });
  }
  return options;
}

export function getFiscalYearDateRange(fiscalStartMonth: number): string {
  const fy = getCurrentFiscalYear(fiscalStartMonth);
  return `${format(fy.start, 'MMM d')} - ${format(fy.end, 'MMM d')}`;
}

export function getFullFiscalYearRange(date: Date, fiscalStartMonth: number): string {
  return `${format(getFiscalYearStart(date, fiscalStartMonth), 'MMMM d, yyyy')} - ${format(getFiscalYearEnd(date, fiscalStartMonth), 'MMMM d, yyyy')}`;
}

export function isInCurrentFiscalYear(date: Date, fiscalStartMonth: number): boolean {
  const fy = getCurrentFiscalYear(fiscalStartMonth);
  return (isAfter(date, fy.start) || isSameDay(date, fy.start)) && (isBefore(date, fy.end) || isSameDay(date, fy.end));
}

export function getDefaultFiscalYearValue(fiscalStartMonth: number): string {
  return getYear(getCurrentFiscalYear(fiscalStartMonth).start).toString();
}