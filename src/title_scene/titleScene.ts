import * as tl from "@akashic-extension/akashic-timeline";
import { ArrayUtil } from "../common/arrayUtil";
import { BaseScene } from "../common/baseScene";
import { Button } from "../common/button";
import { CountdownTimer } from "../common/countdownTimer";
import { Background } from "../game_scene/background/background";
import { Color } from "../game_scene/color";
import { GameScene } from "../game_scene/gameScene";
import { InvaderLayer } from "../game_scene/invader/invaderLayer";
import { TileLayer } from "../game_scene/tile/tileLayer";
import { GameMainParameterObject } from "./../parameterObject";

export class TitleScene extends BaseScene<boolean> {

    private random: g.RandomGenerator;
    private timeline: tl.Timeline;
    private tiles: TileLayer;
    private invaders: InvaderLayer;
    private countdownTimer: CountdownTimer;
    private equals: g.Sprite;

    private isTouched = false;
    private isFinish = false;

    constructor(_param: GameMainParameterObject, timeLimit: number) {
        super({
            game: g.game,
            assetIds: [
                "img_tile", "img_alien", "img_alien_arm", "img_alien_leg", "img_monolith",
                "img_description", "img_equals", "img_button_start",
                "img_font", "font_glyphs",
            ],
        });

        this.random = _param.random || g.game.random;
        this.timeline = new tl.Timeline(this);
        this.onLoad.add(() => this.loadHandler(timeLimit));
    }

    private loadHandler = (timeLimit: number): void => {
        this.append(new Background(this));
        this.append(this.tiles = this.createTiles());
        this.append(this.invaders = this.createInvaders());
        this.append(this.createStartButton());
        this.append(this.createTimeLabel(timeLimit));
        this.append(this.createDiscription());
        this.append(this.equals = this.createEquals(this.tiles));

        this.fadeIn();
        this.onPointDownCapture.add(this.pointDownHandler);
        this.onUpdate.add(this.updateHandler);
    };

    private pointDownHandler = (_ev: g.PointDownEvent): void => {
        this.isTouched = true;
        this.onPointDownCapture.remove(this.pointDownHandler);
    };

    private updateHandler = (): void | boolean => {
        this.countdownTimer.update();

        if (this.isFinish) {
            this.finishScene();
            return true;
        }
    };

    private fadeIn = (): void => {
        this.children.forEach(e => {
            if ((e instanceof Background)) return;

            this.timeline.create(e)
                .fadeIn(GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
        });
    };

    private finishScene = (): void => {
        this.fadeOut();
        this.setTimeout(() => {
            this.onFinish?.(this.isTouched);
        }, GameScene.ANIM_DURATION * 2);
    };

    private fadeOut = (): void => {
        this.children.forEach(e => {
            if ((e instanceof Background)) {
                e.hideStars();
                return;
            }

            this.timeline.create(e)
                .fadeOut(GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
        });
    };

    private createTiles = (): TileLayer => {
        const colorTable = [
            [Color.R, Color.R, Color.R],
            [Color.Y, Color.Y, Color.Y],
            [Color.B, Color.B, Color.B]
        ];

        colorTable.push(...colorTable.map(row => [...row]));
        for (let i = 0; i < TileLayer.ROW; i++) {
            colorTable[i].push(...colorTable[i]);
        }

        const tiles = new TileLayer(this, colorTable);
        tiles.addPointHandlers();
        tiles.x = g.game.width / 2;
        tiles.y = g.game.height - tiles.height / 2 - BaseScene.SCREEN_PADDING;
        tiles.opacity = 0;
        tiles.onStartRotation = tile => {
            this.timeline.create(tile)
                .call(() => {
                    tile.scale(0.9);
                    tile.modified();
                })
                .scaleTo(1, 1, 100, tl.Easing.easeOutBounce);
        };
        tiles.onRotation = () => { };
        tiles.onFinishRotation = _hasChanged => {
            if (ArrayUtil.equals(tiles.getReverseColors(), this.invaders.getColors())) {
                this.equals.show();
            } else {
                this.equals.hide();
            }
        };
        return tiles;
    };

    private createInvaders = (): InvaderLayer => {
        const colors = this.tiles.getReverseColors();
        const invaders = new InvaderLayer(this, this.tiles.getReverseColors());
        invaders.x = g.game.width / 2;
        invaders.y = GameScene.INVADERS_OFFSET_Y;
        invaders.opacity = 0;
        invaders.nextFormation(colors, this.random, false, 1);
        invaders.startAnimation();
        return invaders;
    };

    private createTimeLabel = (timeLimit: number): g.Label => {
        const bitmapFont = new g.BitmapFont({
            src: this.asset.getImageById("img_font"),
            glyphInfo: this.asset.getJSONContentById("font_glyphs"),
        });

        const label = new g.Label({
            scene: this,
            font: bitmapFont,
            fontSize: bitmapFont.size / 2,
            text: timeLimit.toString(),
            opacity: 0,
        });
        label.x = g.game.width - label.width - label.fontSize / 2;
        label.y = g.game.height - label.fontSize * 1.5;

        this.countdownTimer = new CountdownTimer(timeLimit);
        this.countdownTimer.onTick = remainigSec => {
            label.text = `${remainigSec}`;
            label.invalidate();
        };
        this.countdownTimer.onFinish = () => {
            label.text = "0";
            label.invalidate();
            this.isFinish = true;
        };
        return label;
    };

    private createStartButton = (): Button => {
        const button = new Button(this, "img_button_start");
        button.x = g.game.width - button.width - BaseScene.SCREEN_PADDING;
        button.y = g.game.height - button.height - BaseScene.SCREEN_PADDING;
        button.opacity = 0;
        button.onClick = _ => this.isFinish = true;
        return button;
    };

    private createDiscription = (): g.Sprite => {
        const description = new g.Sprite({
            scene: this,
            src: this.asset.getImageById("img_description"),
            opacity: 0,
        });
        description.x = BaseScene.SCREEN_PADDING;
        description.y = (g.game.height - description.height - BaseScene.SCREEN_PADDING) / 2;
        return description;
    };

    private createEquals = (tiles: g.Pane): g.Sprite => new g.Sprite({
        scene: this,
        src: this.asset.getImageById("img_equals"),
        x: tiles.x + tiles.width / 2 + BaseScene.SCREEN_PADDING / 2,
        y: tiles.y - tiles.height * 0.75,
        hidden: true,
    });
}