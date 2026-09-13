import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

/** Un contrato como renglón del resumen: número, cuántos equipos y cuánto. */
export interface RenglonContrato {
  idContrato: number;
  equipos: number;
  /** Monto del contrato, IVA incluido. */
  monto: number;
  /** Sólo se usa cuando los contratos no comparten periodicidad. */
  periodicidad: string | null;
}

/**
 * El servicio del cliente: un solo cargo con sus contratos como renglones.
 *
 * Los importes vienen calculados del servidor. El monto del contrato incluye
 * IVA, así que el total es la suma de los renglones y la base se deriva de ahí.
 */
export interface ResumenServicio {
  descripcion: string;
  contratos: RenglonContrato[];
  periodicidad: string | null;
  openpay: { repeatEvery: number; repeatUnit: string } | null;
  subtotal: number;
  iva: number;
  total: number;
  tasaIva: number;
  /** Contratos que existen pero no pueden cobrarse. No se listan. */
  excluidos: number;
  /**
   * Por qué este cliente no puede quedar domiciliado, cuando no puede.
   *
   * Lo resuelve el servidor con la misma regla que aplica al registrar la
   * tarjeta, así que si viene con contenido el formulario no debe ofrecerse:
   * capturarla terminaría en un rechazo.
   */
  bloqueo: { code: string; titulo: string; message: string } | null;
  /**
   * YYYY-MM-DD del primer cargo. null cuando hay bloqueo.
   *
   * Se muestra ANTES de pedir la tarjeta: es lo que decide si el cliente sigue o
   * levanta el teléfono, sobre todo el que ya pagó el mes y teme el cobro doble.
   */
  primerCobro: string | null;
  /** Mes que salda ese cargo, 'YYYY-MM'. */
  fechaMensualidad: string | null;
  /** El día de esa mensualidad ya pasó: por eso el cargo es hoy. */
  cobroVencido: boolean;
}

export interface SesionPortal {
  token: string;
  expiraEnMinutos: number;
  cliente: { idCliente: number; nombre: string; correo: string };
}

export interface ConfigOpenpay {
  merchantId: string;
  publicKey: string;
  sandbox: boolean;
}

export interface DatosTarjeta {
  card_number: string;
  holder_name: string;
  expiration_year: string;
  expiration_month: string;
  cvv2: string;
}

declare const OpenPay: any;

const OPENPAY_JS = 'https://js.openpay.mx/openpay.v1.min.js';
const OPENPAY_DATA_JS = 'https://js.openpay.mx/openpay-data.v1.min.js';
const JQUERY_JS = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js';

const CLAVE_SESION = 'portal_purifreze_sesion';

/**
 * Servicio del portal público del cliente.
 *
 * Deliberadamente autónomo respecto de OpenpayService (el del admin): son dos
 * contextos distintos —uno lo usa un empleado autenticado con JWT, el otro un
 * cliente con un token de sesión temporal— y acoplarlos haría que un cambio en
 * el admin pudiera romper la pantalla de cara al cliente.
 */
@Injectable({ providedIn: 'root' })
export class PortalService {
  private API_URI = environment.API_URL;
  private http = inject(HttpClient);

  private librosCargados = false;
  private sesion: SesionPortal | null = null;

  // ─── Sesión ───────────────────────────────────────────────────────────────

  get sesionActual(): SesionPortal | null {
    if (this.sesion) return this.sesion;
    try {
      const guardada = sessionStorage.getItem(CLAVE_SESION);
      if (guardada) this.sesion = JSON.parse(guardada) as SesionPortal;
    } catch {
      // sessionStorage puede fallar en modo privado; se sigue sin sesión.
    }
    return this.sesion;
  }

  private guardarSesion(sesion: SesionPortal): void {
    this.sesion = sesion;
    try {
      // sessionStorage y no localStorage: la sesión muere al cerrar la pestaña,
      // que es lo correcto para un dispositivo posiblemente compartido.
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Sin persistencia la sesión vive solo en memoria. Aceptable.
    }
  }

