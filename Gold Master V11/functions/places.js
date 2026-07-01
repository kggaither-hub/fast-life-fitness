exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing GOOGLE_MAPS_API_KEY in Netlify environment variables.' })
    };
  }

  try {
    const params = event.httpMethod === 'POST'
      ? JSON.parse(event.body || '{}')
      : Object.fromEntries(new URLSearchParams(event.rawQuery || ''));

    const action = params.action || 'textSearch';

    if (action === 'geocode') {
      const address = params.address;
      if (!address) throw new Error('Missing address');
      const url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address) + '&key=' + encodeURIComponent(apiKey);
      const response = await fetch(url);
      const data = await response.json();
      return { statusCode: response.status, headers, body: JSON.stringify(data) };
    }

    if (action === 'nearbySearch') {
      const lat = Number(params.lat);
      const lng = Number(params.lng);
      const radius = Number(params.radius || 5000);
      const query = params.query || 'restaurant';
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Missing valid lat/lng');

      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.googleMapsUri,places.types'
        },
        body: JSON.stringify({
          includedTypes: [query],
          maxResultCount: Number(params.maxResultCount || 10),
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius
            }
          }
        })
      });
      const data = await response.json();
      return { statusCode: response.status, headers, body: JSON.stringify(data) };
    }

    const textQuery = params.query || params.q;
    if (!textQuery) throw new Error('Missing query');

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.googleMapsUri,places.types'
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: Number(params.maxResultCount || 10)
      })
    });
    const data = await response.json();
    return { statusCode: response.status, headers, body: JSON.stringify(data) };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message || 'Request failed' })
    };
  }
};
