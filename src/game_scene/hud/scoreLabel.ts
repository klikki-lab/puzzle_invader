import * as tl from "@akashic-extension/akashic-timeline";

export class ScoreLabel extends g.Label {

    private static readonly COUNTER_STOP = 999999;
    private static readonly SPACES = "     ";

    private _prevAddScore = 0;

    constructor(scene: g.Scene, font: g.BitmapFont, fontSize: number, initialScore: number = 0) {
        super({
            scene: scene,
            font: font,
            text: `${(ScoreLabel.SPACES + initialScore).slice(-(ScoreLabel.SPACES.length + 1))}p`,
            fontSize: fontSize,
        });
        g.game.vars.gameState.score = initialScore;
    }

    addScore = (score: number): void => this.setText(this.clamp(score));

    addScoreWithAnim = (timeline: tl.Timeline, score: number, duration: number): tl.Tween => {
        const clamped = this.clamp(score);
        return timeline.create(this)
            .every((e: number, p: number) => {
                this.setText(clamped - Math.floor(score * (1 - p)));
            }, duration);
    };

    isCounterStop = (): boolean => g.game.vars.gameState.score >= ScoreLabel.COUNTER_STOP;

    private clamp = (score: number): number => {
        this._prevAddScore += score;
        g.game.vars.gameState.score += score;
        return Math.min(g.game.vars.gameState.score, ScoreLabel.COUNTER_STOP);
    };

    private setText = (score: number): void => {
        this.text = `${(ScoreLabel.SPACES + score).slice(-(ScoreLabel.SPACES.length + 1))}p`;
        this.invalidate();
    };
}