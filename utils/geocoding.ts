const GOOGLE_MAPS_API_KEY = ""; // Add your API key here

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GeocodeResult {
  formatted_address: string;
  address_components: AddressComponent[];
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface ParsedAddress {
  formatted_address: string;
  street_number?: string;
  route?: string;
  neighborhood?: string;
  locality?: string; // City
  administrative_area_level_2?: string; // County
  administrative_area_level_1?: string; // State/Province
  country?: string;
  postal_code?: string;
}

/**
 * Convert coordinates to full address using Google Geocoding API
 */
export async function reverseGeocode(
  latitude: number, 
  longitude: number
): Promise<ParsedAddress | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result: GeocodeResult = data.results[0];
      
      // Parse address components
      const parsed: ParsedAddress = {
        formatted_address: result.formatted_address,
      };
      
      result.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          parsed.street_number = component.long_name;
        } else if (types.includes('route')) {
          parsed.route = component.long_name;
        } else if (types.includes('neighborhood')) {
          parsed.neighborhood = component.long_name;
        } else if (types.includes('locality')) {
          parsed.locality = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
          parsed.administrative_area_level_2 = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          parsed.administrative_area_level_1 = component.long_name;
        } else if (types.includes('country')) {
          parsed.country = component.long_name;
        } else if (types.includes('postal_code')) {
          parsed.postal_code = component.long_name;
        }
      });
      
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Get a short address format (street + city)
 */
export function getShortAddress(address: ParsedAddress): string {
  const parts = [];
  
  if (address.street_number && address.route) {
    parts.push(`${address.street_number} ${address.route}`);
  } else if (address.route) {
    parts.push(address.route);
  }
  
  if (address.locality) {
    parts.push(address.locality);
  }
  
  return parts.join(', ') || address.formatted_address;
}

/**
 * Get a full address format
 */
export function getFullAddress(address: ParsedAddress): string {
  return address.formatted_address;
}