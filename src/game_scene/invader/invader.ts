import { Tile } from "../tile/tile";

export abstract class Invader extends g.Sprite {

    private _isDefeat = false;

    constructor(scene: g.Scene, assetId: string, private _color: number) {
        const src = scene.asset.getImageById(assetId);
        super({
            scene: scene,
            src: src,
            width: Math.floor(src.width / Tile.DIVISION),
            anchorX: 0.5,
            anchorY: 0.5,
        });
    }

    override show(): void {
        this._isDefeat = false;
        super.show();
    }

    // _colorをget, setで実装したいが、サブクラスからオーバーライドすると
    // ベースクラスのアクセサへアクセスできないという奇妙な仕様かバグがあり、やむなくメソッド化している。

    getColor(): number { return this._color; }

    setColor(color: number) {
        this._color = color;
        this.srcX = color * this.width;
        this.invalidate();
    }

    isDefeat = (): boolean => this._isDefeat;

    defeat = (): void => { this._isDefeat = true; };
}