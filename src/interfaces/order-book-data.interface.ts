import { OrderEntry } from "./order-entry.interface";

export interface OrderBookData {
  time: string;
  orders: OrderEntry[];
}