import { DependencyContainer } from "tsyringe";

import { IPreset } from "@spt/models/eft/common/IGlobals";
import { IHandbookItem } from "@spt/models/eft/common/tables/IHandbookBase";
import { ITemplateItem, ISlot } from "@spt/models/eft/common/tables/ITemplateItem";
import { IBarterScheme, ITraderAssort } from "@spt/models/eft/common/tables/ITrader";
import { BaseClasses } from "@spt/models/enums/BaseClasses";
import { Money } from "@spt/models/enums/Money";
import { IPmcConfig } from "@spt/models/spt/config/IPmcConfig";
import fs from "fs";
import path from "path";
import { IItemClone, IItemModifyInfo, ILocLang, ILocProp, Mass_ModClass } from "./Mass_ModClass";

import { ConfigTypes } from "@spt/models/enums/ConfigTypes";
import { ConfigServer } from "@spt/servers/ConfigServer";
import { CustomItemService } from "@spt/services/mod/CustomItemService";

const IsDebugging = false
export class Mass_ModApi extends Mass_ModClass 
{
    ThisModPathNodes: any;
    newItemList: string[];
    customItem: CustomItemService
    constructor(container: DependencyContainer) 
    {
        super(container);
        this.newItemList = [];
        this.customItem = this.container.resolve<CustomItemService>("CustomItemService");
    }
    /**
     * Initialize mod path nodes and other things
     * @param {*} Str_ThisModPath This Mod's Path
     */
    public initMod(Str_ThisModPath: string): void 
    {
        this.ThisModPathNodes = this.LoopThroughThatBith(Str_ThisModPath);
    }
    public itemSetPrefab(itemId: string, prefabPath: string): void 
    {
        this.DBitems[itemId]._props.Prefab.path = prefabPath;
    }
    /**
     * Clone a handbook by id
     * @param {*} cloneid ID of the item clone from
     * @returns the new handbook Object
     */
    public cloneHandbookById(cloneid: string): IHandbookItem 
    {
        const DBhbItems = this.DBhbItems;
        const MUtils_JsonUtil = this.JsonUtil;
        const handbook: IHandbookItem = {
            "Id": "Dummy",
            "ParentId": "Dummy",
            "Price": 1
        }
        for (const x in DBhbItems) 
        {
            if (DBhbItems[x].Id == cloneid) 
            {
                return MUtils_JsonUtil.clone(DBhbItems[x]);
            }
        }
        this.logger.log(`cloneHandbookById have not found handbook for ${cloneid}`, "red");
        return handbook;
    }

    private LoopThroughThatBith(filepath: string) 
    {
        const baseNode = {};
        const directories: string[] = this.getDirList(filepath);
        const files: string[] = fs.readdirSync(filepath);

        // remove all directories from files
        for (const directory of directories) 
        {
            for (const file in files) 
            {
                if (files[file] === directory) 
                {
                    files.splice(file as any, 1);
                }
            }
        }

        // make sure to remove the file extention
        for (const node in files) 
        {
            const fileName = files[node].split(".").slice(0, -1).join(".");
            baseNode[fileName] = filepath + files[node];
            baseNode[fileName] = path.resolve(baseNode[fileName]);
        }

        // deep tree search
        for (const node of directories) 
        {
            baseNode[node] = this.LoopThroughThatBith(filepath + node + "/");
        }

        return baseNode;
    }
    private getDirList(path: string) 
    {
        return fs.readdirSync(path).filter(function (file) 
        {
            return fs.statSync(path + "/" + file).isDirectory();
        });
    }
    /**
     * Read in Json file
     * @param {*} filePath Path of json file to read
     * @returns json Object
     */
    public async jsonReadAsync(filePath: string): Promise<any> 
    {
        return this.JsonUtil.deserialize(await this.FileSystem.read(filePath));
    }
    /**
     * Read in Json file
     * @param {*} filePath Path of json file to read
     * @returns json Object
     */
    public jsonRead(filePath: string): any 
    {
        return this.JsonUtil.deserialize(this.FileSystemSync.read(filePath));
    }
    /**
    * load Clone Items from folder
    * @param {*} folderPath folder path node of item to clone
    */
    public loadCloneItems(folderPath: string[]): void 
    {
        for (const x in folderPath) 
        {
            const clonelist = this.jsonRead(folderPath[x]) as IItemClone[];
            for (const it in clonelist) 
            {
                const itemToAdd = this.cloneItem(clonelist[it].cloneid, it);
                this.copyValue(itemToAdd, clonelist[it].data);
                this.DBitems[itemToAdd._id] = itemToAdd;
                this.registerNewItem(itemToAdd._id);
            }
        }
    }
    /**
     * Copy value in OrgItem to the coresponding value in TargetItem
     * @param {*} TargetItem Object Target Item
     * @param {*} OrgItem Object Original Item
     */
    public copyValue(TargetItem: any, OrgItem: any): void 
    {
        for (const data in OrgItem) 
        {
            if (TargetItem[data] != null) 
            {
                if (data == "effects_damage" || data == "effects_health") 
                {
                    TargetItem[data] = OrgItem[data];
                }
                else
                    if (typeof OrgItem[data] === "string" || typeof OrgItem[data] === "number" || typeof OrgItem[data] === "boolean") 
                    {
                        if (TargetItem[data] != OrgItem[data]) 
                        {
                            TargetItem[data] = OrgItem[data];
                        }
                    }
                    else
                        if (typeof OrgItem[data] === "object") 
                        {
                            this.copyValue(TargetItem[data], OrgItem[data]);
                        }
            }
        }
    }
    /**
     * Clone a item and rename it with a unique id
     * @param {*} cloneId ID of the item clone from
     * @param {*} id ID for the new item
     * @returns the new item Object
     */
    public cloneItem(cloneId: string, id: string): ITemplateItem 
    {
        const item = this.JsonUtil.clone(this.DBitems[cloneId]);
        item._id = id;
        this.processItemCartridges(item);
        this.processItemChambers(item);
        this.processItemSlots(item);
        return item;
    }
    private indexTo2DigitsHexStr(x: string): string 
    {
        let xid: string = parseInt(x).toString(16);
        if (parseInt(x) < 16) 
        {
            xid = "0" + xid
        }
        return xid;
    }
    //Rename slots, chambers and cartridges with unique id.
    public processItemSlots(item: ITemplateItem): void 
    {
        if (this.doesItemHaveSlots(item)) 
        {
            for (const x in item._props.Slots) 
            {
                item._props.Slots[x]._id = `${item._id.substring(0, 21)}a${this.indexTo2DigitsHexStr(x)}`;
                item._props.Slots[x]._parent = item._id;
            }
        }
        else 
        {
            return;
        }
    }

