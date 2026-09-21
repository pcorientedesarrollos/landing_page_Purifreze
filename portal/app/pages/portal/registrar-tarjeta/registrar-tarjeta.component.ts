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
import { pasosPago } from '../guia/guia.pasos';

type Paso = 'pago' | 'listo';

/**
 * Marcas que la tarjeta dibujada sabe representar.
 *
 * No es validación: Openpay decide si acepta el número. Sirve para mostrarle al
 * cliente que reconocimos su tarjeta mientras la teclea, y para agrupar los
 * dígitos como vienen impresos en el plástico.
 */
type MarcaTarjeta = 'visa' | 'mastercard' | 'amex' | 'carnet';

/** Dónde se teclea el código. Es la única salida de esta pantalla hacia atrás. */
const RUTA_ACTIVAR = '/activar';

/**
 * Los tres tamaños de texto que ofrece la pantalla, como factor del normal.
 *
 * Tres y no un deslizador: son tres botones que se ven y se tocan, y el salto
 * entre uno y otro se nota. 1.3 es el techo con el que las dos columnas siguen
 * cabiendo en un monitor chico antes de apilarse.
 */
const ESCALAS_TEXTO = [1, 1.15, 1.3];

/** El font-size de la raíz con el que están calculados los rem de la hoja. */
const BASE_TEXTO_PX = 16;

const CLAVE_ESCALA = 'portal_purifreze_escala_texto';

/**
 * Portal público de autoservicio.
 *
 * El cliente llega acá con la sesión ya hecha: la abrió /activar al canjear el
 * código que alguien de Purifreze le dio. Esta pantalla no tiene credencial que
 * validar, así que sin sesión no hay nada que mostrar y se vuelve a /activar.
 *
 * Los datos de la tarjeta viven solo en este componente y viajan directo a
 * Openpay: al servidor de Purifreze únicamente llega el token resultante.
 */
@Component({
  selector: 'app-portal-registrar-tarjeta',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalTerminosComponent],
  templateUrl: './registrar-tarjeta.component.html',
  styleUrls: ['./registrar-tarjeta.component.scss'],
})
export class PortalRegistrarTarjetaComponent implements OnInit, AfterViewChecked, OnDestroy {
  private portal = inject(PortalService);
  private animaciones = inject(PortalAnimacionesService);
  private guia = inject(PortalGuiaService);
  private host = inject(ElementRef<HTMLElement>);

  @ViewChild('panel') panel?: ElementRef<HTMLElement>;
  @ViewChild('cajaError') cajaError?: ElementRef<HTMLElement>;
  @ViewChild('checkFinal') checkFinal?: ElementRef<HTMLElement>;

  readonly formId = 'portal-payment-form';

  /**
   * Una sola pantalla: la tarjeta y lo que se va a cobrar se miran juntos, y de
   * acá se pasa directo al resultado. Antes eran tres pasos y el importe
   * desaparecía de la vista justo cuando el cliente entregaba su tarjeta.
   */
  public paso: Paso = 'pago';
  public cargando = false;
  public error = '';
  public sandbox = false;

  // Servicio contratado
  public sesion: SesionPortal | null = null;
  /**
   * La sesión venía de antes en esta pestaña, no de esta entrada. Con esto
   * puesto la pantalla muestra de quién es antes de dejar seguir.
   */
  public sesionHeredada = false;
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

  /**
   * La tarjeta dibujada muestra el dorso.
   *
   * Se voltea al enfocar el CVV porque ahí es donde está impreso: el dibujo le
   * dice a la persona dónde buscar el dato que le estamos pidiendo. También se
   * puede voltear tocándola.
   */
  public dorsoVisible = false;

  // ─── Tamaño del texto ────────────────────────────────────────────────────
  readonly escalasTexto = ESCALAS_TEXTO;
  /** Qué dice el lector de pantalla de cada botón, en el mismo orden. */
  readonly nombresEscalaTexto = ['Texto normal', 'Texto grande', 'Texto más grande'];
  public escalaTexto = ESCALAS_TEXTO[0];

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
   * La casilla de autorización. Es lo que ocupa el lugar de la confirmación que
   * antes era un modal aparte: sin un acto explícito, activar el cobro sería un
   * solo clic sobre un formulario recién llenado.
   */
  public aceptaTerminos = false;

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
    const sesion = this.portal.sesionActual;

    // Esta pantalla ya no trae credencial: el código se teclea en /activar, que
    // deja la sesión hecha. Sin sesión no hay nada que mostrar acá.
    if (!sesion) {
      this.irAActivar();
      return;
    }

    this.sesion = sesion;

