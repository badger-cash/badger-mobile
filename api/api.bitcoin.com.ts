// import axios, { AxiosResponse } from "axios"

// export class Price {
//   public async current(currency: string = "usd"): Promise<number> {
//     try {
//       const response: AxiosResponse = await axios.get(
//         `https://index-api.bitcoin.com/api/v0/cash/price/${currency.toLowerCase()}`
//       )
//       return response.data.price
//     } catch (error) {
//       if (error.response && error.response.data) throw error.response.data
//       else throw error
//     }
//   }
// }

const API = `https://index-api.bitcoin.com/api`;

const priceEndpoint = `${API}/v0/cash/price/`;

const getPrice = async (currency: string = "usd"): Promise<number> => {
  try {
    const req = await fetch(`${priceEndpoint}${currency.toLowerCase()}`);
    const resp = await req.json();
    return resp.price;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

export { priceEndpoint, getPrice };
