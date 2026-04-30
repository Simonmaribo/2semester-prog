const DAWA_BASE_URL = 'https://api.dataforsyningen.dk';

export class DawaService {
  static async autocomplete(query) {
    const url = `${DAWA_BASE_URL}/autocomplete?q=${encodeURIComponent(query)}&type=adgangsadresse&caretpos=${query.length}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DAWA autocomplete fejlede: ${response.status}`);
    }

    return await response.json()
  }
}
