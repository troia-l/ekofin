const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const EMPTY_DECLARATION_DATA = Object.freeze({
  employeeCount: 0,
  weeklyWorkHours: 0,
  extraExcuseLeave: 0,
  remoteWork: 'no',
  vehiclesCount: Object.freeze({
    electric: 0,
    hybrid: 0,
    diesel: 0,
    gasoline: 0,
  }),
  hasEmsPolicy: 'no',
  zeroWasteLevel: 'none',
  hasRenewableEnergy: false,
  annualElectricity: 0,
  annualWater: 0,
  confirmed: false,
});

export const NEW_DECLARATION_DATA = Object.freeze({
  ...EMPTY_DECLARATION_DATA,
  employeeCount: 45,
  weeklyWorkHours: 45,
  extraExcuseLeave: 5,
  remoteWork: 'partial',
  vehiclesCount: Object.freeze({
    electric: 1,
    hybrid: 1,
    diesel: 2,
    gasoline: 1,
  }),
  hasEmsPolicy: 'planning',
  zeroWasteLevel: 'basic',
  annualElectricity: 14500,
  annualWater: 420,
});

/**
 * API'den gelebilen eski veya kısmi beyan kayıtlarını UI'nin beklediği
 * güncel şekle dönüştürür. Eksik alanlara örnek veri değil, nötr değer atanır.
 */
export const normalizeDeclarationData = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const vehicles = source.vehiclesCount && typeof source.vehiclesCount === 'object'
    ? source.vehiclesCount
    : {};

  return {
    ...EMPTY_DECLARATION_DATA,
    ...source,
    employeeCount: toFiniteNumber(source.employeeCount),
    weeklyWorkHours: toFiniteNumber(source.weeklyWorkHours),
    extraExcuseLeave: toFiniteNumber(source.extraExcuseLeave),
    annualElectricity: toFiniteNumber(source.annualElectricity),
    annualWater: toFiniteNumber(source.annualWater),
    hasRenewableEnergy: source.hasRenewableEnergy === true,
    confirmed: source.confirmed === true,
    vehiclesCount: {
      electric: toFiniteNumber(vehicles.electric),
      hybrid: toFiniteNumber(vehicles.hybrid),
      diesel: toFiniteNumber(vehicles.diesel),
      gasoline: toFiniteNumber(vehicles.gasoline),
    },
  };
};