    public processItemChambers(item: ITemplateItem): void 
    {
        if (this.doesItemHaveChambers(item)) 
        {
            for (const x in item._props.Chambers) 
            {
                item._props.Chambers[x]._id = `${item._id.substring(0, 21)}c${this.indexTo2DigitsHexStr(x)}`;
                item._props.Chambers[x]._parent = item._id;
            }
        }
        else 
        {
            return;
        }
    }

    public processItemCartridges(item: ITemplateItem): void 
    {
        if (this.doesItemHaveCartridges(item)) 
        {
            for (const x in item._props.Cartridges) 
            {
                item._props.Cartridges[x]._id = `${item._id.substring(0, 21)}b${this.indexTo2DigitsHexStr(x)}`;
                item._props.Cartridges[x]._parent = item._id;
            }
        }
        else 
        {
            return;
        }
    }
    public registerNewItem(itemId: string): void 
    {
        if (this.newItemList.includes(itemId)) 
        {
            this.logger.log(`newItemList already add ${itemId}`, "red");
        }
        else 
        {
            this.newItemList.push(itemId);
        }
    }

    public doesItemHaveSlots(item: ITemplateItem): boolean 
    {
        if (item._props != null) 
        {
            return item._props.Slots != null;
        }
        else 
        {
            return false;
        }
    }

    public doesItemHaveChambers(item: ITemplateItem): boolean 
    {
        if (item._props != null) 
        {
            return item._props.Chambers != null;
        }
        else 
        {
            return false;
        }
    }

    public doesItemHaveCartridges(item: ITemplateItem): boolean 
    {
        if (item._props != null) 
        {
            return item._props.Cartridges != null;
        }
        else 
        {
            return false;
        }
    }
    /**
     * Initialize mod path nodes and other things
     * @param {*} filePath File path of handbook.json
     */
    public loadHandbooksfromFile(filePath: string): void 
    {
        const hbToAddList = this.jsonRead(filePath).Items as IHandbookItem[];
        for (const x in hbToAddList) 
        {
            this.DBhbItems.push(hbToAddList[x]);
        }
    }
    public addNewLoc(itemId: string, lang: string, loctoAdd: ILocProp): void 
    {
        this.DBlocales[lang][`${itemId} Name`] = loctoAdd.Name;
        this.DBlocales[lang][`${itemId} ShortName`] = loctoAdd.ShortName;
        this.DBlocales[lang][`${itemId} Description`] = loctoAdd.Description;
    }
    /**
     * Load assorts to Database
     * @param {*} folderPath folder path node of locales
     */
    public loadLocales(folderPath: Record<string, string>, locLangs?: Record<string, ILocLang>): void 
    {
        let Obj: boolean = false;
        if (locLangs != undefined) 
        {
            Obj = true;
        }

        const langlist: string[] = new Array<string>();
        if (!Obj) 
        {
            for (const lang in folderPath) 
            {
                langlist.push(lang);
            }
        }
        else 
        {
            for (const lang in locLangs) 
            {
                langlist.push(lang);
            }
        }
        for (const lang in this.DBlocales) 
        {
            if (langlist.includes(lang)) 
            {
                const toAdd: ILocLang = Obj ? locLangs[lang] : this.jsonRead(folderPath[lang]);
                for (const data in toAdd.templates) 
                {
                    const loc = toAdd.templates[data] as ILocProp;
                    this.addNewLoc(data, lang, loc);
                }
                for (const data in toAdd.preset) 
                {
                    this.DBlocales[lang][data] = toAdd.preset[data].Name;
                }
            }
            else 
            {
                const toAdd: ILocLang = Obj ? locLangs.en : this.jsonRead(folderPath.en);

                for (const data in toAdd.templates) 
                {
                    const loc = toAdd.templates[data] as ILocProp;
                    this.addNewLoc(data, lang, loc);
                }
                for (const data in toAdd.preset) 
                {
                    this.DBlocales[lang][data] = toAdd.preset[data].Name;
                }
            }
        }
    }
    /**
    * Get a index number of a slot of a item in DB
    * @param {*} slotname name of the slot
    * @param {*} itemID ID of the item
    * @returns index number of the slot
    */
    public itemGetSlotNumbyName(slotname: string, itemID: string): number 
    {
        if (this.DBitems[itemID] == null) 
        {
            throw `itemGetSlotbyName Error: No such item ${itemID}`;
        }
        else 
        {
            if (this.DBitems[itemID]._props.Slots == null) 
            {
                throw `itemGetSlotbyName Error: item ${itemID} has no slots`;
            }
            else 
            {
                for (const x in this.DBitems[itemID]._props.Slots) 
                {
                    if (this.DBitems[itemID]._props.Slots[x]._name == slotname) 
                    {
                        return Number(x);
                    }
                }
                throw `itemGetSlotbyName Error: item ${itemID} has no slots named ${slotname}`;
            }
        }
    }

