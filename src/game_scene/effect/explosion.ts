export class Explosion {

    private static readonly MAX_NUM = 4;

    constructor(scene: g.Scene, parent: g.Scene | g.E, pos: g.CommonOffset, color: number) {
        const offsetAngle = Math.PI / Explosion.MAX_NUM;
        for (let i = 0; i < Explosion.MAX_NUM; i++) {
            const fragment = new Fragment(scene, pos, color);
            const rad = 2 * Math.PI * (i / Explosion.MAX_NUM) - offsetAngle;
            const v = fragment.width * 0.5;
            fragment.velocity.x = Math.cos(rad) * v;
            fragment.velocity.y = Math.sin(rad) * v;

            parent.append(fragment);
        }
    }
}

class Fragment extends g.Sprite {

    velocity: g.CommonOffset = { x: 0, y: 0 };

    constructor(scene: g.Scene, pos: g.CommonOffset, color: number) {
        const src = scene.asset.getImageById("img_destroy");
        const width = Math.floor(src.width / 3);
        super({
            scene: scene,
            src: src,
            srcX: color * width,
            width: width,
            x: pos.x,
            y: pos.y,
            anchorX: .5,
            anchorY: .5,
            angle: g.game.random.generate() * 360,
        });

        this.onUpdate.add(() => {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.modified();

            const vx = Math.abs(this.velocity.x);
            const vy = Math.abs(this.velocity.y);
            if (vx > 0.1) {
                this.velocity.x *= 0.6;
            }
            if (vy > 0.1) {
                this.velocity.y *= 0.6;
            }

            if (vx < 0.1 && vy < 0.1) {
                this.destroy();
            }
        });
    }
}