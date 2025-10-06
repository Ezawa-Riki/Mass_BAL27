"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//Custom
const Mass_ModApi_1 = require("./Mass_ModApi");
class MainLoader {
    mod;
    logger;
    MassModApi;
    ThisModPath;
    databaseServer;
    jsonUtil;
    preSptModLoader;
    FileSystemSync;
    beforeLoadHbList;
    beforeLoadItemList;
    componetList;
    traderHelper;
    constructor() {
        this.beforeLoadHbList = new Array();
        this.beforeLoadItemList = new Array();
    }
    /**
     * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
     * @param container Dependency container
     */
    preSptLoad(container) {
        // Get a logger
        this.mod = "Mass_BAL27"; // Set name of mod so we can log it to console later
        this.logger = container.resolve("WinstonLogger");
        // this.logger.debug(`[${this.mod}] Loading... `);
        this.preSptModLoader = container.resolve("PreSptModLoader");
        this.ThisModPath = this.preSptModLoader.getModPath(this.mod);
        this.FileSystemSync = container.resolve("FileSystemSync");
    }
    /**
     * Majority of trader-related work occurs after the Spt database has been loaded but prior to SPT code being run
     * @param container Dependency container
     */
    postDBLoad(container) {
        // this.logger.debug(`[${this.mod}] Delayed Loading... `);
        this.databaseServer = container.resolve("DatabaseServer");
        this.jsonUtil = container.resolve("JsonUtil");
        this.MassModApi = new Mass_ModApi_1.Mass_ModApi(container);
        this.MassModApi.initMod(this.ThisModPath);
        const MThisModPath = this.MassModApi.ThisModPathNodes;
        this.componetList = new Array();
        for (const x in MThisModPath.componets) {
            if (MThisModPath.componets[x].componet != undefined) {
                const ComponetData = this.MassModApi.jsonRead(MThisModPath.componets[x].componet);
                if (ComponetData._enabled) {
                    this.logger.log(`Mass_NewItems Loading componet: ${ComponetData._name}`, "cyan");
                    this.componetList.push(x);
                }
                else {
                    this.logger.log(`Component ${ComponetData._name} will NOT be loaded due to the configuration.`, "yellow");
                }
            }
        }
        // this.logger.debug(`[${this.mod}] Loaded`);
        this.loadComponetList(container, this.componetList);
    }
    postSptLoad(container) {
        return;
    }
    loadComponetList(container, ComponetList) {
        const BundleLoader = container.resolve("BundleLoader");
        for (const i in ComponetList) {
            const componetFilePath = `${this.ThisModPath}componets/${ComponetList[i]}/`;
            if (this.FileSystemSync.exists(`${this.ThisModPath}src/scripts/${ComponetList[i]}/${ComponetList[i]}.ts`)) {
                Promise.resolve(`${`./scripts/${ComponetList[i]}/${ComponetList[i]}`}`).then(s => __importStar(require(s))).then(ModJs => {
                    const ModInst = new ModJs.default(container, this.MassModApi);
                    ModInst.onLoadMod();
                    this.logger.log(`Scripts loaded for ${ComponetList[i]}`, "blue");
                });
            }
            else {
                this.logger.log(`No Scripts loaded for ${ComponetList[i]}`, "magenta");
            }
            if (this.FileSystemSync.exists(`${componetFilePath}bundles.json`)) {
                BundleLoader.addBundles(componetFilePath);
                this.logger.log(`Bunlde loaded for ${ComponetList[i]}`, "blue");
            }
        }
    }
}
module.exports = { mod: new MainLoader() };
//# sourceMappingURL=mod.js.map