    /**
     * Get a index number of a slot of a item Object
     * @param {*} slotname name of the slot
     * @param {*} itemObj the item Obj
     * @returns index number of the slot
     */
    public itemObjGetSlotNumbyName(slotname: string, itemObj: ITemplateItem): number 
    {
        for (const x in itemObj._props.Slots) 
        {
            if (itemObj._props.Slots[x]._name == slotname) 
            {
                return Number(x);
            }
        }
    }
    /**
     * Get a slot of a item in DB
     * @param {*} slotname name of the slot
     * @param {*} itemID ID of the item
     * @returns Reference of the slot
     */
    public itemGetSlotbyName(slotname: string, itemID: string): ISlot 
    {
        let slotToReturn: ISlot = {
            "_name": "dummy",
            "_id": "dummy",
            "_parent": "dummy",
            "_props": {
                "filters": [
                    {
                        "Shift": 0,
                        "Filter": [
                        ]
                    }
                ]
            },
            "_required": false,
            "_mergeSlotWithChildren": false,
            "_proto": "55d30c4c4bdc2db4468b457e"
        }
        if (this.DBitems[itemID] == undefined) 
        {
            this.logger.log(`itemGetSlotbyName Error: No such item ${itemID}`, "red");
            return slotToReturn;
        }
        else 
        {
            if (this.DBitems[itemID]._props.Slots == undefined) 
            {
                this.logger.log(`itemGetSlotbyName Error: item ${itemID} has no slots`, "red");
                return slotToReturn;
            }
            else 
            {
                for (const x in this.DBitems[itemID]._props.Slots) 
                {
                    if (this.DBitems[itemID]._props.Slots[x]._name == slotname) 
                    {
                        slotToReturn = this.DBitems[itemID]._props.Slots[x];
                        return slotToReturn;
                    }
                }
                this.logger.log(`itemGetSlotbyName Error: item ${itemID} has no slots named ${slotname}`, "red");
                return slotToReturn;
            }
        }
    }
    /**
     * Generate assort from weapon preset
     * @returns assrotId
     */
    public traderAddItems(Id: string, Price: number, trader: string, loyal: number = 1, currency: string = Money.ROUBLES, postfix: string = "3"): string 
    {
        const pflegth = postfix.length
        const assortId = postfix + Id.slice(pflegth);
        this.DBtraders[trader].assort.items.push({
            "_id": assortId,
            "_tpl": Id,
            "parentId": "hideout",
            "slotId": "hideout",
            "upd": {
                "UnlimitedCount": true,
                "StackObjectsCount": 999999999
            }
        });
        if (this.DBtraders[trader].assort.barter_scheme[assortId] != undefined) 
        {
            this.logger.log(`assort ${assortId} duplicated`, "red")
        }
        this.DBtraders[trader].assort.barter_scheme[assortId] = [
            [{
                "count": Price,
                "_tpl": currency
            }]
        ];
        this.DBtraders[trader].assort.loyal_level_items[assortId] = loyal;
        return assortId;
    }
    /**
     * Generate assort from weapon preset
     * @returns assrotId
     */
    public traderAddItemsBarter(Id: string, barter_scheme: IBarterScheme[], trader: string, loyal: number = 1, postfix: string = "3"): string 
    {
        const pflegth = postfix.length
        const assortId = postfix + Id.slice(pflegth);
        this.DBtraders[trader].assort.items.push({
            "_id": assortId,
            "_tpl": Id,
            "parentId": "hideout",
            "slotId": "hideout",
            "upd": {
                "UnlimitedCount": true,
                "StackObjectsCount": 999999999
            }
        });
        if (this.DBtraders[trader].assort.barter_scheme[assortId] != undefined) 
        {
            this.logger.log(`assort ${assortId} duplicated`, "red")
        }
        this.DBtraders[trader].assort.barter_scheme[assortId] = [];
        this.DBtraders[trader].assort.barter_scheme[assortId][0] = barter_scheme;
        this.DBtraders[trader].assort.loyal_level_items[assortId] = loyal;
        return assortId;
    }
    /**
   * Load assorts to Database
   * @param {*} assortFilePath File path of assort.json
   * @param {*} vendorID Id of the trader to add
   */
    public loadTraderAssort(assortFilePath: string, vendorID: string, validation: boolean = false, print: boolean = false): Promise<void> 
    {

        const assortAdd = this.jsonRead(assortFilePath) as ITraderAssort;
        for (const data in assortAdd.items) 
        {
            if ((assortAdd.items[data].parentId == undefined) || (assortAdd.items[data].slotId == undefined)) 
            {
                this.logger.log(`Trader Item ${assortAdd.items[data]._id} has no valid data`, "red");
                return;
            }
            this.DBtraders[vendorID].assort.items.push(assortAdd.items[data]);
        }

        for (const data in assortAdd.barter_scheme) 
        {
            this.DBtraders[vendorID].assort.barter_scheme[data] = (assortAdd.barter_scheme[data]);
        }
        for (const data in assortAdd.loyal_level_items) 
        {
            this.DBtraders[vendorID].assort.loyal_level_items[data] = (assortAdd.loyal_level_items[data]);
        }
    }

