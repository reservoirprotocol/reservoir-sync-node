import { ApiResponse, SuccessResponse } from '../types';

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
