"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mass_ModApi = void 0;
const BaseClasses_1 = require("C:/snapshot/project/obj/models/enums/BaseClasses");
const Money_1 = require("C:/snapshot/project/obj/models/enums/Money");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Mass_ModClass_1 = require("./Mass_ModClass");
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const IsDebugging = false;
class Mass_ModApi extends Mass_ModClass_1.Mass_ModClass {
    ThisModPathNodes;
    newItemList;
    customItem;
    constructor(container) {
        super(container);
        this.newItemList = [];
        this.customItem = this.container.resolve("CustomItemService");
    }
    /**
     * Initialize mod path nodes and other things
     * @param {*} Str_ThisModPath This Mod's Path
     */
    initMod(Str_ThisModPath) {
        this.ThisModPathNodes = this.LoopThroughThatBith(Str_ThisModPath);
    }
    itemSetPrefab(itemId, prefabPath) {
        this.DBitems[itemId]._props.Prefab.path = prefabPath;
    }
    /**
     * Clone a handbook by id
     * @param {*} cloneid ID of the item clone from
     * @returns the new handbook Object
     */
    cloneHandbookById(cloneid) {
        const DBhbItems = this.DBhbItems;
        const MUtils_JsonUtil = this.JsonUtil;
        const handbook = {
            "Id": "Dummy",
            "ParentId": "Dummy",
            "Price": 1
        };
        for (const x in DBhbItems) {
            if (DBhbItems[x].Id == cloneid) {
                return MUtils_JsonUtil.clone(DBhbItems[x]);
            }
        }
        this.logger.log(`cloneHandbookById have not found handbook for ${cloneid}`, "red");
        return handbook;
    }
    LoopThroughThatBith(filepath) {
        const baseNode = {};
        const directories = this.getDirList(filepath);
        const files = fs_1.default.readdirSync(filepath);
        // remove all directories from files
        for (const directory of directories) {
            for (const file in files) {
                if (files[file] === directory) {
                    files.splice(file, 1);
                }
            }
        }
        // make sure to remove the file extention
        for (const node in files) {
            const fileName = files[node].split(".").slice(0, -1).join(".");
            baseNode[fileName] = filepath + files[node];
            baseNode[fileName] = path_1.default.resolve(baseNode[fileName]);
        }
        // deep tree search
        for (const node of directories) {
            baseNode[node] = this.LoopThroughThatBith(filepath + node + "/");
        }
        return baseNode;
    }
    getDirList(path) {
        return fs_1.default.readdirSync(path).filter(function (file) {
            return fs_1.default.statSync(path + "/" + file).isDirectory();
        });
    }
    /**
     * Read in Json file
     * @param {*} filePath Path of json file to read
     * @returns json Object
     */
    async jsonReadAsync(filePath) {
        return this.JsonUtil.deserialize(await this.FileSystem.read(filePath));
    }
    /**
     * Read in Json file
     * @param {*} filePath Path of json file to read
     * @returns json Object
     */
    jsonRead(filePath) {
        return this.JsonUtil.deserialize(this.FileSystemSync.read(filePath));
    }
    /**
    * load Clone Items from folder
    * @param {*} folderPath folder path node of item to clone
    */
    loadCloneItems(folderPath) {
        for (const x in folderPath) {
            const clonelist = this.jsonRead(folderPath[x]);
            for (const it in clonelist) {
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
    copyValue(TargetItem, OrgItem) {
        for (const data in OrgItem) {
            if (TargetItem[data] != null) {
                if (data == "effects_damage" || data == "effects_health") {
                    TargetItem[data] = OrgItem[data];
                }
                else if (typeof OrgItem[data] === "string" || typeof OrgItem[data] === "number" || typeof OrgItem[data] === "boolean") {
                    if (TargetItem[data] != OrgItem[data]) {
                        TargetItem[data] = OrgItem[data];
                    }
                }
                else if (typeof OrgItem[data] === "object") {
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
    cloneItem(cloneId, id) {
        const item = this.JsonUtil.clone(this.DBitems[cloneId]);
        item._id = id;
        this.processItemCartridges(item);
        this.processItemChambers(item);
        this.processItemSlots(item);
        return item;
    }
    indexTo2DigitsHexStr(x) {
        let xid = parseInt(x).toString(16);
        if (parseInt(x) < 16) {
            xid = "0" + xid;
        }
        return xid;
    }
    //Rename slots, chambers and cartridges with unique id.
    processItemSlots(item) {
        if (this.doesItemHaveSlots(item)) {
            for (const x in item._props.Slots) {
                item._props.Slots[x]._id = `${item._id.substring(0, 21)}a${this.indexTo2DigitsHexStr(x)}`;
                item._props.Slots[x]._parent = item._id;
            }
        }
        else {
            return;
        }
    }
    processItemChambers(item) {
        if (this.doesItemHaveChambers(item)) {
            for (const x in item._props.Chambers) {
                item._props.Chambers[x]._id = `${item._id.substring(0, 21)}c${this.indexTo2DigitsHexStr(x)}`;
                item._props.Chambers[x]._parent = item._id;
            }
        }
        else {
            return;
        }
    }
    processItemCartridges(item) {
        if (this.doesItemHaveCartridges(item)) {
            for (const x in item._props.Cartridges) {
                item._props.Cartridges[x]._id = `${item._id.substring(0, 21)}b${this.indexTo2DigitsHexStr(x)}`;
                item._props.Cartridges[x]._parent = item._id;
            }
        }
        else {
            return;
        }
    }
    registerNewItem(itemId) {
        if (this.newItemList.includes(itemId)) {
            this.logger.log(`newItemList already add ${itemId}`, "red");
        }
        else {
            this.newItemList.push(itemId);
        }
    }
    doesItemHaveSlots(item) {
        if (item._props != null) {
            return item._props.Slots != null;
        }
        else {
            return false;
        }
    }
    doesItemHaveChambers(item) {
        if (item._props != null) {
            return item._props.Chambers != null;
        }
        else {
            return false;
        }
    }
    doesItemHaveCartridges(item) {
        if (item._props != null) {
            return item._props.Cartridges != null;
        }
        else {
            return false;
        }
    }
    /**
     * Initialize mod path nodes and other things
     * @param {*} filePath File path of handbook.json
     */
    loadHandbooksfromFile(filePath) {
        const hbToAddList = this.jsonRead(filePath).Items;
        for (const x in hbToAddList) {
            this.DBhbItems.push(hbToAddList[x]);
        }
    }
    addNewLoc(itemId, lang, loctoAdd) {
        this.DBlocales[lang][`${itemId} Name`] = loctoAdd.Name;
        this.DBlocales[lang][`${itemId} ShortName`] = loctoAdd.ShortName;
        this.DBlocales[lang][`${itemId} Description`] = loctoAdd.Description;
    }
    /**
     * Load assorts to Database
     * @param {*} folderPath folder path node of locales
     */
    loadLocales(folderPath, locLangs) {
        let Obj = false;
        if (locLangs != undefined) {
            Obj = true;
        }
        const langlist = new Array();
        if (!Obj) {
            for (const lang in folderPath) {
                langlist.push(lang);
            }
        }
        else {
            for (const lang in locLangs) {
                langlist.push(lang);
            }
        }
        for (const lang in this.DBlocales) {
            if (langlist.includes(lang)) {
                const toAdd = Obj ? locLangs[lang] : this.jsonRead(folderPath[lang]);
                for (const data in toAdd.templates) {
                    const loc = toAdd.templates[data];
                    this.addNewLoc(data, lang, loc);
                }
                for (const data in toAdd.preset) {
                    this.DBlocales[lang][data] = toAdd.preset[data].Name;
                }
            }
            else {
                const toAdd = Obj ? locLangs.en : this.jsonRead(folderPath.en);
                for (const data in toAdd.templates) {
                    const loc = toAdd.templates[data];
                    this.addNewLoc(data, lang, loc);
                }
                for (const data in toAdd.preset) {
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
    itemGetSlotNumbyName(slotname, itemID) {
        if (this.DBitems[itemID] == null) {
            throw `itemGetSlotbyName Error: No such item ${itemID}`;
        }
        else {
            if (this.DBitems[itemID]._props.Slots == null) {
                throw `itemGetSlotbyName Error: item ${itemID} has no slots`;
            }
            else {
                for (const x in this.DBitems[itemID]._props.Slots) {
                    if (this.DBitems[itemID]._props.Slots[x]._name == slotname) {
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
    itemObjGetSlotNumbyName(slotname, itemObj) {
        for (const x in itemObj._props.Slots) {
            if (itemObj._props.Slots[x]._name == slotname) {
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
    itemGetSlotbyName(slotname, itemID) {
        let slotToReturn = {
            "_name": "dummy",
            "_id": "dummy",
            "_parent": "dummy",
            "_props": {
                "filters": [
                    {
                        "Shift": 0,
                        "Filter": []
                    }
                ]
            },
            "_required": false,
            "_mergeSlotWithChildren": false,
            "_proto": "55d30c4c4bdc2db4468b457e"
        };
        if (this.DBitems[itemID] == undefined) {
            this.logger.log(`itemGetSlotbyName Error: No such item ${itemID}`, "red");
            return slotToReturn;
        }
        else {
            if (this.DBitems[itemID]._props.Slots == undefined) {
                this.logger.log(`itemGetSlotbyName Error: item ${itemID} has no slots`, "red");
                return slotToReturn;
            }
            else {
                for (const x in this.DBitems[itemID]._props.Slots) {
                    if (this.DBitems[itemID]._props.Slots[x]._name == slotname) {
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
    traderAddItems(Id, Price, trader, loyal = 1, currency = Money_1.Money.ROUBLES, postfix = "3") {
        const pflegth = postfix.length;
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
        if (this.DBtraders[trader].assort.barter_scheme[assortId] != undefined) {
            this.logger.log(`assort ${assortId} duplicated`, "red");
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
    traderAddItemsBarter(Id, barter_scheme, trader, loyal = 1, postfix = "3") {
        const pflegth = postfix.length;
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
        if (this.DBtraders[trader].assort.barter_scheme[assortId] != undefined) {
            this.logger.log(`assort ${assortId} duplicated`, "red");
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
    loadTraderAssort(assortFilePath, vendorID, validation = false, print = false) {
        const assortAdd = this.jsonRead(assortFilePath);
        for (const data in assortAdd.items) {
            if ((assortAdd.items[data].parentId == undefined) || (assortAdd.items[data].slotId == undefined)) {
                this.logger.log(`Trader Item ${assortAdd.items[data]._id} has no valid data`, "red");
                return;
            }
            this.DBtraders[vendorID].assort.items.push(assortAdd.items[data]);
        }
        for (const data in assortAdd.barter_scheme) {
            this.DBtraders[vendorID].assort.barter_scheme[data] = (assortAdd.barter_scheme[data]);
        }
        for (const data in assortAdd.loyal_level_items) {
            this.DBtraders[vendorID].assort.loyal_level_items[data] = (assortAdd.loyal_level_items[data]);
        }
    }
    loadTraderAssortObj(assortAdd, vendorID) {
        for (const data in assortAdd.items) {
            if ((assortAdd.items[data].parentId == undefined) || (assortAdd.items[data].slotId == undefined)) {
                this.logger.log(`Trader Item ${assortAdd.items[data]._id} has no valid data`, "red");
                return;
            }
            this.DBtraders[vendorID].assort.items.push(assortAdd.items[data]);
        }
        for (const data in assortAdd.barter_scheme) {
            this.DBtraders[vendorID].assort.barter_scheme[data] = (assortAdd.barter_scheme[data]);
        }
        for (const data in assortAdd.loyal_level_items) {
            this.DBtraders[vendorID].assort.loyal_level_items[data] = (assortAdd.loyal_level_items[data]);
        }
    }
    loadBuffs(folderPath) {
        for (const i in folderPath) {
            this.Table.globals.config.Health.Effects.Stimulator.Buffs[i] = this.jsonRead(folderPath[i]);
        }
    }
    /**
     * Load Presets to Database
     * @param {*} folderPath folder path node of presets
     */
    loadPresets(folderPath) {
        for (const i in folderPath) {
            const preset = this.jsonRead(folderPath[i]);
            this.addPreset(preset);
        }
    }
    addPreset(preset, makingChangeOnExistingPreset = false) {
        if (!makingChangeOnExistingPreset) {
            if (this.DBpresets[preset._id] != undefined) {
                this.logger.log(`addPreset: Preset ${preset._id} already exists`, "red");
            }
            else {
                this.DBpresets[preset._id] = preset;
            }
        }
    } /**
    * Load Presets to Database
    * @param {*} filePath file path of modifier
    */
    loadModifierList(filePath) {
        const itemModDataList = this.jsonRead(filePath);
        for (const mditem in itemModDataList) {
            if ((mditem != itemModDataList[mditem].ItemId) && (itemModDataList[mditem].ItemId != "Chart")) {
                this.logger.log(`Unpaired Modifier ID ${mditem}`, "red");
            }
            this.modifyItems(itemModDataList[mditem]);
        }
    }
    modifyItems(ItemInfo) {
        const ID = ItemInfo.ItemId;
        if (ID == "Chart") {
            if (ItemInfo.ChartType == "ammo") {
                for (const v in ItemInfo.Chart) {
                    for (const a in ItemInfo.Chart[v].AmmoList) {
                        this.ammoAddCustomCalAllItems(ItemInfo.Chart[v].AmmoList[a], ItemInfo.Chart[v].AmmoCloneFrom);
                    }
                }
            }
            if (ItemInfo.ChartType == "mag") {
                for (const m in ItemInfo.Chart) {
                    this.magCloneCaliber("itself", m);
                    this.itemCloneConflict(ItemInfo.Chart[m], m);
                    this.itemCloneAttachment(ItemInfo.Chart[m], "mod_magazine", m);
                }
            }
            if (ItemInfo.ChartType == "SSM") {
                for (const m in ItemInfo.Chart) {
                    for (const Mo in ItemInfo.Chart[m].Id_Map) {
                        this.itemCloneConflict(ItemInfo.Chart[m].Id_Map[Mo], Mo);
                        this.itemCloneAttachment(ItemInfo.Chart[m].Id_Map[Mo], ItemInfo.Chart[m].Slot, Mo);
                    }
                }
            }
            if (ItemInfo.ChartType == "SCM") {
                for (const m in ItemInfo.Chart) {
                    for (const Mo in ItemInfo.Chart[m].Id_Map) {
                        this.itemCloneConflict(ItemInfo.Chart[m].Id_Map[Mo], Mo);
                        this.itemCloneAttachment(ItemInfo.Chart[m].Id_Map[Mo], "same", Mo);
                    }
                }
            }
        }
        else {
            if (ItemInfo.ItemConflictingAddTo != undefined) {
                this.itemAddListConflict(ItemInfo.ItemConflictingAddTo, ID);
            }
            if (ItemInfo.ItemSlotAdd != undefined) {
                for (const i in ItemInfo.ItemSlotAdd) {
                    this.itemAddListAttachment(ItemInfo.ItemSlotAdd[i].AddTo, ItemInfo.ItemSlotAdd[i].TargetSlot, ID);
                }
            }
            if (ItemInfo.Shelf == true) {
                this.weaponAddtoShelf(ItemInfo.ItemId);
            }
            if (ItemInfo.MasteringCloneFromId != undefined) {
                this.itemCloneMastering(ItemInfo.MasteringCloneFromId, ID);
            }
            if (ItemInfo.WeaponCaliberCloneFromId != undefined) {
                this.weaponCloneCaliber(ItemInfo.WeaponCaliberCloneFromId, ID);
            }
            if (ItemInfo.ConflictCloneFromId != undefined) {
                this.itemCloneConflict(ItemInfo.ConflictCloneFromId, ID);
            }
            if (ItemInfo.ItemSlotClone != undefined) {
                for (const x in ItemInfo.ItemSlotClone.TargetSlots) {
                    this.itemCloneAttachment(ItemInfo.ItemSlotClone.SlotCloneFromId, ItemInfo.ItemSlotClone.TargetSlots[x], ID);
                }
            }
            if (ItemInfo.AmmoCloneFromId != undefined) {
                this.ammoAddCustomCalAllItems(ID, ItemInfo.AmmoCloneFromId);
            }
            if (ItemInfo.MagCloneCaliberTable != undefined) {
                this.magCloneCaliber(ItemInfo.MagCloneCaliberTable, ID);
            }
            if (ItemInfo.MasteringCreate != undefined) {
                this.itemCreateMastering(ItemInfo.MasteringCreate.Name, ItemInfo.MasteringCreate.Level2, ItemInfo.MasteringCreate.Level3, ID);
            }
        }
    }
    itemCreateMastering(name, lv2, lv3, weaponID) {
        this.DBmasterings.push({
            "Name": name,
            "Templates": [
                weaponID
            ],
            "Level2": lv2,
            "Level3": lv3
        });
    }
    itemAddListConflict(itemModData, itemID) {
        for (const eachItem in itemModData) {
            const item = itemModData[eachItem];
            if (this.DBitems[item] != undefined)
                this.itemAddConflict(item, itemID);
        }
    }
    itemAddListAttachment(itemModData, slotType, itemID) {
        for (const eachItem in itemModData) {
            const item = itemModData[eachItem];
            if (this.DBitems[item] != undefined) {
                this.weaponAddAttachment(item, slotType, itemID);
            }
        }
    }
    itemCloneMastering(cloneId, weaponID) {
        for (const x in this.DBmasterings) {
            if (this.DBmasterings[x].Templates.includes(cloneId)) {
                if (!this.DBmasterings[x].Templates.includes(weaponID)) {
                    this.DBmasterings[x].Templates.push(weaponID);
                }
            }
        }
    }
    weaponAddAttachment(weaponId, attachmentType, attachmentId) {
        for (const i in this.DBitems[weaponId]._props.Slots) {
            if (this.DBitems[weaponId]._props.Slots[i]._name == attachmentType) {
                if (!this.DBitems[weaponId]._props.Slots[i]._props.filters[0].Filter.includes(attachmentId)) {
                    this.DBitems[weaponId]._props.Slots[i]._props.filters[0].Filter.push(attachmentId);
                    return;
                }
                else {
                    if (IsDebugging) {
                        this.logger.log("WARNING " + attachmentId + " addAttachment " + weaponId + this.DBlocales.ch[`${weaponId} Name`] + " slot type " + attachmentType + " item already exist", "yellow");
                    }
                    return;
                }
            }
        }
        if (IsDebugging) {
            this.logger.log("WARNING " + attachmentId + " addAttachment " + weaponId + this.DBlocales.ch[`${weaponId} Name`] + " slot type " + attachmentType + " no such attachmentType", "yellow");
        }
    }
    /**
     * Add ItemA to ItemB conflict
     * @param {*} itemId ItemA
     * @param {*} conflictId ItemB
     */
    itemAddConflict(conflictId, itemId) {
        if (!this.DBitems[conflictId]._props.ConflictingItems.includes(itemId)) {
            this.DBitems[conflictId]._props.ConflictingItems.push(itemId);
        }
        else {
            if (IsDebugging) {
                this.logger.log("WARNING " + itemId + " addConflict " + conflictId + this.DBlocales.ch[`${this.DBitems[conflictId]._id} Name`] + " item already exist", "yellow");
            }
        }
    }
    /**
     * add ammo of a caliber to magazine
     * @param {*} caliberTable ammoId
     * @param {*} magId ammoId to clone
     */
    magCloneCaliber(caliberTable, magId) {
        let caliberWWTable;
        if (caliberTable == "itself")
            caliberWWTable = this.magGetCaliber(magId);
        else
            caliberWWTable = caliberTable;
        for (const y in this.DBitems) {
            if (this.DBitems[y]._parent == BaseClasses_1.BaseClasses.AMMO) {
                for (const z in caliberWWTable) {
                    if (this.DBitems[y]._props.Caliber == caliberWWTable[z]) {
                        this.magazineAddAmmo(magId, y);
                    }
                }
            }
        }
    }
    itemCloneAttachment(cloneId, attachmentType, attachmentId) {
        for (const x in this.DBitems) {
            if (this.DBitems[x]._type == "Item") {
                if (this.DBitems[x]._props.Slots != undefined) {
                    if (this.DBitems[x]._props.Slots.length != 0) {
                        for (const y in this.DBitems[x]._props.Slots) {
                            if ((this.DBitems[x]._props.Slots[y]._name == attachmentType) || attachmentType == "same") {
                                if (this.DBitems[x]._props.Slots[y]._props.filters[0].Filter.includes(cloneId)) {
                                    if (!this.DBitems[x]._props.Slots[y]._props.filters[0].Filter.includes(attachmentId)) {
                                        this.DBitems[x]._props.Slots[y]._props.filters[0].Filter.push(attachmentId);
                                    }
                                    else {
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
    weaponCloneCaliber(cloneId, weaponId) {
        let caliberWWTable;
        if (cloneId == "itself")
            caliberWWTable = this.weaponGetCaliber(weaponId);
        else
            caliberWWTable = this.weaponGetCaliber(cloneId);
        for (const x in this.DBitems) {
            if (this.DBitems[x]._parent == BaseClasses_1.BaseClasses.AMMO) {
                for (const z in caliberWWTable) {
                    if (this.DBitems[x]._props.Caliber == caliberWWTable[z]) {
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
    ammoAddCustomCalAllItems(ammoId, ammoSample) {
        for (const x in this.DBitems) {
            if (this.DBitems[x]._type === "Item") {
                if (this.DBitems[x]._props.Chambers != undefined) {
                    if (this.DBitems[x]._props.Chambers[0] != undefined) {
                        if (this.DBitems[x]._props.Chambers[0]._props.filters[0].Filter.includes(ammoSample)) {
                            this.weaponAddAmmo(this.DBitems[x]._id, ammoId);
                        }
                    }
                }
                else if (this.DBitems[x]._props.Cartridges != undefined) {
                    if (this.DBitems[x]._props.Cartridges[0] != undefined) {
                        if (this.DBitems[x]._props.Cartridges[0]._props.filters[0].Filter.includes(ammoSample)) {
                            this.magazineAddAmmo(this.DBitems[x]._id, ammoId);
                        }
                    }
                }
            }
        }
    }
    itemCloneConflict(cloneId, itemId) {
        for (const x in this.DBitems) {
            if (this.DBitems[x]._type == "Item") {
                if (this.DBitems[x]._props.ConflictingItems != undefined && typeof this.DBitems[x]._props.ConflictingItems == "object") {
                    if (this.DBitems[x]._props.ConflictingItems.includes(cloneId)) {
                        this.itemAddConflict(x, itemId);
                    }
                }
            }
        }
    }
    weaponAddAmmo(weaponId, ammoId) {
        for (const chamberId in this.DBitems[weaponId]._props.Chambers) {
            if (!this.DBitems[weaponId]._props.Chambers[chamberId]._props.filters[0].Filter.includes(ammoId)) {
                this.DBitems[weaponId]._props.Chambers[chamberId]._props.filters[0].Filter.push(ammoId);
                // console.log(`add ${ammoId} to ${weaponId}, ${serverLocales.ch.templates[weaponId].Name}`);
            }
        }
    }
    magazineAddAmmo(magazineId, ammoId) {
        if (!this.DBitems[magazineId]._props.Cartridges[0]._props.filters[0].Filter.includes(ammoId)) {
            this.DBitems[magazineId]._props.Cartridges[0]._props.filters[0].Filter.push(ammoId);
            // console.log(`add ${ammoId} to ${magazineId}, ${serverLocales.ch.templates[magazineId].Name}`);
        }
        if (this.DBitems[magazineId]._props.Slots[0] != undefined) {
            for (const slotId in this.DBitems[magazineId]._props.Slots) {
                if (!this.DBitems[magazineId]._props.Slots[slotId]._props.filters[0].Filter.includes(ammoId)) {
                    this.DBitems[magazineId]._props.Slots[slotId]._props.filters[0].Filter.push(ammoId);
                    //console.log(DBitems[magazineId]._props.Slots[slotId]._props.filters[0].Filter);
                }
            }
        }
    }
    weaponGetCaliber(weaponId) {
        const caliberTable = new Array();
        for (const x in this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter) {
            if (this.DBitems[weaponId] == undefined) {
                this.logger.log(`weaponGetCaliber ${weaponId} is undefined`, "red");
                return caliberTable;
            }
            if (this.DBitems[this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x]] == undefined) {
                throw this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x];
            }
            if (!caliberTable.includes(this.DBitems[this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x]]._props.Caliber)) {
                caliberTable.push(this.DBitems[this.DBitems[weaponId]._props.Chambers[0]._props.filters[0].Filter[x]]._props.Caliber);
            }
        }
        //		console.log(caliberTable);
        return caliberTable;
    }
    magGetCaliber(magId) {
        const caliberTable = [];
        if (this.DBitems[magId] == undefined) {
            this.logger.log(`magGetCaliber check ${magId}`, "red");
            return caliberTable;
        }
        if (this.DBitems[magId]._props.Cartridges[0] == undefined) {
            this.logger.log(`magGetCaliber check ${magId}`, "red");
            return caliberTable;
        }
        for (const x in this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter) {
            try {
                if (!caliberTable.includes(this.DBitems[this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter[x]]._props.Caliber)) {
                    caliberTable.push(this.DBitems[this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter[x]]._props.Caliber);
                }
            }
            catch (error) {
                this.logger.log(`magGetCaliber check ${magId} ${this.DBitems[magId]._props.Cartridges[0]._props.filters[0].Filter[x]} error: ${error}`, "red");
                return caliberTable;
            }
        }
        //		console.log(caliberTable);
        return caliberTable;
    }
    copyConfig(OrgConfig, Config) {
        for (const x in Config) {
            if (OrgConfig[x] != undefined) {
                if (typeof OrgConfig[x] === "boolean" || typeof OrgConfig[x] === "number" || typeof OrgConfig[x] === "string") {
                    OrgConfig[x] = Config[x];
                }
                else if (typeof OrgConfig[x] === "object") {
                    if (Array.isArray(OrgConfig[x])) {
                        OrgConfig[x] = Config[x];
                    }
                    else {
                        this.copyConfig(OrgConfig[x], Config[x]);
                    }
                }
            }
        }
    }
    weaponAddtoShelf(weaponid) {
        const shelfs = [
            "64381b582bb1c5dedd0fc925",
            "64381b6e44b37a080d0245b9",
            "6401c7b213d9b818bf0e7dd7"
        ];
        for (const x in shelfs) {
            if (!this.DBitems[shelfs[x]]._props.Grids[0]._props.filters[0].Filter.includes(weaponid)) {
                this.DBitems[shelfs[x]]._props.Grids[0]._props.filters[0].Filter.push(weaponid);
            }
        }
    }
    extractNewLoc(itemId, lang) {
        const loc = {
            "Name": this.DBlocales[lang][`${itemId} Name`],
            "ShortName": this.DBlocales[lang][`${itemId} ShortName`],
            "Description": this.DBlocales[lang][`${itemId} Description`]
        };
        return loc;
    }
    /**
    * Get a slot in a item Object
    * @param {*} slotname name of the slot
    * @param {*} itemObj the item Object
    * @returns Reference of the slot
    */
    itemObjGetSlotbyName(slotname, itemObj) {
        for (const x in itemObj._props.Slots) {
            if (itemObj._props.Slots[x]._name == slotname) {
                return itemObj._props.Slots[x];
            }
        }
    }
    /**
    * Generate assort from weapon preset
    * @returns assrotId
    */
    traderGenerateAssortFromPreset(PresetId, Price, trader, loyal, currency, postfix) {
        if (this.DBpresets[PresetId] == undefined) {
            this.logger.log(`no preset id ${PresetId}`, "red");
        }
        const Items = this.JsonUtil.clone(this.DBpresets[PresetId]._items);
        const defaultPostfix = "3";
        if (postfix == undefined) {
            postfix = defaultPostfix;
        }
        const assortId = postfix + this.DBpresets[PresetId]._parent.substring(postfix.length, 24);
        for (const x in Items) {
            Items[x]._id = postfix + Items[x]._id.substring(postfix.length, 24);
            if (Items[x].parentId != undefined) {
                Items[x].parentId = postfix + Items[x].parentId.substring(postfix.length, 24);
            }
            if (Items[x]._id == assortId) {
                Items[x].parentId = "hideout";
                Items[x].slotId = "hideout";
                Items[x].upd = {
                    "UnlimitedCount": true,
                    "StackObjectsCount": 999999999
                };
            }
            for (const ast of this.DBtraders[trader].assort.items) {
                if (ast._id == Items[x]._id) {
                    this.logger.log(`trader ${trader} assort ID ${ast._id} duplicated`, "red");
                }
            }
            this.DBtraders[trader].assort.items.push(Items[x]);
        }
        this.DBtraders[trader].assort.barter_scheme[assortId] = [
            [{
                    "count": Price,
                    "_tpl": (currency == undefined ? Money_1.Money.ROUBLES : currency)
                }]
        ];
        this.DBtraders[trader].assort.loyal_level_items[assortId] = (loyal == undefined ? 1 : loyal);
        return assortId;
    }
    weaponGetChamber(weaponId) {
        const DBitems = this.DBitems;
        const slotToReturn = {
            "_name": "dummy",
            "_id": "dummy",
            "_parent": "dummy",
            "_props": {
                "filters": [
                    {
                        "Shift": 0,
                        "Filter": []
                    }
                ]
            },
            "_required": false,
            "_mergeSlotWithChildren": false,
            "_proto": "55d30c4c4bdc2db4468b457e"
        };
        if (DBitems[weaponId] == null) {
            this.logger.log(`weaponGetChamber Error : no such weapon ${weaponId}`, "red");
            return slotToReturn;
        }
        else if (DBitems[weaponId]._props.Chambers == null) {
            this.logger.log(`weaponGetChamber Error : ${weaponId} has no Chamber`, "red");
            return slotToReturn;
        }
        else {
            return DBitems[weaponId]._props.Chambers[0];
        }
    }
    /**
     * Generate handbook info from clone item list using price from cloned handbook
     * @param {*} cloneItem reference of clone item info
     * @param {*} multi price multiplier default 1
     */
    generateHandbookByCloneItem(cloneItem, multi) {
        for (const hb in this.DBhbItems) {
            if (this.DBhbItems[hb].Id == cloneItem.cloneid) {
                const NewPrice = Math.ceil(this.DBhbItems[hb].Price * (multi == undefined ? 1 : multi));
                const hbtoAdd = {
                    "Id": cloneItem.data._id,
                    "ParentId": this.DBhbItems[hb].ParentId,
                    "Price": NewPrice
                };
                this.DBhbItems.push(hbtoAdd);
                break;
            }
        }
    }
    generateSkinItemName(itemId, orgId, SkinName, SkinCreator) {
        for (const lang in this.DBlocales) {
            const OrgLoc = this.extractNewLoc(orgId, lang);
            let OrgName = OrgLoc.Name;
            OrgName = OrgName.replace("（", "(");
            OrgName = OrgName.replace("）", ")");
            if (OrgName.length - 1 == OrgName.lastIndexOf(")") && OrgName.indexOf("(") != -1) {
                OrgName = OrgName.slice(0, OrgName.lastIndexOf("(") - 1);
            }
            const loctoAdd = {
                "Name": `${OrgName} (${SkinName})`,
                "ShortName": `${OrgLoc.ShortName} ${SkinName}`,
                "Description": `${OrgLoc.Description}\n${SkinName}\nMade by ${SkinCreator}`
            };
            this.addNewLoc(itemId, lang, loctoAdd);
        }
    }
    generatePrice(itemId, orgId, multi) {
        if (this.DBprice[orgId] == undefined) {
            this.logger.log(`Found no Price for ${orgId}, use price in handbook`, "yellow");
            this.DBprice[itemId] = this.getPrice(orgId);
        }
        else {
            this.DBprice[itemId] = Math.ceil(this.DBprice[orgId] * (multi == undefined ? 1 : multi));
        }
    }
    getPrice(itemId) {
        if (this.DBprice[itemId] != undefined) {
            return this.DBprice[itemId];
        }
        else {
            for (const x in this.DBhbItems) {
                if (this.DBhbItems[x].Id == itemId) {
                    return this.DBhbItems[x].Price;
                }
            }
        }
    }
    newSlot(slotname, postfix, parentId, required, mergeSlotWithChildren, Filter = []) {
        const NewSlot = {
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
        };
        return NewSlot;
    }
    /**
 * Write Json file
 * @param {*} filePath Path of json file to write
 * @param {*} data data to write
 */
    jsonWrite(filePath, data) {
        this.FileSystem.write(filePath, this.JsonUtil.serialize(data, true));
        this.logger.log(`Out putting ${filePath}`, "red");
    }
    /**
    * Load Presets to Database
    * @param {*} itemModDataList Record of modifier
    */
    loadModifierObj(itemModDataList) {
        for (const mditem in itemModDataList) {
            if ((mditem != itemModDataList[mditem].ItemId) && (itemModDataList[mditem].ItemId != "Chart")) {
                this.logger.log(`Unpaired Modifier ID ${mditem}`, "red");
            }
            this.modifyItems(itemModDataList[mditem]);
        }
    }
    isMasteringExists(Name) {
        let result = false;
        for (const x in this.DBmasterings) {
            if (this, this.DBmasterings[x].Name == Name) {
                result = true;
            }
        }
        return result;
    }
    weaponAddtoMastering(id, MasteringName) {
        for (const x in this.DBmasterings) {
            if (this.DBmasterings[x].Name == MasteringName) {
                if (!this.DBmasterings[x].Templates.includes(id)) {
                    this.DBmasterings[x].Templates.push(id);
                }
            }
        }
    }
    itemPMCLootBlackList(id) {
        const ConfigServer = this.container.resolve("ConfigServer");
        // const BotConfig = ConfigServer.configs['aki-bot'];
        const BotConfig = ConfigServer.getConfig(ConfigTypes_1.ConfigTypes.PMC);
        BotConfig.vestLoot.blacklist.push(id);
        BotConfig.backpackLoot.blacklist.push(id);
        BotConfig.pocketLoot.blacklist.push(id);
    }
    weaponAddToPrimarySlot(id) {
        const inventoryID = "55d7217a4bdc2d86028b456d";
        this.checkAndPush(this.itemGetSlotbyName("FirstPrimaryWeapon", inventoryID)._props.filters[0].Filter, id);
        this.checkAndPush(this.itemGetSlotbyName("SecondPrimaryWeapon", inventoryID)._props.filters[0].Filter, id);
    }
    weaponAddToHolsterSlot(id) {
        const inventoryID = "55d7217a4bdc2d86028b456d";
        this.checkAndPush(this.itemGetSlotbyName("Holster", inventoryID)._props.filters[0].Filter, id);
    }
    weaponAddToQuestKillShotgun(id) {
        const DBQuests = this.Table.templates.quests;
        const SilentCaliber = "5c0bc91486f7746ab41857a2";
        const SpaTourPart1 = "5a03153686f77442d90e2171";
        const ThePunisherPart4 = "59ca264786f77445a80ed044";
        this.checkAndPush(DBQuests[SilentCaliber].conditions.AvailableForFinish[0].counter.conditions[0].weapon, id);
        this.checkAndPush(DBQuests[SilentCaliber].conditions.AvailableForFinish[1].counter.conditions[0].weapon, id);
        this.checkAndPush(DBQuests[SpaTourPart1].conditions.AvailableForFinish[0].counter.conditions[0].weapon, id);
        this.checkAndPush(DBQuests[ThePunisherPart4].conditions.AvailableForFinish[0].counter.conditions[0].weapon, id);
    }
    checkAndPush(Tgarray, id) {
        if (!Tgarray.includes(id)) {
            Tgarray.push(id);
        }
    }
    itemsRemoveItemsfromSlot(tgtIds, slotName, removeIds) {
        for (const tgtId of tgtIds) {
            for (const removeId of removeIds) {
                const slot = this.itemGetSlotbyName(slotName, tgtId)._props.filters[0].Filter;
                const index = slot.indexOf(removeId);
                if (index != -1) {
                    this.itemGetSlotbyName(slotName, tgtId)._props.filters[0].Filter.splice(index, 1);
                }
            }
        }
    }
}
exports.Mass_ModApi = Mass_ModApi;
//# sourceMappingURL=Mass_ModApi.js.map