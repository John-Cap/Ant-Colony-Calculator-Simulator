import { registerDriver } from "./drivers.js";
import { GateORANDDriver } from "./or_and_driver.js";

registerDriver("GateORAND", GateORANDDriver);