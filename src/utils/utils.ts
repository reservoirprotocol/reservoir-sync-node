import axios from 'axios';
import {
  add,
  addDays,
  endOfMonth,
  format,
  isEqual,
  isPast,
  isSameDay as _isSameDay,
  isSameMonth as _isSameMonth,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { validate } from 'node-cron';
import web3 from 'web3';
import { ApiResponse, ContractInfo, SuccessResponse, Tables } from '../types';

export const isCron = validate;
export const isAddress = web3.utils.isAddress;

/**
 * # delay
 * Delays a function's execution through a promise resolving manner.
 * @param delay - Delay time in seconds.
 * @returns - Promise<void>
 */
export const delay = (seconds: number): Promise<void> =>
  new Promise<void>((r) => setTimeout(r, seconds * 1000));

/**
 * # createQuery
 * Creates a query string based on the provided parameters.
 * @param continuation - Continuation token.
 * @param contracts - Contracts to filter.
 * @param date - Date to query data from.
 * @returns - Query string.
 */
export const createQuery = (
  continuation: string = '',
  contracts: string[] = [],
  type: Tables,
  isBackfilled: boolean,
  date?: string
) => {
  const queries: string[] = [
    'sortDirection=asc',
    'limit=1000',
    'includeCriteriaMetadata=true',
  ];

  if (type === 'sales') {
    queries.push('orderBy=updated_at');
  } else {
    queries.push(`sortBy=updatedAt`);
  }

  if (!isBackfilled && (type === 'asks' || type === 'bids')) {
    queries.push('status=active');
  }

  if (date) {
    let startTimestamp = 0;
    let endTimestamp = 0;
    const datePieces = date.split('-');
    const year = parseInt(datePieces[0]);
    const month = parseInt(datePieces[1]);

    if (datePieces[2]) {
      const day = parseInt(datePieces[2]);
      const startDate = new Date(`${year}-${month}-${day}`);
      const endDate = addDays(startDate.getTime(), 1);
      const timezoneOffset = startDate.getTimezoneOffset() * 60 * 1000;
      startTimestamp = startDate.getTime() - timezoneOffset;
      endTimestamp = endDate.getTime() - timezoneOffset;
    } else {
      const startDate = new Date(`${year}-${month}-01`);
      const timezoneOffset = startDate.getTimezoneOffset() * 60 * 1000;
      startTimestamp = startDate.getTime() - timezoneOffset;
      endTimestamp = endOfMonth(startDate).getTime() - timezoneOffset;
    }

    queries.push(`startTimestamp=${Math.floor(startTimestamp / 1000)}`);
    queries.push(`endTimestamp=${Math.floor(endTimestamp / 1000)}`);
  }

  if (continuation) {
    queries.push(`continuation=${continuation}`);
  }

  if (contracts && type !== 'asks') {
    contracts.forEach((contract) => {
      queries.push(`contract=${contract}`);
    });
  }
  return queries.join('&');
};
/**
 * # isSuccessResponse
 * Type predicate function to determine if a response is a SuccessResponse.
 * @param response - ApiResponse to be checked.
 * @returns - True if the response is a SuccessResponse, false otherwise.
 */
export const isSuccessResponse = (
  response: ApiResponse
): response is SuccessResponse => {
  return response.status === 200;
};

/**
 * # incrementDate
 * Increments the input date by the specified number of days and months.
 * @param date - The input date as a string in 'yyyy-MM-dd' format.
 * @param days - The number of days to increment the input date.
 * @param months - The number of months to increment the input date.
 * @returns - The incremented date as a string in 'yyyy-MM-dd' format.
 */
export const incrementDate = (
  date: string,
  { days = 0, months = 0 }: { days?: number; months?: number }
): string => {
  return format(add(parseISO(date), { days, months }), 'yyyy-MM-dd');
};

/**
 * # isSameDay
 * Checks if two dates are the same day.
 * @param dateOne - The first date as a string.
 * @param dateTwo - The second date as a string.
 * @returns - True if the dates are the same day, false otherwise.
 */
export const isSameDay = (dateOne: string, dateTwo: string): boolean => {
  return _isSameDay(
    parse(dateOne, `yyyy-MM-dd'T'HH:mm:ss.SSSX`, new Date()),
    parse(dateTwo, 'yyyy-MM-dd', new Date())
  );
};

/**
 * # isSameMonth
 * Checks if two dates are in the same month.
 * @param dateOne - The first date as a string.
 * @param dateTwo - The second date as a string.
 * @returns - True if the dates are in the same month, false otherwise.
 */
export const isSameMonth = (dateOne: string, dateTwo: string): boolean => {
  return _isSameMonth(
    parse(dateOne, 'yyyy-MM-dd', new Date()),
    parse(dateTwo, 'yyyy-MM-dd', new Date())
  );
};
/**
 * # isValidDate
 * Checks if a date is valid and has already happened or is currently happening, ignoring time zones.
 * @param date - The date to check, either a string in 'yyyy-MM-dd' format or a Date object.
 * @returns - True if the date is valid and has already happened or is currently happening, false otherwise.
 */
export const isValidDate = (date: Date | string): boolean => {
  const inputDate =
    typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date;

  if (!isValid(inputDate)) {
    return false;
  }

  const inputDateStartOfDay = startOfDay(inputDate);
  const nowStartOfDay = startOfDay(new Date());
  const timezoneOffset = inputDateStartOfDay.getTimezoneOffset() * 60 * 1000;
  const inputDateStartOfDayUTC = inputDateStartOfDay.getTime() - timezoneOffset;
  const nowStartOfDayUTC = nowStartOfDay.getTime() - timezoneOffset;
  return (
    isPast(inputDateStartOfDayUTC) ||
    isEqual(inputDateStartOfDayUTC, nowStartOfDayUTC)
  );
};
/**
 * # getMonth
 * @param date date string
 * @returns month of the string in human readable format
 */
export const getMonth = (date: string): string => {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'MMMM');
};

/**
 * # getYear
 * @param date date string
 * @returns year of the string in human readable format
 */
export const getYear = (date: string): string => {
  return format(parse(date, 'yyyy-MM-dd', new Date()), 'yyyy');
};

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

/**
 * # getContractInfo
 * @param contract - Contract address
 * @returns {ContractInfo} - contract info
 */
export const getContractInfo = async (
  contract: string
): Promise<ContractInfo> => {
  try {
    const res = await axios.get(
      `https://api.reservoir.tools/collections/v5?id=${contract}`
    );
    if (res.status !== 200)
      throw new Error(`Error getting contract info: ${res.status}`);
    return {
      name: res.data.collections[0].slug,
    };
  } catch (err: unknown) {
    return {
      name: contract,
    };
  }
};

/**
 * # getToday
 * Gets the current date
 * @returns {String} - todays date
 */
export const getToday = (): string => {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
};

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
