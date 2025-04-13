export class Splash extends g.Sprite {

    constructor(scene: g.Scene, color: number, pos: g.CommonOffset) {
        const src = scene.asset.getImageById("img_splash");
        const width = Math.floor(src.width / 3);
        super({
            scene: scene,
            src: src,
            srcX: color * width,
            width: width,
            anchorX: 0.5,
            scaleX: (g.game.age % 2) * 2 - 1,
            scaleY: 1,
            x: pos.x,
            y: pos.y,
        });

        const maxFrame = Math.floor(g.game.fps * 0.2);
        let life = 0;
        this.onUpdate.add(() => {
            if (life < maxFrame) {
                life++;
            } else {
                this.scaleY *= 0.4;
                if (this.scaleY < 0.1) {
                    this.destroy();
                    return true;
                }
            }
            this.modified();
        })
    }
}