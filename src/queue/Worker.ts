import axios, { AxiosRequestConfig } from 'axios';
import EventEmitter from 'events';
import { InsertionService } from '../services/';
import { ApiResponse, Schemas } from '../types';
import { isSuccessResponse } from '../utils';

export class Worker extends EventEmitter {
  /**
   * Univeral Unique Identifier to use in order to identify itself with the main process
   * @type {string}
   * @access private
   */
  private _uuid: string;

  /**
   * Processing flag for status of worker
   * @type {boolean}
   * @access private
   */
  private _processing: boolean;

  private _dataset: 'sales' | 'orders';

  private _root: 'sales' | 'asks';

  constructor(uuid: string) {
    super();
    this._uuid = uuid;
  }

  /**
   * # _process
   * Processes a block given a configuration
   */
  public async _process(): Promise<void> {
    while (this._processing) {
      const res = await this._request({
        headers: {},
      });
      if (!isSuccessResponse(res)) continue;

      this._insert(res.data[this._dataset]);
      
    }
  }

  /**
   * Executes a request using axios
   * @param config - AxiosRequestConfig
   * @returns AxiosResponse | undefined
   */
  private async _request(config: AxiosRequestConfig): Promise<ApiResponse> {
    const { data, status } = await axios.request({
      ...config,
      validateStatus: (status: number): boolean => {
        return Boolean(status);
      },
    });
    return {
      data,
      status,
    };
  }
  private _insert(data: Schemas): void {
    InsertionService.upsert(this._root, data);
  }
  private _split(): void {}

  private _release(): void {}

  private _format(): void {}
}
