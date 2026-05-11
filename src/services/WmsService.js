// Udarbejdet i samspil med AI (Claude).
//
// Koordinat-problemet:
//   DAWA giver adressens position i GPS-koordinater
//     (længdegrad/breddegrad, standard EPSG:4326 / WGS84).
//   Datafordelerens WMS forventer koordinater i det danske kortsystem
//     (UTM zone 32 Nord, EPSG:25832 - meter-baserede x/y-koordinater).
//
// Derfor konverterer vi koordinaterne med proj4-biblioteket,
// før vi bygger WMS-URL'en.
const proj4 = require('proj4');
const { config } = require('../config.js');

// Definer EPSG:25832 (dansk UTM zone 32N, GRS80-ellipsoide, meter som enhed)
// så proj4 ved hvordan det skal konvertere fra GPS (EPSG:4326) til dansk UTM.
// EPSG:4326 kender proj4 i forvejen.
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs');

class WmsService {
  // Bygger URL'en til et luftfoto centreret om (lat, lng).
  static getAerialPhotoUrl(lat, lng) {
    const token = config.DATAFORSYNINGEN_TOKEN;
    if (!token) return '';

    // Konverter GPS (lng, lat) -> UTM (easting, northing).
    // proj4 forventer rækkefølgen [længdegrad, breddegrad].
    const [easting, northing] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat]);

    // bbox = 400m x 400m område rundt om punktet (minX, minY, maxX, maxY).
    const bbox = [
      Math.round(easting - 200),
      Math.round(northing - 200),
      Math.round(easting + 200),
      Math.round(northing + 200),
    ].join(',');

    const params = new URLSearchParams({
      apikey: token,
      service: 'WMS',
      version: '1.1.1',
      request: 'GetMap',
      layers: 'orto_foraar',
      styles: 'default',
      srs: 'EPSG:25832',
      bbox: bbox,
      width: '600',
      height: '600',
      format: 'image/jpeg',
    });

    return `https://wms.datafordeler.dk/GeoDanmarkOrto/orto_foraar/1.0.0/WMS?${params.toString()}`;
  }
}

module.exports = { WmsService };
