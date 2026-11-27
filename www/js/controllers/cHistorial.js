import mPosCaja from "../models/mPosCaja.js";

export default class cHistorial {
  constructor(modelo, vistaHistorial, vistaModales) {
    this.modelo = modelo;
    this.vista = vistaHistorial;
    this.modales = vistaModales;
    this.filtroActivo = "todos";

    this.vista.onCambiarFiltro((filtro) => {
      this.filtroActivo = filtro;
      this.refrescar();
    });

    this.vista.onDividirPago((idVenta) => this.abrirDividirPago(idVenta));
    this.vista.onPagarCredito((idVenta) => this.abrirPagoCredito(idVenta));
    this.vista.onEliminarVenta((idVenta) => this.eliminarVenta(idVenta));
    this.vista.onBorrarTodo(() => this.borrarTodo());
  }

  refrescar() {
    const semanas = this.modelo.obtenerVentasAgrupadasPorDiaYSemana(this.filtroActivo);
    this.vista.renderizarSemanas(semanas);
  }

  abrirPagoCredito(idVenta) {
    const venta = this.modelo.buscarVentaPorId(idVenta);
    if (!venta) {
      alert("Venta no encontrada.");
      return;
    }
    if (!venta.esCredito()) {
      alert("Esta venta ya está pagada.");
      return;
    }

    this.modales.abrirModalPagoCredito({
      venta,
      onConfirmarLiquidacion: (metodoPago) => {
        const liquidada = this.modelo.liquidarCredito(idVenta, metodoPago);
        this.modales.cerrarTodos();
        this.refrescar();
        if (liquidada) {
          this.abrirDividirPago(liquidada.id);
        }
      },
    });
  }

  abrirDividirPago(idVenta) {
    const venta = this.modelo.buscarVentaPorId(idVenta);
    if (!venta) {
      alert("Venta no encontrada.");
      return;
    }

    this.modales.abrirModalDividirPago({
      venta,
      calcularDescuento: mPosCaja.calcularDescuentoUSD,
      onGuardarDivision: ({ descuentoMonto, descuentoTipo, efectivoUSD, pagoMovilUSD }) => {
        const res = this.modelo.actualizarDivisionPago(idVenta, {
          descuentoMonto,
          descuentoTipo,
          efectivoUSD,
          pagoMovilUSD,
        });
        if (!res.ok) {
          alert(res.error);
          return;
        }
        this.modales.cerrarTodos();
        this.refrescar();
      },
    });
  }

  eliminarVenta(idVenta) {
    if (!confirm("¿Seguro que deseas eliminar esta venta específica del historial?")) return;
    this.modelo.eliminarVenta(idVenta);
    this.refrescar();
  }

  borrarTodo() {
    if (!confirm("¿Seguro que deseas borrar TODAS las ventas? Esto no se puede deshacer.")) {
      return;
    }
    this.modelo.borrarHistorialCompleto();
    this.refrescar();
  }
}