import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent', () => {
  let fixture: ComponentFixture<NotificationBellComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // O ngOnInit conecta SSE via EventSource (não HttpClient).
    // A lista de notificações só é buscada via HTTP quando o usuário
    // abre o sino pela primeira vez — nenhuma requisição HTTP no init.
    http.expectNone((r) => r.url.includes('/merchant/notifications'));
  });

  afterEach(() => {
    http.verify();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
