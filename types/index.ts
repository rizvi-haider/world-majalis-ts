export interface Channel {
  id: string;
  name: string;
  url: string;
}

export interface CountryData {
  id: string;
  name: string;
  cityName: string;
  timeZone: string;
  channels: Channel[];
}