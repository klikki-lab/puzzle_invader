export class PerfectBonus {

    private totalSec: number;
    private remainingSec: number;

    constructor(private baseScore: number, totalSec: number) {
        this.totalSec = totalSec;
        this.remainingSec = totalSec;
    }

    getScore = (remainingSec: number): number => {
        const diff = this.remainingSec - remainingSec;

        const rate = 1 - (diff / this.totalSec);
        const rounded = Math.round(rate * 100) / 100;
        return Math.floor(this.baseScore * rounded);
    };

    setRemainingTime = (remainingSec: number) => { this.remainingSec = remainingSec; };
}