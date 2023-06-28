import { AxiosResponse } from 'axios';
import { addMilliseconds, differenceInMilliseconds, parseISO } from 'date-fns';
import { ControllerEvent, ErrorType, SuccessType } from '../types';

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
