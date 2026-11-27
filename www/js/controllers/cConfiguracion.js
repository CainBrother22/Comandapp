export default class cConfiguracion {
  constructor(modelo, vistaConfig, vistaModales, onCatalogoActualizado, onHistorialImportado) {
    this.modelo = modelo;
    this.vista = vistaConfig;
    this.modales = vistaModales;
    this.onCatalogoActualizado = onCatalogoActualizado;
    this.onHistorialImportado = onHistorialImportado;

    this.vista.onAgregarCategoria(() => this.agregarCategoria());
    this.vista.onEliminarCategoria((indice) => this.eliminarCategoria(indice));
    this.vista.onAgregarProducto(() => this.agregarProducto());
    this.vista.onEditarProducto((id, datos) => this.editarProducto(id, datos));
    this.vista.onEliminarProducto((id) => this.eliminarProducto(id));
    this.vista.onFiltrarInventario(() => this.refrescarInventarioFiltrado());

    this.vista.onExportarMenu(() => this.exportarMenu());
    this.vista.onImportarMenuArchivo((err, json) => this.importarMenu(err, json));
    this.vista.onExportarHistorial(() => this.exportarHistorial());
    this.vista.onImportarHistorialArchivo((err, json) => this.importarHistorial(err, json));
  }

  refrescar() {
    const categorias = this.modelo.categorias;
    this.vista.renderizarSelectsCategorias(categorias);
    this.vista.renderizarListaCategorias(categorias);
    this.refrescarInventarioFiltrado();
  }

  refrescarInventarioFiltrado() {
    const { busqueda, categoria } = this.vista.filtroActual;
    const filtrados = this.modelo.obtenerProductosFiltrados({ categoria, busqueda });
    this.vista.renderizarListaProductos(filtrados, this.modelo.categorias);
  }

  agregarCategoria() {
    const res = this.modelo.agregarCategoria(this.vista.nombreNuevaCategoria);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    this.vista.limpiarInputCategoria();
    this.refrescar();
    if (this.onCatalogoActualizado) this.onCatalogoActualizado();
  }

  eliminarCategoria(indice) {
    const nombreCat = this.modelo.categorias[indice];
    if (!nombreCat) return;
    if (!confirm(`¿Borrar categoría "${nombreCat}"? Los productos en ella no se mostrarán.`)) {
      return;
    }
    this.modelo.eliminarCategoria(indice);
    this.refrescar();
    if (this.onCatalogoActualizado) this.onCatalogoActualizado();
  }

  agregarProducto() {
    const res = this.modelo.agregarProducto(this.vista.datosNuevoProducto);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    this.vista.limpiarInputsProducto();
    this.refrescar();
    if (this.onCatalogoActualizado) this.onCatalogoActualizado();
    alert("Producto agregado.");
  }

  editarProducto(idProducto, datos) {
    const res = this.modelo.editarProducto(idProducto, datos);
    if (!res.ok) {
      alert(res.error);
      return false;
    }
    this.refrescar();
    if (this.onCatalogoActualizado) this.onCatalogoActualizado();
    return true;
  }

  eliminarProducto(idProducto) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    this.modelo.eliminarProducto(idProducto);
    this.refrescar();
    if (this.onCatalogoActualizado) this.onCatalogoActualizado();
  }

  async exportarMenu() {
    const res = await this.modelo.exportarMenu();
    alert(res.ok ? `✅ ${res.mensaje}` : `❌ Error: ${res.error}`);
  }

  importarMenu(err, json) {
    if (err) {
      alert(`❌ ${err}`);
      return;
    }
    const res = this.modelo.analizarImportacionMenu(json);
    if (!res.ok) {
      alert(`❌ ${res.error}`);
      return;
    }

    this.refrescar();
    if (this.onCatalogoActualizado) this.onCatalogoActualizado();

    let msg = "";
    if (res.catsAgregadas > 0) msg += `• ${res.catsAgregadas} categoría(s) agregada(s).\n`;
    if (res.productosAgregados > 0) {
      msg += `• ${res.productosAgregados} producto(s) nuevo(s) importado(s).\n`;
    }

    if (res.conflictos.length > 0) {
      msg += `• ${res.conflictos.length} producto(s) duplicado(s) detectado(s).`;
      this.modales.abrirModalConflictos(res.conflictos, (accion) => {
        const resolucion = this.modelo.resolverConflictosMenu(res.conflictos, accion);
        this.refrescar();
        if (this.onCatalogoActualizado) this.onCatalogoActualizado();
        if (accion === "reemplazar") {
          alert(`✅ ${resolucion.reemplazados} producto(s) reemplazado(s) correctamente.`);
        } else {
          alert(`⏭️ ${res.conflictos.length} producto(s) duplicado(s) omitido(s).`);
        }
      });
    }

    if (msg) alert(msg.trim());
    else if (res.conflictos.length === 0) alert("✅ Menú importado correctamente.");
  }

  async exportarHistorial() {
    const res = await this.modelo.exportarHistorial();
    alert(res.ok ? `✅ ${res.mensaje}` : `⚠️ ${res.error}`);
  }

  importarHistorial(err, json) {
    if (err) {
      alert(`❌ ${err}`);
      return;
    }
    const res = this.modelo.importarHistorial(json);
    if (!res.ok) {
      alert(`❌ ${res.error}`);
      return;
    }

    if (this.onHistorialImportado) this.onHistorialImportado();
    alert(
      `✅ Importación completada:\n• ${res.importados} venta(s) importada(s).\n• ${res.omitidos} venta(s) omitida(s) por duplicado de ID.`
    );
  }
}