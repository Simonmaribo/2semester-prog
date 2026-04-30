import { config } from '../config.js';

const BBR_REST_BASE = 'https://services.datafordeler.dk/BBR/BBRPublic/1/rest';

const BBR_USAGE_CODES = {
  '120': 'Parcelhus',
  '130': 'Rækkehus',
  '140': 'Etagebolig',
};

export class BbrService {
  static async getBuildingData(adgangsadresseId, adresseId) {
    try {
      const username = config.DATAFORDELER_USERNAME;
      const password = config.DATAFORDELER_PASSWORD;

      const buildings = await BbrService.restRequest('bygning', { Husnummer: adgangsadresseId }, username, password);
      const building = BbrService.pickMainBuilding(buildings);
      if (!building) {
        console.log('[BBR] Ingen bygning fundet');
        return null;
      }

      const result = {
        propertyType: BbrService.getPropertyType(building.byg021BygningensAnvendelse),
        buildYear: building.byg026Opførelsesår || null,
        livingArea: building.byg039BygningensSamledeBoligAreal || building.byg038SamletBygningsareal || null,
        rooms: null,
        bathrooms: null,
        landArea: null,
        numberOfFloors: building.byg054AntalEtager || null,
      };

      const enhed = await BbrService.fetchEnhedData(adgangsadresseId, adresseId, username, password);
      if (enhed) {
        result.rooms = enhed.rooms;
        result.bathrooms = enhed.bathrooms;
        if (enhed.area) {
          result.livingArea = enhed.area;
        }
      }

      return result;
    } catch (error) {
      console.error('[BBR] Fejl:', error);
      return null;
    }
  }

  static async fetchEnhedData(adgangsadresseId, adresseId, username, password) {
    let units = null;

    if (adresseId) {
      units = await BbrService.restRequest('enhed', { AdresseIdentificerer: adresseId }, username, password);
    }

    if (!units || units.length === 0) {
      units = await BbrService.restRequest('enhed', { Husnummer: adgangsadresseId }, username, password);
    }

    if (!units || units.length === 0) return null;

    let unit = units.find(function (u) {
      const code = String(u.enh020EnhedensAnvendelse || '');
      return code.charAt(0) === '1';
    });
    if (!unit) unit = units[0];

    return {
      rooms: unit.enh031AntalVærelser || null,
      bathrooms: unit.enh066AntalBadeværelser || null,
      area: unit.enh026EnhedensSamledeAreal || null,
    };
  }

  static pickMainBuilding(buildings) {
    if (!buildings || buildings.length === 0) return null;

    const bolig = buildings.find(function (b) {
      const code = String(b.byg021BygningensAnvendelse || '');
      return code.charAt(0) === '1';
    });

    return bolig || buildings[0];
  }

  static async restRequest(
    endpoint,
    params,
    username,
    password
  ) {
    const allParams = {
      format: 'json',
      MedDybde: 'false',
      username: username,
      password: password,
    };
    for (const key in params) {
      allParams[key] = params[key];
    }

    const qs = new URLSearchParams(allParams).toString();
    const url = `${BBR_REST_BASE}/${endpoint}?${qs}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[BBR] REST request fejlede (${endpoint}): ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) ? data : null;
  }

  static getPropertyType(code) {
    if (!code) return 'Ukendt';
    return BBR_USAGE_CODES[code] || `Anden type (kode: ${code})`;
  }
}
