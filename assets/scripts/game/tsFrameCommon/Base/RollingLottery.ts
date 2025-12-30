import { BezierCurveMoveBase, BezierCurveMoveBase_ } from "./BezierCurveMoveBase";
import { PoolMng } from "./PoolMng";
import { _decorator, EventHandler, Enum, Size, Prefab, Node, Layout, Rect, Vec3, Quat, Mat4, instantiate, warn, v3, UITransform, assetManager } from 'cc';
// @ts-ignore
import { EDITOR } from 'cc/env';
const { ccclass, property, menu, executeInEditMode } = _decorator;

namespace _RollingLottery {
	/** 方向 */
	export enum Direction {
		竖,
		横,
	}
}

/** 滚动抽奖 */
@ccclass
@menu("转盘/RollingLottery(横竖向滚动)")
@executeInEditMode
export class RollingLottery extends BezierCurveMoveBase {
	/* --------------- 属性 --------------- */
	/** 子节点刷新事件 */
	@property({
		displayName: "子节点刷新事件",
		tooltip: "(子节点_node, 下标_indexN)",
		type: EventHandler,
	})
	itemUpdateEvent = new EventHandler();

	/** 方向 */
	@property({
		displayName: "方向",
		type: Enum(_RollingLottery.Direction),
	})
	dire = _RollingLottery.Direction.竖;

	@property
	itemSize = new Size(0, 0);

	@property
	firstIndexN = 0;

	@property
	realNum = 0;

	@property({
        tooltip: '是否加载预制体列表',
    })
    isLoadPrefabList = true

	@property({
		tooltip: '预制体所在Assert路径',
		visible() {
			return this.isLoadPrefabList;
		}
	})
	bundleAssertPath = '';

	@property({
		tooltip: '预制体所在bundle',
		visible() {
			return this.isLoadPrefabList;
		}
	})
	bundleName = '';

	@property({
		tooltip: '预制体所在资源路径',
		visible() {
			return this.isLoadPrefabList;
		}
	})
	itemPrefabsPath = '';

	@property({
		tooltip: 'item Pool对象池名字',
		visible() {
			return !this.isLoadPrefabList;
		}
	})
	itemPoolName = '';

	@property({
		type: Prefab,
		tooltip: 'item预制体',
		visible() {
			return !this.isLoadPrefabList;
		}
	})
	itemPrefab: Prefab = null;

	@property({ visible: false })
	_numList = '';
	@property({
		tooltip: 'item列表',
	})
	get numList() {
		return this._numList;
	}
	set numList(v) {
		this._numList = v;
		this.updateList();
	}
	
	

	/* --------------- private --------------- */
	/** 周长 */
	private _perimeterN = 0;
	/** 自己矩形 */
	private _selfRect = new Rect();
	/** 父节点中心点矩形 */
	private _parentCenterRect!: Rect;
	/** uiTransform 表 */
	private _nodeTab!: Record<string, Node | null>;
	/* --------------- 临时变量 --------------- */
	private _tempTab = {
		valueM4: new Mat4(),
		value2M4: new Mat4(),
		valueRect: new Rect(),
	};

	/** 滚动子节点临时变量 */
	private _temp = new (class {
		/** 当前节点矩形 */
		currNodeRect = new Rect();
		/** 更新节点坐标 */
		updatePosB = false;
		/** 当前节点 UITransform */
		currNode!: Node;
		/** 当前下标 */
		currIndexN!: number;
		/** 超出周长倍数 */
		outOfRangeMultipleN!: number;
	})();

