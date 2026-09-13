import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  PortalService,
  ResumenServicio,
  SesionPortal,
} from '../../../services/portal/portal.service';
import { PortalAnimacionesService } from '../animaciones.service';
import { PortalTerminosComponent } from '../terminos/terminos.component';
import { mensajeParaCliente } from '../errores';
import { PortalGuiaService } from '../guia/guia.service';
import { pasosServicio, pasosTarjeta } from '../guia/guia.pasos';
import {
  PortalConfirmacionComponent,
  ResumenConfirmacion,
} from '../confirmacion/confirmacion.component';
import { tarjetaAConfirmar } from '../confirmacion/tarjeta';

type Paso = 'identidad' | 'codigo' | 'plan' | 'tarjeta' | 'listo';

/** Porcentaje de la barra de progreso para cada paso. */
const PROGRESO: Record<Paso, number> = {
  identidad: 12,
  codigo: 34,
  plan: 62,
  tarjeta: 88,
  listo: 100,
};

/**
 * Portal público de autoservicio.
 *
 * El cliente se identifica con RFC y correo más un código enviado a su correo
 * registrado, revisa el servicio que tiene contratado, y registra su tarjeta.
 * Los datos de la tarjeta viven solo en este componente y viajan directo a
 * Openpay: al servidor de Purifreze únicamente llega el token resultante.
 */
@Component({
  selector: 'app-portal-registrar-tarjeta',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalTerminosComponent, PortalConfirmacionComponent],
  templateUrl: './registrar-tarjeta.component.html',
  styleUrls: ['./registrar-tarjeta.component.scss'],
})
export class PortalRegistrarTarjetaComponent implements OnInit, AfterViewChecked, OnDestroy {
  private portal = inject(PortalService);
  private animaciones = inject(PortalAnimacionesService);
  private guia = inject(PortalGuiaService);
  private host = inject(ElementRef<HTMLElement>);

  @ViewChild('panel') panel?: ElementRef<HTMLElement>;
  @ViewChild('barraProgreso') barraProgreso?: ElementRef<HTMLElement>;
  @ViewChild('cajaError') cajaError?: ElementRef<HTMLElement>;
  @ViewChild('checkFinal') checkFinal?: ElementRef<HTMLElement>;

  readonly formId = 'portal-payment-form';

  public paso: Paso = 'identidad';
  public cargando = false;
  public error = '';
  public sandbox = false;

  // Identidad
  public rfc = '';
  public correo = '';

  // Código
  public codigo = '';
  public correoEnviado = '';

  // Servicio contratado
  public sesion: SesionPortal | null = null;
  /**
   * El servicio del cliente: un solo cargo con un renglón por contrato.
   *
   * Antes era una lista de planes entre los que elegir. Ya no se elige: la
   * tarjeta que registre cubre todo lo que tiene contratado, y los contratos que
   * no se pueden cobrar ni siquiera llegan desde el servidor.
   */
  public servicio: ResumenServicio | null = null;

  // Tarjeta
  public numero = '';
  public titular = '';
  /** Vigencia tal como el cliente la escribe: "MM/AA", igual que en el plástico. */
  public vigencia = '';
  public cvv = '';
  private deviceSessionId = '';
  public openpayListo = false;

  public tarjetaRegistrada: {
    marca: string | null;
    ultimos4: string | null;
    /** false: la tarjeta quedó guardada pero el cobro automático no se activó. */
    cobroActivado?: boolean;
    /** Qué hacer en ese caso. Lo redacta el servidor. */
    aviso?: string | null;
    /** YYYY-MM-DD del primer cargo, para confirmarle cuándo se le cobra. */
    primerCobro?: string | null;
    /** Mes que salda ese cargo, 'YYYY-MM'. */
    fechaMensualidad?: string | null;
    monto?: number | null;
  } | null = null;

  /**
   * ¿El cliente quedó domiciliado?
   *
   * La pantalla final no puede decir lo mismo en los dos casos: guardar la
   * tarjeta y activar el cobro son dos cosas, y hubo clientes que se fueron
   * creyendo que estaban domiciliados sin estarlo.
   *
   * Ante una respuesta vieja sin el campo se asume que sí: esa versión del
   * servidor sólo llegaba a esta pantalla con la suscripción creada.
   */
  get cobroActivado(): boolean {
    return this.tarjetaRegistrada?.cobroActivado !== false;
  }

