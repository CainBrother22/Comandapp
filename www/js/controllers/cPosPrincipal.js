import mPosCaja from "../models/mPosCaja.js";
import mTasaBCV from "../models/mTasaBCV.js";
import cCaja from "./cCaja.js";
import cHistorial from "./cHistorial.js";
import cConfiguracion from "./cConfiguracion.js";

export default class cPosPrincipal {
  constructor({ vistaCaja, vistaHistorial, vistaConfig, vistaModales }) {
    this.modelo = new mPosCaja();
    this.modelo.inicializar();

    // Elementos globales del cascarón (Activación, Tasa BCV, Navegación)
    this.pantallaActivacion = document.getElementById("pantalla-activacion");
    this.inKey = document.getElementById("input-key");
    this.btActivar = document.getElementById("btn-activar-sistema");
    this.lblErrorKey = document.getElementById("error-key");

    this.inTasaBCV = document.getElementById("tasaBcv");
    this.sidebar = document.getElementById("sidebar");
    this.overlay = document.getElementById("overlay");
    this.btMenuToggle = document.getElementById("btn-menu-toggle");
    this.btActualizarTasa = document.getElementById("btn-actualizar-tasa");
    this.btCerrarSidebar = document.getElementById("btn-cerrar-sidebar");
    this.botonesNav = document.querySelectorAll(".btn-nav");
    this.vistas = document.querySelectorAll(".vista");
    // Dentro de constructor(), debajo de this.vistas = document.querySelectorAll(".vista");
    this.barraOrdenMovil = document.getElementById("barra-orden-movil");

    // Subcontroladores por vista
    this.ctrlHistorial = new cHistorial(this.modelo, vistaHistorial, vistaModales);
    this.ctrlCaja = new cCaja(this.modelo, vistaCaja, vistaModales, () => {
      this.ctrlHistorial.refrescar();
    });
    this.ctrlConfig = new cConfiguracion(
      this.modelo,
      vistaConfig,
      vistaModales,
      () => this.ctrlCaja.refrescarCatalogo(),
      () => this.ctrlHistorial.refrescar()
    );

    this._enlazarEventosGlobales();
    this._iniciarEstado();
  }

  _enlazarEventosGlobales() {
    if (this.btActivar) {
      this.btActivar.onclick = () => this._verificarKey();
    }

    if (this.inTasaBCV) {
      this.inTasaBCV.oninput = (e) => {
        this.modelo.tasaBCV = e.target.value;
        this.ctrlCaja.refrescarOrden();
      };
    }
    // Botón para traer tasa automática del BCV
    if (this.btActualizarTasa) {
      this.btActualizarTasa.onclick = async () => {
        // Preguntamos al usuario qué tasa desea obtener
        const obtenerProxima = confirm(
          "¿Deseas obtener la PRÓXIMA tasa disponible (fecha valor futura)?\n\n" +
          "Aceptar = Próxima tasa\nCancelar = Tasa actual (vigente hoy)"
        );

        const boton = this.btActualizarTasa;
        const textoOriginal = boton.textContent;
        boton.textContent = "⏳...";
        boton.disabled = true;

        try {
          // Llamamos al método correspondiente del modelo
          const resultado = obtenerProxima
            ? await mTasaBCV.obtenerProximaTasa()
            : await mTasaBCV.obtenerTasaActual();

          // Actualizamos el campo de la tasa en la interfaz
          if (this.inTasaBCV) {
            this.inTasaBCV.value = resultado.valor.toFixed(2);
          }

          // Guardamos la tasa en el modelo (y en localStorage)
          this.modelo.tasaBCV = resultado.valor;

          // Refrescamos los totales de la orden si hay productos
          if (this.ctrlCaja) {
            this.ctrlCaja.refrescarOrden();
          }
          boton.textContent = `✅ ${resultado.valor.toFixed(2)}`;
          boton.title = resultado.esFutura
            ? `Próxima tasa BCV (fecha valor: ${resultado.fechaValor})`
            : `Tasa BCV actual (fecha valor: ${resultado.fechaValor})`;

          setTimeout(() => {
            boton.textContent = textoOriginal;
            boton.title = "Traer tasa automática del BCV";
          }, 2500);

        } catch (error) {
          alert(error.message || "Error al consultar el BCV");
          boton.textContent = textoOriginal;
          boton.title = "Traer tasa automática del BCV";
        } finally {
          boton.disabled = false;
        }
      };
    }
    if (this.btMenuToggle) {
      this.btMenuToggle.onclick = () => this._toggleSidebar();
    }
    if (this.btCerrarSidebar) {
      this.btCerrarSidebar.onclick = () => this._toggleSidebar(false);
    }
    if (this.overlay) {
      this.overlay.onclick = () => this._toggleSidebar(false);
    }

    this.botonesNav.forEach((btn) => {
      btn.onclick = () => {
        const vistaId = btn.dataset.vista;
        if (vistaId) {
          this._cambiarVista(vistaId, btn);
        }
        this._toggleSidebar(false);
      };
    });
  }

  _iniciarEstado() {
    if (this.pantallaActivacion) {
      this.pantallaActivacion.style.display = this.modelo.estaActivado() ? "none" : "flex";
    }

    if (this.inTasaBCV && this.modelo.tasaBCV > 0) {
      this.inTasaBCV.value = String(this.modelo.tasaBCV);
    }

    this.ctrlCaja.refrescarTodo();
    this.ctrlHistorial.refrescar();
    this.ctrlConfig.refrescar();
  }

  _verificarKey() {
    const clave = this.inKey ? this.inKey.value : "";
    if (this.modelo.activarSistema(clave)) {
      if (this.pantallaActivacion) this.pantallaActivacion.style.display = "none";
      if (this.lblErrorKey) this.lblErrorKey.style.display = "none";
    } else if (this.lblErrorKey) {
      this.lblErrorKey.textContent = "Clave incorrecta. Acceso denegado.";
      this.lblErrorKey.style.display = "block";
    }
  }

  _toggleSidebar(forzar) {
    if (!this.sidebar || !this.overlay) return;
    const abrir = typeof forzar === "boolean" ? forzar : !this.sidebar.classList.contains("abierto");
    this.sidebar.classList.toggle("abierto", abrir);
    this.overlay.classList.toggle("activo", abrir);
  }

  _cambiarVista(vistaId, botonActivo) {
    this.vistas.forEach((v) => v.classList.add("oculto"));
    this.botonesNav.forEach((b) => b.classList.remove("activo"));

    const destino = document.getElementById(vistaId);
    if (destino) destino.classList.remove("oculto");
    if (botonActivo) botonActivo.classList.add("activo");

    if (this.barraOrdenMovil) {
      if (vistaId !== "vista-caja") {
        this.barraOrdenMovil.classList.add("oculto");
      } else {
        this.barraOrdenMovil.classList.remove("oculto");
      }
    }

    if (vistaId === "vista-historial") {
      this.ctrlHistorial.refrescar();
    } else if (vistaId === "vista-config") {
      this.ctrlConfig.refrescar();
    } else if (vistaId === "vista-caja") {
      this.ctrlCaja.refrescarTodo();
    }
  }
}