export const ThePandaConfig = {
    //符号配置(必须)
    symbol: {

        //客户端自己扩展
        [1]: { node: "s1", win_node: "w1", win_ani: { name: "animation", zIndex: 100 } }, //wild八卦
        [2]: { node: "s1", win_node: "w2", win_ani: { name: "animation", zIndex: 100 } }, //熊猫
        [3]: { node: "s1", win_node: "w3", win_ani: { name: "animation", zIndex: 100 } }, //天坛
        [4]: { node: "s1", win_node: "w4", win_ani: { name: "animation", zIndex: 100 } }, //紫色帆船
        [5]: { node: "s1", win_node: "w5", win_ani: { name: "animation", zIndex: 100 } }, //蓝莲花
        [6]: { node: "s1", win_node: "w6", win_ani: { name: "animation", zIndex: 100 } }, //绿钱袋
        [7]: { node: "s1", win_node: "w7", win_ani: { name: "animation", zIndex: 100 } }, //绿伞
        [8]: { node: "s1", win_node: "w8", win_ani: { name: "animation", zIndex: 100 } }, //金币框
        [9]: { node: "null", win_node: "", win_ani: "" },          //空图标
    },

    //阴影符号节点
    shadowSymbolNode: "s2",
    //收集
    puzzleCfg: {
        atlas: "puzzle_14",
        bg: "theme_store_puzzle14_bg",
        full: "theme_store_puzzle14_full",
        pieces: [
            "theme_store_puzzle_14_1",
            "theme_store_puzzle_14_2",
            "theme_store_puzzle_14_3",
            "theme_store_puzzle_14_4",
            "theme_store_puzzle_14_5",
            "theme_store_puzzle_14_6",
            "theme_store_puzzle_14_7",
            "theme_store_puzzle_14_8",
            "theme_store_puzzle_14_9",
            "theme_store_puzzle_14_10",
            "theme_store_puzzle_14_11",
            "theme_store_puzzle_14_12"]
    },

    //脚本组件(必须)
    scripts: {
        Top: "LMSlots_Top_Base",
        Bottom: "ThePanda_Bottom",
        Slots: "ThePanda_Slots",
        Reels: "LMSlots_Reel_Base",
        Symbols: "ThePanda_Symbol",
    },
    //行列(必须)
    col: 5,
    row: 4,

    //随机符号(必须)
    randomSymbols: [2, 3, 4, 5, 6, 7],

    //scatter定义，用来计算控制免费加速动画
    scatterId: 1,

    //symbol预制(必须)
    symbolPrefab: "LMSlots_Symbol",
    //符号宽高(必须)
    symbolSize: {
        width: 150,
        height: 85,
    },

    //中奖框体预制的名称，不配就表示不显示框
    //配置在Asset_Base中
    kuang: "kuang",

    //旋转速度(必须)
    speed: 3000,

    //列停止间隔时间s
    reelStopInter: 0.2,

    //旋转时间s:3s后旋转停止
    auto_stop_time: 1,

    //回弹效果
    bounce: true,

    normalBgm: 'base_bgm',


    //中奖符号边框线
    winningBox: [['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6'],
    ['sp4', 'sp7', 'sp8', 'sp9', 'sp10', 'sp11'],
    ['sp12', 'sp13', 'sp6', 'sp14', 'sp15', 'sp16'],
    ['sp14', 'sp5', 'sp11', 'sp17', 'sp18', 'sp19'],
    ['sp17', 'sp10', 'sp20', 'sp21', 'sp22', 'sp23'],
    ['sp24', 'sp25', 'sp16', 'sp26', 'sp27', 'sp28'],
    ['sp26', 'sp15', 'sp19', 'sp29', 'sp30', 'sp31'],
    ['sp29', 'sp18', 'sp23', 'sp32', 'sp33', 'sp34'],
    ['sp32', 'sp22', 'sp35', 'sp36', 'sp37', 'sp38'],
    ['sp39', 'sp27', 'sp31', 'sp40', 'sp41', 'sp42'],
    ['sp40', 'sp30', 'sp34', 'sp43', 'sp44', 'sp45'],
    ['sp43', 'sp33', 'sp38', 'sp46', 'sp47', 'sp48'],
    ['sp49', 'sp41', 'sp45', 'sp50', 'sp51', 'sp52'],
    ['sp50', 'sp44', 'sp48', 'sp53', 'sp54', 'sp55'],
    ],

    commEffect: {
        path: 'games/ThePanda/',
        win1: ['win1', 'win1end'],
        win2: ['win2', 'win2end']
    },

    helpItems: [
        "games/ThePanda/prefab/Panda_Help_item1",
        "games/ThePanda/prefab/Panda_Help_item2",
        "games/ThePanda/prefab/Panda_Help_item3",
        "games/ThePanda/prefab/Panda_Help_item4",
        "games/ThePanda/prefab/Panda_Help_item5",
        // "games/ThePanda/prefab/Panda_Help_item6"
    ],
}