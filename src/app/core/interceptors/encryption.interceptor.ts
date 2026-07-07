import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, mergeMap, of } from 'rxjs';
import { CryptoService } from '../services/crypto.service';

@Injectable()
export class EncryptionInterceptor implements HttpInterceptor {
  constructor(private crypto: CryptoService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.crypto.isEnabled()) {
      return next.handle(req);
    }

    const encryptReq$ = (req.body && req.method !== 'GET' && req.method !== 'DELETE')
      ? from(this.buildEncryptedRequest(req))
      : of(req);

    return encryptReq$.pipe(
      mergeMap(encReq =>
        next.handle(encReq).pipe(
          mergeMap(event => {
            if (event instanceof HttpResponse && event.body?.encryptedPayload) {
              return from(
                this.crypto.decrypt(event.body.encryptedPayload).then(decrypted => {
                  try {
                    return event.clone({ body: JSON.parse(decrypted) });
                  } catch {
                    return event.clone({ body: decrypted });
                  }
                }).catch(() => event)
              );
            }
            return of(event);
          })
        )
      )
    );
  }

  private async buildEncryptedRequest(req: HttpRequest<any>): Promise<HttpRequest<any>> {
    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const [encrypted, signature] = await Promise.all([
      this.crypto.encrypt(bodyStr),
      this.crypto.hmacSign(bodyStr)
    ]);
    return req.clone({
      body: { encryptedPayload: encrypted },
      setHeaders: { 'X-Signature': signature }
    });
  }
}
