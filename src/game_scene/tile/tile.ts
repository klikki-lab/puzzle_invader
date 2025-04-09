import { TileLayer } from "./tileLayer";

type StatusType = "ACTIVATE" | "DIACTTIVATE";
type StatusValue = 0 | 1;

const Status: Record<StatusType, StatusValue> = {
    ACTIVATE: 0,
    DIACTTIVATE: 1,
} as const;

export class Tile extends g.Sprite {

    private static readonly STATUS_DIVISION = 3;
    private status: StatusValue = Status.ACTIVATE;

    constructor(scene: g.Scene, private _color: number) {
        const src = scene.asset.getImageById("img_tile");
        super({
            scene: scene,
            src: src,
            width: Math.floor(src.width / (TileLayer.DIVISION + Tile.STATUS_DIVISION)),
            anchorX: 0.5,
            anchorY: 0.5,
        });
        this.color = _color;
    }

    override render(renderer: g.Renderer, camera?: g.Camera): void {
        if (this.parent instanceof g.Pane) {
            if (this.getRight() < 0 || this.getLeft() > this.parent.width ||
                this.getBottom() < 0 || this.getTop() > this.parent.height) {
                return;
            }
        }
        super.render(renderer, camera);
    }

    activate = (): void => {
        if (this.status === Status.ACTIVATE) return;

        this.status = Status.ACTIVATE;
        this.switchColor();
    };

    diactivate = (): void => {
        if (this.status === Status.DIACTTIVATE) return;

        this.status = Status.DIACTTIVATE;
        this.switchColor();
    };

    getTop = (): number => this.y - this.height * 0.5;

    getRight = (): number => this.x + this.width * 0.5;

    getBottom = (): number => this.y + this.height * 0.5;

    getLeft = (): number => this.x - this.width * 0.5;

    get color(): number { return this._color; }

    set color(color: number) {
        this._color = color;
        this.switchColor();
    }

    private switchColor = (): void => {
        this.srcX = (this.color + this.status * Tile.STATUS_DIVISION) * this.width;
        this.invalidate();
    };
}