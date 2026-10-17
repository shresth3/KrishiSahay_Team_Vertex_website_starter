export type MandiOption = {
  id: string;
  name: string;
  distanceKm: number;
  pricePerQuintal: number;
  transportCost: number;
  handlingCost: number;
  storageCost: number;
  spoilagePercent: number;
  shared?: boolean;
};

export function calculateMandi(option: MandiOption, quantityQuintals: number) {
  const grossRevenue = option.pricePerQuintal * quantityQuintals;
  const spoilageLoss = grossRevenue * (option.spoilagePercent / 100);
  const totalCosts = option.transportCost + option.handlingCost + option.storageCost + spoilageLoss;
  return {
    grossRevenue,
    spoilageLoss,
    totalCosts,
    netReturn: grossRevenue - totalCosts,
    netPerQuintal: quantityQuintals > 0 ? (grossRevenue - totalCosts) / quantityQuintals : 0
  };
}

export function inr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(value);
}
