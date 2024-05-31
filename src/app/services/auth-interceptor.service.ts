import {Inject, Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {from, lastValueFrom, Observable} from "rxjs";
import {OKTA_AUTH} from "@okta/okta-angular";
import {OktaAuth} from "@okta/okta-auth-js";

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptorService implements HttpInterceptor{

  constructor(@Inject(OKTA_AUTH) private oktaAuth: OktaAuth) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.handleAccess(request, next));
  }

  private async handleAccess(request: HttpRequest<any>, next: HttpHandler): Promise<HttpEvent<any>> {

    // Only add an access token for secured endpoints
    const secureEndpoints = ['http://localhost:8080/api/orders'];

    if(secureEndpoints.some(url => request.urlWithParams.includes(url))) {

      // Get the access token
      const accessToken = this.oktaAuth.getAccessToken();

      // Clone the request and set the new header
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });

    }
      return await lastValueFrom(next.handle(request));
  }
}
