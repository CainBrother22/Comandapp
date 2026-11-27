import vCajaPlain from "./views/vCajaPlain.js";
import vHistorialPlain from "./views/vHistorialPlain.js";
import vConfiguracionPlain from "./views/vConfiguracionPlain.js";
import vModalesPlain from "./views/vModalesPlain.js";
import cPosPrincipal from "./controllers/cPosPrincipal.js";

const vistaCaja = new vCajaPlain();
const vistaHistorial = new vHistorialPlain();
const vistaConfig = new vConfiguracionPlain();
const vistaModales = new vModalesPlain();

new cPosPrincipal({
  vistaCaja,
  vistaHistorial,
  vistaConfig,
  vistaModales,
});