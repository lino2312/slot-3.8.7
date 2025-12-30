import * as i18n from 'db://i18n/LanguageData';
import { EventId } from "./constants/EventId";
import { GameItemCfg } from "./constants/GameItemCfg";
import { MessageId } from "./constants/MessageId";
import { StotageKey } from "./constants/StorageKey";
import { GameData } from "./data/GameData";
import { TransactionData } from "./data/TransactionData";
import { AlertManager } from "./manager/AlertManager";
import { ApiManager } from "./manager/ApiManager";
import { AudioManager } from "./manager/AudioManager";
import { BroadcastManager } from "./manager/BroadcastManager";
import { DownloadManager } from "./manager/DownloadManager";
import { GameManager } from "./manager/GameManager";
import { LoadMaskManager } from "./manager/LoadMaskManager";
import { NetManager } from "./manager/NetManager";
import { PayManager } from "./manager/PayManager";
import { PlatformApiManager } from "./manager/PlatformApiManager";
import { PopUpManager } from "./manager/PopUpManager";
import { RedHitManager } from "./manager/RedHitManager";
import { SubGameManager } from "./manager/SubGameManager";
import { AnimationUtils } from "./utils/AnimationUtils";
import { CacheUtils } from "./utils/CacheUtils";
import { CommonUtils } from "./utils/CommonUtils";
import { ComponentUtils } from "./utils/ComponenUtils";
import { DateUtils } from "./utils/DateUtils";
import { DeviceUtils } from "./utils/DeviceUtils";
import { EventUtils } from "./utils/EventUtils";
import { FormatUtils } from "./utils/FormatUtils";
import { HttpUtils } from "./utils/HttpUtils";
import { MathUtils } from "./utils/MathUtils";
import { ResUtils } from "./utils/ResUtils";
import { SceneUtils } from "./utils/SceneUtils";
import { ScreenUtils } from "./utils/ScreenUtils";
import { ShareLinkUtils } from "./utils/ShareLinkUtils";
import { StorageUtils } from "./utils/StorageUtils";
import { StringUtils } from "./utils/StringUtils";
import { SystemUtils } from "./utils/SystemUtils";

export const App = {
    //------------------manager------------------
    BroadcastManager: null as BroadcastManager | null,
    AudioManager: null as AudioManager | null,
    NetManager: null as NetManager | null,
    PlatformApiMgr: PlatformApiManager.getInstance(),
    GameManager: null as GameManager | null,
    ApiManager: ApiManager.getInstance(),
    AlertManager: null as AlertManager | null,
    LoadMaskManager: null as LoadMaskManager | null,
    PayManager: PayManager.getInstance(),
    PopUpManager: null as PopUpManager | null,
    RedHitManager: null as RedHitManager | null,
    DownloadManager: DownloadManager.getInstance(),
    SubGameManager: null as SubGameManager | null,

    //------------------Utils------------------
    AnimationUtils: AnimationUtils,
    CommonUtils: CommonUtils,
    ComponentUtils: ComponentUtils,
    DateUtils: DateUtils,
    DeviceUtils: DeviceUtils,
    EventUtils: EventUtils.getInstance(),
    FormatUtils: FormatUtils,
    MathUtils: MathUtils,
    ScreenUtils: ScreenUtils,
    ShareLinkUtils: ShareLinkUtils,
    StorageUtils: StorageUtils,
    StringUtils: StringUtils,
    SystemUtils: SystemUtils,
    HttpUtils: HttpUtils,
    ResUtils: ResUtils,
    SceneUtils: SceneUtils,
    CacheUtils: CacheUtils.getInstance(),

    //------------------Data------------------
    GameData: GameData,
    GameItemCfg: GameItemCfg,
    TransactionData: TransactionData,
    userData: () => {
        return App.GameManager?.getUserData();
    },
    //------------------Constants------------------
    EventID: EventId,
    MessageID: MessageId,
    StorageKey: StotageKey,

    //------------------i18n------------------
    i18n: i18n,

    //------------------other------------------
    status: {
        isInGame: false,
        isInSubGame: false,
        networkConnect: false,
        urlAddress: null,
        isRefreshCache: false,
        isOpenOfficialRechargeInputDialog: false,
        registerState: null as any,
    }, //存放一些状态值


    //------------------config------------------


    //------------------function------------------
    _params: null as any, //传递参数(私有属性)
    setParams: (params: any) => {
        App._params = params;
    },
    getParams: () => {
        return App._params;
    },

};

// ⚠️ 仅开发调试用
(window as any).App = App;

