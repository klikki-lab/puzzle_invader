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
    private tweens: tl.Tween[] = [];
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
                "img_description_01", "img_description_02", "img_description_03",
                "img_equals", "img_button_start", "img_font", "font_glyphs",
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
        const d1 = this.createDescription1();
        const d2 = this.createDescription2();
        const d3 = this.createDescription3();
        this.append(d1);
        this.append(d2);
        this.append(d3);
        this.append(this.equals = this.createEquals(this.tiles));

        const duration = Math.floor(GameScene.ANIM_DURATION / 2);
        const createTween = (description: g.Sprite, wait: number): tl.Tween => this.timeline.create(description)
            .wait(wait)
            .fadeIn(duration, tl.Easing.easeOutQuint)
            .con()
            .scaleTo(1, 1, duration, tl.Easing.easeOutQuint);
        this.tweens.push(createTween(d1, 200), createTween(d2, 2000), createTween(d3, 5000));

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
            if (this.isDescription(e)) return;

            this.timeline.create(e)
                .fadeIn(GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
        });
    };

    private isDescription = (e: g.E): boolean => {
        if ((e instanceof g.Sprite)) {
            const asset = e.src as g.ImageAsset;
            return (asset.id).indexOf("img_description_") === 0;
        }
        return false;
    };

    private finishScene = (): void => {
        for (const tween of this.tweens) {
            if (!tween.isFinished()) tween.cancel();
        }
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
        const colorTable: number[][] = [
            [Color.R, Color.R, Color.R],
            [Color.Y, Color.Y, Color.Y],
            [Color.B, Color.B, Color.B]
        ] as const;

        const tiles = new TileLayer(this, colorTable);
        tiles.addPointHandlers();
        tiles.x = g.game.width / 2;
        tiles.y = g.game.height - tiles.height / 2 - BaseScene.SCREEN_PADDING;
        tiles.opacity = 0;
        tiles.onStartRotation = tile => {
            tile.activate();
            tile.scale(0.8);
            tile.modified();
            this.timeline.create(tile)
                .scaleTo(1, 1, GameScene.ANIM_DURATION / 3, tl.Easing.easeOutQuint);
        };
        tiles.onDecideRotation = tiles => tiles.forEach(tile => tile.activate());
        tiles.onRotation = () => { /* do nothing here */ };
        tiles.onFinishRotation = _hasChanged => {
            tiles.deactivateAll();
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
        const invaders = new InvaderLayer(this, colors);
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

    private createDescription1 = (): g.Sprite => {
        const description = this.createDescription("img_description_01");
        description.x = (this.invaders.x - this.invaders.width / 2) / 2;
        description.y = BaseScene.SCREEN_PADDING * .25 + this.invaders.height / 2;
        return description
    };

    private createDescription2 = (): g.Sprite => {
        const description = this.createDescription("img_description_02");
        description.x = (this.tiles.x - this.tiles.width / 2) / 2;
        description.y = this.tiles.y - this.tiles.height / 2 + description.height / 2;
        return description
    };

    private createDescription3 = (): g.Sprite => {
        const description = this.createDescription("img_description_03");
        description.x = (this.tiles.x - this.tiles.width / 2) / 2;
        description.y = this.tiles.y + description.height;
        return description
    };

    private createDescription = (assetId: string): g.Sprite => new g.Sprite({
        scene: this,
        src: this.asset.getImageById(assetId),
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 1.25,
        scaleY: 1.25,
        opacity: 0,
    });

    private createEquals = (tiles: g.Pane): g.Sprite => new g.Sprite({
        scene: this,
        src: this.asset.getImageById("img_equals"),
        x: tiles.x + tiles.width / 2 + BaseScene.SCREEN_PADDING / 2,
        y: tiles.y - tiles.height * 0.75,
        hidden: true,
    });
}