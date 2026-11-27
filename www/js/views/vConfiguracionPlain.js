export default class vConfiguracionPlain {
  constructor() {
    this.inNuevaCategoria = document.getElementById("nueva-categoria-input");
    this.btAgregarCategoria = document.getElementById("btn-agregar-categoria");
    this.listaCategorias = document.getElementById("lista-categorias-editable");
    this.badgeConteoCategorias = document.getElementById("badge-conteo-categorias");

    this.inNuevoNombre = document.getElementById("nuevo-nombre");
    this.inNuevoPrecio = document.getElementById("nuevo-precio");
    this.selNuevaCategoria = document.getElementById("nueva-categoria");
    this.btAgregarProducto = document.getElementById("btn-agregar-producto");

    // Mejora 3: Filtros y búsqueda dentro del editor de catálogo
    this.inFiltroInventario = document.getElementById("filtro-inventario-texto");
    this.selFiltroCategoria = document.getElementById("filtro-inventario-categoria");
    this.badgeConteoProductos = document.getElementById("badge-conteo-productos");
    this.listaMenu = document.getElementById("lista-menu-editable");

    // Respaldos JSON
    this.btExportarMenu = document.getElementById("btn-exportar-menu");
    this.btImportarMenu = document.getElementById("btn-importar-menu");
    this.inImportarMenu = document.getElementById("input-importar-menu");

    this.btExportarHistorial = document.getElementById("btn-exportar-historial");
    this.btImportarHistorial = document.getElementById("btn-importar-historial");
    this.inImportarHistorial = document.getElementById("input-importar-historial");

    this._idEditando = null;
    this._onEliminarCategoria = null;
    this._onEditarProducto = null;
    this._onEliminarProducto = null;
    this._onFiltrarInventario = null;

    if (this.inFiltroInventario) {
      this.inFiltroInventario.oninput = () => this._notificarFiltro();
    }
    if (this.selFiltroCategoria) {
      this.selFiltroCategoria.onchange = () => this._notificarFiltro();
    }

    if (this.btImportarMenu && this.inImportarMenu) {
      this.btImportarMenu.onclick = () => this.inImportarMenu.click();
    }
    if (this.btImportarHistorial && this.inImportarHistorial) {
      this.btImportarHistorial.onclick = () => this.inImportarHistorial.click();
    }
  }

  _notificarFiltro() {
    if (this._onFiltrarInventario) {
      this._onFiltrarInventario({
        busqueda: this.inFiltroInventario ? this.inFiltroInventario.value : "",
        categoria: this.selFiltroCategoria ? this.selFiltroCategoria.value : "TODAS",
      });
    }
  }

  get nombreNuevaCategoria() {
    return this.inNuevaCategoria ? this.inNuevaCategoria.value.trim() : "";
  }

  limpiarInputCategoria() {
    if (this.inNuevaCategoria) this.inNuevaCategoria.value = "";
  }

  get datosNuevoProducto() {
    return {
      nombre: this.inNuevoNombre ? this.inNuevoNombre.value.trim() : "",
      precioUSD: this.inNuevoPrecio ? this.inNuevoPrecio.value : "",
      categoria: this.selNuevaCategoria ? this.selNuevaCategoria.value : "",
    };
  }

  limpiarInputsProducto() {
    if (this.inNuevoNombre) this.inNuevoNombre.value = "";
    if (this.inNuevoPrecio) this.inNuevoPrecio.value = "";
  }

  get filtroActual() {
    return {
      busqueda: this.inFiltroInventario ? this.inFiltroInventario.value : "",
      categoria: this.selFiltroCategoria ? this.selFiltroCategoria.value : "TODAS",
    };
  }

  onAgregarCategoria(callback) {
    if (this.btAgregarCategoria) this.btAgregarCategoria.onclick = callback;
  }

  onEliminarCategoria(callback) {
    this._onEliminarCategoria = callback;
  }

  onAgregarProducto(callback) {
    if (this.btAgregarProducto) this.btAgregarProducto.onclick = callback;
  }

  onEditarProducto(callback) {
    this._onEditarProducto = callback;
  }

  onEliminarProducto(callback) {
    this._onEliminarProducto = callback;
  }

  onFiltrarInventario(callback) {
    this._onFiltrarInventario = callback;
  }

  onExportarMenu(callback) {
    if (this.btExportarMenu) this.btExportarMenu.onclick = callback;
  }

  onImportarMenuArchivo(callback) {
    if (this.inImportarMenu) {
      this.inImportarMenu.onchange = () => {
        const archivo = this.inImportarMenu.files?.[0];
        if (!archivo) return;
        this._leerArchivoJSON(archivo, callback);
        this.inImportarMenu.value = "";
      };
    }
  }

  onExportarHistorial(callback) {
    if (this.btExportarHistorial) this.btExportarHistorial.onclick = callback;
  }

  onImportarHistorialArchivo(callback) {
    if (this.inImportarHistorial) {
      this.inImportarHistorial.onchange = () => {
        const archivo = this.inImportarHistorial.files?.[0];
        if (!archivo) return;
        this._leerArchivoJSON(archivo, callback);
        this.inImportarHistorial.value = "";
      };
    }
  }

  _leerArchivoJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        callback(null, json);
      } catch {
        callback("El archivo seleccionado no es un JSON válido.", null);
      }
    };
    reader.readAsText(file);
  }

  renderizarSelectsCategorias(categorias = []) {
    if (this.selNuevaCategoria) {
      const previa = this.selNuevaCategoria.value;
      this.selNuevaCategoria.innerHTML = "";
      for (const cat of categorias) {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        this.selNuevaCategoria.appendChild(opt);
      }
      if (categorias.includes(previa)) {
        this.selNuevaCategoria.value = previa;
      }
    }

    if (this.selFiltroCategoria) {
      const filtroPrevio = this.selFiltroCategoria.value || "TODAS";
      this.selFiltroCategoria.innerHTML = `<option value="TODAS">Todas las categorías</option>`;
      for (const cat of categorias) {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        this.selFiltroCategoria.appendChild(opt);
      }
      this.selFiltroCategoria.value =
        filtroPrevio === "TODAS" || categorias.includes(filtroPrevio)
          ? filtroPrevio
          : "TODAS";
    }
  }

  renderizarListaCategorias(categorias = []) {
    if (this.badgeConteoCategorias) {
      this.badgeConteoCategorias.textContent = `${categorias.length}`;
    }
    if (!this.listaCategorias) return;
    this.listaCategorias.innerHTML = "";

    if (categorias.length === 0) {
      this.listaCategorias.innerHTML = `<li class="item-vacio">Sin categorías registradas.</li>`;
      return;
    }

    categorias.forEach((cat, index) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = cat;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-eliminar";
      btn.textContent = "Borrar";
      btn.onclick = () => {
        if (this._onEliminarCategoria) this._onEliminarCategoria(index);
      };

      li.appendChild(span);
      li.appendChild(btn);
      this.listaCategorias.appendChild(li);
    });
  }

  renderizarListaProductos(productos = [], categorias = []) {
    if (this.badgeConteoProductos) {
      this.badgeConteoProductos.textContent = `${productos.length}`;
    }
    if (!this.listaMenu) return;
    this.listaMenu.innerHTML = "";

    if (productos.length === 0) {
      this.listaMenu.innerHTML = `<li class="item-vacio">No se encontraron productos.</li>`;
      return;
    }

    for (const prod of productos) {
      const li = document.createElement("li");

      if (this._idEditando === prod.id) {
        li.className = "item-edicion-activa";

        const inNombre = document.createElement("input");
        inNombre.type = "text";
        inNombre.value = prod.nombre;
        inNombre.placeholder = "Nombre";

        const inPrecio = document.createElement("input");
        inPrecio.type = "number";
        inPrecio.step = "0.01";
        inPrecio.value = prod.precioUSD;
        inPrecio.placeholder = "Precio ($)";

        const selCat = document.createElement("select");
        for (const cat of categorias) {
          const opt = document.createElement("option");
          opt.value = cat;
          opt.textContent = cat;
          selCat.appendChild(opt);
        }
        selCat.value = prod.categoria;

        const grupoBtns = document.createElement("div");
        grupoBtns.className = "acciones-item-edicion";

        const btnGuardar = document.createElement("button");
        btnGuardar.type = "button";
        btnGuardar.className = "btn-accion btn-pagar-credito";
        btnGuardar.textContent = "Guardar";
        btnGuardar.onclick = () => {
          if (this._onEditarProducto) {
            const ok = this._onEditarProducto(prod.id, {
              nombre: inNombre.value,
              precioUSD: inPrecio.value,
              categoria: selCat.value,
            });
            if (ok !== false) {
              this._idEditando = null;
            }
          }
        };

        const btnCancelar = document.createElement("button");
        btnCancelar.type = "button";
        btnCancelar.className = "btn-accion btn-editar-pago";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.onclick = () => {
          this._idEditando = null;
          this._notificarFiltro();
        };

        grupoBtns.appendChild(btnGuardar);
        grupoBtns.appendChild(btnCancelar);

        li.appendChild(inNombre);
        li.appendChild(inPrecio);
        li.appendChild(selCat);
        li.appendChild(grupoBtns);
      } else {
        const span = document.createElement("span");
        span.innerHTML = `<strong>${prod.nombre}</strong> — $${prod.precioUSD.toFixed(2)} <small style="color:var(--text-muted);">(${prod.categoria})</small>`;

        const grupoBtns = document.createElement("div");
        grupoBtns.className = "acciones-item-edicion";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn-accion btn-editar-pago";
        btnEditar.textContent = "Editar";
        btnEditar.onclick = () => {
          this._idEditando = prod.id;
          this._notificarFiltro();
        };

        const btnBorrar = document.createElement("button");
        btnBorrar.type = "button";
        btnBorrar.className = "btn-eliminar";
        btnBorrar.textContent = "Borrar";
        btnBorrar.onclick = () => {
          if (this._onEliminarProducto) this._onEliminarProducto(prod.id);
        };

        grupoBtns.appendChild(btnEditar);
        grupoBtns.appendChild(btnBorrar);

        li.appendChild(span);
        li.appendChild(grupoBtns);
      }

      this.listaMenu.appendChild(li);
    }
  }
}