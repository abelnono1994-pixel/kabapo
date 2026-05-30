export type Country = {
  name: string;
  code: string;
  continent: 'Africa' | 'Europe';
  phoneCode: string;
};

export type City = {
  name: string;
  countryCode: string;
};

export const europeanCountries: Country[] = [
  { name: 'France', code: 'FR', continent: 'Europe', phoneCode: '+33' },
  { name: 'Allemagne', code: 'DE', continent: 'Europe', phoneCode: '+49' },
  { name: 'Italie', code: 'IT', continent: 'Europe', phoneCode: '+39' },
  { name: 'Espagne', code: 'ES', continent: 'Europe', phoneCode: '+34' },
  { name: 'Belgique', code: 'BE', continent: 'Europe', phoneCode: '+32' },
  { name: 'Suisse', code: 'CH', continent: 'Europe', phoneCode: '+41' },
  { name: 'Royaume-Uni', code: 'GB', continent: 'Europe', phoneCode: '+44' },
];

export const africanCountries: Country[] = [
  { name: 'Cameroun', code: 'CM', continent: 'Africa', phoneCode: '+237' },
  { name: 'Nigéria', code: 'NG', continent: 'Africa', phoneCode: '+234' },
  { name: "Côte d'Ivoire", code: 'CI', continent: 'Africa', phoneCode: '+225' },
  { name: 'Sénégal', code: 'SN', continent: 'Africa', phoneCode: '+221' },
  { name: 'Ghana', code: 'GH', continent: 'Africa', phoneCode: '+233' },
  { name: 'Afrique du Sud', code: 'ZA', continent: 'Africa', phoneCode: '+27' },
  { name: 'Gabon', code: 'GA', continent: 'Africa', phoneCode: '+241' },
];

export const allCountries: Country[] = [...africanCountries, ...europeanCountries].sort((a, b) => a.name.localeCompare(b.name));

export const cameroonCities: City[] = [
  { name: 'Douala', countryCode: 'CM' },
  { name: 'Yaoundé', countryCode: 'CM' },
  { name: 'Bafoussam', countryCode: 'CM' },
  { name: 'Bamenda', countryCode: 'CM' },
  { name: 'Garoua', countryCode: 'CM' },
  { name: 'Maroua', countryCode: 'CM' },
  { name: 'Ngaoundéré', countryCode: 'CM' },
  { name: 'Bertoua', countryCode: 'CM' },
  { name: 'Ebolowa', countryCode: 'CM' },
  { name: 'Kribi', countryCode: 'CM' },
  { name: 'Limbé', countryCode: 'CM' },
  { name: 'Buéa', countryCode: 'CM' },
  { name: 'Dschang', countryCode: 'CM' },
  { name: 'Foumban', countryCode: 'CM' },
  { name: 'Kumba', countryCode: 'CM' },
  { name: 'Nkongsamba', countryCode: 'CM' },
];

export const otherCapitals: City[] = [
  { name: 'Paris', countryCode: 'FR' },
  { name: 'Berlin', countryCode: 'DE' },
  { name: 'Rome', countryCode: 'IT' },
  { name: 'Madrid', countryCode: 'ES' },
  { name: 'Bruxelles', countryCode: 'BE' },
  { name: 'Berne', countryCode: 'CH' },
  { name: 'Londres', countryCode: 'GB' },
  { name: 'Abuja', countryCode: 'NG' },
  { name: 'Yamoussoukro', countryCode: 'CI' },
  { name: 'Dakar', countryCode: 'SN' },
  { name: 'Accra', countryCode: 'GH' },
  { name: 'Pretoria', countryCode: 'ZA' },
  { name: 'Libreville', countryCode: 'GA' },
];

export const allCities: City[] = [...cameroonCities, ...otherCapitals];
