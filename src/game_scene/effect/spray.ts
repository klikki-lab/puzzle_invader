import { MathUtil } from "../../common/mathUitl";

export class Spray {

    private static readonly MAX_NUM = 3;

    constructor(scene: g.Scene, parent: g.Scene | g.E, pos: g.CommonOffset, color: number, count = Spray.MAX_NUM) {
        for (let i = 0; i < count; i++) {
            const fragment = new Fragment(scene, pos, color);
            const scale = (g.game.random.generate() + 1) * 0.2;
            fragment.scale(scale);
            const radian = Math.PI / 180 * (g.game.random.generate() * 120 + 30);
            const radius = (fragment.width * scale) * (1 - scale / 1);
            const dx = Math.cos(radian) * radius;
            const dy = Math.sin(radian) * radius;
            fragment.velocity.x = dx;
            fragment.velocity.y = dy;
            fragment.angle = MathUtil.getAngle(dx, dy) - 90;
            parent.append(fragment);
        }
    }
}

class Fragment extends g.Sprite {

    velocity: g.CommonOffset = { x: 0, y: 0 };

    constructor(scene: g.Scene, pos: g.CommonOffset, color: number) {
        const src = scene.asset.getImageById("img_bullet");
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
        });

        this.onUpdate.add(() => {
            this.x += this.velocity.x;
            this.y += this.velocity.y;

            const vx = Math.abs(this.velocity.x);
            const vy = Math.abs(this.velocity.y);
            if (vx > 0.1) {
                this.velocity.x *= 0.8;
            }
            if (vy > 0.1) {
                this.velocity.y *= 0.8;
            }
            if (vx < 2 && vy < 2) {
                this.scale(this.scaleX * 0.8);
                if (this.scaleX < 0.01) {
                    this.destroy();
                }
            }
            this.modified();
        });
    }
}