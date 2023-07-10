import { AxiosResponse } from 'axios';
import {
  addMilliseconds,
  differenceInMilliseconds,
  format,
  parseISO,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

import { ControllerEvent, ErrorType, Schemas, SuccessType } from '../types';
/**
 * # isTodayUTC
 * @param dateString - Date string
 * @returns Boolean
 */
export const isTodayUTC = (dateString: string) => {
  if (!dateString) return false;
  return (
    format(utcToZonedTime(new Date(dateString), 'Etc/UTC'), 'yyyy-MM-dd') ===
    format(utcToZonedTime(new Date(), 'Etc/UTC'), 'yyyy-MM-dd')
  );
};
/**
 * # isSuccessResponse
 * Type predicate function to determine if a response is a SuccessResponse.
 * @param response - ApiResponse to be checked.
 * @returns - True if the response is a SuccessResponse, false otherwise.
 */
export const isSuccessResponse = (
  r: AxiosResponse<SuccessType | ErrorType>
): r is AxiosResponse<SuccessType> => {
  return r.status === 200;
};

export const isQueueEvent = (e: ControllerEvent): e is ControllerEvent => {
  return e.type === 'queue';
};

/**
 * # isErrorResponse
 * Type predicate function to determine if a response is a SuccessResponse.
 * @param response - ApiResponse to be checked.
 * @returns - True if the response is a SuccessResponse, false otherwise.
 */
export const isErrorResponse = (
  r: AxiosResponse<SuccessType | ErrorType>
): r is AxiosResponse<SuccessType> => {
  return r.status !== 200;
};

export function parseTimestamp(date: string): number {
  const datePieces = date.split('T')[0].split('-').map(Number);
  const [year, month, day] = datePieces;

  const startDate = new Date(year, month - 1, day);

  const timezoneOffset = startDate.getTimezoneOffset() * 60 * 1000;
  const startTimestamp = (startDate.getTime() - timezoneOffset) / 1000;

  return startTimestamp;
}
// api.reservoir.tools/sales/v5?orderBy=updated_at&sortDirection=asc&startTimestamp=1538352000&endTimestamp=1688083200
// https: //api.reservoir.tools/sales/v5?limit=1000&includeCriteriaMetadata=true&orderBy=updated_at&startTimestamp=1538377174800&endTimestamp=1688108374800

/**
 * Calculates the middle point between two dates.
 *
 * @param {string} date1 - The first date as an ISO 8601 string (e.g., '2023-06-20T16:50:43.483Z').
 * @param {string} date2 - The second date as an ISO 8601 string.
 * @return {string} The middle date as an ISO 8601 string.
 */
export function getMiddleDate(date1: string, date2: string): string {
  const parsedDate1 = parseISO(date1);
  const parsedDate2 = parseISO(date2);

  const diff = differenceInMilliseconds(parsedDate2, parsedDate1);

  const middleDate = addMilliseconds(parsedDate1, diff / 2);

  return middleDate.toISOString();
}

/**
 * Determines the density of the data based on the 'updated_at' date of the first and last record.
 * The data is considered high density if the time difference between the first and last record is less than the provided threshold.
 *
 * @param {Object[]} data - The array of data objects to check.
 * @param {number} threshold - The maximum time difference in milliseconds to be considered as high-density data.
 * @returns {boolean} Returns true if the data is high density, false otherwise.
 */
export function isHighDensityBlock(data: Schemas, threshold: number) {
  const dateOne = new Date(data[0].updatedAt).getTime();
  const dateTwo = new Date(data[data.length - 1].updatedAt).getTime();

  return Math.abs(dateOne - dateTwo) > threshold;
}

/**
 * Delays
 * @param ms Delay time
 * @returns A void promise
 */
export const delay = async (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));
/**
 * # toBuffer
 * @param hexValue - Hex value to slice
 * @returns Formatted buffer of a Hex
 */
export const toBuffer = (hexValue: string) => {
  return Buffer.from(hexValue, 'hex');
};

/**
 * # toBuffer
 * @param hexValue - Hex value to slice
 * @returns Formatted buffer of a Hex
 */
export const addressToBuffer = (hexValue: string = '') => {
  return Buffer.from((hexValue || '').slice(2), 'hex');
};

export const UrlBase = {
  mainnet: 'https://api.reservoir.tools',
  goerli: 'https://api-goerli.reservoir.tools',
} as const;

export const UrlPaths = {
  sales: '/sales/v4',
  asks: '/orders/asks/v4',
  bids: '/orders/bids/v5',
} as const;

export const RecordRoots = {
  asks: 'orders',
  sales: 'sales',
  bids: 'orders',
} as const;