  limpiarSesion(): void {
    this.sesion = null;
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {
      /* nada que hacer */
    }
  }

  /**
   * Header propio en vez de Authorization.
   *
   * JwtInterceptorInterceptor pisa Authorization en TODAS las peticiones con el
   * JWT del admin, así que el token del portal nunca llegaría. X-Portal-Token
   * queda fuera de su alcance.
   */
  private get headers(): HttpHeaders {
    const token = this.sesionActual?.token ?? '';
    return new HttpHeaders({ 'X-Portal-Token': token });
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  solicitarCodigo(rfc: string, correo: string): Observable<any> {
    return this.http.post(`${this.API_URI}/portal/solicitar-codigo`, { rfc, correo });
  }

  async verificarCodigo(rfc: string, correo: string, codigo: string): Promise<SesionPortal> {
    const res: any = await firstValueFrom(
      this.http.post(`${this.API_URI}/portal/verificar-codigo`, { rfc, correo, codigo })
    );
    const sesion = res?.data as SesionPortal;
    this.guardarSesion(sesion);
    return sesion;
  }

  contratos(): Observable<any> {
    return this.http.get(`${this.API_URI}/portal/contratos`, { headers: this.headers });
  }

  configOpenpay(): Observable<any> {
    return this.http.get(`${this.API_URI}/portal/config-openpay`, { headers: this.headers });
  }

  /**
   * `terminosVersion` no es informativo: el servidor rechaza el registro si no
   * coincide con la versión vigente del texto, y guarda cuál se aceptó. Un
   * navegador con la pantalla vieja abierta no puede registrar una tarjeta
   * declarando un consentimiento sobre un texto que ya cambió.
   */
  registrarTarjeta(
    tokenId: string,
    deviceSessionId: string,
    terminosVersion: string
  ): Observable<any> {
    return this.http.post(
      `${this.API_URI}/portal/tarjeta`,
      { tokenId, deviceSessionId, terminosVersion },
      { headers: this.headers }
    );
  }

  cerrarSesion(): Observable<any> {
    return this.http.post(`${this.API_URI}/portal/cerrar-sesion`, {}, { headers: this.headers });
  }

  // ─── Openpay.js ───────────────────────────────────────────────────────────

  /** Carga Openpay.js e inicializa con las credenciales públicas del comercio. */
  async inicializarOpenpay(): Promise<ConfigOpenpay> {
    const res: any = await firstValueFrom(this.configOpenpay());
    const config = res?.data as ConfigOpenpay;

    if (!this.librosCargados) {
      if (!(window as any).jQuery) await this.cargarScript(JQUERY_JS);
      await this.cargarScript(OPENPAY_JS);
      await this.cargarScript(OPENPAY_DATA_JS);
      this.librosCargados = true;
    }
    OpenPay.setId(config.merchantId);
    OpenPay.setApiKey(config.publicKey);
    OpenPay.setSandboxMode(config.sandbox);
    return config;
  }

  generarDeviceSessionId(formId: string, campoOculto = 'deviceIdHiddenFieldName'): string {
    return OpenPay.deviceData.setup(formId, campoOculto);
  }

  /**
   * Tokeniza la tarjeta contra Openpay desde el navegador del cliente.
   * El número de tarjeta no pasa por el servidor de Purifreze en ningún momento.
   */
  tokenizar(datos: DatosTarjeta): Promise<string> {
    return new Promise((resolve, reject) => {
      OpenPay.token.create(
        datos,
        (respuesta: any) => resolve(respuesta.data.id),
        (respuesta: any) => {
          const desc =
            respuesta?.data?.description ?? respuesta?.message ?? 'No pudimos validar la tarjeta';
          const err: any = new Error(desc);
          err.errorCode = respuesta?.data?.error_code;
          reject(err);
        }
      );
    });
  }

  private cargarScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existente = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existente) {
        if (existente.dataset['cargado'] === 'true') return resolve();
        existente.addEventListener('load', () => resolve());
        existente.addEventListener('error', () => reject(new Error(`No se pudo cargar ${src}`)));
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = () => {
        script.dataset['cargado'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }
}
