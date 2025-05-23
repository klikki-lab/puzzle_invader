import { Tile } from "../tile/tile";
import { Invader } from "./invader";

export class Alien extends Invader {

    private static readonly ANIM_PERIOD = Math.floor(g.game.fps * 0.84);

    constructor(scene: g.Scene, color: number) {
        super(scene, "img_alien", color);

        this.createArms(scene, color);
        this.createLegs(scene, color);
    }

    override setColor(color: number) {
        super.setColor(color);

        this.children?.forEach(e => {
            if (!(e instanceof g.Sprite)) return;

            e.srcX = color * e.width;
            e.invalidate();
        });
    }

    private createArms = (scene: g.Scene, color: number): void => {
        const createArm = (color: number): g.Sprite => {
            const src = scene.asset.getImageById("img_alien_arm");
            const width = Math.floor(src.width / Tile.DIVISION);
            const arm = new g.Sprite({
                scene: scene,
                src: src,
                srcX: color * width,
                width: width,
                y: this.height / 2 + 8,
                anchorY: 0.5,
            });
            arm.onUpdate.add(() => {
                if (g.game.age % Alien.ANIM_PERIOD === 0) {
                    arm.scaleY *= -1;
                    arm.modified();
                }
            });
            return arm;
        };

        const offsetX = 2.5;
        const left = createArm(color);
        left.x = this.width - offsetX;

        const right = createArm(color);
        right.x = offsetX;
        right.scaleX = -1;

        this.append(left);
        this.append(right);
    };

    private createLegs = (scene: g.Scene, color: number): void => {
        const createLeg = (color: number): g.Sprite => {
            const src = scene.asset.getImageById("img_alien_leg");
            const width = Math.floor(src.width / Tile.DIVISION);
            const leg = new g.Sprite({
                scene: scene,
                src: src,
                srcX: color * width,
                width: width,
                y: this.height,
            });
            leg.onUpdate.add(() => {
                if (g.game.age % Alien.ANIM_PERIOD === 0) {
                    leg.scaleX *= -1;
                    leg.modified();
                }
            });
            return leg;
        };

        const offsetX = 8 * 2;
        const left = createLeg(color);
        left.x = this.width / 2 + offsetX;

        const right = createLeg(color);
        right.x = this.width / 2 - offsetX;
        right.scaleX = -1;

        this.append(left);
        this.append(right);
    };
}