  /**
   * El logotipo oficial de Openpay se descarga de su sección de Recursos. Si el
   * archivo todavía no está en assets, la imagen falla y se muestra el respaldo
   * en texto: un ícono roto en un formulario de pago destruye la confianza que
   * el sello busca generar.
   */
  public logoOpenpayDisponible = true;

  /**
   * Carnet es una marca mexicana que Openpay incluye en su kit, pero que no todo
   * comercio tiene habilitada. Mostrarla sin aceptarla haría que un cliente
   * intente pagar con una tarjeta que va a ser rechazada.
   *
   * Confirmar con Openpay si está activa en la cuenta antes de ponerla en true.
   */
  public aceptaCarnet = false;

  public terminosAbiertos = false;

  /**
   * Lo que el cliente está confirmando, mientras el modal está abierto. Se arma
   * al abrirlo y no en cada render: lo que confirma tiene que ser lo que vio.
   */
  public confirmacion: ResumenConfirmacion | null = null;

  /**
   * Versión del texto que esta pantalla muestra. Viaja con el registro de la
   * tarjeta y queda guardada como evidencia de qué fue lo que se aceptó; el
   * servidor la rechaza si no es la vigente.
   */
  public readonly terminosVersion = PortalTerminosComponent.VERSION;

  /**
   * Candado contra envíos duplicados.
   *
   * Openpay lo pide entre sus recomendaciones: "Evita los pagos duplicados...
   * configurar que el botón de pago se desactive ya que se seleccionó".
   *
   * No alcanza con [disabled]="cargando": entre el clic y el redibujado de
   * Angular hay una ventana donde un segundo envío entra. Esta bandera se
   * levanta de forma síncrona, antes de ceder el control.
   */
  private enviando = false;

  /** Paso cuya entrada todavía no se animó. Evita re-animar en cada ciclo de render. */
  private pasoAnimado: Paso | null = null;
  private errorAnimado = '';

  ngOnInit(): void {
    // Con una sesión viva se omite la identificación.
    const sesion = this.portal.sesionActual;
    if (sesion) {
      this.sesion = sesion;
      void this.irAPlanes();
    }
  }

  /**
   * Las animaciones se disparan acá y no en los métodos de navegación porque
   * *ngIf recrea el nodo: antes de que Angular renderice, el elemento a animar
   * todavía no existe en el DOM.
   */
  ngAfterViewChecked(): void {
    if (this.pasoAnimado !== this.paso) {
      this.pasoAnimado = this.paso;
      this.animaciones.entradaPaso(this.panel?.nativeElement ?? null);
      this.animaciones.entradaCampos(
        this.host.nativeElement.querySelectorAll('.pf-campo, .pf-plan')
      );
      this.animaciones.avanzarProgreso(
        this.barraProgreso?.nativeElement ?? null,
        PROGRESO[this.paso]
      );
      if (this.paso === 'listo') {
        this.animaciones.confirmacion(this.checkFinal?.nativeElement ?? null);
      }
    }

    if (this.error && this.errorAnimado !== this.error) {
      this.errorAnimado = this.error;
      this.animaciones.sacudirError(this.cajaError?.nativeElement ?? null);
    }
    if (!this.error) this.errorAnimado = '';
  }

  /** La guía vive en body, fuera del componente: si la pantalla se va, la guía también. */
  ngOnDestroy(): void {
    this.guia.cerrar();
  }

  // ─── Progreso ────────────────────────────────────────────────────────────

  get etapaActual(): number {
    if (this.paso === 'identidad' || this.paso === 'codigo') return 1;
    if (this.paso === 'plan') return 2;
    return 3;
  }

  esEtapa(n: number): boolean {
    return this.etapaActual === n;
  }

  // ─── Identidad ───────────────────────────────────────────────────────────

