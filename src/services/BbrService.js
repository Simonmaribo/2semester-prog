const { config } = require('../config.js');

const BBR_USAGE_CODES = {
  '120': 'Parcelhus',
  '130': 'Rækkehus',
  '140': 'Etagebolig'
};

class BbrService {
  // status 6 = "gældende" i BBR, anvendelseskode der starter med 1 = bolig
  static erGældendeBolig(item, anvField) {
    return String(item.status) === '6' && String(item[anvField] || '').charAt(0) === '1';
  }

  static async getBuildingData(adgangsadresseId, adresseId) {
    try {
      const { DATAFORDELER_USERNAME, DATAFORDELER_PASSWORD } = config;

      // find bygning på adressen, filtreret på anvendelseskode (bolig)
      const bygningParams = new URLSearchParams({
        format: 'json',
        MedDybde: 'false',
        username: DATAFORDELER_USERNAME,
        password: DATAFORDELER_PASSWORD,
        Husnummer: adgangsadresseId,
      });
      const bygningRes = await fetch(`https://services.datafordeler.dk/BBR/BBRPublic/1/rest/bygning?${bygningParams}`);
      if (!bygningRes.ok) {
        console.error('bbr bygning fejl', bygningRes.status);
        return null;
      }
      const buildings = await bygningRes.json();
      const building = buildings?.find((b) => BbrService.erGældendeBolig(b, 'byg021BygningensAnvendelse'));
      if (!building) return null;

      // find enheder (lejligheder) i bygningen - relevant ved etageboliger
      const enhedUrl = `https://services.datafordeler.dk/BBR/BBRPublic/1/rest/enhed?format=json&MedDybde=false&username=${DATAFORDELER_USERNAME}&password=${DATAFORDELER_PASSWORD}&Bygning=${building.id_lokalId}`;
      const enhedRes = await fetch(enhedUrl);
      if (!enhedRes.ok) {
        console.error('bbr enhed fejl', enhedRes.status);
        return null;
      }
      const units = await enhedRes.json();

      let unit = null;
      if (adresseId) {
        unit = units.find((u) => u.adresseIdentificerer === adresseId);
      }
      if (!unit) {
        unit = units.find((u) => BbrService.erGældendeBolig(u, 'enh020EnhedensAnvendelse'));
      }

      return {
        propertyType: BBR_USAGE_CODES[building.byg021BygningensAnvendelse] || 'Andet', // anvendelseskode (120=parcel, 130=rækkehus, 140=etage)
        buildYear: building.byg026Opførelsesår || null, // opførelsesår
        livingArea: unit.enh026EnhedensSamledeAreal || building.byg039BygningensSamledeBoligAreal || null, // enhedens areal ellers bygningens samlede boligareal
        rooms: unit.enh031AntalVærelser || null,  // antal værelser i enheden
      };
    } catch (error) {
      console.error('bbr fejl:', error);
      return null;
    }
  }
}

module.exports = { BbrService };
