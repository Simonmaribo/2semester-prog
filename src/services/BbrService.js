import { config } from '../config.js';

const BBR_REST_BASE = 'https://services.datafordeler.dk/BBR/BBRPublic/1/rest';
const BBR_USAGE_CODES = { 
  '120': 'Parcelhus', 
  '130': 'Rækkehus', 
  '140': 'Etagebolig' 
};

export class BbrService {
  // status 6 = "gældende" i BBR, anvendelseskoder der starter med 1 = bolig
  static erGældendeBolig(item, anvField) {
    return String(item.status) === '6' && String(item[anvField] || '').charAt(0) === '1';
  }

  static async getBuildingData(adgangsadresseId, adresseId) {
    try {
      const { DATAFORDELER_USERNAME, DATAFORDELER_PASSWORD } = config;

      // Find den gældende bolig-bygning på adressen
      const buildings = await BbrService.restRequest('bygning', { Husnummer: adgangsadresseId }, DATAFORDELER_USERNAME, DATAFORDELER_PASSWORD);
      const building = buildings?.find((b) => BbrService.erGældendeBolig(b, 'byg021BygningensAnvendelse'));
      if (!building) return null;

      // Hent enheder for bygningen. Hvis vi har adresseId (specifik lejlighed),
      // filtrer på adresseIdentificerer. Ellers tager vi første gældende bolig-enhed.
      const units = await BbrService.restRequest('enhed', { Bygning: building.id_lokalId }, DATAFORDELER_USERNAME, DATAFORDELER_PASSWORD);
      const matchByAddress = adresseId && units?.find((u) => u.adresseIdentificerer === adresseId);
      const unit = matchByAddress || units?.find((u) => BbrService.erGældendeBolig(u, 'enh020EnhedensAnvendelse'));

      return {
        propertyType: BBR_USAGE_CODES[building.byg021BygningensAnvendelse] || 'Andet',
        buildYear: building.byg026Opførelsesår || null,
        livingArea: unit?.enh026EnhedensSamledeAreal || building.byg039BygningensSamledeBoligAreal || building.byg038SamletBygningsareal || null,
        rooms: unit?.enh031AntalVærelser || null,
      };
    } catch (error) {
      console.error('[BBR] Fejl:', error);
      return null;
    }
  }

  static async restRequest(endpoint, params, username, password) {
    const queryString = new URLSearchParams({ format: 'json', MedDybde: 'false', username, password, ...params }).toString();
    const response = await fetch(`${BBR_REST_BASE}/${endpoint}?${queryString}`);
    if (!response.ok) {
      const body = await response.text()
      console.error(`[BBR] ${endpoint} fejlede: ${response.status} - ${body}`);
      return null;
    }
    const data = await response.json();
    return Array.isArray(data) ? data : null;
  }
}
