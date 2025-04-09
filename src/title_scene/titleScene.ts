import * as tl from "@akashic-extension/akashic-timeline";
import { BaseScene } from "../common/baseScene";
import { Button } from "../common/button";
import { CountdownTimer } from "../common/countdownTimer";
import { Background } from "../game_scene/background/background";
import { Color } from "../game_scene/color";
import { Explosion } from "../game_scene/effect/explosion";
import { Splash } from "../game_scene/effect/splash";
import { Spray } from "../game_scene/effect/spray";
import { GameScene } from "../game_scene/gameScene";
import { InvaderLayer } from "../game_scene/invader/invaderLayer";
import { Bullet } from "../game_scene/tile/bullet";
import { TileLayer } from "../game_scene/tile/tileLayer";
import { GameMainParameterObject } from "./../parameterObject";

export class TitleScene extends BaseScene<boolean> {

    private random: g.RandomGenerator;
    private timeline: tl.Timeline;
    private background: Background;
    private logo: g.Sprite;
    private tiles: TileLayer;
    private invaders: InvaderLayer;
    private effectLayer: g.E;
    private startButton: Button;
    private timeLabel: g.Label;
    private countdownTimer: CountdownTimer;
    private descriptions: g.Sprite[];
    private tweens: tl.Tween[];

    private isTouched = false;
    private isFinish = false;

    constructor(_param: GameMainParameterObject, timeLimit: number) {
        super({
            game: g.game,
            assetIds: [
                "img_title_logo", "img_button_start", "img_tile", "img_bullet",
                "img_alien", "img_alien_arm", "img_alien_leg", "img_monolith",
                "img_splash", "img_spray", "img_destroy",
                "img_description_01", "img_description_02",
                "img_font", "font_glyphs",
            ],
        });

        this.random = _param.random || g.game.random;
        this.timeline = new tl.Timeline(this);
        this.onLoad.add(() => this.loadHandler(timeLimit));
    }

    private loadHandler = (timeLimit: number): void => {
        this.append(this.background = new Background(this));
        this.append(this.logo = this.createTitleLogo());
        this.append(this.tiles = this.createTiles());
        this.append(this.invaders = this.createInvaders());
        this.append(this.effectLayer = new g.E({ scene: this, }));
        this.append(this.startButton = this.createStartButton());
        this.append(this.timeLabel = this.createTimeLabel(timeLimit));
        this.appendDescriptions();

        this.onPointDownCapture.add(this.pointDownHandler);
        this.onUpdate.add(this.updateHandler);
    };

    private pointDownHandler = (_ev: g.PointDownEvent): void => {
        this.isTouched = true;
        this.onPointDownCapture.remove(this.pointDownHandler);
    };

    private updateHandler = (): void | boolean => { this.countdownTimer.update(); };

    private finishShooting = (shouldShooting = false): void => {
        this.isFinish = true;
        this.tweens.forEach(tween => {
            if (!tween.isFinished()) {
                tween.cancel();
            }
            tween.fadeIn(0);
        });
        this.descriptions.forEach(description => description.hide());

        this.setTimeout(() => {
            if (shouldShooting) {
                this.startShooting(() => this.setTimeout(this.finishScene, GameScene.ANIM_DURATION * 2));
            } else {
                this.setTimeout(this.finishScene, GameScene.ANIM_DURATION * 2);
            }
        }, GameScene.ANIM_DURATION / 3)
    };

    private finishScene = (): void => {
        const createTween = (target: g.E, x: number, y: number): tl.Tween =>
            this.timeline.create(target).moveTo(x, y, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);

        this.background.hideStars();
        createTween(this.logo, this.logo.x, -this.logo.height - BaseScene.SCREEN_PADDING);
        const destY = this.invaders.isAllDestroyed() ? -this.tiles.height / 2 : g.game.height + this.tiles.height / 2;
        createTween(this.tiles, this.tiles.x, destY);
        createTween(this.invaders, this.invaders.x, -(this.invaders.height + GameScene.INVADERS_OFFSET_Y));
        createTween(this.startButton, g.game.width, this.startButton.y);
        createTween(this.timeLabel, g.game.width, this.timeLabel.y)
            .wait(GameScene.ANIM_DURATION * 2)
            .call(() => this.onFinish?.(this.isTouched));
    };

