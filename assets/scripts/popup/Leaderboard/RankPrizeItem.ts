import { _decorator, Component, Label, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RankPrizeItem')
export class RankPrizeItem extends Component {

    @property(Label)
    public rank: Label = null!;
    @property(Label)
    public prize: Label = null!;
    @property(Sprite)
    public bg: Sprite = null!;
    @property([SpriteFrame])
    public bgIcons: SpriteFrame[] = [];

    protected onLoad(): void {}
    protected start(): void {}

    /**
     * Initialize prize item data
     * @param rank - Rank number or name
     * @param prize - Prize value or description
     * @param isLast - Whether this is the last item (changes background)
     */
    public onInit(rank: string | number, prize: string | number, isLast: boolean): void {
        this.rank.string = String(rank);
        this.prize.string = String(prize);
        this.bg.spriteFrame = isLast ? this.bgIcons[1] : this.bgIcons[0];
    }
}
