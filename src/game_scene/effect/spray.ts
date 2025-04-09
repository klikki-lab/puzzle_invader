export class Spray {

    private static readonly MAX_NUM = 5;

    constructor(scene: g.Scene, parent: g.Scene | g.E, pos: g.CommonOffset, color: number, count = Spray.MAX_NUM) {
        for (let i = 0; i < count; i++) {
            const fragment = new Fragment(scene, pos, color);
            const radian = Math.PI / 180 * (g.game.random.generate() * 160 + 10);
            const radius = fragment.width / 2 + fragment.width * g.game.random.generate();
            fragment.velocity.x = Math.cos(radian) * radius;
            fragment.velocity.y = Math.sin(radian) * radius;
            parent.append(fragment);
        }
    }
}

class Fragment extends g.Sprite {

    velocity: g.CommonOffset = { x: 0, y: 0 };

    constructor(scene: g.Scene, pos: g.CommonOffset, color: number) {
        const src = scene.asset.getImageById("img_spray");
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
                this.velocity.x *= 0.7;
            }
            if (vy > 0.1) {
                this.velocity.y *= 0.7;
            }

            if (vx < 0.2 && vy < 0.2) {
                this.scale(this.scaleX * 0.7);
                if (this.scaleX < 0.1) {
                    this.destroy();
                }
            }
        });
    }
}