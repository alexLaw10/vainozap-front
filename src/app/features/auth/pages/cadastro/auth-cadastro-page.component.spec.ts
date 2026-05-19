import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthCadastroPageComponent } from './auth-cadastro-page.component';

describe('AuthCadastroPageComponent', () => {
  let fixture: ComponentFixture<AuthCadastroPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCadastroPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthCadastroPageComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