    private startShooting = (onFinish: () => void): void => {
        const tiles = this.tiles.getTiles();
        tiles.forEach((tile, rowIndex) => {
            tile.forEach((tile, columnIndex) => {
                const tilePos = this.tiles.localToGlobal(tile);
                const bullet = new Bullet(this, tile.color);
                bullet.moveTo(tilePos);
                bullet.hide();
                this.effectLayer.append(bullet);

                const tween = this.timeline.create(bullet);
                tween.wait(GameScene.ANIM_DURATION * rowIndex)
                    .call(() => {
                        bullet.show();
                        const invader = this.invaders.getVanguardInvaderOrUndefined(columnIndex);
                        const dest = invader ?
                            this.invaders.localToGlobal(invader) : { x: tilePos.x, y: -bullet.height / 2 };

                        tween.moveY(dest.y + bullet.height / 2, Math.floor(GameScene.ANIM_DURATION / 2), tl.Easing.linear)
                            .call(() => {
                                bullet.destroy();
                                if (invader) {
                                    if (tile.color === invader.color) {
                                        new Explosion(this, this.effectLayer, dest, tile.color);
                                        invader.defeat();
                                    } else {
                                        const pos = { x: dest.x, y: dest.y + invader.height / 2 };
                                        this.effectLayer.append(new Splash(this, tile.color, pos));
                                        new Spray(this, this.effectLayer, pos, tile.color);
                                    }
                                }

                                if (rowIndex === TileLayer.ROW - 1 && columnIndex === TileLayer.COLUMN - 1) {
                                    onFinish();
                                }
                            })
                    });

                this.timeline.create(tile)
                    .wait(GameScene.ANIM_DURATION * rowIndex)
                    .call(() => {
                        tile.scale(0.5);
                        tile.modified();
                    })
                    .scaleTo(1, 1, GameScene.ANIM_DURATION / 2, tl.Easing.easeOutQuint);
            });

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
        tiles.onStartRotation = tile => {
            this.timeline.create(tile)
                .call(() => {
                    tile.scale(0.9);
                    tile.modified();
                })
                .scaleTo(1, 1, 100, tl.Easing.easeOutBounce);
        };
        tiles.onRotation = () => { };
        tiles.onFinishRotation = _hasChanged => { };
        return tiles;
    };

    private createInvaders = (): InvaderLayer => {
        const colors = this.tiles.getReverseColors();
        const invaders = new InvaderLayer(this, this.tiles.getReverseColors());
        invaders.nextFormation(colors, this.random, false, 1);
        invaders.x = g.game.width / 2;
        invaders.y = GameScene.INVADERS_OFFSET_Y;
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
            opacity: 0.75,
        });
        label.x = g.game.width - label.width - label.fontSize / 2;
        label.y = g.game.height - label.fontSize * 1.5;

        this.countdownTimer = new CountdownTimer(timeLimit);
        this.countdownTimer.onTick = remainigSec => {
            label.text = `${remainigSec}`;
            label.invalidate();
        };
        this.countdownTimer.onFinish = () => {
            if (!this.isFinish) {
                label.hide();
                this.startButton.removeAllListener();
                this.startButton.hide();
                this.finishShooting();
            }
        };
        return label;
    };

    private createStartButton = (): Button => {
        const button = new Button(this, "img_button_start");
        button.x = g.game.width - button.width - BaseScene.SCREEN_PADDING;
        button.y = g.game.height - button.height - BaseScene.SCREEN_PADDING;
        button.onClick = button => {
            if (!this.countdownTimer.isFinish()) {
                this.countdownTimer.stop();
                button.hide();
                this.timeLabel.hide();
                this.finishShooting(this.countdownTimer.remainingTime >= 1);
            }
        };
        return button;
    };

    private appendDescriptions = (): void => {
        const createDescription = (assetId: string): g.Sprite => {
            const asset = this.asset.getImageById(assetId);
            return new g.Sprite({
                scene: this,
                src: asset,
                x: g.game.width,
                y: (g.game.height - asset.height) / 2 - BaseScene.SCREEN_PADDING / 2,
                opacity: 1,
            });
        }

        this.descriptions = [];
        this.tweens = [];

        const first = createDescription("img_description_01");
        this.append(first);
        const second = createDescription("img_description_02");
        this.append(second);
        this.descriptions.push(first, second);

        const firstTween = this.timeline.create(first)
            .moveX((g.game.width - first.width) / 2, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint)
            .wait(3000)
            .moveX(-first.width, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
        const secondTween = this.timeline.create(second)
            .wait(3000 + Math.floor(GameScene.ANIM_DURATION * 1.5))
            .moveX((g.game.width - second.width) / 2, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
        this.tweens.push(firstTween, secondTween);
    };

    private createTitleLogo = (): g.Sprite => new g.Sprite({
        scene: this,
        src: this.asset.getImageById("img_title_logo"),
        x: BaseScene.SCREEN_PADDING / 6,
        y: BaseScene.SCREEN_PADDING / 2,
        angle: -10,
    });
}