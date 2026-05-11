class DawaService {
  static async autocomplete(query) {
    const response = await fetch(`https://api.dataforsyningen.dk/autocomplete?q=${encodeURIComponent(query)}&type=adresse&caretpos=${query.length}`);
    if (!response.ok) {
      throw new Error(`DAWA autocomplete fejlede: ${response.status}`);
    }

    return await response.json()
  }
}

module.exports = { DawaService };
