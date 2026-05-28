import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotificationService } from '../../services/notification.service';
import { MerchantNotificationBellComponent } from './notification-bell.component';

describe('MerchantNotificationBellComponent', () => {
  let fixture: ComponentFixture<MerchantNotificationBellComponent>;

  beforeEach(async () => {
    const notifSpy = {
      notifications: signal([]),
      unreadCount:   computed(() => 0),
      load:          jest.fn(),
      markRead:      jest.fn(),
      markAllRead:   jest.fn(),
      connectSse:    jest.fn(),
      disconnectSse: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports:   [MerchantNotificationBellComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerchantNotificationBellComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