    public loadTraderAssortObj(assortAdd: ITraderAssort, vendorID: string): void 
    {

        for (const data in assortAdd.items) 
        {
            if ((assortAdd.items[data].parentId == undefined) || (assortAdd.items[data].slotId == undefined)) 
            {
                this.logger.log(`Trader Item ${assortAdd.items[data]._id} has no valid data`, "red");
                return;
            }
            this.DBtraders[vendorID].assort.items.push(assortAdd.items[data]);
        }

        for (const data in assortAdd.barter_scheme) 
        {
            this.DBtraders[vendorID].assort.barter_scheme[data] = (assortAdd.barter_scheme[data]);
        }
        for (const data in assortAdd.loyal_level_items) 
        {
            this.DBtraders[vendorID].assort.loyal_level_items[data] = (assortAdd.loyal_level_items[data]);
        }
    }
    public loadBuffs(folderPath: string[]): void 
    {
        for (const i in folderPath) 
        {
            this.Table.globals.config.Health.Effects.Stimulator.Buffs[i] = this.jsonRead(folderPath[i]);
        }
    }
    /**
     * Load Presets to Database
     * @param {*} folderPath folder path node of presets
     */
    public loadPresets(folderPath: string[]): void 
    {
        for (const i in folderPath) 
        {
            const preset = this.jsonRead(folderPath[i]) as IPreset;
            this.addPreset(preset);
        }
    }
    public addPreset(preset: IPreset, makingChangeOnExistingPreset: boolean = false): void 
    {
        if (!makingChangeOnExistingPreset) 
        {
            if (this.DBpresets[preset._id] != undefined) 
            {
                this.logger.log(`addPreset: Preset ${preset._id} already exists`, "red");
            }
            else 
            {
                this.DBpresets[preset._id] = preset;
            }
        }
    }    /**
    * Load Presets to Database
    * @param {*} filePath file path of modifier
    */
    public loadModifierList(filePath: string): void 
    {
        const itemModDataList = this.jsonRead(filePath) as Record<string, IItemModifyInfo>;

        for (const mditem in itemModDataList) 
        {
            if ((mditem != itemModDataList[mditem].ItemId) && (itemModDataList[mditem].ItemId != "Chart")) 
            {
                this.logger.log(`Unpaired Modifier ID ${mditem}`, "red");
            }
            this.modifyItems(itemModDataList[mditem]);
        }
    }
    public modifyItems(ItemInfo: IItemModifyInfo): void 
    {
        const ID = ItemInfo.ItemId;

        if (ID == "Chart") 
        {
            if (ItemInfo.ChartType == "ammo") 
            {
                for (const v in ItemInfo.Chart) 
                {
                    for (const a in ItemInfo.Chart[v].AmmoList) 
                    {
                        this.ammoAddCustomCalAllItems(ItemInfo.Chart[v].AmmoList[a], ItemInfo.Chart[v].AmmoCloneFrom);
                    }
                }
            }
            if (ItemInfo.ChartType == "mag") 
            {
                for (const m in ItemInfo.Chart) 
                {
                    this.magCloneCaliber("itself", m);
                    this.itemCloneConflict(ItemInfo.Chart[m], m);
                    this.itemCloneAttachment(ItemInfo.Chart[m], "mod_magazine", m);
                }
            }
            if (ItemInfo.ChartType == "SSM") 
            {
                for (const m in ItemInfo.Chart) 
                {
                    for (const Mo in ItemInfo.Chart[m].Id_Map) 
                    {
                        this.itemCloneConflict(ItemInfo.Chart[m].Id_Map[Mo], Mo);
                        this.itemCloneAttachment(ItemInfo.Chart[m].Id_Map[Mo], ItemInfo.Chart[m].Slot, Mo);
                    }
                }
            }
            if (ItemInfo.ChartType == "SCM") 
            {
                for (const m in ItemInfo.Chart) 
                {
                    for (const Mo in ItemInfo.Chart[m].Id_Map) 
                    {
                        this.itemCloneConflict(ItemInfo.Chart[m].Id_Map[Mo], Mo);
                        this.itemCloneAttachment(ItemInfo.Chart[m].Id_Map[Mo], "same", Mo);
                    }
                }
            }
        }
        else 
        {

            if (ItemInfo.ItemConflictingAddTo != undefined) 
            {
                this.itemAddListConflict(ItemInfo.ItemConflictingAddTo, ID);
            }

            if (ItemInfo.ItemSlotAdd != undefined) 
            {
                for (const i in ItemInfo.ItemSlotAdd) 
                {
                    this.itemAddListAttachment(ItemInfo.ItemSlotAdd[i].AddTo, ItemInfo.ItemSlotAdd[i].TargetSlot, ID)
                }
            }
            if (ItemInfo.Shelf == true) 
            {
                this.weaponAddtoShelf(ItemInfo.ItemId);
            }
            if (ItemInfo.MasteringCloneFromId != undefined) 
            {
                this.itemCloneMastering(ItemInfo.MasteringCloneFromId, ID);
            }

            if (ItemInfo.WeaponCaliberCloneFromId != undefined) 
            {
                this.weaponCloneCaliber(ItemInfo.WeaponCaliberCloneFromId, ID)
            }

            if (ItemInfo.ConflictCloneFromId != undefined) 
            {
                this.itemCloneConflict(ItemInfo.ConflictCloneFromId, ID);
            }

            if (ItemInfo.ItemSlotClone != undefined) 
            {
                for (const x in ItemInfo.ItemSlotClone.TargetSlots) 
                {
                    this.itemCloneAttachment(ItemInfo.ItemSlotClone.SlotCloneFromId, ItemInfo.ItemSlotClone.TargetSlots[x], ID);
                }
            }

            if (ItemInfo.AmmoCloneFromId != undefined) 
            {
                this.ammoAddCustomCalAllItems(ID, ItemInfo.AmmoCloneFromId);
            }

            if (ItemInfo.MagCloneCaliberTable != undefined) 
            {
                this.magCloneCaliber(ItemInfo.MagCloneCaliberTable, ID);
            }
            if (ItemInfo.MasteringCreate != undefined) 
            {
                this.itemCreateMastering(ItemInfo.MasteringCreate.Name, ItemInfo.MasteringCreate.Level2, ItemInfo.MasteringCreate.Level3, ID)
            }
        }

    }
    public itemCreateMastering(name: string, lv2: number, lv3: number, weaponID: string): void 
    {
        this.DBmasterings.push({
            "Name": name,
            "Templates": [
                weaponID
            ],
            "Level2": lv2,
            "Level3": lv3
        })
    }

