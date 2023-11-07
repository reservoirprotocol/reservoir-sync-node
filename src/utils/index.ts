import { AxiosResponse } from "axios";
import {
  addMilliseconds,
  differenceInMilliseconds,
  format,
  parseISO,
} from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import fs from "fs";
import path from "path";
import { isAddress } from "web3-validator";
import { LoggerService } from "../services";

import {
  Chains,
  ControllerEvent,
  DataTypes,
  ErrorType,
  Schemas,
  SuccessType,
} from "../types";
/**
 * # isTodayUTC
 * @param dateString - Date string
 * @returns Boolean
 */
export const isTodayUTC = (dateString: string) => {
  if (!dateString) return false;
  return (
    format(utcToZonedTime(new Date(dateString), "Etc/UTC"), "yyyy-MM-dd") ===
    format(utcToZonedTime(new Date(), "Etc/UTC"), "yyyy-MM-dd")
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
  return e.type === "queue";
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

export function parseTimestamp(date: string, isEndTime: boolean): number {
  const datePieces = date.split("T");
  const [year, month, day] = datePieces[0].split("-").map(Number);

  const timePieces = datePieces[1].substring(0, 8).split(":").map(Number);
  const [hour, minute, second] = timePieces;

  const timeAdjustment = isEndTime ? 5000 : -5000;

  const startDate = new Date(year, month - 1, day, hour, minute, second);

  const timezoneOffset = startDate.getTimezoneOffset() * 60 * 1000;
  
  return (startDate.getTime() - timezoneOffset + timeAdjustment) / 1000;
}

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
export const toBuffer = (hexValue: string = "") => {
  if (!hexValue) return null;
  return Buffer.from(hexValue || " ", "hex");
};

export const toString = (value: number = 0): string | null => {
  if (!value) return null;
  return value.toString();
};

/**
 * # toBuffer
 * @param hexValue - Hex value to slice
 * @returns Formatted buffer of a Hex
 */
export const addressToBuffer = (hexValue: string = "") => {
  if (!hexValue) return null;
  return Buffer.from((hexValue || " ").slice(2), "hex");
};

export const readContracts = (): Record<DataTypes, string[]> => {
  const hashMap: Record<DataTypes, string[]> = {
    sales: [],
    asks: [],
    bids: [],
    transfers: [],
  };
  try {
    fs.readFileSync(path.join(__dirname, "../contracts.txt"), "utf-8")
      .trim()
      .split("\n")
      .forEach((line) => {
        const [contract = "", key = ""] = line.split(":");
        if (!isAddress(contract)) return;

        if (!key) {
          Object.keys(hashMap).forEach((key) => {
            if (!hashMap[key as DataTypes].includes(contract)) {
              hashMap[key as DataTypes].push(contract);
            }
          });
        } else {
          hashMap[key as DataTypes].push(contract);
        }
      });

    return hashMap;
  } catch (e: unknown) {
    LoggerService.error(e);
    return hashMap;
  }
};

export const splitArray = <T>(arr: T[], parts: number): T[][] => {
  const len = arr.length;
  const out: T[][] = Array(parts).fill([]);
  const quotient = Math.floor(len / parts);
  const remainder = len % parts;

  let start = 0;
  for (let i = 0; i < parts; i++) {
    const partSize = quotient + (i < remainder ? 1 : 0);
    out[i] = arr.slice(start, start + partSize);
    start += partSize;
  }

  return out;
};

const chains: Record<Chains, number> = {
  arbitrum: 42161,
  mainnet: 1,
  goerli: 5,
  polygon: 137,
  mumbai: 80001,
  optimism: 10,
  sepolia: 11155111,
};

export const getChainId = (): string => {
  const chainName = process.env.CHAIN as Chains;

  return chains[chainName].toString();
};

export const END_OF_TIME = 253402300799;

export const UrlBase = {
  mainnet: "https://api.reservoir.tools",
  goerli: "https://api-goerli.reservoir.tools",
  sepolia: "https://api-sepolia.reservoir.tools",
  polygon: "https://api-polygon.reservoir.tools",
  mumbai: "https://api-mumbai.reservoir.tools",
  arbitrum: "https://api-arbitrum.reservoir.tools",
  optimism: "https://api-optimism.reservoir.tools",
} as const;

export const UrlPaths = {
  sales: "/sales/v6",
  asks: "/orders/asks/v5",
  bids: "/orders/bids/v6",
  transfers: "/transfers/bulk/v2",
} as const;

export const RecordRoots = {
  asks: "orders",
  sales: "sales",
  bids: "orders",
  transfers: "transfers",
} as const;

export const WorkerCounts = {
  fast: 20,
  normal: 15,
  slow: 10,
} as const;
