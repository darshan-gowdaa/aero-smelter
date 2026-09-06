import rawData from "./data.json";
import { AsgDataset } from "./types";

export const asgData = rawData as unknown as AsgDataset;

// Useful derived calculations
export const totalRevenue = asgData.fact_payments.reduce((acc, p) => acc + (p.amount || 0), 0);
export const totalTransactions = asgData.fact_payments.length;
export const avgTransactionAmount = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

export const confirmedBookingsCount = asgData.fact_bookings.filter((b) => b.is_confirmed === 1).length;
export const cancelledBookingsCount = asgData.fact_bookings.filter((b) => b.is_cancelled === 1).length;
export const pendingBookingsCount = asgData.fact_bookings.filter((b) => b.is_pending === 1).length;
export const cancellationRate = asgData.fact_bookings.length > 0 
  ? (cancelledBookingsCount / asgData.fact_bookings.length) * 100 
  : 0;

export const imputedPaymentCount = asgData.fact_payments.filter((p) => p.is_amount_imputed === 1).length;
export const imputedStatusCount = asgData.fact_bookings.filter((b) => b.is_status_imputed === 1).length;
