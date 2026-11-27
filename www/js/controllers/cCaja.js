import mPosCaja from "../models/mPosCaja.js";

export default class cCaja {
  constructor(modelo, vistaCaja, vistaModales, onVentaRegistrada) {
    this.modelo = modelo;
    this.vista = vistaCaja;
    this.modales = vistaModales;
    this.onVentaRegistrada = onVentaRegistrada;

    this.categoriaActiva = "TODAS";
    this.busquedaActual = "";

    this.vista.onSeleccionarCategoria((cat) => {
      this.categoriaActiva = cat;
      this.refrescarCatalogo();
    });

    this.vista.onBuscarProducto((texto) => {
      this.busquedaActual = texto;
      this.refrescarCatalogo();
    });

    this.vista.onAgregarProducto((producto) => {
      this.modelo.ordenActual.agregarProducto(producto);
      this.refrescarOrden();
    });

    this.vista.onEliminarProducto((idProducto) => {
      this.modelo.ordenActual.eliminarUnoPorId(idProducto);
      this.refrescarOrden();
    });

    this.vista.onPausarOrden(() => this.pausarOrden());
    this.vista.onAbrirEspera(() => this.abrirEspera());
    this.vista.onCobrar(() => this.iniciarCobro());

    this.modales.onRestaurarEspera((indice) => this.restaurarComanda(indice));
    this.modales.onEliminarEspera((indice) => this.eliminarComanda(indice));
  }

  refrescarTodo() {
    this.refrescarCatalogo();
    this.refrescarOrden();
    this.vista.actualizarContadorEspera(this.modelo.ordenesEnEspera.length);
  }

  refrescarCatalogo() {
    const categorias = this.modelo.categorias;
    if (this.categoriaActiva !== "TODAS" && !categorias.includes(this.categoriaActiva)) {
      this.categoriaActiva = "TODAS";
    }
    this.vista.renderizarTabsCategorias(categorias, this.categoriaActiva);
    const filtrados = this.modelo.obtenerProductosFiltrados({
      categoria: this.categoriaActiva,
      busqueda: this.busquedaActual,
    });
    this.vista.renderizarProductos(filtrados);
  }

  refrescarOrden() {
    const agrupados = this.modelo.ordenActual.obtenerAgrupados();
    const cantidadTotal = this.modelo.ordenActual.cantidadItems();
    const totalUSD = this.modelo.ordenActual.calcularSubtotalUSD();
    const totalBs = this.modelo.ordenActual.calcularTotalBs(this.modelo.tasaBCV);

    this.vista.renderizarOrden({
      agrupados,
      cantidadTotal,
      totalUSD,
      totalBs,
    });
  }

  pausarOrden() {
    const resultado = this.modelo.pausarOrdenActual(this.vista.cliente, this.vista.notas);
    if (!resultado.ok) {
      alert(resultado.error);
      return;
    }
    this.vista.cliente = "";
    this.vista.notas = "";
    this.refrescarOrden();
    this.vista.actualizarContadorEspera(this.modelo.ordenesEnEspera.length);
  }

  abrirEspera() {
    this.modales.abrirModalEspera(this.modelo.ordenesEnEspera);
  }

  restaurarComanda(indice) {
    if (this.modelo.ordenActual.cantidadItems() > 0) {
      const confirmar = confirm(
        "Ya tienes productos en la orden actual. ¿Deseas reemplazarla? (Se perderá la orden actual)"
      );
      if (!confirmar) return;
    }

    const comanda = this.modelo.restaurarOrdenEspera(indice);
    if (!comanda) return;

    this.vista.cliente = this.modelo.ordenActual.cliente;
    this.vista.notas = this.modelo.ordenActual.notas;
    this.refrescarOrden();
    this.vista.actualizarContadorEspera(this.modelo.ordenesEnEspera.length);
    this.modales.cerrarTodos();
  }

  eliminarComanda(indice) {
    if (!confirm("¿Descartar esta comanda por completo?")) return;
    this.modelo.eliminarOrdenEspera(indice);
    this.vista.actualizarContadorEspera(this.modelo.ordenesEnEspera.length);
    this.modales.abrirModalEspera(this.modelo.ordenesEnEspera);
  }

  iniciarCobro() {
    if (this.modelo.ordenActual.cantidadItems() === 0) {
      alert("Agrega productos primero.");
      return;
    }
    if (this.modelo.tasaBCV <= 0) {
      alert("Ingresa una tasa BCV válida.");
      return;
    }

    this.modales.abrirModalCobroOrden({
      agrupados: this.modelo.ordenActual.obtenerAgrupados(),
      subtotalUSD: this.modelo.ordenActual.calcularSubtotalUSD(),
      tasaBCV: this.modelo.tasaBCV,
      calcularDescuento: mPosCaja.calcularDescuentoUSD,
      onConfirmarPago: ({ metodoPago, esCredito, descuentoMonto, descuentoTipo }) => {
        const venta = this.modelo.registrarVenta({
          cliente: this.vista.cliente,
          notas: this.vista.notas,
          descuentoMonto,
          descuentoTipo,
          esCredito,
          metodoPago,
        });

        alert(
          `Venta registrada.\nCliente: ${venta.cliente}\nTotal Final: $${venta.totalUSD.toFixed(2)}\nEstado: ${venta.estado}`
        );

        this.vista.cliente = "";
        this.vista.notas = "";
        this.refrescarOrden();
        this.modales.cerrarTodos();

        if (this.onVentaRegistrada) {
          this.onVentaRegistrada();
        }
      },
    });
  }
}