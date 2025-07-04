import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LogEntry, PaginatedLogs } from '../../models/auth.models';

@Component({
  selector: 'app-log-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './log-viewer.component.html',
  styleUrls: ['./log-viewer.component.scss']
})
export class LogViewerComponent implements OnInit {
  private readonly ADMIN_PASSWORD = '123';
  
  password = '';
  passwordError = false;
  isAuthenticated = false;
  
  logs: LogEntry[] = [];
  totalLogs = 0;
  currentPage = 0;
  pageSize = 20;
  hasMore = false;

  // Tarih filtreleri
  startDate: string;
  endDate: string;

  @Output() dblClick = new EventEmitter<boolean>();

  constructor(private authService: AuthService) {
    // Son 1 günlük varsayılan tarih aralığını ayarla
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    this.startDate = yesterday.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    // Sayfa yenilendiğinde oturum durumunu kontrol et
    const savedAuth = localStorage.getItem('log_viewer_auth');
    if (savedAuth === 'true') {
      this.isAuthenticated = true;
      this.loadLogs();
    }
  }

  checkPassword() {
    if (this.password === this.ADMIN_PASSWORD) {
      this.isAuthenticated = true;
      this.passwordError = false;
      localStorage.setItem('log_viewer_auth', 'true');
      this.loadLogs();
    } else {
      this.passwordError = true;
      localStorage.removeItem('log_viewer_auth');
    }
  }

  loadLogs() {
    const skip = this.currentPage * this.pageSize;
    const params: any = {
      skip: skip.toString(),
      take: this.pageSize.toString()
    };

    // Tarih filtrelerini ekle
    if (this.startDate) {
      params.startDate = this.startDate;
    }
    if (this.endDate) {
      params.endDate = this.endDate;
    }

    this.authService.getLogs(params).subscribe({
      next: (response: PaginatedLogs) => {
        this.logs = response.data;
        this.totalLogs = response.meta.total;
        this.hasMore = response.meta.hasMore;
      },
      error: (error) => {
        console.error('Log yükleme hatası:', error);
        // Hata durumunda oturumu sonlandır
        this.isAuthenticated = false;
        localStorage.removeItem('log_viewer_auth');
      }
    });
  }

  onPageSizeChange() {
    this.currentPage = 0; // Sayfa boyutu değiştiğinde ilk sayfaya dön
    this.loadLogs();
  }

  onDateFilterChange() {
    this.currentPage = 0; // Filtreler değiştiğinde ilk sayfaya dön
    this.loadLogs();
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadLogs();
    }
  }

  nextPage() {
    if (this.hasMore) {
      this.currentPage++;
      this.loadLogs();
    }
  }

  getQrIdentifier(qrData: LogEntry['qrData']): string {
    return qrData.qrCode || qrData.id || '-';
  }
} 