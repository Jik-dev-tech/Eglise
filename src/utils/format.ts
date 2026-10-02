import type { Devise } from '@/types';

function formatDecimals(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue < 0 ? '-' : '';
  const absolute = Math.abs(safeValue);
  const raw = String(absolute);
  const [wholePart, fractionalPart = ''] = raw.split('.');
  const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const normalizedFraction = fractionalPart.replace(/0+$/, '');
  return `${sign}${formattedWhole}${normalizedFraction ? `.${normalizedFraction}` : ''}`;
}

export function formatCurrency(amount: number, devise: Devise = 'CDF'): string {
  return `${formatDecimals(amount)} ${devise}`;
}

export function formatDual(cdf: number, usd: number): string {
  return `${formatDecimals(cdf)} CDF | ${formatDecimals(usd)} USD`;
}

export function formatCdf(cdf: number): string {
  return `${formatDecimals(cdf)} CDF`;
}

export function formatUsd(usd: number): string {
  return `${formatDecimals(usd)} USD`;
}

export function formatNumber(amount: number): string {
  return formatDecimals(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toLocalISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toLocalISO(new Date());
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: toLocalISO(start),
    end: toLocalISO(end),
  };
}

export function getWeekRange(mondayDate: string): { start: string; end: string } {
  const [y, m, d] = mondayDate.split('-').map(Number);
  const monday = new Date(y, (m || 1) - 1, d || 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: toLocalISO(monday),
    end: toLocalISO(sunday),
  };
}

export function getQuarterRange(year: number, quarter: number): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);
  return {
    start: toLocalISO(start),
    end: toLocalISO(end),
  };
}

export function getYearRange(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
}

export function getMondayOfDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  dt.setDate(diff);
  return toLocalISO(dt);
}

export function lastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
];
