// import { Mastering, Preset } from "@spt/models/eft/common/IGlobals";
import { IHandbookItem, IHandbookBase } from "@spt/models/eft/common/tables/IHandbookBase";
import { IQuest } from "@spt/models/eft/common/tables/IQuest";
import { ITemplateItem, IProps } from "@spt/models/eft/common/tables/ITemplateItem";
import { ITrader } from "@spt/models/eft/common/tables/ITrader";
import { IDatabaseTables } from "@spt/models/spt/server/IDatabaseTables";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { IPreset, IMastering } from "@spt/models/eft/common/IGlobals";
import { DatabaseServer } from "@spt/servers/DatabaseServer";
import { JsonUtil } from "@spt/utils/JsonUtil";
import { FileSystem } from "@spt/utils/FileSystem";
import { FileSystemSync } from "@spt/utils/FileSystemSync";
import { DependencyContainer } from "tsyringe";

export abstract class Mass_ModClass {
    container: DependencyContainer;
    logger: ILogger;
    JsonUtil: JsonUtil;
    FileSystem: FileSystem;
    FileSystemSync: FileSystemSync;
    databaseServer: DatabaseServer;
    Table: IDatabaseTables;
    DBitems: Record<string, ITemplateItem>;
    DBhandbooks: IHandbookBase;
    DBhbItems: IHandbookItem[];
    DBprice: Record<string, number>;
    DBlocales: Record<string, Record<string, string>>;
    DBtraders: Record<string, ITrader>;
    // DBquests: Record<string, IQuest>;
    DBpresets: Record<string, IPreset>;
    DBmasterings: IMastering[];
    constructor(container: DependencyContainer) {
        this.container = container;
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.JsonUtil = container.resolve<JsonUtil>("JsonUtil");
        this.FileSystem = container.resolve<FileSystem>("FileSystem");
        this.FileSystemSync = container.resolve<FileSystemSync>("FileSystemSync");
        this.databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        this.Table = this.databaseServer.getTables();
        this.DBitems = this.Table.templates.items;
        this.DBhandbooks = this.Table.templates.handbook;
        this.DBhbItems = this.DBhandbooks.Items;
        this.DBprice = this.Table.templates.prices;
        this.DBlocales = this.Table.locales.global;
        this.DBtraders = this.Table.traders;
        // this.DBquests = this.Table.templates.quests;
        this.DBpresets = this.Table.globals.ItemPresets;
        this.DBmasterings = this.Table.globals.config.Mastering;
    }
}

export interface IComponetData {
    _name: string;
    _enabled: boolean;
}

export interface ILoadingScript {
    onLoadMod(): void;
}

export interface IItemModifyInfo {
    ItemId: string;
    ItemConflictingAddTo?: string[];
    ItemSlotAdd?: IItemSlotAdd[];
    MasteringCloneFromId?: string;
    WeaponCaliberCloneFromId?: string;
    ItemSlotClone?: IItemSlotClone;
    ConflictCloneFromId?: string;
    AmmoCloneFromId?: string;
    Chart?: any;
    ChartType?: string;
    MagCloneCaliberTable?: any;
    MasteringCreate?: IMasteringCreate;
    Shelf?: boolean
}

export interface IItemSlotAdd {
    TargetSlot: string;
    AddTo: string[];
}

export interface IItemSlotClone {
    SlotCloneFromId: string;
    TargetSlots: string[];
}

export interface IMasteringCreate {
    Name: string;
    Level2: number;
    Level3: number
}
export interface IItemClone {
    cloneid: string;
    data: IItemCloneData
}
export interface IItemCloneData {
    _id: string;
    _name?: string;
    _parent?: string;
    _type?: string;
    _props: IProps;
    _proto?: string;
}
export interface ILocProp {
    Name: string;
    ShortName?: string;
    Description?: string;
}
export interface ILocLang {
    templates: Record<string, ILocProp>;
    preset?: Record<string, ILocProp>;
}