import { _decorator, Node, director, UIOpacity, Tween, tween, Vec3, find, Label, RichText, Sprite, ProgressBar, SpriteFrame, Button, isValid, instantiate, Vec2, UITransform, resources, Prefab } from 'cc';
import { ScreenUtils } from './ScreenUtils';
import { EventUtils } from './EventUtils';
import { EventId } from '../constants/EventId';
import { Config } from '../config/Config';
import { MathUtils } from './MathUtils';
import { FormatUtils } from './FormatUtils';
export class AnimationUtils {

    //节点摇晃动作
    static shakeNodeR(node: Node) {
        Tween.stopAllByTarget(node);
        node.angle = 0;

        let r_offset = 15;
        let t_interval = 0.25;
        let r1 = tween(node).to(t_interval, { angle: r_offset });
        let r2 = tween(node).to(2 * t_interval, { angle: -r_offset });
        let r3 = tween(node).to(2 * t_interval, { angle: r_offset });
        let r4 = tween(node).to(2 * t_interval, { angle: -r_offset });
        let r5 = tween(node).to(2 * t_interval, { angle: r_offset });
        let r6 = tween(node).to(t_interval, { angle: 0 });
        let delayAction = tween(node).delay(1.8);


        let seq = tween(node).repeatForever(
            tween().sequence(r1, r2, r3, r4, r5, r6, delayAction)
        );
        seq.start();
    }

    //节点呼吸动作
    static breathNode(node: Node, _targetScale: Vec3, _targetScaleSmall: Vec3) {
        Tween.stopAllByTarget(node);
        let targetScale = _targetScale || new Vec3(1.1, 1.1, 1.1);
        let targetScaleSmall = _targetScaleSmall || Vec3.ONE;
        node.setScale(targetScaleSmall);

        tween(node)
            .to(0.6, { scale: targetScale })
            .to(0.6, { scale: targetScaleSmall })
            .union()
            .repeatForever()
            .start();
    }

    //闪烁动作
    static blinkAction(
        node: Node,
        actionTime = 0.2,
        delayTime = 2,
        nBlinkCount = 0,
        endCall?: () => void
    ) {
        // 停止所有 tween
        Tween.stopAllByTarget(node);
        let uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = node.addComponent(UIOpacity);
        }
        Tween.stopAllByTarget(uiOpacity);
        uiOpacity.opacity = 255;

        const blinkTween = tween(uiOpacity)
            .to(actionTime, { opacity: 0 })
            .delay(0.1)
            .to(actionTime, { opacity: 255 })
            .delay(delayTime);

