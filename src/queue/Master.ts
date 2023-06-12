import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import EventEmitter from 'events';
import { DataTypes } from '../types';
class MasterError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, MasterError.prototype);
  }
  printStack() {
    console.log(this.stack);
  }
}

interface DateRange {
  start: string;
  end: string;
}

interface MasterConfig {
  axios: AxiosInstance;
  mode: 'default' | 'supersayanmode'; // Naming convention!?
  dataType: DataTypes;
  contract: string;
  uuid: string;
}

const Paths = {
  sales: '/sales/v4',
  asks: '/orders/asks/v4',
} as const;

// Master contains the queue
// Queue is also handled inherew
// Workers are created and then listen to the master using the event emitter

/**
 * Flow
 *
 * 1. SyncNode launches services
 * 2. MasterService is created with higher level stuff such as apiKey, chain, base, etc
 * 3. MasterService then creates worker pools using the Worker class, it creates a group of 10 20 30 (based on mode) (how does the filtering work?) (so 10 workers for 10k contracts?? Thats why we should ONLY filter on the client. Because we ofc cant create that many workers)
 * so if thats the case then it makes most sense to filter on the client. Really the only way to do that would be to make 
 * 4.
 *
 *
 *
 */

class _Master extends EventEmitter {
  // In here we create the worker groups and then we assign then an ID

  constructor(private readonly config: MasterConfig) {
    super();
  }

  private async _request(request: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      return await this.config.axios.request({});
    } catch (e: unknown) {
      throw new Error(e instanceof Error ? e.message : `Unknown Error: ${e}`);
    }
  }
  /**
   * Determines the range of the dataset
   * @access private
   * @returns DataRange
   */
  private async _determineRange(): Promise<DateRange> {
    try {
      const [reqOne, reqTwo] = await Promise.allSettled([
        this._request({
          method: 'get',
          url: '',
          params: this._normalizeParameters({
            startTimestamp: '',
            endTimestamp: '',
            contract: this.config.contract,
            sortBy: 'asc',
          }),
          // What we need to set here is the path and the query parameters
        }),
        this._request({
          method: 'get',
          url: '',
          params: this._normalizeParameters({
            startTimestamp: '',
            endTimestamp: '',
            contract: '',
            sortBy: 'desc',
          }),
          // What we need to set here is the path and the query parameters
        }),
      ]);

      if (reqOne.status === 'rejected' || reqTwo.status === 'rejected')
        throw new Error(`DETERMINE RANGE FAILED`);

      return {
        start: '',
        end: '',
      };
    } catch (e: unknown) {
      throw new Error(e instanceof Error ? e.message : `Unknown Error: ${e}`);
    }
  }
  private async _normalizeParameters(
    params: Record<string | number, unknown>
  ): Promise<Record<string | number, unknown>> {
    if (this.config.dataType === 'sales') {
      return {};
    }
    if (this.config.dataType === 'asks') {
      return {};
    }
    return params;
  }
}

export const Master = new _Master({
  axios: axios.create({
    baseURL: '',
    headers: {
      Authorization: ``,
    },
    timeout: 5000,
  }),
  contract: '',
  dataType: 'sales',
  mode: 'default',
  uuid: `0xr`,
});
