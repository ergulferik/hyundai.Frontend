import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { GeoLocation, LoginPayload, QrData, UserInfo } from '../../models/auth.models';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZXingScannerModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  location: GeoLocation | null = null;
  isLoading = false;
  showQrScanner = false;
  qrData: QrData | null = null;
  isUserLoggedIn = false;
  currentUser: UserInfo | null = null;
  private readonly MAX_DISTANCE_METERS = 100; // Maksimum izin verilen mesafe (metre)

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      surname: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^05[0-9]{9}$/)
      ]],
      qrCode: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.checkLoginStatus();
    this.getCurrentLocation();
  }

  private checkLoginStatus() {
    this.isUserLoggedIn = this.authService.isLoggedIn();
    if (this.isUserLoggedIn) {
      const userInfoStr = localStorage.getItem(this.authService.USER_INFO_KEY);
      if (userInfoStr) {
        this.currentUser = JSON.parse(userInfoStr);
      }
    }
  }

  async logout() {
    if (this.currentUser?.phone) {
      this.isLoading = true;
      try {
        await this.authService.logout(this.currentUser.phone).toPromise();
        this.authService.clearUserInfo();
        this.isUserLoggedIn = false;
        this.currentUser = null;
        this.messageService.success('Çıkış başarılı!');
      } catch (error) {
        console.error('Çıkış hatası:', error);
        this.messageService.error('Çıkış yapılırken bir hata oluştu.');
      } finally {
        this.isLoading = false;
      }
    }
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.messageService.error('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.messageService.error('Konum izni reddedildi.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.messageService.error('Konum bilgisi alınamadı.');
            break;
          case error.TIMEOUT:
            this.messageService.error('Konum bilgisi alınamadı (zaman aşımı).');
            break;
          default:
            this.messageService.error('Konum alınırken bir hata oluştu.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  isPersonalInfoValid(): boolean {
    const nameControl = this.userForm.get('name');
    const surnameControl = this.userForm.get('surname');
    const phoneControl = this.userForm.get('phone');

    return nameControl?.valid && surnameControl?.valid && phoneControl?.valid || false;
  }

  proceedToQrScan() {
    if (this.isPersonalInfoValid()) {
      this.showQrScanner = true;
    }
  }

  backToPersonalInfo() {
    this.showQrScanner = false;
  }

  calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) 
  {
    var R = 6371; // km
    var dLat = this.toRad(lat2-lat1);
    var dLon = this.toRad(lon2-lon1);
    var lat1 = this.toRad(lat1);
    var lat2 = this.toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
  }

  // Converts numeric degrees to radians
  toRad(Value: number) 
  {
      return Value * Math.PI / 180;
  }

  private async validateLocationAndLogin(qrLocation: GeoLocation) {
    if (!this.location) {
      this.messageService.error('Konum bilgisi alınamadı. Lütfen konum izni verdiğinizden emin olun.');
      return;
    }

    const distance = this.calcCrow(
      this.location.latitude,
      this.location.longitude,
      qrLocation.latitude,
      qrLocation.longitude
    );
    console.log(distance, this.location, qrLocation);

    if (distance > this.MAX_DISTANCE_METERS) {
      this.messageService.error(`QR kodun bulunduğu konumdan çok uzaktasınız. Maksimum mesafe: ${this.MAX_DISTANCE_METERS}m`);
      return;
    }

    this.messageService.success('Konum doğrulandı, giriş yapılıyor...');
    await this.onSubmit();
  }

  onQrCodeScanned(result: string) {
    if (result) {
      try {
        const qrData = JSON.parse(result);
        if (qrData.latitude && qrData.longitude) {
          this.qrData = qrData;
          this.userForm.patchValue({
            qrCode: result
          });
          this.validateLocationAndLogin(qrData);
        } else {
          this.messageService.error('QR kod geçersiz: Konum bilgisi bulunamadı.');
        }
      } catch (error) {
        this.messageService.error('QR kod geçersiz: JSON formatı hatalı.');
      }
    }
  }

  async onSubmit() {
    if (this.userForm.valid && this.location && this.qrData) {
      this.isLoading = true;

      const userInfo: UserInfo = {
        name: this.userForm.value.name,
        surname: this.userForm.value.surname,
        phone: this.userForm.value.phone
      };

      const payload: LoginPayload = {
        user: userInfo,
        currentLocation: {...this.location, accuracy: this.calcCrow(this.location.latitude, this.location.longitude, this.qrData.latitude, this.qrData.longitude)},
        loginTime: new Date(),
        qrData: this.qrData!
      };

      try {
        const response = await this.authService.login(payload).toPromise();
        console.log('Giriş başarılı:', response);
        if (response) {
          this.authService.setUserInfo(response.data as UserInfo);
          this.messageService.success('Giriş başarılı! Yönlendiriliyorsunuz...');
          this.checkLoginStatus();
          this.showQrScanner = false;
        } else {
          throw new Error('Login response is empty');
        }
      } catch (error) {
        console.error('Giriş hatası:', error);
        this.messageService.error('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        this.isLoading = false;
      }
    } else {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
} 