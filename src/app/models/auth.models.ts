export interface UserInfo {
  _id?: string;
  phone: string;
  name: string;
  surname: string;
}

export interface QrData {
  _id: string;
  qrCode?: string;
  id?: string;
  latitude: number;
  longitude: number;
}

export interface GeoLocation {
  _id?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LoginPayload {
  user: UserInfo;
  currentLocation: GeoLocation;
  loginTime: Date;
  qrData: QrData;
}

export interface LogEntry {
  _id: string;
  action: string;
  user: UserInfo;
  currentLocation: GeoLocation;
  loginTime: string;
  ipAddress: string;
  success: boolean;
  qrData: QrData;
  __v: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    skip: string;
    take: string;
    total: number;
    hasMore: boolean;
  };
}

export type PaginatedLogs = PaginatedResponse<LogEntry>; 