
import { Category, Transaction, PaymentMethod } from './types.ts';

export interface ParsedSMS {
  amount: number;
  title: string;
  isExpense: boolean;
}

/**
 * Patterns for common Indian bank/UPI SMS formats
 * Examples:
 * - "Debited: INR 500.00 from A/c XX1234 on 22-10-23 to VPA merchant@upi (Ref 328...)"
 * - "Dear Customer, your A/c XX5678 is debited for Rs 120.00 on 21-10-23 at ZOMATO. UPI Ref 329..."
 */
export const parseSMS = (text: string): ParsedSMS | null => {
  try {
    const amountRegex = /(?:Rs|INR|Rs\.|INR\.)\s?([0-9,]+(?:\.[0-9]{2})?)/i;
    const amountMatch = text.match(amountRegex);
    if (!amountMatch) return null;

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Extract merchant/title
    // Looks for "to VPA X", "at X", "to X"
    const merchantRegex = /(?:to|at|towards)\s+([A-Z0-9\s@.]+)(?:\s+Ref|on|at|VPA|from)/i;
    const merchantMatch = text.match(merchantRegex);
    let title = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';
    
    // Clean up title (remove trailing dots or common filler words)
    title = title.split(' ')[0] + (title.split(' ')[1] ? ' ' + title.split(' ')[1] : '');

    const isExpense = text.toLowerCase().includes('debit') || text.toLowerCase().includes('spent') || text.toLowerCase().includes('paid');

    return {
      amount,
      title,
      isExpense
    };
  } catch (e) {
    console.error('Failed to parse SMS', e);
    return null;
  }
};

// Simulated fetch for demonstration since web apps have restricted SMS access
export const getSimulatedSMS = () => {
  const samples = [
    "HDFC Bank: Rs 450.00 debited from A/c XX1234 on 25-Oct-23 to VPA swiggy@upi. Ref 329123.",
    "SBI: Your A/c XX9900 is debited for INR 1250.00 at AMAZON on 26-10-23. UPI Ref 99211.",
    "Dear Customer, your A/c XX4411 is debited for Rs 55.00 at Starbucks. Ref 88211."
  ];
  return samples[Math.floor(Math.random() * samples.length)];
};
