import http from "node:http";
import https from "node:https";

import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

export const createAxiosInstanceForWaybackMachine = ({
  keepAlive = true,
}: {
  keepAlive?: boolean;
} = {}): AxiosInstance => {
  const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive }),
    httpsAgent: new https.Agent({ keepAlive }),
    timeout: 10_000,
  });

  axiosRetry(axiosInstance, {
    retries: 10,
    retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
    retryCondition: (error) =>
      ![200, 204, 404].includes(error.response?.status ?? 0),
    shouldResetTimeout: true,
  });

  return axiosInstance;
};
