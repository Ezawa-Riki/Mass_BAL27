/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from "tsyringe";
import { IItemModifyInfo, ILoadingScript, Mass_ModClass } from "../../Mass_ModClass";
import { Mass_ModApi } from "../../Mass_ModApi";
import { NTrader } from "../../enum/NTrader";
import { mod_slot } from "../../enum/mod_slot";
import { Money } from "@spt/models/enums/Money";
import { NewItemFromCloneDetails } from "@spt/models/spt/mod/NewItemDetails";
import { CustomItemService } from "@spt/services/mod/CustomItemService";
import { AdvancedNewItemFromCloneDetails } from "../../AdvancedNewItemFromCloneDetails";
import { IMastering } from "@spt/models/eft/common/IGlobals";
import { handbookCategory } from "../../enum/handbookCategory";
import { Weapons } from "@spt/models/enums/Weapons";
import { ItemTpl } from "@spt/models/enums/ItemTpl";

const IDDL = {
    WEAPON_BAL27: "020020BA27BA270000000000",
    WEAPON_P90: Weapons.SMG_57X28_P90,
    WEAPON_MP9: "5e00903ae9dc277128008b87",
    WEAPON_AK103: "5ac66d2e5acfc43b321d4b53",
    WEAPON_AK74M: "5ac4cd105acfc40016339859",
    WEAPON_AK101: "5ac66cb05acfc40198510a10",

    BARREL_VECTOR_45_5IN: "5fb65363d1409e5ca04b54f5",

    BARREL_BAL27_DEF: "04BA4BBA27BA27AB00000000",
    BARREL_BAL27_BURST: "04BB4BBA27BA27BB00000000",
    BARREL_BAL27_HEAVY: "04BC4BBA27BA27CB00000000",
    BARREL_BAL27_LONG: "04BD4BBA27BA27DB00000000",

    BARREL_P90_105: ItemTpl.BARREL_FN_P90_57X28_105_INCH,
    BARREL_P90_16: ItemTpl.BARREL_FN_P90_57X28_16_INCH,

    REC_STM9: "602e63fb6335467b0c5ac94d",

    STOCK_BAL27_DEF: "043043BA27BA274300000000",
    STOCK_BAL27_HVY: "043143BA27BA274310000000",
    STOCK_BAL27_LGT: "043243BA27BA274320000000",
    STOCK_BAL27_TAC: "043343BA27BA274330000000",
    STOCK_AR15_MOE: ItemTpl.STOCK_AR15_MAGPUL_MOE_CARBINE_STOCK_FDE,

    PG_AR15_MAGPUL_MOE: "55802f5d4bdc2dac148b458f",
    PG_BAL27_TAPE: "045045BA27BA274500000000",
    PG_BAL27_AIM: "045145BA27BA274510000000",
    PG_BAL27_ASS: "045245BA27BA274520000000",
    PG_BAL27_SNP: "045345BA27BA274530000000",
    PG_BAL27_TAC: "045445BA27BA274540000000",

    COMB_TR76_TAC: "044044AB76AB764400000000",
    COMB_TR76_HVY: "044144AB76AB764410000000",
    COMB_TR76_ERGO: "044244AB76AB764420000000",

    FRONT_SIGHT_MAGPUL: "5bc09a30d4351e00367fb7c8",
    FRONT_SIGHT_TR76: "04CF4CAB76AB7F4C00000000",

    REAR_SIGHT_MAGPUL: "5bc09a18d4351e003562b68e",
    REAR_SIGHT_TR76: "04CB4CAB76AB7B4C00000000",

    HANDGUARD_TR76_SIL: "041041AB76AB764100000000",
    HANDGUARD_TR76_LONG: "041A41AB76AB7641AA000000",

    MUZ_BAL27: "04E04EBA27BA274E00000000",
    SLI_BAL27: "04E14EBA27BA274E10000000",
    MUZ_P90: ItemTpl.FLASHHIDER_FN_P90_57X28_FLASH_HIDER,
    SIL_P90: ItemTpl.SILENCER_FN_P90_ATTENUATOR_57X28_SOUND_SUPPRESSOR,

    MAGAZINE_PMAG_21: "5a718da68dc32e000d46d264",
    MAGAZINE_G17_17: "5a718b548dc32e000d46d262",
    MAG_G45_13: "5fb651b52b1b027b1f50bcff",
    MAG_MP9_15: "5de8e8dafd6b4e6e2276dc32",
    MAG_BAL27_30: "02F02FBA27BA272F00000000",
    MAG_P90: ItemTpl.MAGAZINE_57X28_P90_50RND,

    MOUNT_MLOK_41: "5b7be4895acfc400170e2dd5",//full foregrip slot
    MOUNT_M700: "5bfebc530db834001d23eb65",//full scope & rear sight slot
    MOUNT_VECTOR_BOTTOM: "5fbb976df9986c4cff3fe5f2",//short foregrip slot
    MOUNT_MLOK_25: "5b7be47f5acfc400170e2dd2",//short tactical slot
    WEAPON_VECTOR_45: "5fb64bc92b1b027b1f50bcf2",//short scope slot
    HANDGUARD_WITH_BIPODS: "5addc7005acfc4001669f275",//tactical slot with bipod (tactical_003)
    HANDGUARD_HK416_DEF: "5bb20de5d4351e0035629e59",//front sight & bipod only (bipod) & 45 degree mount (scope) & long upper tatical (tactical_000)
    HANDGUARD_STM9_12: "6034e3e20ddce744014cb878",//side m-lok (000 001) & bottom m-lok with bipod (002) & m-lok foregrip 
}

