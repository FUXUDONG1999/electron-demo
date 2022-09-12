import CryptoJS from 'crypto-js';
import axios from 'axios';
import * as QueryString from 'querystring';

const SDK_VERSION = '3.0.123';

function sign(secretKey: string, signStr: string) {
  return CryptoJS.HmacSHA256(signStr, secretKey).toString(CryptoJS.enc.Base64);
}

export class ApiClient {
  private readonly secretId: string;

  private readonly secretKey: string;

  private readonly host: string;

  private readonly region: string;

  private readonly version: string;

  private readonly sdkVersion: string;

  constructor(secretId: string, secretKey: string, host: string, region: string, version: string) {
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.host = host;
    this.version = version;
    this.region = region;
    this.sdkVersion = `SDK_NODEJS${SDK_VERSION}`;
  }

  private doRequest(action: string, req: any = {}): any {
    let params = this.mergeData(req);
    params = QueryString.stringify(this.formatRequestData(action, params));
    return new Promise((resolve, reject) => {
      axios
        .post(`http://${this.host}/`, params, {
          headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        })
        .then((response) => {
          if (response.status == 200) {
            const respData = response.data.Response;
            if (respData.Error) {
              reject(respData);
            } else {
              const data = respData.Data;
              if (data.code == 0) {
                resolve(data.data);
              } else {
                reject(data);
              }
            }
          } else {
            reject(response);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private mergeData(data: any, prefix = '') {
    const ret: any = {};
    for (const k in data) {
      if (data[k] === null) {
        continue;
      }
      if (data[k] instanceof Array || data[k] instanceof Object) {
        Object.assign(ret, this.mergeData(data[k], `${prefix + k}.`));
      } else {
        ret[prefix + k] = data[k];
      }
    }
    return ret;
  }

  private formatRequestData(action: string, params: any) {
    params.Action = action;
    params.RequestClient = this.sdkVersion;
    params.Nonce = Math.round(Math.random() * 65535);
    params.Timestamp = Math.round(Date.now() / 1000);
    params.Version = this.version;
    params.Language = 'en-US';

    params.SecretId = this.secretId;
    params.Region = this.region;

    params.SignatureMethod = 'HmacSHA256';
    const signStr = this.formatSignString(params);

    params.Signature = sign(this.secretKey, signStr);
    return params;
  }

  private formatSignString(params: any) {
    let strParam = '';
    const keys = Object.keys(params);
    keys.sort();
    for (const k in keys) {
      strParam += `&${keys[k]}=${params[keys[k]]}`;
    }
    return `POST${this.host}/` + `?${strParam.slice(1)}`;
  }

  public getBusiness(source: string): any {
    return this.doRequest('GetBusiness', { Source: source });
  }

  public getProducts(): any {
    return this.doRequest('GetAllProducts');
  }
}

export const api3100 = new ApiClient(
  'AKIDvc2B3ctrYx5uPdX8RSBdngJdcJislOqJ',
  'cYKo2ybx3rPedIjsCI9oFPR2NPActsb1',
  'opbill.yunapi3.yfm18.tcepoc.fsphere.cn',
  'chongqing',
  '2018-10-25',
);
