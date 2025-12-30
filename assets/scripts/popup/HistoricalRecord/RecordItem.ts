// RecordItem.ts
import { _decorator, Component, Node, SpriteAtlas, Sprite, Label, Color, find, SpriteFrame } from 'cc';
import { ComponentUtils } from '../../utils/ComponenUtils';
import { MathUtils } from '../../utils/MathUtils';
const { ccclass, property } = _decorator;
const GREEN = new Color(0, 255, 0, 255);
const RED = new Color(255, 0, 0, 255);
const WHITE = new Color(255, 255, 255, 255);

type GameResult = any;

const FortuneWheel_ResultMap: Record<number, { symbol: number; mult: number }> = {
    1: { symbol: 1, mult: 2 },
    2: { symbol: 3, mult: 10 },
    3: { symbol: 5, mult: 2 },
    4: { symbol: 2, mult: 8 },
    5: { symbol: 4, mult: 2 },
    6: { symbol: 1, mult: 5 },
    7: { symbol: 3, mult: 2 },
    8: { symbol: 5, mult: 50 },
    9: { symbol: 2, mult: 2 },
    10: { symbol: 4, mult: 20 },
};

const Roulette_Places: number[][] = [
    // 1~10
    [1], [2], [3], [4], [5], [6], [7], [8], [9], [10],
    // 11~20
    [11], [12], [13], [14], [15], [16], [17], [18], [19], [20],
    // 21~30
    [21], [22], [23], [24], [25], [26], [27], [28], [29], [30],
    // 31~37
    [31], [32], [33], [34], [35], [36], [0],
    // two numbers (18x) 38~97
    [0, 3], [0, 2], [0, 1], [2, 3], [2, 1], [3, 6], [2, 5], [1, 4], [5, 6], [5, 4],
    [6, 9], [5, 8], [4, 7], [9, 8], [8, 7], [9, 12], [8, 11], [7, 10], [12, 11], [11, 10],
    [12, 15], [11, 14], [10, 13], [15, 14], [14, 13], [15, 18], [14, 17], [13, 16], [18, 17], [17, 16],
    [18, 21], [17, 20], [16, 19], [21, 20], [20, 19], [21, 24], [20, 23], [19, 22], [24, 23], [23, 22],
    [24, 27], [23, 26], [22, 25], [27, 26], [26, 25], [27, 30], [26, 29], [25, 28], [30, 29], [29, 28],
    [30, 33], [29, 32], [28, 31], [33, 32], [32, 31], [33, 36], [32, 35], [31, 34], [36, 35], [35, 34],
    // three numbers (12x) 98~111
    [0, 3, 2], [0, 2, 1], [1, 3, 2], [6, 5, 4], [9, 8, 7], [12, 11, 10], [15, 14, 13], [18, 17, 16], [21, 20, 19], [24, 23, 22],
    [27, 26, 25], [30, 29, 28], [33, 32, 31], [36, 35, 34],
    // four numbers (9x) 112~133
    [3, 6, 2, 5], [2, 5, 1, 4], [6, 9, 5, 8], [5, 8, 4, 7], [9, 12, 8, 11],
    [8, 11, 7, 10], [12, 15, 11, 14], [11, 14, 10, 13], [15, 18, 14, 17], [14, 17, 13, 16],
    [18, 21, 17, 20], [17, 20, 16, 19], [21, 24, 20, 23], [20, 23, 19, 22], [24, 27, 23, 26],
    [23, 26, 22, 25], [27, 30, 26, 29], [26, 29, 25, 28], [30, 33, 29, 32], [29, 32, 28, 31],
    [33, 36, 32, 35], [32, 35, 31, 34],
    // six numbers (6x) 134~144
    [1, 2, 3, 4, 5, 6], [4, 5, 6, 7, 8, 9], [7, 8, 9, 10, 11, 12], [10, 11, 12, 13, 14, 15],
    [13, 14, 15, 16, 17, 18], [16, 17, 18, 19, 20, 21], [19, 20, 21, 22, 23, 24], [22, 23, 24, 25, 26, 27],
    [25, 26, 27, 28, 29, 30], [28, 29, 30, 31, 32, 33], [31, 32, 33, 34, 35, 36],
    // 2 to 1 (3x) 145~150
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36], [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35], [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24], [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    // red/black 151~152
    [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36], [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
    // odd/even 153~154
    [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35], [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
    // low/high 155~156
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
];

@ccclass('RecordItem')
export default class RecordItem extends Component {
    @property(SpriteAtlas)
    atlas: SpriteAtlas | null = null;

    private gameId = 0;
    private _itemdata: any = null;

    setGameId(id: number) {
        this.gameId = id;
    }

    // show game result node
    showGameResult(result: GameResult) {
        const cfg = this.getShowConf(this.gameId);
        const node_result = find('node_result', this.node) as Node;
        if (!node_result) return;
        node_result.children.forEach(child => child.active = false);
        const showNode = find(cfg.result_node, node_result) as Node | null;
        if (showNode) {
            showNode.active = true;
            cfg.result(result, showNode, this.atlas);
        }
    }

    // show option node
    showGameOption(opt: any) {
        const cfg = this.getShowConf(this.gameId);
        const node_option = find('node_option', this.node) as Node;
        if (!node_option) return;
        node_option.children.forEach(child => child.active = false);
        const showNode = find(cfg.option_node, node_option) as Node | null;
        if (showNode) {
            showNode.active = true;
            if (cfg.option_scale) showNode.setScale(cfg.option_scale, cfg.option_scale);
            cfg.option(opt, showNode, this.atlas);
        }
    }

    getShowConf(id: number) {
        const self = this;
        const atlas = this.atlas;

        const cfg: Record<number, any> = {
            0: { result_node: '', option_node: '', result: () => { }, option: () => { } },

            // 11 Andar Bahar
            11: {
                result_node: '11', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const AndarRecordColor = new Color(108, 153, 255);
                    const BaharRecordColor = new Color(243, 50, 50);
                    const OptName = ['', 'Ander', 'Bahar', '1-5', '6-10', '11-15', '16-25', '26-30', '31-35', '36-40', '41 or more'];
                    const lblRes1 = find('lbl_res1', node)!.getComponent(Label)!;
                    const lblRes2 = find('lbl_res2', node)!.getComponent(Label)!;
                    lblRes1.string = OptName[result.winplace[0]];
                    lblRes2.string = OptName[result.winplace[1]];
                    if (result.res == 1) {
                        lblRes1.color = AndarRecordColor;
                        lblRes2.color = AndarRecordColor;
                    } else {
                        lblRes1.color = BaharRecordColor;
                        lblRes2.color = BaharRecordColor;
                    }
                },
                option: (opt: any, node: Node) => {
                    const OptName = ['', 'Ander', 'Bahar', '1-5', '6-10', '11-15', '16-25', '26-30', '31-35', '36-40', '41 or more'];
                    node.getComponent(Label)!.string = OptName[opt];
                }
            },

            // 12 Crash
            12: {
                result_node: '12', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result.mult;
                    const item = find('item', node) as Node;
                    const showbg = data >= 2 ? 'Crash_hj_l' : 'Crash_Guess2';
                    const showball = data >= 2 ? 'Crash_red' : 'Crash_green';
                    const spr = item.getComponent(Sprite)!;
                    if (atlas) spr.spriteFrame = atlas.getSpriteFrame(showbg) as SpriteFrame;
                    const colorNode = find('color', item) as Node;
                    if (colorNode && atlas) colorNode.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(showball) as SpriteFrame;
                    const valLbl = find('val', item);
                    if (valLbl) (valLbl.getComponent(Label) as Label).string = String(data) + 'x';
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = String(opt);
                }
            },

            // 13 Jhandi Munda
            13: {
                result_node: '13', option_node: 'spr',
                result: (result: any, node: Node) => {
                    node.children.forEach(ch => ch.active = false);
                    let cnt = 0;
                    for (let i = 0; i < result.res.length; i++) {
                        if (result.res[i] >= 2) {
                            const itemNode = find(`item${cnt + 1}`, node) as Node;
                            if (itemNode) {
                                itemNode.active = true;
                                const spr = find('spr', itemNode) as Node;
                                if (spr && atlas) spr.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`JhandiMunda_record${i + 1}`) as SpriteFrame;
                            }
                            cnt += 1;
                        }
                    }
                },
                option: (opt: any, node: Node) => {
                    const comp = node.getComponent(Sprite);
                    if (comp && atlas) comp.spriteFrame = atlas.getSpriteFrame(`JhandiMunda_record${opt}`) as SpriteFrame;
                }
            },

            // 14 Horse Racing
            14: {
                result_node: '14', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const sprNode = find('paoma_result', node) as Node;
                    if (sprNode && atlas) sprNode.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`HorseRacing_paoma_result${result.res}`) as SpriteFrame;
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = String(opt);
                }
            },

            // 15 Wingo Lottery
            15: {
                result_node: '15', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    let frameN = '';
                    if (result.ball == 0 || result.ball == 5) {
                        frameN = 'WingoLottery_x1';
                    } else if (result.ball < 5) {
                        frameN = 'WingoLottery_x5';
                    } else if (result.ball > 5) {
                        frameN = 'WingoLottery_x3';
                    }
                    const spr = find('spr', node) as Node;
                    if (spr && atlas) spr.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(frameN) as SpriteFrame;
                    const lbl = spr.getChildByName('lbl');
                    if (lbl) lbl.getComponent(Label)!.string = String(result.ball);
                },
                option: (opt: any, node: Node) => {
                    const optname = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1-4', '0/5', '6-9'];
                    node.getComponent(Label)!.string = optname[opt - 1];
                }
            },

            // 16 Fortune Wheel
            16: {
                result_node: '16', option_node: 'spr', option_scale: 0.8,
                result: (result: any, node: Node) => {
                    const res = FortuneWheel_ResultMap[result.res];
                    if (res && atlas) {
                        const symbolNode = find('symbol', node) as Node;
                        const multNode = find('mult', node) as Node;
                        if (symbolNode) symbolNode.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`FortuneWheel_symbol_${res.symbol}`) as SpriteFrame;
                        if (multNode) multNode.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`FortuneWheel_x${res.mult}`) as SpriteFrame;
                    }
                },
                option: (opt: any, node: Node) => {
                    if (atlas) node.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`FortuneWheel_symbol_${opt}`) as SpriteFrame;
                }
            },

            // 17 Dragon Tiger
            17: {
                result_node: '17', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const val = result.res;
                    const list = ['Lhdz_zoushi_icon01', 'Lhdz_zoushi_icon02', 'Lhdz_zoushi_icon03'];
                    const item = find('item', node) as Node;
                    if (item && atlas) item.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(list[val - 1]) as SpriteFrame;
                },
                option: (opt: any, node: Node) => {
                    const optname = ['Dragon', 'Tiger', 'Tie'];
                    node.getComponent(Label)!.string = optname[opt - 1];
                }
            },

            // 18 Roulette (36)
            18: {
                result_node: '18', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const val = result.res;
                    const node_ball = find('ball', node) as Node;
                    if (!node_ball) return;
                    // set label
                    const valLbl = find('val', node_ball);
                    if (valLbl) (valLbl.getComponent(Label) as Label).string = String(val);

                    let key: string;
                    if (val == 0) {
                        key = 'Roulette_end_lingbg';
                    } else {
                        const colorItem = Roulette_Places[150] || [];
                        const _getBallColor = (ball: number) => {
                            let colorType = 1; // black
                            for (let i = 0; i < colorItem.length; i++) {
                                if (ball == colorItem[i]) {
                                    colorType = 2; // red
                                    break;
                                }
                            }
                            return colorType;
                        };
                        const color = _getBallColor(val);
                        key = (color == 1) ? 'Roulette_end_heibg' : 'Roulette_end_hongbg';
                    }
                    if (atlas) node_ball.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(key) as SpriteFrame;
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = String(opt);
                }
            },

            // 19 Baccarat
            19: {
                result_node: '19', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    node.active = true;
                    const item = find('zhuzi', node) as Node;
                    const sprNameList = ['Baccarat_zoushi_icon02', 'Baccarat_zoushi_icon01', 'Baccarat_zoushi_icon03'];
                    if (item && atlas) item.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(sprNameList[result.res - 1]) as SpriteFrame;
                    const p_p = find('p_p', item);
                    const b_p = find('b_p', item);
                    if (p_p) p_p.active = (result.winplace.indexOf(5) >= 0);
                    if (b_p) b_p.active = (result.winplace.indexOf(4) >= 0);
                },
                option: (opt: any, node: Node) => {
                    const optname = ['Banker', 'Player', 'Tie', 'Banker Pair', 'Player Pair'];
                    node.getComponent(Label)!.string = optname[opt - 1];
                }
            },

            // 20 7 Up Down
            20: {
                result_node: '20', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const item = find('item', node) as Node;
                    if (!item) return;
                    if (result.gold) {
                        if (atlas) item.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame('SevenUpDown_r_h') as SpriteFrame;
                    } else {
                        const list = ['SevenUpDown_r_hong', 'SevenUpDown_r_lv', 'SevenUpDown_r_lan'];
                        if (atlas) item.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(list[result.res - 1]) as SpriteFrame;
                    }
                    const lbl = find('lbl', item);
                    if (lbl) lbl.getComponent(Label)!.string = String(result.point);
                },
                option: (opt: any, node: Node) => {
                    const optname = ['2-6', '8-12', '7'];
                    node.getComponent(Label)!.string = optname[opt - 1];
                }
            },

            // 21 Aladdin Wheel
            21: {
                result_node: '21', option_node: 'spr', option_scale: 0.8,
                result: (result: any, node: Node) => {
                    if (result.win.length > 1) {
                        const icon_deng = find('icon_deng', node);
                        const symbol = find('symbol', node);
                        const mult = find('mult', node);
                        if (icon_deng) icon_deng.active = true;
                        if (symbol) symbol.active = false;
                        if (mult) (mult.getComponent(Label) as Label).string = '';
                    } else {
                        const icon_deng = find('icon_deng', node);
                        const symbol = find('symbol', node);
                        const mult = find('mult', node);
                        if (icon_deng) icon_deng.active = false;
                        if (symbol && atlas) symbol.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`laba_bet_${result.win[0].place - 1}`) as SpriteFrame;
                        if (mult) (mult.getComponent(Label) as Label).string = 'x' + result.win[0].mult;
                    }
                },
                option: (opt: any, node: Node) => {
                    if (atlas) node.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(`laba_bet_${opt - 1}`) as SpriteFrame;
                }
            },

            // 22 Crash skin: 飞行员
            22: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result.mult;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    lbl.string = data.toFixed(2) + 'x';
                    lbl.color = data > 1.5 ? new Color(140, 62, 247) : new Color(4, 161, 230);
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    lbl.string = String(opt);
                }
            },

            // 23 Crash skin: 女飞行员
            23: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const lbl = node;
                    const data = result.mult;
                    lbl.getComponent(Label)!.string = data.toFixed(2) + 'x';
                    (lbl.getComponent(Label) as Label).color = Color.GREEN; // original used color logic
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = String(opt);
                }
            },

            // 24 Crash skin: CrashX
            24: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result.mult;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    lbl.string = data.toFixed(2) + 'x';
                    lbl.color = data > 1.5 ? new Color(72, 209, 163) : new Color(90, 118, 207);
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    lbl.string = String(opt);
                }
            },

            // 25 Crash skin: 板球
            25: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result.mult;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    lbl.string = data.toFixed(2) + 'x';
                    lbl.color = data > 1.5 ? new Color(72, 209, 163) : new Color(90, 118, 207);
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    lbl.string = String(opt);
                }
            },

            // 26 Crash skin: 喷气式飞机
            26: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result.mult;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    lbl.string = data.toFixed(2) + 'x';
                    lbl.color = data > 1.5 ? Color.GREEN : Color.RED;
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    lbl.string = String(opt);
                }
            },


            // 27 Crash skin: 齐柏林飞艇
            27: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result.mult;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    lbl.string = data.toFixed(2) + 'x';
                    lbl.color = data > 1.5 ? Color.GREEN : Color.RED;
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    lbl.string = String(opt);
                }
            },

            // 28 Single Dice
            28: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    if (MathUtils.SavePoints) {
                        lbl.string = String(MathUtils.SavePoints(data.num));
                    } else {
                        lbl.string = String(data.num);
                    }

                    lbl.color = data.res > 0 ? Color.GREEN : Color.WHITE;
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    let str = String(opt);
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        if (result.roll == 1) str = 'UNDER';
                        else if (result.roll == 2) str = 'OVER';
                    } catch (e) { /* ignore */ }

                    lbl.string = str;
                }
            },

            // 29 Single Limbo
            29: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    lbl.string = data.mult + 'x';
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    let str = String(opt);
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        lbl.string = String(result.multiplier) + 'x';
                        // Color must be set on the Label, not Node
                        lbl.color = (result.res == 1) ? Color.GREEN : Color.RED;
                    } catch (e) {
                        lbl.string = '--';
                    }
                }
            },

            // 30 Single Plinko
            30: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result;
                    const lbl = node.getComponent(Label); // get the Label component
                    if (!lbl) return;

                    if (MathUtils.SavePoints) {
                        lbl.string = String(MathUtils.SavePoints(data.mult));
                    } else {
                        lbl.string = String(data.mult);
                    }

                    lbl.color = data.mult > 1 ? Color.GREEN : Color.WHITE;
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    let str = String(opt);
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        if (result.color == 1) str = 'GREEN';
                        else if (result.color == 2) str = 'YELLOW';
                        else if (result.color == 3) str = 'RED';
                    } catch (e) { /* ignore */ }

                    lbl.string = str;
                }
            },

            // 31 Single Keno
            31: {
                result_node: '31', option_node: '31',
                result: (result: any, node: Node) => {
                    const lay = node;
                    for (let i = 0; i < 10; i++) {
                        const item = find(`item${i + 1}`, lay) as Node;
                        if (typeof result.lottery_nums[i] === 'number') {
                            item.active = true;
                            if (ComponentUtils.setLabelString) {
                                ComponentUtils.setLabelString('num', item, result.lottery_nums[i]);
                            } else {
                                const lbl = item.getComponent(Label);
                                if (lbl) lbl.string = String(result.lottery_nums[i]);
                            }
                        } else {
                            item.active = false;
                        }
                    }
                },
                option: (opt: any, node: Node) => {
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        const isHit = (val: number) => result.lottery_nums.some((n: number) => n === val);
                        const lay = node;
                        for (let i = 0; i < 10; i++) {
                            const item = find(`item${i + 1}`, lay) as Node;
                            if (typeof result.nums[i] === 'number') {
                                item.active = true;
                                const val = result.nums[i];
                                if (ComponentUtils.setLabelString) {
                                    ComponentUtils.setLabelString('num', item, val);
                                } else {
                                    const lbl = item.getComponent(Label);
                                    if (lbl) lbl.string = String(val);
                                }
                                let spname = 'Keno_ball_sel';
                                if (isHit(val)) spname = 'Keno_ball_hit';
                                const icon = find('icon', item) as Node;
                                if (icon && atlas) icon.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(spname) as SpriteFrame;
                            } else {
                                item.active = false;
                            }
                        }
                    } catch (e) { /* ignore */ }
                }
            },

            // 32 Single Mines
            32: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result;
                    const lbl = node.getComponent(Label);
                    if (lbl) {
                        lbl.string = 'x' + (data.winMult || 0);
                        lbl.color = data.winMult > 0 ? Color.GREEN : Color.WHITE;
                    }
                },
                option: (opt: any, node: Node) => {
                    const lbl = node.getComponent(Label);
                    if (!lbl) return;

                    try {
                        const result = JSON.parse(self._itemdata.result);
                        lbl.string = 'Mines ' + (result.mineCnt || 0);
                    } catch (e) {
                        lbl.string = '--';
                    }
                }
            },

            // 33 Single Hilo
            33: {
                result_node: '22', option_node: '33', option_scale: 0.3,
                result: (result: any, node: Node) => {
                    const data = result;
                    const lbl = node.getComponent(Label);
                    if (lbl) {
                        lbl.string = data.result == 1 ? 'WIN' : 'LOSE';
                        lbl.color = data.res > 0 ? Color.GREEN : Color.WHITE;
                    }
                },
                option: (opt: any, node: Node) => {
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        const poker = node;
                        // show last poker card using a Poker component (assumed present)
                        const comp = poker.getComponent('Poker') as any;
                        if (comp && comp.show16Poker) comp.show16Poker(result.card);
                    } catch (e) { /* ignore */ }
                }
            },

            // 34 Single Towers
            34: {
                result_node: '22', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const lbl = node;
                    lbl.getComponent(Label)!.string = 'x' + result.mult;
                },
                option: (opt: any, node: Node) => {
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        const dif_cfg = ['Easy', 'Medium', 'Hard', 'Extreme', 'Nightmare'];
                        node.getComponent(Label)!.string = dif_cfg[result.difficulty - 1];
                    } catch (e) { node.getComponent(Label)!.string = '--'; }
                }
            },

            // 35 Multiplayer DoubleRoll
            35: {
                result_node: '14', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const data = result;
                    const color_cfg = ['rec_red_1', 'rec_black_1', 'rec_green_1'];
                    const paoma = find('paoma_result', node) as Node;
                    if (paoma && atlas) paoma.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(color_cfg[data.res - 1]) as SpriteFrame;
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = '--';
                }
            },

            // 36 Multiplayer DoubleRoll (other)
            36: {
                result_node: '22', option_node: 'spr',
                result: (result: any, node: Node) => {
                    const data = result;
                    const lbl = node.getComponent(Label);
                    if (lbl) {
                        lbl.string = data.result == data.choose ? 'WIN' : 'LOSE';
                        lbl.color = data.result == data.choose ? Color.GREEN : Color.WHITE;
                    }
                },
                option: (opt: any, node: Node) => {
                    try {
                        const result = JSON.parse(self._itemdata.result);
                        const endIdx = result.choose == 1 ? 1 : 0;
                        const color_cfg = ['coin_small_white1', 'coin_small_yellow1'];
                        if (atlas) node.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(color_cfg[endIdx]) as SpriteFrame;
                    } catch (e) { /* ignore */ }
                }
            },

            // 37 Single Crypto
            37: {
                result_node: '37', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const sparr = ['dot_white', 'dot1', 'dot2', 'dot3', 'dot4', 'dot5', 'dot6', 'dot7', 'dot8'];
                    const gems = result.gems || [];
                    const colors: { gem: number; count: number }[] = [];
                    for (let i = 0; i < gems.length; i++) {
                        let flag = false;
                        for (let j = 0; j < colors.length; j++) {
                            if (colors[j].gem == gems[i]) {
                                colors[j].count++;
                                flag = true;
                                break;
                            }
                        }
                        if (!flag) colors.push({ gem: gems[i], count: 1 });
                    }
                    colors.sort((a, b) => b.count - a.count);
                    let idx = 1;
                    for (let i = 0; i < colors.length; i++) {
                        if (colors[i].count > 1) {
                            for (let j = 0; j < colors[i].count; j++) {
                                const colorNode = find('dot' + idx, node) as Node;
                                if (colorNode && atlas) colorNode.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(sparr[colors[i].gem]) as SpriteFrame;
                                idx++;
                            }
                        }
                    }
                    for (; idx < 5; idx++) {
                        const colorNode = find('dot' + idx, node) as Node;
                        if (colorNode && atlas) colorNode.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(sparr[0]) as SpriteFrame;
                    }
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = '--';
                }
            },

            // 38 Triple
            38: {
                result_node: '38', option_node: 'lbl',
                result: (result: any, node: Node) => {
                    const sparr = ['triple_symbol_1_0', 'triple_symbol_2_0', 'triple_symbol_3_0'];
                    for (let i = 0; i < 3; i++) {
                        const icon = find(`s${i}/icon`, node) as Node;
                        if (icon && atlas) icon.getComponent(Sprite)!.spriteFrame = atlas.getSpriteFrame(sparr[result.res[i] - 1]) as SpriteFrame;
                    }
                },
                option: (opt: any, node: Node) => {
                    node.getComponent(Label)!.string = '--';
                }
            }
        };

        return cfg[id] || cfg[0];
    }
}
