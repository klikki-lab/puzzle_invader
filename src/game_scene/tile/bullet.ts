export class Bullet extends g.Sprite {

    constructor(scene: g.Scene, private _color: number) {
        const src = scene.asset.getImageById("img_bullet");
        const width = Math.floor(src.width / 3);
        super({
            scene: scene,
            src: src,
            width: width,
            srcX: _color * width,
            anchorX: 0.5,
            anchorY: 0.5,
        });
    }

    get color(): number { return this._color; }
}