    // Si la sesión no se canjeó en esta entrada, quedó de una visita anterior en
    // la misma pestaña: puede ser el mismo cliente que recargó, o el siguiente
    // que llegó a un dispositivo compartido y que no tiene por qué continuar el
    // registro de otro sin saberlo. El portal saluda por nombre, pero saludar no
    // es preguntar, así que acá se pregunta.
    this.sesionHeredada = !this.portal.consumirEntradaReciente();

    // El tamaño que la persona eligió en una visita anterior, antes de pintar.
    this.restaurarEscalaTexto();

    void this.cargar();
  }

  /**
   * Tamaño del texto de la pantalla.
   *
   * Quien registra su tarjeta no siempre ve bien de cerca, y esta pantalla pide
   * leer un importe y una fecha antes de autorizar un cargo recurrente: que el
   * texto sea legible es parte de que el consentimiento sea informado.
   *
   * Se escribe sobre el font-size de la raíz porque toda la hoja de estilos
   * mide en rem: cambiarlo ahí escala los textos, los campos y los espacios
   * juntos, sin tocar una sola regla. El plástico dibujado no se mueve: su SVG
   * mide en unidades de su viewBox.
   */
  cambiarEscalaTexto(escala: number): void {
    this.escalaTexto = escala;
    document.documentElement.style.fontSize = `${BASE_TEXTO_PX * escala}px`;
    try {
      localStorage.setItem(CLAVE_ESCALA, String(escala));
    } catch {
      // Sin persistencia la preferencia vale para esta visita. Aceptable.
    }
  }

  /** La preferencia vale para la persona, no para la pestaña: sobrevive al cierre. */
  private restaurarEscalaTexto(): void {
    let guardada = 0;
    try {
      guardada = Number(localStorage.getItem(CLAVE_ESCALA));
    } catch {
      return;
    }
    if (ESCALAS_TEXTO.includes(guardada)) this.cambiarEscalaTexto(guardada);
  }

  /**
   * "No soy yo": tira la sesión heredada y manda a teclear un código propio.
   */
  salirYActivar(): void {
    this.portal.limpiarSesion();
    this.sesion = null;
    this.irAActivar();
  }

  /** Sigue con la sesión que ya estaba. Sólo cierra el aviso. */
  continuarComoEsteCliente(): void {
    this.sesionHeredada = false;
  }

  private irAActivar(): void {
    window.location.href = RUTA_ACTIVAR;
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


  // ─── Servicio contratado ─────────────────────────────────────────────────

  /**
   * Trae el servicio y, si hay algo que cobrar, prepara la pasarela.
   *
   * En ese orden y no en paralelo: al cliente bloqueado —varios contratos, sin
   * contratos, mensualidades sin generar— no se le pide tarjeta, así que
   * cargarle Openpay.js sería trabajo y scripts de terceros para nada.
   */
  private async cargar(): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      const res: any = await firstValueFrom(this.portal.contratos());
      this.servicio = (res?.data ?? null) as ResumenServicio | null;
    } catch (e: any) {
      if (e?.status === 401) {
        this.portal.limpiarSesion();
        this.sesion = null;
        this.error =
          'Tu sesión expiró. Vuelve a escribir tu código para continuar.';
      } else {
        this.error = mensajeParaCliente(e, 'No pudimos cargar tus contratos.');
      }
    } finally {
      this.enviando = false;
      this.cargando = false;
      // El servicio llega después del primer render, así que se anima aparte.
      this.pasoAnimado = null;
    }

    await this.prepararOpenpay();
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

  /**
   * Deja el formulario listo para tokenizar.
   *
   * Openpay.deviceData.setup() busca el <form> por id, así que esto corre
   * DESPUÉS de que el servicio cargó y el formulario está en el DOM.
   */
  private async prepararOpenpay(): Promise<void> {
    if (!this.hayServicio) return;
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

  /**
   * Marca deducida del prefijo del número (IIN), mientras se teclea.
   *
   * Los rangos son los públicos de cada red: Visa empieza con 4, Mastercard con
   * 51-55 o 2221-2720, American Express con 34 o 37. Carnet va antes de
   * Mastercard porque 506199 caería en su rango de dos dígitos.
   *
   * Devuelve null mientras no alcance para decidir: la tarjeta dibujada queda
   * neutra en vez de adivinar.
   */
  get marcaDetectada(): MarcaTarjeta | null {
    const n = this.numeroLimpio;
    if (!n) return null;
    if (n.startsWith('4')) return 'visa';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^(506199|606333|588772)/.test(n)) return 'carnet';
    if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
    return null;
  }

  /**
   * Cómo se agrupan los dígitos en el plástico.
   *
   * American Express imprime 4-6-5 y son 15 dígitos; el resto va de cuatro en
   * cuatro. Agrupar como en la tarjeta física es lo que permite comparar a
   * simple vista lo tecleado con lo impreso.
   */
  private get gruposDelNumero(): number[] {
    return this.marcaDetectada === 'amex' ? [4, 6, 5] : [4, 4, 4, 4];
  }

  formatearNumero(): void {
    // Amex son 15 dígitos exactos; una Visa puede llegar a 19.
    const limpio = this.numeroLimpio.slice(0, this.marcaDetectada === 'amex' ? 15 : 19);
    const grupos = this.gruposDelNumero;

    const partes: string[] = [];
    let i = 0;
    for (const tamano of grupos) {
      if (i >= limpio.length) break;
      partes.push(limpio.slice(i, i + tamano));
      i += tamano;
    }
    // Una Visa de 17 a 19 dígitos deja un resto después de los cuatro grupos:
    // se agrega de a cuatro en vez de recortarlo.
    while (i < limpio.length) {
      partes.push(limpio.slice(i, i + 4));
      i += 4;
    }

    this.numero = partes.join(' ');
  }

  // ─── Lo que se dibuja en la tarjeta ──────────────────────────────────────
  //
  // Todo sale de los campos que el cliente ya tecleó: no se guarda ninguna
  // copia del número ni del CVV. Es la misma cadena del formulario, agrupada.

  /** Número con los huecos que faltan marcados, como el plástico en blanco. */
  get numeroEnTarjeta(): string {
    const d = this.numeroLimpio;
    const partes: string[] = [];
    let i = 0;
    for (const tamano of this.gruposDelNumero) {
      partes.push(d.slice(i, i + tamano).padEnd(tamano, '•'));
      i += tamano;
    }
    const resto = d.slice(i);
    return resto ? `${partes.join(' ')} ${resto}` : partes.join(' ');
  }

  get titularEnTarjeta(): string {
    return this.titular.trim() || 'NOMBRE DEL TITULAR';
  }

  get vigenciaEnTarjeta(): string {
    const d = this.vigencia.replace(/\D/g, '');
    if (!d) return 'MM/AA';
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : `${d}/`;
  }

  /**
   * El CVV, legible, en el dorso dibujado.
   *
   * Es la pantalla del propio cliente mirando su propia tarjeta: verlo escrito
   * le sirve para comprobar que tecleó los tres dígitos correctos, que es el
   * dato que más se equivoca. El campo sigue siendo type="password" para que no
   * quede a la vista de quien pase al lado mientras llena el formulario; el
   * dorso solo aparece mientras ese campo tiene el foco.
   *
   * No se guarda en ninguna parte: sale del mismo campo y se va con él.
   */
  get cvvEnTarjeta(): string {
    return this.cvv || '•••';
  }

  /**
   * Logotipo que va sobre la tarjeta, del kit oficial de Openpay.
   *
   * Carnet solo se muestra si el comercio la tiene habilitada (aceptaCarnet):
   * pintar su logo sin aceptarla le haría creer al cliente que su tarjeta sirve.
   */
  get logoDeLaMarca(): string | null {
    const marca = this.marcaDetectada;
    if (!marca) return null;
    if (marca === 'carnet' && !this.aceptaCarnet) return null;
    return `assets/openpay/${marca}.png`;
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

  /** Todo lo que tiene que ser cierto para poder activar el cobro. */
  get puedeActivar(): boolean {
    return this.tarjetaValida && this.aceptaTerminos && this.openpayListo && !this.cargando;
  }

  /**
   * Activa el cobro automático.
   *
   * Tocar el botón con la casilla marcada ES el consentimiento: terminosVersion
   * viaja con el alta y queda guardado como evidencia de qué texto se aceptó.
   */
  async registrarTarjeta(): Promise<void> {
    if (!this.puedeActivar || this.enviando) return;
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
    }
  }

  /**
   * Los términos completos, en su propio modal. El resumen de la derecha dice
   * lo esencial; esto es el texto largo para quien quiera leerlo entero.
   */
  abrirTerminos(): void {
    this.terminosAbiertos = true;
  }

  /**
   * "Acepto los términos" cierra el modal y marca la casilla: quien leyó el
   * texto completo y lo aceptó ahí no tiene por qué volver a decirlo abajo.
   */
  aceptarDesdeTerminos(): void {
    this.aceptaTerminos = true;
    this.terminosAbiertos = false;
  }

  cerrarTerminos(): void {
    this.terminosAbiertos = false;
  }

  private limpiarDatosSensibles(): void {
    this.numero = '';
    this.cvv = '';
  }

  // ─── Guía "¿Cómo funciona?" ──────────────────────────────────────────────

  /** Un solo recorrido: la pantalla es una sola. */
  abrirGuia(): void {
    if (!this.hayServicio || !this.openpayListo) return;
    this.guia.abrir(pasosPago());
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
