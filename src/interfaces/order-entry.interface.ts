export interface OrderEntry {
  price: number;
  size: number;
  type: 'bid' | 'ask';
  level: number;
}