  get identidadValida(): boolean {
    return (
      /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(this.rfc.trim()) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.correo.trim())
    );
  }

  async solicitarCodigo(): Promise<void> {
    if (!this.identidadValida || this.enviando) return;
    this.enviando = true;
    this.cargando = true;
    this.error = '';
    try {
      await firstValueFrom(
        this.portal.solicitarCodigo(this.rfc.trim().toUpperCase(), this.correo.trim())
      );
      this.correoEnviado = this.correo.trim();
      this.paso = 'codigo';
    } catch (e: any) {
      this.error = mensajeParaCliente(e, 'No pudimos enviar el código. Intenta de nuevo.');
    } finally {
      this.enviando = false;
      this.cargando = false;
    }
  }

  // ─── Código ──────────────────────────────────────────────────────────────

  get codigoValido(): boolean {
    return /^\d{6}$/.test(this.codigo.trim());
  }

  async verificarCodigo(): Promise<void> {
    if (!this.codigoValido || this.enviando) return;
    this.enviando = true;
    this.cargando = true;
    this.error = '';
    try {
      this.sesion = await this.portal.verificarCodigo(
        this.rfc.trim().toUpperCase(),
        this.correo.trim(),
        this.codigo.trim()
      );
      this.codigo = '';
      await this.irAPlanes();
    } catch (e: any) {
      this.error = mensajeParaCliente(e, 'El código no es válido o ya venció.');
    } finally {
      this.enviando = false;
      this.cargando = false;
    }
  }

  volverAIdentidad(): void {
    this.paso = 'identidad';
    this.codigo = '';
    this.error = '';
  }

  // ─── Servicio contratado ─────────────────────────────────────────────────

  private async irAPlanes(): Promise<void> {
    this.paso = 'plan';
    this.cargando = true;
    this.error = '';
    try {
      const res: any = await firstValueFrom(this.portal.contratos());
      this.servicio = (res?.data ?? null) as ResumenServicio | null;
    } catch (e: any) {
      if (e?.status === 401) {
        this.portal.limpiarSesion();
        this.sesion = null;
        this.paso = 'identidad';
        this.error = 'Tu sesión expiró. Solicita un código nuevo.';
      } else {
        this.error = mensajeParaCliente(e, 'No pudimos cargar tus contratos.');
      }
    } finally {
      this.enviando = false;
      this.cargando = false;
      // El listado llega después del render del paso, así que se anima aparte.
      this.pasoAnimado = null;
    }
  }

  /**
   * Por qué no se le va a poder cobrar, si es el caso.
   *
   * Lo decide el servidor con la misma regla que corre al registrar la tarjeta
   * —varios contratos, sin contratos, o mensualidades sin generar—. Antes acá
   * sólo se contemplaba el caso de varios contratos, y los demás llegaban hasta
   * el formulario para ser rechazados con la tarjeta ya capturada.
   */
  get bloqueo(): { code: string; titulo: string; message: string } | null {
    return this.servicio?.bloqueo ?? null;
  }

  /** Hay algo que cobrar. Sin esto no tiene sentido pedir una tarjeta. */
  get hayServicio(): boolean {
    return (this.servicio?.contratos.length ?? 0) > 0 && !this.bloqueo;
  }

  /**
   * Los contratos son mensuales en todos los casos del sistema. Si alguna vez no
   * coinciden, el servidor manda null y cada renglón muestra la suya.
   */
  get periodicidadComun(): string | null {
    return this.servicio?.periodicidad ?? null;
  }

  async continuarATarjeta(): Promise<void> {
    if (!this.hayServicio) return;
    // La guía deja tocar "Continuar": al cambiar de pantalla, se va con ella.
    this.guia.cerrar();
    this.paso = 'tarjeta';
    this.error = '';
    this.cargando = true;
    try {
      const config = await this.portal.inicializarOpenpay();
      this.sandbox = config.sandbox;

      // setTimeout cede el turno para que Angular renderice el formulario antes
      // de que Openpay lo busque por id.
      setTimeout(() => {
        try {
          this.deviceSessionId = this.portal.generarDeviceSessionId(this.formId);
          if (!this.deviceSessionId) {
            throw new Error('deviceData.setup() no devolvió identificador');
          }
          this.openpayListo = true;
          this.pasoAnimado = null;
        } catch (e) {
          // Se registra el detalle: sin device_session_id el cargo se rechaza por
          // antifraude, y el motivo real hay que poder verlo en consola.
          console.error('[portal] falló deviceData.setup()', e);
          this.error =
            'No pudimos iniciar el sistema de pagos. Recarga la página e intenta de nuevo.';
        }
      });
    } catch {
      this.error = 'No pudimos conectar con el sistema de pagos. Intenta más tarde.';
    } finally {
      this.enviando = false;
      this.cargando = false;
    }
  }

  // ─── Tarjeta ─────────────────────────────────────────────────────────────

  get numeroLimpio(): string {
    return this.numero.replace(/\D/g, '');
  }

  formatearNumero(): void {
    const limpio = this.numeroLimpio.slice(0, 19);
    this.numero = limpio.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  /**
   * Escribe la barra sola mientras el cliente teclea: 12 → "12/", 1225 → "12/25".
   *
   * Un mes que no puede existir se corrige en el momento en vez de dejarlo pasar
   * hasta el envío: un 5 suelto es mayo y se convierte en "05/", y un 20 no puede
   * ser mes, así que se toma el 2 y se espera el segundo dígito. Corregir después
   * obligaría a la persona a volver a un campo que ya dio por terminado.
   */
  formatearVigencia(): void {
    let digitos = this.vigencia.replace(/\D/g, '').slice(0, 4);

    if (digitos.length === 1 && Number(digitos) > 1) {
      // Un solo dígito mayor que 1 sólo puede ser un mes de una cifra: 5 → 05.
      digitos = `0${digitos}`;
    } else if (digitos.length >= 2) {
      const mes = Number(digitos.slice(0, 2));
      if (mes === 0 || mes > 12) {
        // "20" no es un mes: se conserva el primer dígito y se espera el resto.
        digitos = digitos.slice(0, 1);
      }
    }

    this.vigencia = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
    // La barra queda puesta apenas el mes está completo, para que el cursor
    // caiga solo en el año sin que la persona tenga que escribirla.
    if (digitos.length === 2) this.vigencia = `${digitos}/`;
  }

  /** Mes de la vigencia en dos dígitos, o '' si todavía no está completa. */
  get mes(): string {
    const d = this.vigencia.replace(/\D/g, '');
    return d.length >= 2 ? d.slice(0, 2) : '';
  }

  /** Año de la vigencia en dos dígitos, como lo espera Openpay. */
  get anio(): string {
    const d = this.vigencia.replace(/\D/g, '');
    return d.length >= 4 ? d.slice(2, 4) : '';
  }

  /**
   * La vigencia está completa y no quedó en el pasado.
   *
   * Se compara contra el mes actual: una tarjeta vencida la rechaza Openpay
   * igual, pero avisarlo acá le ahorra a la persona un rechazo del banco que no
   * explica nada.
   */
  get vigenciaValida(): boolean {
    if (!/^\d{2}$/.test(this.mes) || !/^\d{2}$/.test(this.anio)) return false;
    const mes = Number(this.mes);
    if (mes < 1 || mes > 12) return false;

    const ahora = new Date();
    const anioActual = ahora.getFullYear() % 100;
    const mesActual = ahora.getMonth() + 1;
    const anio = Number(this.anio);
    return anio > anioActual || (anio === anioActual && mes >= mesActual);
  }

  get tarjetaValida(): boolean {
    return (
      this.numeroLimpio.length >= 15 &&
      this.titular.trim().length > 2 &&
      this.vigenciaValida &&
      /^\d{3,4}$/.test(this.cvv)
    );
  }

  /**
   * El formulario no registra: abre la confirmación, donde el cliente ve qué se
   * cobra, desde cuándo y con qué tarjeta. El registro sale de ahí.
   */
  pedirConfirmacion(): void {
    const servicio = this.servicio;
    if (!servicio || !this.tarjetaValida || this.enviando || !this.openpayListo) return;
    this.guia.cerrar();
    this.error = '';

    const primer = servicio.primerCobro;
    this.confirmacion = {
      contratos: servicio.contratos.length,
      total: this.formatoMonto(servicio.total),
      periodicidad: this.periodicidadComun,
      primerCargo: primer ? (this.esHoy(primer) ? 'hoy' : this.fechaLarga(primer)) : null,
      cobroEnElActo: servicio.cobroVencido,
      mensualidad: servicio.fechaMensualidad
        ? this.diaMensualidad(servicio.fechaMensualidad)
        : null,
      tarjeta: tarjetaAConfirmar(this.numeroLimpio),
    };
  }

  cerrarConfirmacion(): void {
    if (!this.enviando) this.confirmacion = null;
  }

  /** Lo llama la confirmación. Tocar "Activar pago automático" es aceptar los términos. */
  async registrarTarjeta(): Promise<void> {
    if (!this.tarjetaValida || this.enviando || !this.openpayListo) return;
    this.enviando = true;
    this.cargando = true;
    this.error = '';
    try {
      const tokenId = await this.portal.tokenizar({
        card_number: this.numeroLimpio,
        holder_name: this.titular.trim(),
        expiration_year: this.anio,
        expiration_month: this.mes,
        cvv2: this.cvv,
      });

      const res: any = await firstValueFrom(
        this.portal.registrarTarjeta(tokenId, this.deviceSessionId, this.terminosVersion)
      );

      this.limpiarDatosSensibles();
      this.tarjetaRegistrada = res?.data ?? null;
      this.paso = 'listo';
      this.portal.limpiarSesion();
    } catch (e: any) {
      console.log(e)
      this.error = mensajeParaCliente(e, 'No pudimos registrar la tarjeta. Revisa los datos.');
    } finally {
      this.enviando = false;
      this.cargando = false;
      // Bien o mal, la confirmación se cierra: si el banco rechazó la tarjeta, el
      // error se lee junto a los campos, que es donde se corrige.
      this.confirmacion = null;
    }
  }

  /**
   * Los términos se abren desde la confirmación, que se oculta mientras tanto:
   * los dos modales comparten z-index y quedarían encimados.
   */
  abrirTerminos(): void {
    this.terminosAbiertos = true;
  }

  /**
   * "Cerrar" y "Acepto los términos" regresan a la confirmación. Aceptar ahí no
   * activa nada: el consentimiento se da al tocar "Activar pago automático".
   */
  cerrarTerminos(): void {
    this.terminosAbiertos = false;
  }

  volverAPlan(): void {
    this.limpiarDatosSensibles();
    this.paso = 'plan';
    this.error = '';
  }

  private limpiarDatosSensibles(): void {
    this.numero = '';
    this.cvv = '';
  }

  // ─── Guía "¿Cómo funciona?" ──────────────────────────────────────────────

  abrirGuiaServicio(): void {
    if (!this.hayServicio) return;
    this.guia.abrir(pasosServicio());
  }

  /**
   * Solo con Openpay listo: antes de eso, el último paso resaltaría un botón que
   * todavía dice "Preparando el pago seguro…".
   */
  abrirGuiaTarjeta(): void {
    if (!this.openpayListo) return;
    this.guia.abrir(pasosTarjeta());
  }

  // ─── Presentación ────────────────────────────────────────────────────────

  formatoMonto(monto: number | null): string {
    if (monto === null) return '—';
    return monto.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });
  }

  /** "1 equipo" / "3 equipos". Sin nombres ni números de serie. */
  textoEquipos(cantidad: number): string {
    if (!cantidad) return 'Sin equipos registrados';
    return cantidad === 1 ? '1 equipo' : `${cantidad} equipos`;
  }

  /** "IVA 16%" a partir de la tasa que mandó el servidor. */
  get etiquetaIva(): string {
    const tasa = this.servicio?.tasaIva ?? 0.16;
    return `IVA ${Math.round(tasa * 100)}%`;
  }

  /**
   * "3 de octubre de 2026", o "hoy" cuando el cargo cae el mismo día.
   *
   * Se arma partiendo la cadena y no con `new Date(fecha)`: esa forma la lee
   * como UTC y en Mérida devuelve el día anterior. En una fecha de cobro eso es
   * una llamada del cliente.
   */
  fechaCobro(fecha: string | null): string {
    if (!fecha) return '';
    if (this.esHoy(fecha)) return 'hoy';
    return `el ${this.fechaLarga(fecha)}`;
  }

  /** "3 de octubre de 2026", partiendo la cadena por la misma razón que fechaCobro. */
  fechaLarga(fecha: string): string {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return `${dia} de ${MESES[mes - 1]} de ${anio}`;
  }

  /**
   * ¿La fecha es hoy?
   *
   * Decide si hay que nombrar la mensualidad: la palabra "hoy" es más clara que
   * una fecha, pero esconde a qué mes corresponde el cargo, y un importe que se
   * cobra en el acto sin decir qué paga se lee como un cargo sorpresa.
   */
  esHoy(fecha: string | null): boolean {
    if (!fecha) return false;
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const hoy = new Date();
    return anio === hoy.getFullYear() && mes === hoy.getMonth() + 1 && dia === hoy.getDate();
  }

  /**
   * "1 de septiembre" — el día de la mensualidad que se está saldando.
   *
   * Sin el año a propósito: siempre es el mes en curso o el siguiente, y el año
   * sólo alarga la frase. Con el día el cliente puede cotejarlo contra su
   * contrato sin preguntarnos.
   */
  diaMensualidad(fecha: string | null): string {
    if (!fecha) return '';
    const [, mes, dia] = fecha.split('-').map(Number);
    return `${dia} de ${MESES[mes - 1]}`;
  }
}

/** Meses en español, para escribir la fecha como la lee una persona. */
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