const List_muzzle = [
    IDDL.MUZ_BAL27,
    IDDL.SLI_BAL27
]

const List_barrels = [
    IDDL.BARREL_BAL27_DEF,
    IDDL.BARREL_BAL27_BURST,
    IDDL.BARREL_BAL27_HEAVY,
    IDDL.BARREL_BAL27_LONG
]

const List_stocks = [
    IDDL.STOCK_BAL27_DEF,
    IDDL.STOCK_BAL27_HVY,
    IDDL.STOCK_BAL27_LGT,
    IDDL.STOCK_BAL27_TAC
]
const List_magazine = [
    IDDL.MAG_BAL27_30
]
const List_pistolgrips = [
    IDDL.PG_BAL27_TAPE,
    IDDL.PG_BAL27_AIM,
    IDDL.PG_BAL27_ASS,
    IDDL.PG_BAL27_SNP,
    IDDL.PG_BAL27_TAC
]
const PrefabPaths = {
    WEAPON_BAL27: "assets/bal27/weapon_bal27_57x28_container.bundle",

    BARREL_BAL27_DEF: "assets/bal27/mods/barrel_bal27_def.bundle",
    BARREL_BAL27_BURST: "assets/bal27/mods/barrel_bal27_burst.bundle",
    BARREL_BAL27_HEAVY: "assets/bal27/mods/barrel_bal27_heavy.bundle",
    BARREL_BAL27_LONG: "assets/bal27/mods/barrel_bal27_long.bundle",

    MUZ_BAL27: "assets/bal27/mods/muzzle_bal27_def_57x28.bundle",
    SLI_BAL27: "assets/bal27/mods/silencer_bal27_57x28.bundle",

    STOCK_BAL27_DEF: "assets/bal27/mods/stock_bal27_def.bundle",
    STOCK_BAL27_HVY: "assets/bal27/mods/stock_bal27_heavy.bundle",
    STOCK_BAL27_LGT: "assets/bal27/mods/stock_bal27_light.bundle",
    STOCK_BAL27_TAC: "assets/bal27/mods/stock_bal27_tac.bundle",

    PG_BAL27_TAPE: "assets/bal27/mods/pistolgrip_bal27_tape.bundle",
    PG_BAL27_AIM: "assets/bal27/mods/pistolgrip_bal27_aim.bundle",
    PG_BAL27_ASS: "assets/bal27/mods/pistolgrip_bal27_ass.bundle",
    PG_BAL27_SNP: "assets/bal27/mods/pistolgrip_bal27_snp.bundle",
    PG_BAL27_TAC: "assets/bal27/mods/pistolgrip_bal27_tac.bundle",

    MAG_BAL27_30: "assets/bal27/mods/mag_bal27_std_57x28_30.bundle"
}
const cpntName = "Mass_BAL27";
class Mass_BAL27 extends Mass_ModClass implements ILoadingScript
{
    MMA: Mass_ModApi;
    MThisModPath: any;
    data: Record<string, AdvancedNewItemFromCloneDetails>;
    constructor(container: DependencyContainer, MMA: Mass_ModApi)
    {
        super(container);
        this.MMA = MMA;
        this.MThisModPath = this.MMA.ThisModPathNodes.componets;
        const data_P90_weapon = this.DBitems[IDDL.WEAPON_P90]._props;
        const data_P90_mag = this.DBitems[IDDL.MAG_P90]._props;
        this.data = {
            weapon_bal27: {
                itemTplToClone: IDDL.WEAPON_P90,
                newId: IDDL.WEAPON_BAL27,
                overrideProperties: {
                    Prefab: {
                        path: PrefabPaths.WEAPON_BAL27,
                        rcid: ""
                    },
                    Slots: [
                        {
                            "_name": mod_slot.barrel,
                            "_id": "5c488af32e2216398b5a9608",
                            "_parent": "5c488a752e221602b412af63",
                            "_props": {
                                "filters": [
                                    {
                                        "Shift": 0,
                                        "Filter": [
                                            ...List_barrels
                                        ]
                                    }
                                ]
                            },
                            "_required": true,
                            "_mergeSlotWithChildren": false,
                            "_proto": "55d30c4c4bdc2db4468b457e"
                        },
                        {
                            "_name": mod_slot.stock,
                            "_id": "5c488af32e2216398b5a9608",
                            "_parent": "5c488a752e221602b412af63",
                            "_props": {
                                "filters": [
                                    {
                                        "Shift": 0,
                                        "Filter": [
                                            ...List_stocks
                                        ]
                                    }
                                ]
                            },
                            "_required": true,
                            "_mergeSlotWithChildren": false,
                            "_proto": "55d30c4c4bdc2db4468b457e"
                        },
                        {
                            "_name": mod_slot.pistol_grip,
                            "_id": "5c488af32e2216398b5a9608",
                            "_parent": "5c488a752e221602b412af63",
                            "_props": {
                                "filters": [
                                    {
                                        "Shift": 0,
                                        "Filter": [
                                            ...List_pistolgrips
                                        ]
                                    }
                                ]
                            },
                            "_required": true,
                            "_mergeSlotWithChildren": false,
                            "_proto": "55d30c4c4bdc2db4468b457e"
                        },
                        {
                            "_id": "5cc82d76e24e8d00134b4b85",
                            "_mergeSlotWithChildren": false,
                            "_name": "mod_magazine",
                            "_parent": "5cc82d76e24e8d00134b4b83",
                            "_props": {
                                "filters": [
                                    {
                                        "AnimationIndex": -1,
                                        "Filter": [
                                            ...List_magazine
                                        ]
                                    }
                                ]
                            },
                            "_proto": "55d30c394bdc2dae468b4577",
                            "_required": false
                        }
                    ],
                    Width: 3,
                    Height: 2,
                    Foldable: false,
                    bFirerate: 850,
                    defMagType: IDDL.MAG_BAL27_30,
                    "Chambers": this.JsonUtil.clone(data_P90_weapon.Chambers),
                    "defAmmo": data_P90_weapon.defAmmo,
                    "ammoCaliber": data_P90_weapon.ammoCaliber,
                    isBoltCatch: false,
                    ConflictingItems: [
                    ],
                    Ergonomics: data_P90_weapon.Ergonomics + 9,
                    RecoilForceUp: 33,
                    RecoilForceBack: 125,
                    Weight: data_P90_weapon.Weight + 0.44,
                    weapClass: "assaultRifle"
                },
                fleaPriceRoubles: 60000,
                parentId: this.DBitems[IDDL.WEAPON_AK74M]._parent,
                handbookPriceRoubles: 40000,
                handbookParentId: handbookCategory.Assaultrifles,
                locales: {
                    "en": {
                        "name": "Atlas BAL-27 5.7x28 assault rifle",
                        "shortName": "BAL-27",
                        "description": "A bullpup prototype weapon designed to fire 5.7x28mm rounds."
                    },
                    "ch": {
                        "name": "Atlas BAL-27 5.7x28 突击步枪",
                        "shortName": "BAL-27",
                        "description": "A bullpup prototype weapon designed to fire 5.7x28mm rounds."
                    }
                },
                addtoTraders: false,
                copySlot: true,
                copySlots: [
                    {
                        id: IDDL.WEAPON_VECTOR_45,
                        newSlotName: mod_slot.sight_front
                    },
                    {
                        id: IDDL.WEAPON_VECTOR_45,
                        newSlotName: mod_slot.sight_rear
                    },
                    // {
                    //     id: IDDL.MOUNT_MLOK_25,
                    //     tgtSlotName: mod_slot.tactical,
                    //     newSlotName: mod_slot.tactical_001
                    // },
                    {
                        id: IDDL.MOUNT_MLOK_25,
                        tgtSlotName: mod_slot.tactical,
                        newSlotName: mod_slot.tactical_002
                    },
                    {
                        id: IDDL.WEAPON_VECTOR_45,
                        newSlotName: mod_slot.scope
                    },
                    {
                        id: IDDL.MOUNT_VECTOR_BOTTOM,
                        newSlotName: mod_slot.foregrip
                    }
                ],
                masteries: true,
                masterySections: [
                    {
                        Name: "BAL27",
                        Templates: [
                            IDDL.WEAPON_BAL27
                        ],
                        Level2: 500,
                        Level3: 1000
                    }
                ],
                "addweaponpreset": true,
                "weaponpresets": [
                    {
                        "_changeWeaponName": false,
                        "_encyclopedia": IDDL.WEAPON_BAL27,
                        "_id": "220020BA27BA270000000000",
                        "_items": [
                            {
                                "_id": "220020BA27BA270000000060",
                                "_tpl": IDDL.WEAPON_BAL27
                            },
                            {
                                "_id": "220020BA27BA270000000063",
                                "_tpl": IDDL.MAG_BAL27_30,
                                "parentId": "220020BA27BA270000000060",
                                "slotId": mod_slot.magazine
                            },
                            {
                                "_id": "220020BA27BA270000000048",
                                "_tpl": IDDL.BARREL_BAL27_DEF,
                                "parentId": "220020BA27BA270000000060",
                                "slotId": mod_slot.barrel
                            },
                            {
                                "_id": "220020BA27BA270000000049",
                                "_tpl": IDDL.MUZ_BAL27,
                                "parentId": "220020BA27BA270000000048",
                                "slotId": mod_slot.muzzle
                            },
                            {
                                "_id": "220020BA27BA2700000000e0",
                                "_tpl": IDDL.STOCK_BAL27_DEF,
                                "parentId": "220020BA27BA270000000060",
                                "slotId": mod_slot.stock
                            },
                            {
                                "_id": "220020BA27BA2700000000f0",
                                "_tpl": IDDL.PG_BAL27_TAPE,
                                "parentId": "220020BA27BA270000000060",
                                "slotId": mod_slot.pistol_grip
                            }
                        ],
                        "_name": "BAL-27 Default",
                        "_parent": "220020BA27BA270000000060",
                        "_type": "Preset"
                    }
                ]

            },
            // ********************************* Barrels *********************************
            barrel_bal27_def: {
                itemTplToClone: IDDL.BARREL_P90_16,
                newId: IDDL.BARREL_BAL27_DEF,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.BARREL_BAL27_DEF,
                        "rcid": ""
                    },
                    Slots: [
                        {
                            "_name": mod_slot.muzzle,
                            "_id": "5c488af32e2216398b5a9608",
                            "_parent": "5c488a752e221602b412af63",
                            "_props": {
                                "filters": [
                                    {
                                        "Shift": 0,
                                        "Filter": [
                                            ...List_muzzle
                                        ]
                                    }
                                ]
                            },
                            "_required": false,
                            "_mergeSlotWithChildren": false,
                            "_proto": "55d30c4c4bdc2db4468b457e"
                        }
                    ],
                    Width: 2,
                    ExtraSizeDown: 0,
                    ExtraSizeLeft: 0,
                    ExtraSizeUp: 0,
                    ExtraSizeRight: 0,
                    ExtraSizeForceAdd: false,

                    Weight: 0.7,
                    CenterOfImpact: 0.0385
                },
                fleaPriceRoubles: 15000,
                parentId: this.DBitems[IDDL.BARREL_P90_105]._parent,
                handbookPriceRoubles: 16000,
                handbookParentId: handbookCategory.Barrels,
                locales: {
                    "en": {
                        "name": "BAL-27 standard barrel",
                        "shortName": "BAL-27 standard",
                        "description": "standard barrel for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 原厂枪管",
                        "shortName": "BAL-27 原厂",
                        "description": "BAL-27 的原厂枪管。"
                    }
                },
                addtoTraders: false,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 18000
                    }
                ]
            },
            barrel_bal27_burst: {
                itemTplToClone: IDDL.BARREL_P90_105,
                newId: IDDL.BARREL_BAL27_BURST,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.BARREL_BAL27_BURST,
                        "rcid": ""
                    },
                    Slots: [
                    ],
                    Width: 2,
                    ExtraSizeDown: 0,
                    ExtraSizeLeft: 0,
                    ExtraSizeUp: 0,
                    ExtraSizeRight: 0,
                    ExtraSizeForceAdd: false,

                    Weight: 0.58,
                    CenterOfImpact: 0.10,
                    Ergonomics: -10,
                    Recoil: -5 + -5 + -10
                },
                fleaPriceRoubles: 15000,
                parentId: this.DBitems[IDDL.BARREL_P90_105]._parent,
                handbookPriceRoubles: 16000,
                handbookParentId: handbookCategory.Barrels,
                locales: {
                    "en": {
                        "name": "BAL-27 Lonefire Comp barrel",
                        "shortName": "Lonefire Comp",
                        "description": "Lonefire integrated compensator barrel for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Lonefire 补偿枪管",
                        "shortName": "Lonefire",
                        "description": "BAL-27 的Lonefire 一体式补偿器枪管。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 18000
                    }
                ]
            },
            barrel_bal27_heavy: {
                itemTplToClone: IDDL.BARREL_BAL27_DEF,
                newId: IDDL.BARREL_BAL27_HEAVY,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.BARREL_BAL27_HEAVY,
                        "rcid": ""
                    },
                    HeatFactor: 0.98,
                    CoolFactor: 0.94,
                    Ergonomics: -13 + 5,
                    Weight: 0.55,
                    DurabilityBurnModificator: 1.1 + 0.1
                },
                fleaPriceRoubles: 15000,
                parentId: this.DBitems[IDDL.BARREL_P90_105]._parent,
                handbookPriceRoubles: 16000,
                handbookParentId: handbookCategory.Barrels,
                locales: {
                    "en": {
                        "name": "BAL-27 Prime MNX barrel",
                        "shortName": "Prime MNX",
                        "description": "Prime MNX lightweight barrel for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Prime MNX枪管",
                        "shortName": "Prime MNX",
                        "description": "BAL-27 的 Prime MNX 轻量化枪管。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 18500
                    }
                ]
            },
            barrel_bal27_long: {
                itemTplToClone: IDDL.BARREL_BAL27_DEF,
                newId: IDDL.BARREL_BAL27_LONG,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.BARREL_BAL27_LONG,
                        "rcid": ""
                    },

                    HeatFactor: 1.05,
                    CoolFactor: 0.95,

                    Recoil: -13 + -4,
                    Ergonomics: -13 + -6,
                    CenterOfImpact: 0.033,
                    Weight: 0.99,
                    DurabilityBurnModificator: 0.9,
                    "ExtraSizeForceAdd": false,
                    "ExtraSizeLeft": 1,
                    Velocity: 2.2 + 0.6
                },
                fleaPriceRoubles: 15000,
                parentId: this.DBitems[IDDL.BARREL_P90_105]._parent,
                handbookPriceRoubles: 16000,
                handbookParentId: handbookCategory.Barrels,
                locales: {
                    "en": {
                        "name": "BAL-27 Noctkill Long barrel",
                        "shortName": "Noctkill Long",
                        "description": "Noctkill Long barrel for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Noctkill 长枪管",
                        "shortName": "Noctkill",
                        "description": "BAL-27 的Noctkill 长枪管。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 18500
                    }
                ]
            },
            // ********************************* Muzzles *********************************
            muzzle_bal27: {
                itemTplToClone: IDDL.MUZ_P90,
                newId: IDDL.MUZ_BAL27,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.MUZ_BAL27,
                        "rcid": ""
                    },
                    Slots: []
                },
                fleaPriceRoubles: 12000,
                parentId: this.DBitems[IDDL.MUZ_P90]._parent,
                handbookPriceRoubles: 5000,
                handbookParentId: handbookCategory["Flashhiders&brakes"],
                locales: {
                    "en": {
                        "name": "BAL-27 5.7x28 muzzle brake-compensator",
                        "shortName": "BAL-27",
                        "description": "Muzzle brake-compensator for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 5.7x28 膛口制退补偿器",
                        "shortName": "BAL-27",
                        "description": "Muzzle brake-compensator for BAL-27."
                    }
                },
                addtoTraders: false,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 5000
                    }
                ],
                copySlot: false,
                addtoModSlots: false
            },
            silencer_bal27: {
                itemTplToClone: IDDL.SIL_P90,
                newId: IDDL.SLI_BAL27,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.SLI_BAL27,
                        "rcid": ""
                    },
                    Slots: [],
                    Recoil: -10
                },
                fleaPriceRoubles: 18000,
                parentId: this.DBitems[IDDL.SIL_P90]._parent,
                handbookPriceRoubles: 15000,
                handbookParentId: handbookCategory.Suppressors,
                locales: {
                    "en": {
                        "name": "BAL-27 Prowl-IV 5.7x28 suppressor",
                        "shortName": "Prowl-IV",
                        "description": "Prowl-IV suppressor for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Prowl-IV 5.7x28 抑制器",
                        "shortName": "Prowl-IV",
                        "description": "BAL-27 的Prowl-IV 抑制器。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 15000
                    }
                ],
                copySlot: false,
                addtoModSlots: false
            },
            // ********************************* Stocks *********************************
            stock_bal27_def: {
                itemTplToClone: IDDL.STOCK_AR15_MOE,
                newId: IDDL.STOCK_BAL27_DEF,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.STOCK_BAL27_DEF,
                        "rcid": ""
                    },
                    Slots: [],
                    BlocksFolding: true,
                    BlocksCollapsible: true,
                    "Recoil": -20,
                    "Ergonomics": 25,
                    "Weight": 0.85,
                    RaidModdable: false,
                    ExtraSizeRight: 1
                },
                fleaPriceRoubles: 20000,
                parentId: this.DBitems[IDDL.STOCK_AR15_MOE]._parent,
                handbookPriceRoubles: 20000,
                handbookParentId: handbookCategory["Stocks&chassis"],
                locales: {
                    "en": {
                        "name": "BAL-27 standard stock",
                        "shortName": "BAL-27 std.",
                        "description": "Standard stock for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 标准枪托",
                        "shortName": "BAL-27 标准",
                        "description": "BAL-27的标准枪托。"
                    }
                },
                addtoTraders: false,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 12000
                    }
                ]
            },
            stock_bal27_heavy: {
                itemTplToClone: IDDL.STOCK_BAL27_DEF,
                newId: IDDL.STOCK_BAL27_HVY,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.STOCK_BAL27_HVY,
                        "rcid": ""
                    },
                    Slots: [],
                    BlocksFolding: true,
                    BlocksCollapsible: true,
                    "Recoil": -30,
                    "Ergonomics": 25,
                    "Weight": 1.05,
                    RaidModdable: false
                },
                fleaPriceRoubles: 20000,
                parentId: this.DBitems[IDDL.STOCK_AR15_MOE]._parent,
                handbookPriceRoubles: 20000,
                handbookParentId: handbookCategory["Stocks&chassis"],
                locales: {
                    "en": {
                        "name": "BAL-27 Sandbar Heavy stock",
                        "shortName": "Sandbar Heavy",
                        "description": "Sandbar Heavy stock for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Sandbar 重型枪托",
                        "shortName": "Sandbar 重型",
                        "description": "BAL-27的Sandbar 重型枪托。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 20000
                    }
                ]
            },
            stock_bal27_light: {
                itemTplToClone: IDDL.STOCK_BAL27_DEF,
                newId: IDDL.STOCK_BAL27_LGT,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.STOCK_BAL27_LGT,
                        "rcid": ""
                    },
                    Slots: [],
                    BlocksFolding: true,
                    BlocksCollapsible: true,
                    "Recoil": -20,
                    "Ergonomics": 33,
                    "Weight": 0.66,
                    RaidModdable: false
                },
                fleaPriceRoubles: 20000,
                parentId: this.DBitems[IDDL.STOCK_AR15_MOE]._parent,
                handbookPriceRoubles: 20000,
                handbookParentId: handbookCategory["Stocks&chassis"],
                locales: {
                    "en": {
                        "name": "BAL-27 Clarent Light stock",
                        "shortName": "Clarent Light",
                        "description": "Clarent Light stock for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Clarent 轻型枪托",
                        "shortName": "BAL-27 轻型",
                        "description": "BAL-27的轻型枪托。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 20000
                    }
                ]
            },
            stock_bal27_tac: {
                itemTplToClone: IDDL.STOCK_BAL27_DEF,
                newId: IDDL.STOCK_BAL27_TAC,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.STOCK_BAL27_TAC,
                        "rcid": ""
                    },
                    Slots: [],
                    BlocksFolding: true,
                    BlocksCollapsible: true,
                    "Recoil": -25,
                    "Ergonomics": 29,
                    "Weight": 0.85,
                    RaidModdable: false
                },
                fleaPriceRoubles: 20000,
                parentId: this.DBitems[IDDL.STOCK_AR15_MOE]._parent,
                handbookPriceRoubles: 20000,
                handbookParentId: handbookCategory["Stocks&chassis"],
                locales: {
                    "en": {
                        "name": "BAL-27 Ardent Tac stock",
                        "shortName": "Ardent Tac",
                        "description": "Ardent Tac stock for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Ardent 战术枪托",
                        "shortName": "Ardent 战术",
                        "description": "BAL-27的Ardent 战术枪托。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 20000
                    }
                ]
            },

            // ********************************* Pistol Grips *********************************
            pg_bal27_tape: {
                itemTplToClone: IDDL.PG_AR15_MAGPUL_MOE,
                newId: IDDL.PG_BAL27_TAPE,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.PG_BAL27_TAPE,
                        "rcid": ""
                    },
                    Recoil: 0,
                    Weight: 0.009,
                    Ergonomics: 3,
                    ExtraSizeDown: 0
                },
                fleaPriceRoubles: 6000,
                parentId: this.DBitems[IDDL.PG_AR15_MAGPUL_MOE]._parent,
                handbookPriceRoubles: 3000,
                handbookParentId: handbookCategory.Pistolgrips,
                locales: {
                    "en": {
                        "name": "BAL-27 standard grip",
                        "shortName": "Std",
                        "description": "Pistol grip for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 原厂握把",
                        "shortName": "原厂",
                        "description": "BAL-27的原厂握把。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 8000
                    }
                ]
            },
            pg_bal27_tac: {
                itemTplToClone: IDDL.PG_BAL27_TAPE,
                newId: IDDL.PG_BAL27_TAC,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.PG_BAL27_TAC,
                        "rcid": ""
                    },
                    Recoil: -1,
                    Ergonomics: 4
                },
                fleaPriceRoubles: 16000,
                parentId: this.DBitems[IDDL.PG_AR15_MAGPUL_MOE]._parent,
                handbookPriceRoubles: 13000,
                handbookParentId: handbookCategory.Pistolgrips,
                locales: {
                    "en": {
                        "name": "BAL-27 Tidal Tac grip",
                        "shortName": "Tidal Tac",
                        "description": "Pistol grip for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Tidal Tac 握把",
                        "shortName": "Tidal Tac",
                        "description": "BAL-27的Tidal Tac握把。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 18000
                    }
                ]
            },
            pg_bal27_ass: {
                itemTplToClone: IDDL.PG_BAL27_TAPE,
                newId: IDDL.PG_BAL27_ASS,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.PG_BAL27_ASS,
                        "rcid": ""
                    },
                    Recoil: 0,
                    Weight: 0.009,
                    Ergonomics: 5
                },
                fleaPriceRoubles: 16000,
                parentId: this.DBitems[IDDL.PG_AR15_MAGPUL_MOE]._parent,
                handbookPriceRoubles: 13000,
                handbookParentId: handbookCategory.Pistolgrips,
                locales: {
                    "en": {
                        "name": "BAL-27 Hammer grip",
                        "shortName": "Hammer",
                        "description": "Pistol grip for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Hammer 握把",
                        "shortName": "Hammer",
                        "description": "BAL-27的Hammer握把。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 18000
                    }
                ]
            },
            pg_bal27_snp: {
                itemTplToClone: IDDL.PG_BAL27_TAPE,
                newId: IDDL.PG_BAL27_SNP,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.PG_BAL27_SNP,
                        "rcid": ""
                    },
                    Recoil: -1,
                    Ergonomics: 2
                },
                fleaPriceRoubles: 6000,
                parentId: this.DBitems[IDDL.PG_AR15_MAGPUL_MOE]._parent,
                handbookPriceRoubles: 3000,
                handbookParentId: handbookCategory.Pistolgrips,
                locales: {
                    "en": {
                        "name": "BAL-27 Highground grip",
                        "shortName": "Highground",
                        "description": "Pistol grip for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Highground 握把",
                        "shortName": "Highground",
                        "description": "BAL-27的Highground握把。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 8000
                    }
                ]
            },
            pg_bal27_aim: {
                itemTplToClone: IDDL.PG_BAL27_TAPE,
                newId: IDDL.PG_BAL27_AIM,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.PG_BAL27_AIM,
                        "rcid": ""
                    },
                    Recoil: -2,
                    Ergonomics: 1
                },
                fleaPriceRoubles: 6000,
                parentId: this.DBitems[IDDL.PG_AR15_MAGPUL_MOE]._parent,
                handbookPriceRoubles: 3000,
                handbookParentId: handbookCategory.Pistolgrips,
                locales: {
                    "en": {
                        "name": "BAL-27 Channel-M grip",
                        "shortName": "Channel-M",
                        "description": "Pistol grip for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 Channel-M 握把",
                        "shortName": "Channel-M",
                        "description": "BAL-27的Channel-M握把。"
                    }
                },
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 8000
                    }
                ]
            },
            // ********************************* Magazines *********************************
            mag_bal27_mag_30: {
                itemTplToClone: IDDL.MAG_P90,
                newId: IDDL.MAG_BAL27_30,
                overrideProperties: {
                    "Prefab": {
                        "path": PrefabPaths.MAG_BAL27_30,
                        "rcid": ""
                    },
                    magAnimationIndex: 0,
                    Ergonomics: data_P90_mag.Ergonomics + 2,
                    "Cartridges": this.JsonUtil.clone(data_P90_mag.Cartridges),
                    "VisibleAmmoRangesString": "1-30",
                    Weight: data_P90_mag.Weight * 0.7,
                    LoadUnloadModifier: 40
                },
                fleaPriceRoubles: 12000,
                parentId: this.DBitems[IDDL.MAGAZINE_PMAG_21]._parent,
                handbookPriceRoubles: 8000,
                handbookParentId: handbookCategory.Magazines,
                locales: {
                    "en": {
                        "name": "BAL-27 5.7x28 30-round magazine",
                        "shortName": "BAL-27 30",
                        "description": "30-rd magazine for BAL-27."
                    },
                    "ch": {
                        "name": "BAL-27 5.7x28 30发弹匣",
                        "shortName": "BAL-27 30",
                        "description": "BAL-27的30发弹匣。"
                    }
                },
                copySlot: false,
                addtoTraders: true,
                traderId: NTrader.Default,
                "barterScheme": [
                    {
                        "count": 12000
                    }
                ]
            }

        }
    }
    public onLoadMod(): void
    {
        // this.getMagAnimationIndex()
        const CustomItem = this.container.resolve<CustomItemService>("CustomItemService");
        const MMA = this.MMA;
        const ModifyInfos: Record<string, IItemModifyInfo> = {};
        for (const x in this.data)
        {
            let id: string;
            if (this.data[x].newId != undefined)
            {
                id = this.data[x].newId;
            }
            else
            {
                id = x;
            }
            // this.logger.log(x, "cyan");
            const item: NewItemFromCloneDetails = {
                itemTplToClone: this.data[x].itemTplToClone,
                overrideProperties: this.data[x].overrideProperties,
                newId: id,
                fleaPriceRoubles: this.data[x].fleaPriceRoubles,
                parentId: this.data[x].parentId,
                handbookPriceRoubles: this.data[x].handbookPriceRoubles,
                handbookParentId: this.data[x].handbookParentId,
                locales: this.data[x].locales
            }
            CustomItem.createItemFromClone(item);
            MMA.registerNewItem(id);
            if (this.data[x].addtoTraders)
            {
                MMA.traderAddItems(id, this.data[x].barterScheme[0].count, NTrader.Default, this.data[x].loyallevelitems);
            }
            if (this.data[x].copySlot)
            {
                let index: number = 0;
                for (const y in this.data[x].copySlots)
                {
                    const slotData = this.data[x].copySlots[y];
                    const tgtSlotName = slotData.tgtSlotName == undefined ? slotData.newSlotName : slotData.tgtSlotName;
                    const tgtSlot = this.JsonUtil.clone(this.MMA.itemGetSlotbyName(tgtSlotName, slotData.id));
                    const newFilter = tgtSlot._props.filters[0].Filter;
                    const newSlot = this.MMA.newSlot(slotData.newSlotName, "F" + index.toString(16), id, tgtSlot._required, tgtSlot._mergeSlotWithChildren, newFilter);
                    this.DBitems[id]._props.Slots.push(newSlot);
                    index += 1;
                }
            }
            MMA.processItemCartridges(this.DBitems[id]);
            MMA.processItemChambers(this.DBitems[id]);
            MMA.processItemSlots(this.DBitems[id]);

            if (this.data[x].masteries)
            {
                const masteries = this.data[x].masterySections;
                if (MMA.isMasteringExists(masteries[0].Name))
                {
                    for (const y in masteries[0].Templates)
                    {
                        MMA.weaponAddtoMastering(masteries[0].Templates[y], masteries[0].Name);
                    }
                }
                else
                {
                    this.DBmasterings.push(masteries[0] as IMastering);
                }
            }

            if (this.data[x].addweaponpreset)
            {
                const presets = this.data[x].weaponpresets
                for (const y in presets)
                {
                    MMA.addPreset(presets[y]);
                }
            }

            if (this.data[x].addtoModSlots)
            {
                const MODINFO: IItemModifyInfo = {
                    "ItemId": id,
                    "ItemSlotClone": {
                        "SlotCloneFromId": this.data[x].itemTplToClone,
                        "TargetSlots": this.data[x].modSlot
                    },
                    "ConflictCloneFromId": id
                }
                MMA.modifyItems(MODINFO);
            }


        }


        MMA.traderGenerateAssortFromPreset("220020BA27BA270000000000", 70000, NTrader.Default, 1, Money.ROUBLES);
        ModifyInfos[IDDL.WEAPON_BAL27] = {
            ItemId: IDDL.WEAPON_BAL27,
            WeaponCaliberCloneFromId: "itself"
        };
        ModifyInfos[IDDL.MAG_BAL27_30] = {
            ItemId: IDDL.MAG_BAL27_30,
            MagCloneCaliberTable: "itself"
        };
        this.DBitems[IDDL.MAG_BAL27_30]._props.Cartridges[0]._max_count = 30;

        MMA.loadModifierObj(ModifyInfos);

    }

}
module.exports = Mass_BAL27;