export class WaveLabel extends g.Label {

    constructor(scene: g.Scene, font: g.BitmapFont, fontSize: number, private _wave: number = 1) {
        super({
            scene: scene,
            font: font,
            fontSize: fontSize,
            text: `w${(" " + _wave).slice(-2)}`,
        });
    }

    nextWave = (): void => {
        this.text = `w${(" " + ++this._wave).slice(-2)}`;
        this.invalidate();
    };

    get wave(): number { return this._wave; }
}