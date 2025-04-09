export class TimeLabel extends g.Label {

    constructor(scene: g.Scene, font: g.BitmapFont, fontSize: number, sec: number) {
        super({
            scene: scene,
            font: font,
            fontSize: fontSize,
            text: `t${("  " + sec).slice(-3)}`,
        });
    }

    setTime = (sec: number): void => {
        this.text = `t${("  " + sec).slice(-3)}`;
        this.invalidate();
    };
}