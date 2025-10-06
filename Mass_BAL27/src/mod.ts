import { DependencyContainer } from "tsyringe";

// SPT types
import { IPreSptLoadMod } from "@spt/models/external/IPreSptLoadMod";
import { IPostDBLoadMod } from "@spt/models/external/IPostDBLoadMod";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { PreSptModLoader } from "@spt/loaders/PreSptModLoader";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { BundleLoader } from "@spt/loaders/BundleLoader";

// New trader settings
import baseJson = require("../db/base.json");
import { TraderHelper } from "./traderHelpers";

//Custom
import { Mass_ModApi } from "./Mass_ModApi";
import { IComponetData } from "./Mass_ModClass";
import { FileSystemSync } from "@spt/utils/FileSystemSync";


class MainLoader implements IPreSptLoadMod, IPostDBLoadMod 
{
    mod: string;
    logger: ILogger;
    MassModApi: Mass_ModApi;
    ThisModPath: string;
    databaseServer: DatabaseServer;
    jsonUtil: JsonUtil;
    preSptModLoader: PreSptModLoader;
    FileSystemSync: FileSystemSync;
    beforeLoadHbList: string[];
    beforeLoadItemList: string[];
    componetList: string[]
    private traderHelper: TraderHelper;

    constructor() 
    {
        this.beforeLoadHbList = new Array<string>();
        this.beforeLoadItemList = new Array<string>();
    }

    /**
     * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
     * @param container Dependency container
     */
    public preSptLoad(container: DependencyContainer): void 
    {
        // Get a logger

        this.mod = "Mass_BAL27"; // Set name of mod so we can log it to console later
        this.logger = container.resolve<ILogger>("WinstonLogger");
        // this.logger.debug(`[${this.mod}] Loading... `);
        this.preSptModLoader = container.resolve<PreSptModLoader>("PreSptModLoader");
        this.ThisModPath = this.preSptModLoader.getModPath(this.mod);
        this.FileSystemSync = container.resolve<FileSystemSync>("FileSystemSync");
    }

    /**
     * Majority of trader-related work occurs after the Spt database has been loaded but prior to SPT code being run
     * @param container Dependency container
     */
    public postDBLoad(container: DependencyContainer): void 
    {
        // this.logger.debug(`[${this.mod}] Delayed Loading... `);
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.jsonUtil = container.resolve<JsonUtil>("JsonUtil");

        this.MassModApi = new Mass_ModApi(container);
        this.MassModApi.initMod(this.ThisModPath);



        const MThisModPath = this.MassModApi.ThisModPathNodes;
        this.componetList = new Array<string>();
        for (const x in MThisModPath.componets) 
        {
            if (MThisModPath.componets[x].componet != undefined) 
            {
                const ComponetData = this.MassModApi.jsonRead(MThisModPath.componets[x].componet) as IComponetData;

                if (ComponetData._enabled) 
                {
                    this.logger.log(`Mass_NewItems Loading componet: ${ComponetData._name}`, "cyan");
                    this.componetList.push(x);
                }
                else 
                {
                    this.logger.log(`Component ${ComponetData._name} will NOT be loaded due to the configuration.`, "yellow");
                }
            }
        }
        // this.logger.debug(`[${this.mod}] Loaded`);
        this.loadComponetList(container, this.componetList);
    }

    public postSptLoad(container: DependencyContainer): void 
    {
        return;
    }




    private loadComponetList(container: DependencyContainer, ComponetList: string[]): void 
    {
        const BundleLoader = container.resolve<BundleLoader>("BundleLoader");
        for (const i in ComponetList) 
        {
            const componetFilePath = `${this.ThisModPath}componets/${ComponetList[i]}/`;
            if (this.FileSystemSync.exists(`${this.ThisModPath}src/scripts/${ComponetList[i]}/${ComponetList[i]}.ts`)) 
            {
                import(`./scripts/${ComponetList[i]}/${ComponetList[i]}`).then(ModJs =>
                {
                    const ModInst = new ModJs.default(container, this.MassModApi);
                    ModInst.onLoadMod();
                    this.logger.log(`Scripts loaded for ${ComponetList[i]}`, "blue");
                });
            }
            else 
            {
                this.logger.log(`No Scripts loaded for ${ComponetList[i]}`, "magenta");
            }
            if (this.FileSystemSync.exists(`${componetFilePath}bundles.json`)) 
            {
                BundleLoader.addBundles(componetFilePath);
                this.logger.log(`Bunlde loaded for ${ComponetList[i]}`, "blue");
            }
        }
    }
}

module.exports = { mod: new MainLoader() }