import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getHeaders } from "./headers.js";
import { getProxy } from "./proxyPool.js";
import { logSuccess, logFailure } from "./analytics.js";

class ScraperEngine {
  constructor(options = {}) {
    this.timeout = options.timeout || 15000;
    this.retries = options.retries || 3;
  }

  async request(url, config = {}) {
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const proxy = getProxy();
        const agent = proxy ? new HttpsProxyAgent(proxy) : null;

        const response = await axios({
          url,
          method: config.method || "GET",
          data: config.data || null,
          timeout: this.timeout,
          headers: getHeaders(config.cookie),
          httpsAgent: agent,
          httpAgent: agent,
          validateStatus: () => true
        });

        if (response.status >= 200 && response.status < 400) {
          logSuccess();
          return response;
        }

        throw new Error(`Bad status ${response.status}`);
      } catch (err) {
        if (attempt === this.retries) {
          logFailure();
          throw err;
        }
      }
    }
  }
}

export default new ScraperEngine({
  timeout: 20000,
  retries: 3
});
