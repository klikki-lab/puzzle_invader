import { TileLayer } from "./tile/tileLayer";

export class Attempter {

    private _onFinish: () => void;

    private _attempt = 0;
    private _correct = 0;

    nextAttempt = (): void => {
        this._attempt = 0;
        this._correct = 0;
    };

    correct = (): void => {
        this._correct++;
        this._attempt++;
        if (this.isFinished()) {
            this._onFinish();
        }
    };

    incorrect = (): void => {
        this._attempt++;
        if (this.isFinished()) {
            this._onFinish();
        }
    };

    /**
     * @returns パーフェクトなら `true`、そうでなければ `false`
     */
    isPerfect = (): boolean => this._attempt === this._correct;

    /** 
     * @returns すべて不正解なら `true`、そうでなければ `false`
     */
    isAllIncorrect = (): boolean => this._correct === 0;

    /** 
     * @returns 正解数
     */
    getCorrect = (): number => this._correct;

    /**
     * 全問終了時の処理をセットする
     * @param callback コールバック関数
     */
    set onFinish(callback: () => void) { this._onFinish = callback; }

    private isFinished = (): boolean => this._attempt >= TileLayer.ROW * TileLayer.COLUMN;
}