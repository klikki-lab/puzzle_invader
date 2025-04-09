export class CountdownTimer {

    private _onTick?: (remainingSec: number) => void;
    private _onFinish?: () => void;
    private _remainingTime: number;
    private prevSec: number;
    private isStopped: boolean = false;

    constructor(_remainingSec: number) {
        this._remainingTime = _remainingSec;
        this.prevSec = _remainingSec;
    }

    update = (): void => {
        if (this.isStopped) return;

        this._remainingTime -= 1 / g.game.fps;
        const sec = this.getRemainingSec();
        if (sec !== this.prevSec) {
            this.prevSec = sec;
            if (sec > 0) {
                this._onTick?.(Math.max(0, sec));
            } else if (sec >= 0) {
                this._onFinish?.();
            }
        }
    };

    /**
     * カウントダウンを停止する。
     * @returns カウントダウン中であれば `true`、そうでなければ `false`
     */
    stop = (): boolean => {
        if (!this.isStopped) {
            this.isStopped = true;
            return true;
        }
        return false;
    };

    isFinish = (): boolean => this._remainingTime <= 0;

    getRemainingSec = (): number => Math.ceil(this._remainingTime);

    get remainingTime(): number { return this._remainingTime; }

    set onTick(callback: (remainingSec: number) => void) { this._onTick = callback; };

    set onFinish(callback: () => void) { this._onFinish = callback; };
}