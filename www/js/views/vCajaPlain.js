export default class vCajaPlain {
  constructor() {
    this.tabsCategorias = document.getElementById("tabs-categorias");
    this.inBusquedaMenu = document.getElementById("busqueda-menu");
    this.contenedorProductos = document.getElementById("contenedor-productos");

    this.inCliente = document.getElementById("nombre-cliente");
    this.inNotas = document.getElementById("notas-orden");
    this.listaOrden = document.getElementById("lista-orden");
    this.lblTotalUSD = document.getElementById("total-usd");
    this.lblTotalBs = document.getElementById("total-bs");

    this.btPausar = document.getElementById("btn-pausar-orden");
    this.btVerEspera = document.getElementById("btn-ver-espera");
    this.btCobrar = document.getElementById("btn-cobrar");

    // Barra flotante inferior para móvil (salto rápido a la orden actual)
    this.barraFlotante = document.getElementById("barra-orden-movil");
    this.lblBarraItems = document.getElementById("barra-movil-items");
    this.lblBarraTotal = document.getElementById("barra-movil-total");
    this.btIrOrden = document.getElementById("btn-ir-orden");
    this.seccionCuenta = document.getElementById("cuenta");

    this._onSeleccionarCategoria = null;
    this._onBuscarProducto = null;
    this._onAgregarProducto = null;
    this._onEliminarProducto = null;

    if (this.inBusquedaMenu) {
      this.inBusquedaMenu.oninput = () => {
        if (this._onBuscarProducto) {
          this._onBuscarProducto(this.inBusquedaMenu.value);
        }
      };
    }

    if (this.btIrOrden && this.seccionCuenta) {
      this.btIrOrden.onclick = () => {
        this.seccionCuenta.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
  }

  get cliente() {
    return this.inCliente ? this.inCliente.value.trim() : "";
  }

  set cliente(valor) {
    if (this.inCliente) this.inCliente.value = valor ?? "";
  }

  get notas() {
    return this.inNotas ? this.inNotas.value.trim() : "";
  }

  set notas(valor) {
    if (this.inNotas) this.inNotas.value = valor ?? "";
  }

  get busquedaMenu() {
    return this.inBusquedaMenu ? this.inBusquedaMenu.value : "";
  }

  onSeleccionarCategoria(callback) {
    this._onSeleccionarCategoria = callback;
  }

  onBuscarProducto(callback) {
    this._onBuscarProducto = callback;
  }

  onAgregarProducto(callback) {
    this._onAgregarProducto = callback;
  }

  onEliminarProducto(callback) {
    this._onEliminarProducto = callback;
  }

  onPausarOrden(callback) {
    if (this.btPausar) this.btPausar.onclick = callback;
  }

  onAbrirEspera(callback) {
    if (this.btVerEspera) this.btVerEspera.onclick = callback;
  }

  onCobrar(callback) {
    if (this.btCobrar) this.btCobrar.onclick = callback;
  }

  actualizarContadorEspera(cantidad) {
    if (this.btVerEspera) {
      this.btVerEspera.textContent = `📝 En Espera (${cantidad})`;
    }
  }

  // Mejora 2: Pestañas horizontales de categorías para evitar apilamiento largo
  renderizarTabsCategorias(categorias = [], categoriaActiva = "TODAS") {
    if (!this.tabsCategorias) return;
    this.tabsCategorias.innerHTML = "";

    const opciones = ["TODAS", ...categorias];
    for (const cat of opciones) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-categoria" + (cat === categoriaActiva ? " activa" : "");
      btn.textContent = cat === "TODAS" ? "Todas" : cat;
      btn.onclick = () => {
        if (this._onSeleccionarCategoria) {
          this._onSeleccionarCategoria(cat);
        }
      };
      this.tabsCategorias.appendChild(btn);
    }
  }

  renderizarProductos(productos = []) {
    if (!this.contenedorProductos) return;
    this.contenedorProductos.innerHTML = "";

    if (productos.length === 0) {
      this.contenedorProductos.innerHTML =
        `<p class="empty-menu">No hay productos que coincidan con el filtro.</p>`;
      return;
    }

    const grid = document.createElement("div");
    grid.className = "grupo-botones";

    for (const prod of productos) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-comida";
      btn.innerHTML = `
        <span class="btn-comida-nombre">${prod.nombre}</span>
        <span class="btn-comida-precio">$${prod.precioUSD.toFixed(2)}</span>
      `;
      btn.onclick = () => {
        if (this._onAgregarProducto) {
          this._onAgregarProducto(prod);
        }
      };
      grid.appendChild(btn);
    }

    this.contenedorProductos.appendChild(grid);
  }

  renderizarOrden({ agrupados = [], cantidadTotal = 0, totalUSD = 0, totalBs = 0 }) {
    if (!this.listaOrden) return;
    this.listaOrden.innerHTML = "";

    if (agrupados.length === 0) {
      this.listaOrden.innerHTML = `<li class="empty-state"><em>Sin productos en la orden</em></li>`;
    } else {
      for (const item of agrupados) {
        const li = document.createElement("li");
        const cantHtml = item.cantidad > 1 ? `<b>${item.cantidad}x</b> ` : "";

        const spanInfo = document.createElement("span");
        spanInfo.innerHTML = `${cantHtml}${item.producto.nombre}`;

        const spanDer = document.createElement("span");
        spanDer.textContent = `$${item.subtotalUSD.toFixed(2)} `;

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "btn-eliminar";
        btnEliminar.style.marginLeft = "10px";
        btnEliminar.textContent = "X";
        btnEliminar.onclick = () => {
          if (this._onEliminarProducto) {
            this._onEliminarProducto(item.producto.id);
          }
        };

        spanDer.appendChild(btnEliminar);
        li.appendChild(spanInfo);
        li.appendChild(spanDer);
        this.listaOrden.appendChild(li);
      }
    }

    if (this.lblTotalUSD) this.lblTotalUSD.textContent = totalUSD.toFixed(2);
    if (this.lblTotalBs) this.lblTotalBs.textContent = totalBs.toFixed(2);

    if (this.barraFlotante) {
      this.barraFlotante.classList.toggle("visible", cantidadTotal > 0);
      if (this.lblBarraItems) {
        this.lblBarraItems.textContent =
          cantidadTotal === 1 ? "1 ítem" : `${cantidadTotal} ítems`;
      }
      if (this.lblBarraTotal) {
        this.lblBarraTotal.textContent = `$${totalUSD.toFixed(2)} · Bs.${totalBs.toFixed(2)}`;
      }
    }
  }
}