        if (nBlinkCount) {
            tween(uiOpacity)
                .repeat(nBlinkCount, blinkTween)
                .call(() => { if (endCall) endCall(); })
                .start();
        } else {
            tween(uiOpacity)
                .repeatForever(blinkTween)
                .start();
        }
    }

    //节点摇晃效果
    //@param node: 要摇晃的节点
    //@param offset 摇晃的幅度(默认16)
    //@param time: 摇晃的时间(默认1s)
    //@param originPos: 摇晃结束后回到的位置
    static shakeNode = function (node: Node, offset: number, time: number, originPos: Readonly<Vec3>) {
        offset = offset || 16;
        time = time || 1.0;
        let duration = 0.04;
        let originScale = node.scale.clone ? node.scale.clone() : new Vec3(node.scale.x, node.scale.y, node.scale.z);
        let times = Math.floor(time / (duration * 4));
        let originalPos = node.position.clone ? node.position.clone() : new Vec3(node.position.x, node.position.y, node.position.z);

        Tween.stopAllByTarget(node);

        let shakeSequence = [];
        for (let i = 0; i < times; i++) {
            shakeSequence.push(
                tween(node).to(duration, { position: new Vec3(originalPos.x - offset, originalPos.y, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x, originalPos.y, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x + offset, originalPos.y, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x, originalPos.y, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x, originalPos.y + offset, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x, originalPos.y, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x, originalPos.y - offset, originalPos.z) }),
                tween(node).to(duration, { position: new Vec3(originalPos.x, originalPos.y, originalPos.z) })
            );
        }

        tween(node)
            .to(duration, { scale: new Vec3(originScale.x + 0.025, originScale.y + 0.025, originScale.z + 0.025) })
            .sequence(...shakeSequence)
            .to(duration, { scale: originScale })
            .call(() => {
                if (originPos) {
                    node.setPosition(originPos);
                }
            })
            .start();
    }

    //节点的箭头动作
    static ArrowAction(node: Node, moveVal: Vec3, duration: number) {
        let orgPos = node.position
        Tween.stopAllByTarget(node)
        tween(node)
            .repeatForever(
                tween()
                    .to(duration, { x: orgPos.x + moveVal.x, y: orgPos.y + moveVal.y })
                    .to(duration, { x: orgPos.x, y: orgPos.y })
            )
            .start()
    }

    // 飞钻石
    static FlyDiamond(fromNode: Node, toNode: Node, endCall: () => void, rollData: { lblCoin: Node; }, bCopyHallCoin: any) {
        //检查当前canvas下有没有flycoin的节点，没有就添加
        if (!toNode) {
            toNode = find("Canvas/UserinfoBar/钻石/icon")
        }
        //位置转换：会将fromNode,toNode转换到flycoin下的坐标来显示
        let doFly = function (node: Node) {
            ScreenUtils.FixDesignScale_V(node)
            if (isValid(fromNode) && isValid(toNode) && isValid(node)) {
                let fromWordPos = fromNode.getWorldPosition()
                let toWordPos = toNode.getWorldPosition()
                let fromNodePos = node.getComponent(UITransform).convertToNodeSpaceAR(fromWordPos)
                let toNodePos = node.getComponent(UITransform).convertToNodeSpaceAR(toWordPos)
                let _copyHallNode
                if (bCopyHallCoin && rollData) {
                    _copyHallNode = find('copyhalldiamond', node)
                    if (!_copyHallNode) {
                        let targetNode = find("Canvas/UserinfoBar/钻石")
                        // if (targetNode) {
                        let copNode = instantiate(targetNode)
                        let pos = node.getComponent(UITransform).convertToNodeSpaceAR(targetNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO))
                        copNode.name = 'copyhalldiamond'
                        copNode.parent = node
                        copNode.position = pos
                        _copyHallNode = copNode
                        // }
                    }
                    rollData.lblCoin = find('lbl_val', _copyHallNode)
                    _copyHallNode.active = true
                }
                let flyEnd = function () {
                    if (endCall) {
                        endCall()
                    }
                    if (bCopyHallCoin) {
                        EventUtils.getInstance().dispatchEvent(EventId.UPATE_DIAMOND)
                        if (_copyHallNode) {
                            _copyHallNode.active = false
                        }
                    }

                }
                // @ts-ignore
                let script = node.getComponent('FlyDiamonds') as any;
                if (script && typeof script.showFlyCoins === 'function') {
                    script.showFlyCoins(fromNodePos, toNodePos, 20, flyEnd, rollData)
                }
            }
            else {
                if (endCall) {
                    endCall()
                }
            }
        }
        let flyNode = find("Canvas/flydiamonds")
        if (!flyNode) {
            resources.load("BalootClient/BaseRes/prefabs/flydiamonds", Prefab, (err, prefab) => {
                if (!err && prefab) {
                    let newNode = instantiate(prefab);
                    newNode.parent = find("Canvas");
                    newNode.setSiblingIndex(999);
                    doFly(newNode);
                }
            });
        }
        else {
            doFly(flyNode)
        }
    }
    // 飞钻石
    static FlyCoinV2(fromNode: Node, toNode: Node, endCall: () => void, rollData: { lblCoin: Node; }, bCopyHallCoin: any) {
        //检查当前canvas下有没有flycoin的节点，没有就添加
        //位置转换：会将fromNode,toNode转换到flycoin下的坐标来显示
        if (!toNode) {
            toNode = find("Canvas/UserinfoBar/金币/icon")
        }
        let doFly = function (node: Node) {
            ScreenUtils.FixDesignScale_V(node)
            if (isValid(fromNode) && isValid(toNode) && isValid(node)) {
                let fromWordPos = fromNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO)
                let toWordPos = toNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO)
                let fromNodePos = node.getComponent(UITransform).convertToNodeSpaceAR(fromWordPos)
                let toNodePos = node.getComponent(UITransform).convertToNodeSpaceAR(toWordPos)
                let _copyHallNode
                if (bCopyHallCoin && rollData) {
                    _copyHallNode = find('copyhallcoin', node)
                    if (!_copyHallNode) {
                        let targetNode = find("Canvas/UserinfoBar/金币")
                        // if (!targetNode) {
                        //     targetNode = cc.find(Global.INGAME_COIN_NODE_PATH).parent
                        // }
                        // if (targetNode) {
                        let copNode = instantiate(targetNode)
                        let pos = node.getComponent(UITransform).convertToNodeSpaceAR(targetNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO))
                        copNode.name = 'copyhallcoin'
                        copNode.parent = node
                        copNode.position = pos
                        _copyHallNode = copNode
                        // }
                    }
                    rollData.lblCoin = find('lbl_coin', _copyHallNode)
                    if (!rollData.lblCoin) {
                        rollData.lblCoin = find('lbl_coinsNum', _copyHallNode)
                    }
                    _copyHallNode.active = true
                }
                let flyEnd = function () {
                    if (endCall) {
                        endCall()
                    }
                    if (bCopyHallCoin) {
                        EventUtils.getInstance().dispatchEvent(EventId.UPATE_COINS)
                        if (_copyHallNode) {
                            _copyHallNode.active = false
                        }
                    }
                }
                let script = node.getComponent('FlyCoins') as any;
                if (script && typeof script.showFlyCoins === 'function') {
                    script.showFlyCoins(fromNodePos, toNodePos, 20, flyEnd, rollData)
                }
            }
            else {
                if (endCall) {
                    endCall()
                }
            }
        }
        let flyNode = find("Canvas/flycoins")
        if (!flyNode) {
            //add
            resources.load("BalootClient/BaseRes/prefabs/flycoins", Prefab, (err, prefab) => {
                if (!err) {
                    let newNode = instantiate(prefab)
                    newNode.parent = find("Canvas")
                    newNode.setSiblingIndex(999);
                    doFly(newNode)
                }
            })
        }
        else {
            doFly(flyNode)
        }

    }

    // 飞任意节点
    static FlyAnimTo(fromNode: Node, toNode: Node, parm) {
        let spriteFrame = parm.spriteFrame;
        let prefab = parm.prefab;
        let scale = parm.scale || 1;
        let delay = parm.delay || 0;
        let onStart = parm.onStart;
        let zIndex = parm.zIndex || 1000;
        let onEnd = parm.onEnd;
        let count = parm.count || 20;

        if (isValid(fromNode) && isValid(toNode) && (spriteFrame || prefab)) {
            let Canvas = find("Canvas")

            let fromWordPos = fromNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO)
            let toWordPos = toNode.getComponent(UITransform).convertToWorldSpaceAR(Vec3.ZERO)
            let fromNodePos = Canvas.getComponent(UITransform).convertToNodeSpaceAR(fromWordPos)
            let toNodePos = Canvas.getComponent(UITransform).convertToNodeSpaceAR(toWordPos)

            let tempNodes = [];
            for (let i = 0; i < count; i++) {
                let flyNode = null;
                if (spriteFrame) {
                    flyNode = new Node();
                    let sp = flyNode.addComponent(Sprite)
                    sp.spriteFrame = spriteFrame;
                } else if (prefab) {
                    flyNode = instantiate(prefab)
                }
                flyNode.scale = scale;
                flyNode.active = false;
                flyNode.parent = find("Canvas");
                flyNode.setSiblingIndex(zIndex);
                tempNodes.push(flyNode)
            }

            let isStart = false;
            // 给予动画
            for (let i = 0; i < tempNodes.length; i++) {
                const _node = tempNodes[i];
                ScreenUtils.FixDesignScale_V(_node)
                _node.position = _node.parent.convertToNodeSpaceAR(fromWordPos)
                // 随机生成一个中间位置
                let tempPos = fromNodePos.add(new Vec3(Math.random() * 300 - 150, Math.random() * 300 - 150, 0));
                // 随机时间
                let animTime = 0.1 + Math.random() * 0.3;
                tween(_node)
                    .delay(delay)
                    .call(() => {
                        _node.active = true;
                        // 回调
                        if (!isStart) {
                            onStart && onStart();
                            isStart = true;
                        }
                    })
                    .to(animTime, { position: tempPos })
                    .delay(0.5)
                    .to(0.3, { position: toNodePos, scale: 1 })
                    .call(() => {
                        onEnd && onEnd(_node);
                        _node.destroy();
                    })
                    .start();
            }

        }
    }



    static FlyAnimToPos = function (fromWordPos: Node, toWordPos: Node, parm) {
        let spriteFrame = parm.spriteFrame;
        let prefab = parm.prefab;
        let scale = parm.scale || 1;
        let endScale = parm.endScale || 1;
        let delay = parm.delay || 0;
        let onStart = parm.onStart;
        let onEnd = parm.onEnd;
        let zIndex = parm.zIndex || 1000;
        let onEndOne = parm.onEndOne;
        let count = parm.count || 20;
        let onInit = parm.onInit;
        let noBoom = parm.boom || false;
        let rangeX = parm.rangeX || 150;
        let rangeY = parm.rangeY || 150;

        if ((spriteFrame || prefab)) {
            let Canvas = find("Canvas")
            // let fromWordPos = fromNode.convertToWorldSpaceAR(cc.v2(0, 0))
            // let toWordPos = toNode.convertToWorldSpaceAR(cc.v2(0, 0))
            // let fromNodePos = Canvas.convertToNodeSpaceAR(fromWordPos)
            // let toNodePos = Canvas.convertToNodeSpaceAR(toWordPos)

            let tempNodes = [];
            for (let i = 0; i < count; i++) {
                let flyNode = null;
                if (spriteFrame) {
                    flyNode = new Node();
                    let sp = flyNode.addComponent(Sprite)
                    sp.spriteFrame = spriteFrame;
                } else if (prefab) {
                    flyNode = instantiate(prefab)
                }
                flyNode.parent = Canvas;
                onInit && onInit(i, flyNode);
                flyNode.scale = scale;
                flyNode.position = Vec3.ZERO;
                flyNode.setSiblingIndex(zIndex);
                flyNode.active = false;
                tempNodes.push(flyNode)
            }

            let isStart = false;
            let indexAnim = 0;
            // 给予动画
            for (let i = 0; i < tempNodes.length; i++) {
                const _node = tempNodes[i];
                ScreenUtils.FixDesignScale_V(_node)
                _node.position = _node.parent.getComponent(UITransform).convertToNodeSpaceAR(fromWordPos)
                // 随机生成一个中间位置
                let tempPos = _node.parent.getComponent(UITransform).convertToNodeSpaceAR(fromWordPos)
                    .add(new Vec3(Math.random() * rangeX * 2 - rangeX, Math.random() * rangeY * 2 - rangeY, 0));
                // 随机时间
                let animTime = 0.1 + Math.random() * 0.3;
                let delayTime = 0.3 + Math.random() * 0.3;
                let moveTime = 0.3 + Math.random() * 0.3;
                if (!noBoom) {
                    tween(_node)
                        .delay(delay)
                        .call(() => {
                            _node.active = true;
                            // 回调
                            if (!isStart) {
                                onStart && onStart();
                                isStart = true;
                            }
                        })
                        .to(animTime, { position: tempPos })
                        .delay(delayTime)
                        .to(moveTime, { position: _node.parent.convertToNodeSpaceAR(toWordPos), scale: endScale })
                        .call(() => {
                            indexAnim++;
                            // if (tempNodes.indexOf(_node) >= tempNodes.length - 1) {
                            // }
                            if (indexAnim >= tempNodes.length) {
                                onEnd && onEnd(_node);
                            }
                            onEndOne && onEndOne(_node);
                            _node.destroy();
                        })
                        .start();
                } else {
                    _node.active = true;
                    // 回调
                    if (!isStart) {
                        onStart && onStart();
                        isStart = true;
                    }
                    _node.position = tempPos;
                    tween(_node)
                        .delay(delayTime)
                        .to(moveTime, { position: _node.parent.convertToNodeSpaceAR(toWordPos), scale: endScale })
                        .call(() => {
                            indexAnim++;
                            // if (tempNodes.indexOf(_node) >= tempNodes.length - 1) {
                            // }
                            if (indexAnim >= tempNodes.length) {
                                onEnd && onEnd(_node);
                            }
                            onEndOne && onEndOne(_node);
                            _node.destroy();
                        })
                        .start();

                }

            }
        }
    }


    static RewardFly = function (rewards, fromWorldPos) {
        let flyNode = find("Canvas/RewardFlyAnim");
        if (flyNode) {
            (flyNode.getComponent("RewardFlyAnim") as any).run(rewards, fromWorldPos);
        } else {
            resources.load("BalootClient/BaseRes/prefabs/RewardFlyAnim", Prefab, (err, prefab) => {
                if (err == null) {
                    let node = instantiate(prefab);
                    node.parent = find("Canvas")
                    node.setSiblingIndex(1000);
                    node.position = Vec3.ZERO;
                    node.getComponent("RewardFlyAnim").scheduleOnce(() => {
                        (node.getComponent("RewardFlyAnim") as any).run(rewards, fromWorldPos);
                    })
                    // node.getComponent("RewardFlyAnim").run(rewards, fromWorldPos);
                }
            });
        }
    }

    //数字滚动的效果
    //lblObj 需要执行动作的label
    //nBeginNum 开始数字
    //nEndNum 结束数字
    //nDur 持续时间 > 0  指定时间内滚动完
    //finishCall 结束回调
    //perChangeCall 每次数字变化的回调：ps播放数字变化音效
    //nPoint 小数点位数
    //bFormatDot 格式化成带逗号形式
    //unit :单位，是1000，1000000这种，用来格式成100,000K
    static doRoallNumEff(lblObj, nBeginNum, nEndNum, nDur = 1.5, finishCall, perChangeCall, nPoint = 2, bFormatDot, unit = false, fromatStr = '') {
        let lblCmp = lblObj.getComponent(Label)
        nDur = nDur / Config.SLOT_GAME_SPEED;
        if (lblCmp) {
            let setNum = function (lbl, numVal) {

                let strNum = MathUtils.SavePoints(numVal, nPoint)
                let showStr = strNum
                if (bFormatDot) {
                    showStr = FormatUtils.FormatNumToComma(Number(strNum))
                }
                if (unit) {
                    showStr = FormatUtils.formatNumShort(Number(strNum), nPoint)
                }
                lbl.string = `${fromatStr}${showStr}`;
            }

            setNum(lblCmp, nBeginNum)

            if (nBeginNum == nEndNum || nEndNum < 1) { //设置为同一个数，就没必要滚动了
                setNum(lblCmp, nEndNum);
                if (finishCall) {
                    finishCall()
                }
                return
            }
            let nDifTime = 0.04
            let nRoallTime = Math.floor(nDur / nDifTime)
            let nDif = Math.floor(((nEndNum - nBeginNum) / nRoallTime) * 100) / 100
            if (nDif % 10 == 0) {
                //被10整除了，可能累加末位数字不会变化。此时需要
                nDif = nDif - 1
                nRoallTime = Math.floor(((nEndNum - nBeginNum) / nDif) * 100) / 100

            }

            if (nDif == 0) {
                nDif = 1
            }
            //修正：小于1的增长
            if (nRoallTime < 0) {
                nRoallTime = 1
                nDif = nEndNum - nBeginNum
            }

            Tween.stopAllByTarget(lblCmp.node);
            let nStart = nBeginNum;
            let nStep = nDif;
            let curStep = 0;
            function doStep() {
                nStart += nStep;
                setNum(lblCmp, nStart);
                if (perChangeCall) perChangeCall(nStart);
                curStep++;
                if (curStep < nRoallTime) {
                    tween(lblCmp.node)
                        .delay(nDifTime)
                        .call(doStep)
                        .start();
                } else {
                    setNum(lblCmp, nEndNum);
                    if (finishCall) finishCall();
                }
            }

            // 启动滚动动画
            tween(lblCmp.node)
                .delay(nDifTime)
                .call(doStep)
                .start();

        }
    }
}