import { TileLayer } from "../tile/tileLayer";

export class Monolith extends g.Sprite {

    private _isDefeat = false;

    constructor(scene: g.Scene, private _color: number) {
        const src = scene.asset.getImageById("img_monolith");
        super({
            scene: scene,
            src: src,
            width: Math.floor(src.width / TileLayer.DIVISION),
            anchorX: 0.5,
            anchorY: 0.5,
            hidden: true,
        });
        this.color = _color;
    }

    isDefeat = (): boolean => this._isDefeat;

    defeat = (): void => {
        this._isDefeat = true;
        this.hide();
    }

    get color(): number { return this._color; }

    set color(color: number) {
        this._color = color;
        this.srcX = color * this.width;
        this.invalidate();
    }

    override show(): void {
        this._isDefeat = false;
        super.show();
    }
}