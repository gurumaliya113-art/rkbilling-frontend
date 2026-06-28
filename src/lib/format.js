export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );

export const inr2 = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(
    Number(n || 0),
  );

export const num = (n) => new Intl.NumberFormat('en-IN').format(Number(n || 0));

export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

export const dateOnly = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '-';

export const timeOnly = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : '-';
