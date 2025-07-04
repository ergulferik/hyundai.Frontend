import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  UserInfo, 
  LoginPayload, 
  PaginatedLogs 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://hyundaibackend-production.up.railway.app';
  readonly USER_INFO_KEY = 'hyundai_user_info';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<{success: boolean, data: UserInfo}> {
    return this.http.post<{success: boolean, data: UserInfo}>(`${this.API_URL}/auth/login`, payload);
  }

  logout(phone: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/logout`, { phone });
  }

  getLogs(params: {
    skip?: string;
    take?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<PaginatedLogs> {
    return this.http.get<PaginatedLogs>(`${this.API_URL}/logs`, { params });
  }

  isLoggedIn(): boolean {
    const userInfo = localStorage.getItem(this.USER_INFO_KEY);
    return userInfo !== null;
  }

  setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
  }

  clearUserInfo(): void {
    localStorage.removeItem(this.USER_INFO_KEY);
  }
} 