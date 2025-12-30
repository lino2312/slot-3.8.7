export interface PosData {
    col: number,
    row: number
}

export interface RewardConfig { 
    [index: string]: {[key:string]:{reward:number}}
}