	private index = 0;

	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		super.onLoad();
		if (EDITOR) {
			this.updateList();
			return;
		}
		if (this.itemPoolName && this.itemPrefab) {
			PoolMng.newNodePoolByPrefab(this.itemPoolName, this.itemPrefab);
		}
	}

	onDestroy() {
		if (EDITOR) {
			return;
		}
		for (let i = this.node.children.length-1; i >= 0; i--) {
			let child = this.node.children[i];
			let item = child[0];
			if (item) {
				item.destroy();
			}
		}
	}

	getItemNum() {
		return this.node.children.length;
	}

	getItemRealNum() {
		return this.realNum;
	}

	updateList() {
		let list: number[] = [];
		if (this._numList.trim() != '') {
			let listTmp = this._numList.split(',');
			listTmp.forEach(element => {
				let type = 0;
				let strNum = element.trim();
				if (strNum != '') {
					type = parseInt(element);
				}
				list.push(type);
			});
		}
		this.initList(this.index, list, null);
	}

	initList(index: number, itemList: number[], cbLoaded: Function, cbItemLoaded: Function = null, cbPositionChanged: Function = null, cbRemove: Function = null) {
		this.index = index;
		this.node.getComponent(Layout).enabled = true;
		// 创建节点
		if (this.node.children.length != itemList.length) {
			if (itemList.length > this.node.children.length) {
				for (let i = this.node.children.length; i < itemList.length; i++) {
					let child = new Node();
					child.parent = this.node;
				}
			} else {
				for (let i = this.node.children.length-1; i >= itemList.length; i--) {
					let child = this.node.children[i];
					child.removeFromParent();
				}
			}
		}
		let finishedNum = 0;
		for (let i = 0; i < itemList.length; i++) {
			let type = itemList[i];
			let item = this.node.children[i];
			// Note: POSITION_CHANGED event does not exist in Cocos Creator 3.x
			// If position change notification is needed, call cbPositionChanged manually in _move method
			// if (i < this.realNum && this.isLoadPrefabList) {
			// 	item.on(Node.EventType.POSITION_CHANGED, () => {
			// 		if (cbPositionChanged) {
			// 			cbPositionChanged(i);
			// 		}
			// 	});
			// }
			this.initItem(item, type, () => {
				if (i < this.realNum) {
					if (cbItemLoaded) {
						cbItemLoaded(i, item);
					}
				}
				finishedNum++;
				if (finishedNum == itemList.length) {
					setTimeout(() => {
						this._initData();
						this._initView();
						this._initEvent();
						if (cbLoaded) {
							cbLoaded();
						}
					}, 100);
				}
			}, () => {
				if (cbRemove) {
					cbRemove(i);
				}
			});
		}
	}

	initItem(node: Node, type: number, cbLoaded: Function = null, cbRemove: Function = null) {
        if (!node) {
            return;
        }
		if (node.children.length > 1) {
			warn('RollingLottery子节点数量超过1个');
			for (let i = node.children.length-1; i >= 1; i--) {
				let item = node.children[i];
				this.removeItem(item);
			}
		}
		let isExist = false;
		let item = node.children[0];
        if (item) {
			if (this.isLoadPrefabList) {
				let itemType = parseInt(item.name);
				if (itemType != type) {
					this.removeItem(item);
					if (cbRemove) {
						cbRemove();
					}
				} else {
					isExist = true;
				}
			} else {
				isExist = true;
			}
        }
        if (!isExist && type > 0) {
            this.newItem(type, (item) => {
				item.parent = node;
				const nodeUITransform = node.getComponent(UITransform) || node.addComponent(UITransform);
				nodeUITransform.width = this.itemSize.width;
				const itemUITransform = item.getComponent(UITransform);
				if (itemUITransform) {
					nodeUITransform.height = itemUITransform.height;
				}
				if (cbLoaded) {
					cbLoaded(item);
				}
			});
        } else {
			const nodeUITransform = node.getComponent(UITransform) || node.addComponent(UITransform);
			nodeUITransform.width = this.itemSize.width;
			nodeUITransform.height = this.itemSize.height;
			if (cbLoaded) {
				cbLoaded(item);
			}
		}
    }

	newItem(type: number, callback: Function) {
		if (this.isLoadPrefabList) {
			if (EDITOR) {
				// Cocos Creator 3.x 编辑器模式下直接使用资源路径加载
				let resPath = `${this.bundleAssertPath}/${this.itemPrefabsPath}/${type}`;
				assetManager.loadAny({ path: resPath, type: Prefab }, (err, data: Prefab) => {
					if (err) {
						console.warn('Failed to load prefab:', resPath, err);
						return;
					}
					let node = instantiate(data);
					if (callback) {
						callback(node);
					}
				});
			} else {
				PoolMng.getNodePool(`${this.bundleName}_item_${type}`, (node: Node) => {
					if (callback) {
						callback(node);
					}
				});
			}
		} else if (this.itemPrefab) {
			if (EDITOR) {
				if (callback) {
					callback(instantiate(this.itemPrefab));
				}
			} else {
				if (this.itemPoolName) {
					PoolMng.getNodePool(this.itemPoolName, (node: Node) => {
						if (callback) {
							callback(node);
						}
					});
				} else {
					if (callback) {
						callback(instantiate(this.itemPrefab));
					}
				}
			}
		}
	}

	removeItem (ndItem: Node) {
		// Note: POSITION_CHANGED event does not exist in Cocos Creator 3.x
		// ndItem.off(Node.EventType.POSITION_CHANGED);
		if (this.isLoadPrefabList) {
			PoolMng.putNodePool(`${this.bundleName}_item_${ndItem.name}`, ndItem);
		} else if (this.itemPoolName) {
			PoolMng.putNodePool(this.itemPoolName, ndItem);
		} else {
			ndItem.destroy();
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化事件 */
	private _initEvent(): void {
		this.node.on(Node.EventType.CHILD_ADDED, this._nodeChildAdded, this);
		this.node.on(Node.EventType.CHILD_REMOVED, this._nodeChildRemoved, this);
	}

	/** 初始化视图 */
	private _initView(): void {
		const layout = this.node.getComponent(Layout);
		if (layout) {
			layout.enabled = false;
		}

		this._currDistN = this.firstIndexN;

		// 初始化子节点及选中
		if (this.node.children.length) {
			// 重置子节点
			this.node.children.forEach((v, kN) => {
				v.name = String(kN + this._currIndexN);
				this.itemUpdateEvent.emit([v, kN + this._currIndexN]);
			});

			this.jump(this._currDistN);
		}
	}

	/** 重制数据 */
	private _resetData(): void {
		this._currIndexN = 0;

		// item 大小矩形，中心点在节点 (0, 0) 位置
		this._parentCenterRect = new Rect(-this.itemSize.width * 0.5, -this.itemSize.height * 0.5, this.itemSize.width, this.itemSize.height);

		// 重置数据
		this._nodeTab = Object.create(null);
		this._nodeTab[this.node.parent!.uuid] = this.node;
		this._nodeTab[this.node.uuid] = this.node;
		this._selfRect = this._getBoundingBoxToWorld(this.node);
		this._perimeterN = 0;

		// 更新周长
		let itemSize: Size;

		this.node.children.forEach((v) => {
			this._nodeTab[v.uuid] = v;
			const uiTransform = this._nodeTab[v.uuid]!.getComponent(UITransform);
			if (uiTransform) {
				itemSize = uiTransform.contentSize;
				this._perimeterN += this.dire === _RollingLottery.Direction.横 ? itemSize.width : itemSize.height;
			}
		});
	}

	/** 重制视图 */
	private _resetView(): void {
		const layout = this.node.getComponent(Layout);

		if (layout) {
			layout.enabled = false;
		}

		// 重置坐标
		{
			const startPosV3 = this.node.position.clone();

			if (this.dire === _RollingLottery.Direction.横) {
				this.node.children.forEach((v, kN) => {
					v.position = v3(startPosV3.x + this._parentCenterRect.width * kN, v.y, 0);
				});
			} else {
				this.node.children.forEach((v, kN) => {
					v.position = v3(v.x, startPosV3.y - this._parentCenterRect.height * kN, 0);
				});
			}
		}

		// 初始化子节点及选中
		if (this.node.children.length) {
			// 重置子节点
			this.node.children.forEach((v, kN) => {
				v.name = String(kN + this._currIndexN);
				this.itemUpdateEvent.emit([v, kN + this._currIndexN]);
			});

			this.jump(this._currIndexN);
		}
	}

	/** 重置 */
	private _reset(): void {
		if (!this.node.children.length) {
			return;
		}

		this._resetData();
		this._resetView();
	}

	/**
	 * 获取在世界坐标系下的节点包围盒(不包含自身激活的子节点范围)
	 * @param node_ 目标节点
	 * @param outRect_ 输出矩形
	 * @returns 输出矩形
	 */
	private _getBoundingBoxToWorld(node_: Node, outRect_ = new Rect()): Rect {
		const node = this._nodeTab[node_.uuid]!;
		const uiTransform = node.getComponent(UITransform);
		if (!uiTransform) {
			return outRect_;
		}

		let rotation = Quat.fromEuler(new Quat(), node_.eulerAngles.x, node_.eulerAngles.y, node_.eulerAngles.z);
		let position = v3(node_.position.x, node_.position.y, node_.position.z);
		let scale = node_.scale;
		Mat4.fromRTS(this._tempTab.valueM4, rotation, position, scale);
		const width = uiTransform.contentSize.width;
		const height = uiTransform.contentSize.height;
		const anchorPoint = uiTransform.anchorPoint;

		outRect_.x = -anchorPoint.x * width;
		outRect_.y = -anchorPoint.y * height;
		outRect_.width = width;
		outRect_.height = height;

		// node_.parent!.getWorldMatrix(this._tempTab.value2M4);
		// cc.Mat4.multiply(this._tempTab.value2M4, this._tempTab.value2M4, this._tempTab.valueM4);
		// outRect_.transformMat4(this._tempTab.value2M4);
		outRect_.transformMat4(this._tempTab.valueM4);

		return outRect_;
	}

	/**
	 * 更新节点下标
	 * @param node_ 目标节点
	 * @param indexN_ 下标
	 */
	private _updateNodeIndex(node_: Node, indexN_: number): void {
		node_.name = String(indexN_);
		this.itemUpdateEvent.emit([node_, indexN_]);
	}

	/**
	 * 上到下移动子节点
	 * @param distN_ 距离
	 */
	private _moveNodeTopToBottom(distN_: number): void {
		this.node.children.forEach((v, kN) => {
			this._temp.currNode = this._nodeTab[v.uuid]!;
			this._temp.updatePosB = false;
			this._getBoundingBoxToWorld(v, this._temp.currNodeRect);

			// 移动坐标
			this._temp.currNodeRect.y += distN_;

			// 相交则更新节点坐标
			if (this._temp.currNodeRect.intersects(this._selfRect)) {
				this._temp.updatePosB = true;
			}
			// 若不相交则超出范围
			else {
				// 若节点在上方则跳过更新
				if (this._temp.currNodeRect.yMin > this._selfRect.yMax) {
					this._temp.updatePosB = true;
				} else {
					// (超出范围 / 周长) + 超出视图区域的 1
					this._temp.outOfRangeMultipleN = Math.floor((this._selfRect.yMin - this._temp.currNodeRect.yMax) / this._perimeterN) + 1;

					// 更新坐标
					this._temp.currNodeRect.y += this._temp.outOfRangeMultipleN * this._perimeterN;
					const currUITransform = this._temp.currNode.getComponent(UITransform);
					const anchorY = currUITransform ? currUITransform.anchorPoint.y : 0.5;
					v.position = v3(v.position.x, this._temp.currNodeRect.y + this.itemSize.height * anchorY, 0);

					// 更新 item 下标
					this._updateNodeIndex(v, Number(v.name) - this._temp.outOfRangeMultipleN * this.node.children.length);
				}
			}

			// 更新节点坐标
			if (this._temp.updatePosB) {
				const currUITransform1 = this._temp.currNode.getComponent(UITransform);
				const anchorY1 = currUITransform1 ? currUITransform1.anchorPoint.y : 0.5;
				v.position = v3(v.position.x, this._temp.currNodeRect.y + this._temp.currNodeRect.height * anchorY1, 0);
			}

			// 更新当前下标
			this._temp.currIndexN = Number(v.name);

			if (
				this._temp.currIndexN < this._currIndexN &&
				Rect.intersection(this._tempTab.valueRect, this._temp.currNodeRect, this._parentCenterRect).height >=
					this._parentCenterRect.height * 0.5
			) {
				this.currIndexN = this._temp.currIndexN;
			}
		});
	}

	/**
	 * 下到上移动子节点
	 * @param distN_ 距离
	 */
	private _moveNodeBottomToTop(distN_: number): void {
		this.node.children.forEach((v, kN) => {
			this._temp.currNode = this._nodeTab[v.uuid]!;
			this._temp.updatePosB = false;
			this._getBoundingBoxToWorld(v, this._temp.currNodeRect);

			// 移动坐标
			this._temp.currNodeRect.y += distN_;

			// 相交则更新节点坐标
			if (this._temp.currNodeRect.intersects(this._selfRect)) {
				this._temp.updatePosB = true;
			}
			// 若不相交则超出范围
			else {
				// 若节点在下方则跳过更新
				if (this._selfRect.yMin > this._temp.currNodeRect.yMax) {
					this._temp.updatePosB = true;
				} else {
					// (超出范围 / 周长) + 超出视图区域的 1
					this._temp.outOfRangeMultipleN = Math.floor((this._temp.currNodeRect.yMin - this._selfRect.yMax) / this._perimeterN) + 1;

					// 更新坐标
					this._temp.currNodeRect.y -= this._temp.outOfRangeMultipleN * this._perimeterN;
					const currUITransform2 = this._temp.currNode.getComponent(UITransform);
					const anchorY2 = currUITransform2 ? currUITransform2.anchorPoint.y : 0.5;
					v.position = v3(v.position.x, this._temp.currNodeRect.y + this.itemSize.height * anchorY2, 0);

					// 更新 item 下标
					this._updateNodeIndex(v, Number(v.name) + this._temp.outOfRangeMultipleN * this.node.children.length);
				}
			}

			// 更新节点坐标
			if (this._temp.updatePosB) {
				const currUITransform3 = this._temp.currNode.getComponent(UITransform);
				const anchorY3 = currUITransform3 ? currUITransform3.anchorPoint.y : 0.5;
				v.position = v3(v.position.x, this._temp.currNodeRect.y + this._temp.currNodeRect.height * anchorY3, 0);
			}

			// 更新当前下标
			this._temp.currIndexN = Number(v.name);
			if (
				this._temp.currIndexN > this._currIndexN &&
				Rect.intersection(this._tempTab.valueRect, this._temp.currNodeRect, this._parentCenterRect).height >=
					this._parentCenterRect.height * 0.5
			) {
				this.currIndexN = this._temp.currIndexN;
			}
		});
	}

	/**
	 * 左到右移动子节
	 * @param distN_ 距离
	 */
	private _moveNodeLeftToRight(distN_: number): void {
		this.node.children.forEach((v, kN) => {
			this._temp.currNode = this._nodeTab[v.uuid]!;
			this._temp.updatePosB = false;
			this._getBoundingBoxToWorld(v, this._temp.currNodeRect);

			// 移动坐标
			this._temp.currNodeRect.x += distN_;

			// 相交则更新节点坐标
			if (this._temp.currNodeRect.intersects(this._selfRect)) {
				this._temp.updatePosB = true;
			}
			// 若不相交则超出范围
			else {
				// 若节点在左方则跳过更新
				if (this._temp.currNodeRect.xMax < this._selfRect.xMin) {
					this._temp.updatePosB = true;
				} else {
					// (超出范围 / 周长) + 超出视图区域的 1
					this._temp.outOfRangeMultipleN = Math.floor((this._temp.currNodeRect.xMin - this._selfRect.xMax) / this._perimeterN) + 1;

					// 更新坐标
					this._temp.currNodeRect.x -= this._temp.outOfRangeMultipleN * this._perimeterN;
					const currUITransform4 = this._temp.currNode.getComponent(UITransform);
					const anchorX4 = currUITransform4 ? currUITransform4.anchorPoint.x : 0.5;
					v.position = v3(this._temp.currNodeRect.x + this.itemSize.width * anchorX4, v.position.y, 0);

					// 更新 item 下标
					this._updateNodeIndex(v, Number(v.name) - this._temp.outOfRangeMultipleN * this.node.children.length);
				}
			}

			// 更新节点坐标
			if (this._temp.updatePosB) {
				const currUITransform5 = this._temp.currNode.getComponent(UITransform);
				const anchorX5 = currUITransform5 ? currUITransform5.anchorPoint.x : 0.5;
				v.position = v3(this._temp.currNodeRect.x + this._temp.currNodeRect.width * anchorX5, v.position.y, 0);
			}

			// 更新当前下标
			this._temp.currIndexN = Number(v.name);

			if (
				this._temp.currIndexN < this._currIndexN &&
				Rect.intersection(this._tempTab.valueRect, this._temp.currNodeRect, this._parentCenterRect).width >=
					this._parentCenterRect.width * 0.5
			) {
				this.currIndexN = this._temp.currIndexN;
			}
		});
	}

	/**
	 * 右到左移动子节
	 * @param distN_ 距离
	 */
	private _moveNodeRightToLeft(distN_: number): void {
		this.node.children.forEach((v, kN) => {
			this._temp.currNode = this._nodeTab[v.uuid]!;
			this._temp.updatePosB = false;
			this._getBoundingBoxToWorld(v, this._temp.currNodeRect);

			// 移动坐标
			this._temp.currNodeRect.x += distN_;

			// 相交则更新节点坐标
			if (this._temp.currNodeRect.intersects(this._selfRect)) {
				this._temp.updatePosB = true;
			}
			// 若不相交则超出范围
			else {
				// 若节点在右方则跳过更新
				if (this._temp.currNodeRect.xMin > this._selfRect.xMax) {
					this._temp.updatePosB = true;
				} else {
					// (超出范围 / 周长) + 超出视图区域的 1
					this._temp.outOfRangeMultipleN = Math.floor((this._selfRect.xMin - this._temp.currNodeRect.xMax) / this._perimeterN) + 1;

					// 更新坐标
					this._temp.currNodeRect.x += this._temp.outOfRangeMultipleN * this._perimeterN;
					const currUITransform6 = this._temp.currNode.getComponent(UITransform);
					const anchorX6 = currUITransform6 ? currUITransform6.anchorPoint.x : 0.5;
					v.position = v3(this._temp.currNodeRect.x + this.itemSize.width * anchorX6, v.position.y, 0);

					// 更新 item 下标
					this._updateNodeIndex(v, Number(v.name) + this._temp.outOfRangeMultipleN * this.node.children.length);
				}
			}

			// 更新节点坐标
			if (this._temp.updatePosB) {
				const currUITransform7 = this._temp.currNode.getComponent(UITransform);
				const anchorX7 = currUITransform7 ? currUITransform7.anchorPoint.x : 0.5;
				v.position = v3(this._temp.currNodeRect.x + this._temp.currNodeRect.width * anchorX7, v.position.y, 0);
			}

			// 更新当前下标
			this._temp.currIndexN = Number(v.name);

			if (
				this._temp.currIndexN > this._currIndexN &&
				Rect.intersection(this._tempTab.valueRect, this._temp.currNodeRect, this._parentCenterRect).width >=
					this._parentCenterRect.width * 0.5
			) {
				this.currIndexN = this._temp.currIndexN;
			}
		});
	}

	/** 初始化数据 */
	protected _initData(): void {
		super._initData();
		this._resetData();
	}

	/** 运动 */
	protected _move(valueN_: number): void {
		if (!valueN_) {
			return;
		}

		// 左右滚动
		if (this.dire === _RollingLottery.Direction.横) {
			// 从左往右
			if (valueN_ > 0) {
				this._moveNodeLeftToRight(valueN_);
			}
			// 从右往左
			else if (valueN_ < 0) {
				this._moveNodeRightToLeft(valueN_);
			}
		}
		// 上下滚动
		else {
			// 从上往下
			if (valueN_ < 0) {
				this._moveNodeTopToBottom(valueN_);
			}
			// 从下往上
			else if (valueN_ > 0) {
				this._moveNodeBottomToTop(valueN_);
			}
		}
	}

	/** 获取当前下标 */
	protected _getCurrIndex(): number {
		return this.currIndexN;
	}

	protected _getMoveDist(indexN_: number, scrollConfig_?: RollingLottery_.ScrollConfig): number {
		/** 当前节点 */
		const currNode = this.node.getChildByName(String(this._currIndexN))!;
		/** 间隔格子 */
		const intervalN = indexN_ - this._currIndexN;
		/** 格子距离 */
		const boxDistN = this.dire === _RollingLottery.Direction.横 ? this.itemSize.width : this.itemSize.height;
		/** 当前格子距父节点(0, 0)的偏移坐标 */
		const parentNode = this._nodeTab[this.node.parent!.uuid]!;
		const currUITransform = currNode.getComponent(UITransform);
		const parentUITransform = parentNode.getComponent(UITransform);
		let worldPos = v3(0, 0, 0);
		if (currUITransform) {
			worldPos = currUITransform.convertToWorldSpaceAR(v3(0, 0, 0));
		}
		let nodePos = v3(0, 0, 0);
		if (parentUITransform) {
			nodePos = parentUITransform.convertToNodeSpaceAR(worldPos);
		}
		const offsetDistV3 = this.node.position.clone().subtract(nodePos);

		// 设置总距离
		if (this.dire === _RollingLottery.Direction.横) {
			return -intervalN * boxDistN + offsetDistV3.x;
		} else {
			return intervalN * boxDistN + offsetDistV3.y;
		}
	}

	loop(speedN_: number, config_?: BezierCurveMoveBase_.LoopConfig): void {
		if (this.dire === _RollingLottery.Direction.竖) {
			speedN_ = -speedN_;
		}

		super.loop(speedN_, config_);
	}

	move(indexN_: number, scrollConfig_?: RollingLottery_.ScrollConfig): void {
		super.move(indexN_, new RollingLottery_.ScrollConfig(scrollConfig_));
	}

	jump(indexN_: number): void {
		super.jump(indexN_);
		this.currIndexN = indexN_;
	}

	getSpeed(indexN_: number, config_?: RollingLottery_.ScrollConfig): number {
		return super.getSpeed(indexN_, new RollingLottery_.ScrollConfig(config_));
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _nodeChildAdded(): void {
		this.unschedule(this._reset);
		this.scheduleOnce(this._reset);
	}

	private _nodeChildRemoved(): void {
		this.unschedule(this._reset);
		this.scheduleOnce(this._reset);
	}

	eventIndexChange(valueN_: number, indexN_: number, jumpB_: boolean): void {

	}

	eventItemUpdate(node_: Node, indexN_: number): void {

	}

	eventScrollEnd(): void {
        
	}

	eventLoopEnd(data: string): void {

	}

	eventTransitionEnd(data: string): void {

	}
}

export namespace RollingLottery_ {
	/** 方向 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	export const Direction = _RollingLottery.Direction;
	/** 方向 */
	export type Direction = _RollingLottery.Direction;

	/** 滚动配置 */
	export class ScrollConfig extends BezierCurveMoveBase_.MoveConfig {
		constructor(init_?: ScrollConfig) {
			super(init_);
		}
	}
}
