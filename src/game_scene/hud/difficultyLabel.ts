export class DifficultyLabel extends g.Label {

    /** 模範手数  */
    private _optimalMoveCount = 0;
    private _attempt = 0;

    constructor(scene: g.Scene, font: g.BitmapFont, fontSize: number) {
        super({
            scene: scene,
            font: font,
            fontSize: fontSize,
            text: "D 1",
        });
    }

    /**
     * @returns 模範手数
     */
    get optimalMoveCount() { return this._optimalMoveCount; }

    /**
     * @param optimalMoveCount 模範手数
     */
    set optimalMoveCount(optimalMoveCount) {
        this._optimalMoveCount = optimalMoveCount;
        this.text = `D${(" " + optimalMoveCount).slice(-2)}`;
        this.invalidate();
        this._attempt = 0;
    }

    get attempt(): number { return this._attempt; }

    set attempt(attempt: number) { this._attempt = attempt; }
}