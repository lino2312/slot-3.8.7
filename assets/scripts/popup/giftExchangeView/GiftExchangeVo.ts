export class GiftExchangeVo {
    private data = null;
    constructor(data) {
        console.log("GiftExchangeVo", data)
        this.data = data
    }

    get getList() {
        return this.data ? this.data.list : [];
    }
}