    public itemAddListConflict(itemModData: string[], itemID: string): void 
    {
        for (const eachItem in itemModData) 
        {
            const item = itemModData[eachItem];
            if (this.DBitems[item] != undefined)
                this.itemAddConflict(item, itemID);
        }
    }

    public itemAddListAttachment(itemModData: string[], slotType: string, itemID: string): void 
    {
        for (const eachItem in itemModData) 
        {
            const item = itemModData[eachItem];
            if (this.DBitems[item] != undefined) 
            {
                this.weaponAddAttachment(item, slotType, itemID);
            }
        }
    }

    public itemCloneMastering(cloneId: string, weaponID: string): void 
    {
        for (const x in this.DBmasterings) 
        {
            if (this.DBmasterings[x].Templates.includes(cloneId)) 
            {
                if (!this.DBmasterings[x].Templates.includes(weaponID)) 
                {
                    this.DBmasterings[x].Templates.push(weaponID);
                }
            }
        }
    }
    public weaponAddAttachment(weaponId: string, attachmentType: string, attachmentId: string): void 
    {
        for (const i in this.DBitems[weaponId]._props.Slots) 
        {
            if (this.DBitems[weaponId]._props.Slots[i]._name == attachmentType) 
            {
                if (!this.DBitems[weaponId]._props.Slots[i]._props.filters[0].Filter.includes(attachmentId)) 
                {
                    this.DBitems[weaponId]._props.Slots[i]._props.filters[0].Filter.push(attachmentId);
                    return;
                }
                else 
                {
                    if (IsDebugging)
                    {
                        this.logger.log("WARNING " + attachmentId + " addAttachment " + weaponId + this.DBlocales.ch[`${weaponId} Name`] + " slot type " + attachmentType + " item already exist", "yellow");
                    }

                    return;
                }
            }
        }
        if (IsDebugging)
        {
            this.logger.log("WARNING " + attachmentId + " addAttachment " + weaponId + this.DBlocales.ch[`${weaponId} Name`] + " slot type " + attachmentType + " no such attachmentType", "yellow");
        }
    }
    /**
     * Add ItemA to ItemB conflict
     * @param {*} itemId ItemA
     * @param {*} conflictId ItemB
     */
    public itemAddConflict(conflictId: string, itemId: string): void 
    {
        if (!this.DBitems[conflictId]._props.ConflictingItems.includes(itemId)) 
        {
            this.DBitems[conflictId]._props.ConflictingItems.push(itemId);
        }
        else 
        {
            if (IsDebugging)
            {
                this.logger.log("WARNING " + itemId + " addConflict " + conflictId + this.DBlocales.ch[`${this.DBitems[conflictId]._id} Name`] + " item already exist", "yellow");
            }
        }
    }
    /**
     * add ammo of a caliber to magazine
     * @param {*} caliberTable ammoId
     * @param {*} magId ammoId to clone
     */
    public magCloneCaliber(caliberTable: any, magId: string): void 
    {
        let caliberWWTable: any;
        if (caliberTable == "itself")
            caliberWWTable = this.magGetCaliber(magId);
        else
            caliberWWTable = caliberTable;
        for (const y in this.DBitems) 
        {
            if (this.DBitems[y]._parent == BaseClasses.AMMO) 
            {
                for (const z in caliberWWTable) 
                {
                    if (this.DBitems[y]._props.Caliber == caliberWWTable[z]) 
                    {
                        this.magazineAddAmmo(magId, y);
                    }
                }
            }
        }
    }
    public itemCloneAttachment(cloneId: string, attachmentType: string, attachmentId: string): void 
    {
        for (const x in this.DBitems) 
        {
            if (this.DBitems[x]._type == "Item") 
            {
                if (this.DBitems[x]._props.Slots != undefined) 
                {
                    if (this.DBitems[x]._props.Slots.length != 0) 
                    {
                        for (const y in this.DBitems[x]._props.Slots) 
                        {
                            if ((this.DBitems[x]._props.Slots[y]._name == attachmentType) || attachmentType == "same") 
                            {
                                if (this.DBitems[x]._props.Slots[y]._props.filters[0].Filter.includes(cloneId)) 
                                {
                                    if (!this.DBitems[x]._props.Slots[y]._props.filters[0].Filter.includes(attachmentId)) 
                                    {
                                        this.DBitems[x]._props.Slots[y]._props.filters[0].Filter.push(attachmentId);
                                    }
                                    else 
                                    {
                                        this.logger.log("WARNING " + attachmentId + " addAttachment " + this.DBitems[x]._id + ((this.DBlocales.ch[`${this.DBitems[x]._id} Name`] == undefined) ? (this.DBitems[x]._id + "has no name") : this.DBlocales.ch[`${this.DBitems[x]._id} Name`]) + " slot type " + attachmentType + " item already exist", "yellow");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    public weaponCloneCaliber(cloneId: string, weaponId: string): void 
    {
        let caliberWWTable: string[];
        if (cloneId == "itself")
            caliberWWTable = this.weaponGetCaliber(weaponId);
        else
            caliberWWTable = this.weaponGetCaliber(cloneId);
        for (const x in this.DBitems) 
        {
            if (this.DBitems[x]._parent == BaseClasses.AMMO) 
            {
                for (const z in caliberWWTable) 
                {
                    if (this.DBitems[x]._props.Caliber == caliberWWTable[z]) 
                    {
                        this.weaponAddAmmo(weaponId, x);
                    }
                }
            }
        }
    }
    /**
   * add ammo to slots
   * @param {*} ammoId ammoId
   * @param {*} ammoSample ammoId to clone
   */
    public ammoAddCustomCalAllItems(ammoId: string, ammoSample: string): void 
    {
        for (const x in this.DBitems) 
        {
            if (this.DBitems[x]._type === "Item") 
            {
                if (this.DBitems[x]._props.Chambers != undefined) 
                {
                    if (this.DBitems[x]._props.Chambers[0] != undefined) 
                    {
                        if (this.DBitems[x]._props.Chambers[0]._props.filters[0].Filter.includes(ammoSample)) 
                        {
                            this.weaponAddAmmo(this.DBitems[x]._id, ammoId);
                        }
                    }
                }
                else if (this.DBitems[x]._props.Cartridges != undefined) 
                {
                    if (this.DBitems[x]._props.Cartridges[0] != undefined) 
                    {
                        if (this.DBitems[x]._props.Cartridges[0]._props.filters[0].Filter.includes(ammoSample)) 
                        {
                            this.magazineAddAmmo(this.DBitems[x]._id, ammoId);
                        }
                    }
                }
            }
        }
    }
    public itemCloneConflict(cloneId: string, itemId: string): void 
    {
        for (const x in this.DBitems) 
        {
            if (this.DBitems[x]._type == "Item") 
            {
                if (this.DBitems[x]._props.ConflictingItems != undefined && typeof this.DBitems[x]._props.ConflictingItems == "object") 
                {
                    if (this.DBitems[x]._props.ConflictingItems.includes(cloneId)) 
                    {
                        this.itemAddConflict(x, itemId);
                    }
                }
            }
        }
    }

    public weaponAddAmmo(weaponId: string, ammoId: string): void 
    {
        for (const chamberId in this.DBitems[weaponId]._props.Chambers) 
        {
            if (!this.DBitems[weaponId]._props.Chambers[chamberId]._props.filters[0].Filter.includes(ammoId)) 
            {
                this.DBitems[weaponId]._props.Chambers[chamberId]._props.filters[0].Filter.push(ammoId);
                // console.log(`add ${ammoId} to ${weaponId}, ${serverLocales.ch.templates[weaponId].Name}`);
            }
        }
    }

    public magazineAddAmmo(magazineId: string, ammoId: string): void 
    {
        if (!this.DBitems[magazineId]._props.Cartridges[0]._props.filters[0].Filter.includes(ammoId)) 
        {
            this.DBitems[magazineId]._props.Cartridges[0]._props.filters[0].Filter.push(ammoId);
            // console.log(`add ${ammoId} to ${magazineId}, ${serverLocales.ch.templates[magazineId].Name}`);
        }
        if (this.DBitems[magazineId]._props.Slots[0] != undefined) 
        {
            for (const slotId in this.DBitems[magazineId]._props.Slots) 
            {
                if (!this.DBitems[magazineId]._props.Slots[slotId]._props.filters[0].Filter.includes(ammoId)) 
                {
                    this.DBitems[magazineId]._props.Slots[slotId]._props.filters[0].Filter.push(ammoId);
                    //console.log(DBitems[magazineId]._props.Slots[slotId]._props.filters[0].Filter);
                }
            }
        }
    }
    public weaponGetCaliber(weaponId: string): string[] 
    {
        const caliberTable = new Array<string>();
        for (const x in this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter) 
        {
            if (this.DBitems[weaponId] == undefined) 
            {
                this.logger.log(`weaponGetCaliber ${weaponId} is undefined`, "red");
                return caliberTable;
            }
            if (this.DBitems[this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x]] == undefined) 
            {
                throw this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x];
            }
            if (!caliberTable.includes(this.DBitems[this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x]]._props.Caliber)) 
            {
                caliberTable.push(this.DBitems[this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x]]._props.Caliber);
            }
        }
        //		console.log(caliberTable);
        return caliberTable;
    }
    public magGetCaliber(magId: string): string[] 
    {
        const caliberTable: string[] = [];
        if (this.DBitems[magId] == undefined) 
        {
            this.logger.log(`magGetCaliber check ${magId}`, "red");
            return caliberTable;
        }
        if (this.DBitems[magId]._props.Cartridges[0] == undefined) 
        {
            this.logger.log(`magGetCaliber check ${magId}`, "red");
            return caliberTable;
        }
        for (const x in this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter) 
        {
            try
            {

                if (!caliberTable.includes(this.DBitems[this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter[x]]._props.Caliber)) 
                {
                    caliberTable.push(this.DBitems[this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter[x]]._props.Caliber);
                }
            } catch (error)
            {
                this.logger.log(`magGetCaliber check ${magId} ${this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter[x]} error: ${error}`, "red");
                return caliberTable;
            }
        }
        //		console.log(caliberTable);
        return caliberTable;
    }
    public copyConfig(OrgConfig: any, Config: any) 
    {
        for (const x in Config) 
        {
            if (OrgConfig[x] != undefined) 
            {
                if (typeof OrgConfig[x] === "boolean" || typeof OrgConfig[x] === "number" || typeof OrgConfig[x] === "string") 
                {
                    OrgConfig[x] = Config[x];
                }
                else if (typeof OrgConfig[x] === "object") 
                {
                    if (Array.isArray(OrgConfig[x])) 
                    {
                        OrgConfig[x] = Config[x];
                    }
                    else 
                    {
                        this.copyConfig(OrgConfig[x], Config[x]);
                    }
                }
            }
        }
    }
    public weaponAddtoShelf(weaponid: string) 
    {
        const shelfs = [
            "64381b582bb1c5dedd0fc925",
            "64381b6e44b37a080d0245b9",
            "6401c7b213d9b818bf0e7dd7"
        ]
        for (const x in shelfs) 
        {
            if (!this.DBitems[shelfs[x]]._props.Grids[0]._props.filters[0].Filter.includes(weaponid)) 
            {
                this.DBitems[shelfs[x]]._props.Grids[0]._props.filters[0].Filter.push(weaponid);
            }

        }
    }
    public extractNewLoc(itemId: string, lang: string): ILocProp 
    {
        const loc: ILocProp = {
            "Name": this.DBlocales[lang][`${itemId} Name`],
            "ShortName": this.DBlocales[lang][`${itemId} ShortName`],
            "Description": this.DBlocales[lang][`${itemId} Description`]
        }
        return loc;
    }
    /**
    * Get a slot in a item Object
    * @param {*} slotname name of the slot
    * @param {*} itemObj the item Object
    * @returns Reference of the slot
    */
    public itemObjGetSlotbyName(slotname: string, itemObj: ITemplateItem): ISlot 
    {
        for (const x in itemObj._props.Slots) 
        {
            if (itemObj._props.Slots[x]._name == slotname) 
            {
                return itemObj._props.Slots[x];
            }
        }
    }
    /**
    * Generate assort from weapon preset
    * @returns assrotId
    */
    public traderGenerateAssortFromPreset(PresetId: string, Price: number, trader: string, loyal?: number, currency?: string, postfix?: string): string 
    {
        if (this.DBpresets[PresetId] == undefined) 
        {
            this.logger.log(`no preset id ${PresetId}`, "red");
        }
        const Items = this.JsonUtil.clone(this.DBpresets[PresetId]._items);
        const defaultPostfix = "3";
        if (postfix == undefined) 
        {
            postfix = defaultPostfix;
        }
        const assortId = postfix + this.DBpresets[PresetId]._parent.substring(postfix.length, 24);
        for (const x in Items) 
        {
            Items[x]._id = postfix + Items[x]._id.substring(postfix.length, 24)
            if (Items[x].parentId != undefined) 
            {
                Items[x].parentId = postfix + Items[x].parentId.substring(postfix.length, 24);
            }
            if (Items[x]._id == assortId) 
            {
                Items[x].parentId = "hideout";
                Items[x].slotId = "hideout";
                Items[x].upd = {
                    "UnlimitedCount": true,
                    "StackObjectsCount": 999999999
                }
            }
            for (const ast of this.DBtraders[trader].assort.items) 
            {
                if (ast._id == Items[x]._id) 
                {
                    this.logger.log(`trader ${trader} assort ID ${ast._id} duplicated`, "red")
                }
            }
            this.DBtraders[trader].assort.items.push(Items[x]);
        }
        this.DBtraders[trader].assort.barter_scheme[assortId] = [
            [{
                "count": Price,
                "_tpl": (currency == undefined ? Money.ROUBLES : currency)
            }]
        ];
        this.DBtraders[trader].assort.loyal_level_items[assortId] = (loyal == undefined ? 1 : loyal);
        return assortId;
    }
    public weaponGetChamber(weaponId: string): ISlot 
    {
        const DBitems = this.DBitems;
        const slotToReturn: ISlot = {
            "_name": "dummy",
            "_id": "dummy",
            "_parent": "dummy",
            "_props": {
                "filters": [
                    {
                        "Shift": 0,
                        "Filter": [
                        ]
                    }
                ]
            },
            "_required": false,
            "_mergeSlotWithChildren": false,
            "_proto": "55d30c4c4bdc2db4468b457e"
        }
        if (DBitems[weaponId] == null) 
        {
            this.logger.log(`weaponGetChamber Error : no such weapon ${weaponId}`, "red");
            return slotToReturn;
        }
        else if (DBitems[weaponId]._props.Chambers == null) 
        {
            this.logger.log(`weaponGetChamber Error : ${weaponId} has no Chamber`, "red");
            return slotToReturn;
        }
        else 
        {
            return DBitems[weaponId]._props.Chambers[0];
        }
    }
    /**
     * Generate handbook info from clone item list using price from cloned handbook
     * @param {*} cloneItem reference of clone item info
     * @param {*} multi price multiplier default 1
     */
    public generateHandbookByCloneItem(cloneItem: IItemClone, multi?: number): void 
    {
        for (const hb in this.DBhbItems) 
        {
            if (this.DBhbItems[hb].Id == cloneItem.cloneid) 
            {
                const NewPrice = Math.ceil(this.DBhbItems[hb].Price * (multi == undefined ? 1 : multi));
                const hbtoAdd: IHandbookItem = {
                    "Id": cloneItem.data._id,
                    "ParentId": this.DBhbItems[hb].ParentId,
                    "Price": NewPrice
                }
                this.DBhbItems.push(hbtoAdd);
                break;
            }
        }
    }
    public generateSkinItemName(itemId: string, orgId: string, SkinName: string, SkinCreator: string): void 
    {
        for (const lang in this.DBlocales) 
        {
            const OrgLoc: ILocProp = this.extractNewLoc(orgId, lang);
            let OrgName = OrgLoc.Name;
            OrgName = OrgName.replace("（", "(");
            OrgName = OrgName.replace("）", ")");
            if (OrgName.length - 1 == OrgName.lastIndexOf(")") && OrgName.indexOf("(") != -1) 
            {
                OrgName = OrgName.slice(0, OrgName.lastIndexOf("(") - 1);
            }
            const loctoAdd: ILocProp = {
                "Name": `${OrgName} (${SkinName})`,
                "ShortName": `${OrgLoc.ShortName} ${SkinName}`,
                "Description": `${OrgLoc.Description}\n${SkinName}\nMade by ${SkinCreator}`
            }
            this.addNewLoc(itemId, lang, loctoAdd);
        }
    }
    public generatePrice(itemId: string, orgId: string, multi?: number): void 
    {
        if (this.DBprice[orgId] == undefined) 
        {
            this.logger.log(`Found no Price for ${orgId}, use price in handbook`, "yellow");
            this.DBprice[itemId] = this.getPrice(orgId);
        }
        else 
        {
            this.DBprice[itemId] = Math.ceil(this.DBprice[orgId] * (multi == undefined ? 1 : multi));
        }
    }
    public getPrice(itemId: string): number 
    {
        if (this.DBprice[itemId] != undefined) 
        {
            return this.DBprice[itemId]
        }
        else 
        {
            for (const x in this.DBhbItems) 
            {
                if (this.DBhbItems[x].Id == itemId) 
                {
                    return this.DBhbItems[x].Price;
                }
            }
        }

    }
    public newSlot(slotname: string, postfix: string, parentId: string, required?: boolean, mergeSlotWithChildren?: boolean, Filter: string[] = []): ISlot 
    {
        const NewSlot: ISlot = {
            "_name": slotname,
            "_id": `${parentId.substring(0, 24 - postfix.length)}${postfix}`,
            "_parent": parentId,
            "_props": {
                "filters": [{
                    "Shift": 0,
                    "Filter": Filter
                }]
            },
            "_required": (required == undefined ? false : required),
            "_mergeSlotWithChildren": (mergeSlotWithChildren == undefined ? false : required),
            "_proto": "55d30c4c4bdc2db4468b457e"
        }
        return NewSlot;
    }

    /**
 * Write Json file
 * @param {*} filePath Path of json file to write
 * @param {*} data data to write
 */
    public jsonWrite(filePath: string, data: any): void 
    {
        this.FileSystem.write(filePath, this.JsonUtil.serialize(data, true));
        this.logger.log(`Out putting ${filePath}`, "red");
    }
    /**
    * Load Presets to Database
    * @param {*} itemModDataList Record of modifier
    */
    public loadModifierObj(itemModDataList: Record<string, IItemModifyInfo>): void 
    {

        for (const mditem in itemModDataList) 
        {
            if ((mditem != itemModDataList[mditem].ItemId) && (itemModDataList[mditem].ItemId != "Chart")) 
            {
                this.logger.log(`Unpaired Modifier ID ${mditem}`, "red");
            }
            this.modifyItems(itemModDataList[mditem]);
        }
    }

    public isMasteringExists(Name: string): boolean 
    {
        let result = false;
        for (const x in this.DBmasterings) 
        {
            if (this, this.DBmasterings[x].Name == Name) 
            {
                result = true;
            }
        }
        return result;
    }

    public weaponAddtoMastering(id: string, MasteringName: string) 
    {
        for (const x in this.DBmasterings) 
        {
            if (this.DBmasterings[x].Name == MasteringName) 
            {
                if (!this.DBmasterings[x].Templates.includes(id)) 
                {
                    this.DBmasterings[x].Templates.push(id);
                }
            }
        }
    }

    public itemPMCLootBlackList(id: string) 
    {
        const ConfigServer = this.container.resolve<ConfigServer>("ConfigServer");
        // const BotConfig = ConfigServer.configs['aki-bot'];
        const BotConfig = ConfigServer.getConfig<IPmcConfig>(ConfigTypes.PMC);

        BotConfig.vestLoot.blacklist.push(id);
        BotConfig.backpackLoot.blacklist.push(id);
        BotConfig.pocketLoot.blacklist.push(id);
    }

    public weaponAddToPrimarySlot(id: string) 
    {
        const inventoryID = "55d7217a4bdc2d86028b456d";
        this.checkAndPush(this.itemGetSlotbyName("FirstPrimaryWeapon", inventoryID)._props.filters[0].Filter, id);
        this.checkAndPush(this.itemGetSlotbyName("SecondPrimaryWeapon", inventoryID)._props.filters[0].Filter, id);
    }
    public weaponAddToHolsterSlot(id: string) 
    {
        const inventoryID = "55d7217a4bdc2d86028b456d";
        this.checkAndPush(this.itemGetSlotbyName("Holster", inventoryID)._props.filters[0].Filter, id);
    }
    public weaponAddToQuestKillShotgun(id: string) 
    {
        const DBQuests = this.Table.templates.quests
        const SilentCaliber = "5c0bc91486f7746ab41857a2";
        const SpaTourPart1 = "5a03153686f77442d90e2171";
        const ThePunisherPart4 = "59ca264786f77445a80ed044";
        this.checkAndPush(DBQuests[SilentCaliber].conditions.AvailableForFinish[0].counter.conditions[0].weapon, id);
        this.checkAndPush(DBQuests[SilentCaliber].conditions.AvailableForFinish[1].counter.conditions[0].weapon, id);
        this.checkAndPush(DBQuests[SpaTourPart1].conditions.AvailableForFinish[0].counter.conditions[0].weapon, id);
        this.checkAndPush(DBQuests[ThePunisherPart4].conditions.AvailableForFinish[0].counter.conditions[0].weapon, id);
    }
    private checkAndPush(Tgarray: any[], id: any) 
    {
        if (!Tgarray.includes(id)) 
        {
            Tgarray.push(id);
        }
    }


    public itemsRemoveItemsfromSlot(tgtIds: string[], slotName: string, removeIds: string[]) 
    {
        for (const tgtId of tgtIds) 
        {
            for (const removeId of removeIds) 
            {
                const slot: string[] = this.itemGetSlotbyName(slotName, tgtId)._props.filters[0].Filter;
                const index = slot.indexOf(removeId)
                if (index != -1) 
                {
                    this.itemGetSlotbyName(slotName, tgtId)._props.filters[0].Filter.splice(index, 1);
                }
            }
        }
    }
}