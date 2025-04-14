import * as tl from "@akashic-extension/akashic-timeline";
import { AudioController, SoundParam } from "../common/audioController";
import { BaseScene } from "../common/baseScene";
import { Button } from "../common/button";
import { CountdownTimer } from "../common/countdownTimer";
import { GameMainParameterObject } from "./../parameterObject";
import { Attempter } from "./attempter";
import { Background } from "./background/background";
import { Color } from "./color";
import { Explosion } from "./effect/explosion";
import { Splash } from "./effect/splash";
import { Spray } from "./effect/spray";
import { DifficultyLabel } from "./hud/difficultyLabel";
import { ScoreLabel } from "./hud/scoreLabel";
import { TimeLabel } from "./hud/timeLabel";
import { WaveLabel } from "./hud/waveLabel";
import { Invader } from "./invader/invader";
import { InvaderLayer } from "./invader/invaderLayer";
import { Monolith } from "./invader/monolith";
import { PerfectBonus } from "./perfectBonus";
import { Bullet } from "./tile/bullet";
import { TileLayer } from "./tile/tileLayer";

const MusicId = {
    BGM: "nc227381_edited",
} as const;

const SoundId = {
    NOTCH: "se_kotsun01",
    CLICK: "se_switch04",
    PRESSED_BUTTON: "se_suitsuku01",
    SHOT: "se_beam05",
    PERFECT: "se_push_start01",
    WARP: "se_powerup14",
    ATTACK: "se_pikon22",
    ATTCK_MONOLITH: "se_texiyuuuun",
    DESTROY: "se_bubble_pop02",
    DESTROY_MONOLITH: "se_bunnn1",
    SPLASH: "se_water_monster03",
    REGENERATION: "se_down3",
} as const;

export class GameScene extends BaseScene<void> {

    /** 333 ms */
    public static readonly ANIM_DURATION = Math.floor(1000 / TileLayer.ROW);
    /** 48 x 1.25 px */
    public static readonly INVADERS_OFFSET_Y = BaseScene.SCREEN_PADDING * 1.25

    private random: g.RandomGenerator;
    private timeline: tl.Timeline;
    private audioController: AudioController;
    private background: Background;
    private tiles: TileLayer;
    private invaders: InvaderLayer;
    private effectLayer: g.E;
    private hudLayer: g.E;
    private bitmapFont: g.BitmapFont;
    private fireButton: Button;
    private scoreLabel: ScoreLabel;
    private timeLabel: TimeLabel;
    private waveLabel: WaveLabel;
    private difficultyLabel: DifficultyLabel;
    private countdownTimer: CountdownTimer;
    private attempter: Attempter;
    private perfectBonus: PerfectBonus;
    private totalTimeLimit: number;
    private hintTween?: tl.Tween;

    /** モノリスのヒントを出すべきかどうか */
    private shouldShowHint = false;
    /** ショットを無効にするか (ゲーム終了後は`true`) */
    private disableShooting = false;

    constructor(param: GameMainParameterObject, isTouched: boolean, timeLimit: number) {
        super({
            game: g.game,
            assetIds: [
                "img_tile", "img_bullet", "img_button_fire", "img_splash", "img_destroy",
                "img_alien", "img_alien_arm", "img_alien_leg", "img_monolith", "img_monolith_hint",
                "img_start", "img_finish", "img_font", "font_glyphs",
                MusicId.BGM, SoundId.NOTCH, SoundId.CLICK, SoundId.PRESSED_BUTTON,
                SoundId.SHOT, SoundId.WARP, SoundId.PERFECT,
                SoundId.ATTACK, SoundId.ATTCK_MONOLITH, SoundId.DESTROY, SoundId.DESTROY_MONOLITH,
                SoundId.SPLASH, SoundId.REGENERATION,
            ],
        });

        // this.enableRightClickScreenshot();
        this.random = param.random || g.game.random;
        this.totalTimeLimit = param.sessionParameter?.totalTimeLimit ?? 140;
        this.onLoad.add(() => this.loadHandler(timeLimit, isTouched));
    }

    private loadHandler = (timeLimit: number, isTouched: boolean): void => {
        this.audioController = this.createAudioController(0.15, 0.2, !isTouched);

        this.timeline = new tl.Timeline(this);
        this.attempter = new Attempter();
        this.attempter.onFinish = this.finishShooting;
        this.perfectBonus = new PerfectBonus(1000, timeLimit);
        this.bitmapFont = this.createBitmapFont();

        this.append(this.background = new Background(this));
        this.append(this.tiles = this.createTiles());
        this.append(this.fireButton = this.createFireButton(this.tiles));
        this.append(this.invaders = this.createInvaders());
        this.append(this.effectLayer = new g.E({ scene: this, parent: this }));
        this.append(this.hudLayer = this.createHudLayer(timeLimit));

        if (!isTouched) {
            this.onPointDownCapture.add(this.pointDwnHandler);
        }
        this.startGame();
    };

    private pointDwnHandler = (_ev: g.PointDownEvent): void => {
        this.audioController.enablePlaySound();
        this.onPointDownCapture.remove(this.pointDwnHandler);
    };

    private updateHandler = (): void | boolean => { this.countdownTimer.update(); };

    private startGame = (): void => {
        const start = this.createSprite("img_start");
        this.animNotice(start)
            .call(this.tiles.addPointHandlers);

        this.timeline.create(this.tiles)
            .moveY(g.game.height - this.tiles.height / 2 - BaseScene.SCREEN_PADDING, GameScene.ANIM_DURATION * 2, tl.Easing.easeOutQuint);

        this.invadeAnimation(solutionStep => {
            this.difficultyLabel.optimalMoveCount = solutionStep;

            this.fireButton.y = this.tiles.y - this.fireButton.height / 2;
            this.fireButton.show();
            this.onUpdate.add(this.updateHandler);

            this.timeline.create(start)
                .scaleTo(1.5, 0, GameScene.ANIM_DURATION / 2, tl.Easing.easeOutQuint)
                .con()
                .fadeOut(GameScene.ANIM_DURATION, tl.Easing.easeOutQuint)
                .call(() => {
                    this.audioController.playMusic(MusicId.BGM);
                    start.destroy();
                });
        });
    };

    private finishGame = (): void => {
        const margin = 2; // 念のために余裕を設けておく 
        const elapsed = Math.floor(g.game.age / g.game.fps);
        const duration = (this.totalTimeLimit - elapsed - margin) * 1000;
        this.audioController.fadeOutMusic(MusicId.BGM, Math.max(1, duration));

        const finish = this.createSprite("img_finish");
        this.animNotice(finish)
            .call(() => {
                this.timeline.create(finish, { loop: true })
                    .scaleTo(1.05, 1.05, 500, tl.Easing.easeOutSine)
                    .scaleTo(1.0, 1.0, 500, tl.Easing.easeInSine);
            });
    };

    private animNotice = (notice: g.Sprite, option?: tl.TweenOption): tl.Tween => {
        notice.moveTo(notice.width / 2 + BaseScene.SCREEN_PADDING * 2, -notice.height / 2);
        notice.angle = -10;
        notice.modified();
        return this.timeline.create(notice, option)
            .moveY(g.game.height / 2, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
    };

    private invadeAnimation = (onFinishInvadeAnim: (solutionStep: number) => void): void => {
        const calcAttemptCount = (wave: number, period: number): number => {
            const maxAttemptCount = (TileLayer.ROW + TileLayer.COLUMN) * 2
            const attemptCount = Math.floor(wave / period) + 1;
            return Math.min(attemptCount, maxAttemptCount);
        };

        const reverseColors = this.tiles.getReverseColors();
        const wave = this.waveLabel.wave + 1;
        const period = TileLayer.ROW;
        const attemptCount = calcAttemptCount(wave, period);
        const isMonolithTurn = wave % period === 0;

        const { invaders, rotateResult } = this.invaders.nextFormation(reverseColors, this.random, isMonolithTurn, attemptCount);
        // console.log(rotateResult.solutionSteps, rotateResult.retryCount);
        invaders.forEach((row, rowIndex) => {
            row.forEach((invader, columnIndex) => {
                const y = invader.y;
                this.timeline.create(invader)
                    .wait((row.length - rowIndex) * GameScene.ANIM_DURATION)
                    .call(() => {
                        if (columnIndex === 0) {
                            const soundId = this.isMonolith(invader) ? SoundId.ATTCK_MONOLITH : SoundId.ATTACK;
                            this.audioController.playSound(soundId);
                        }

                        invader.y = -invader.height;
                        invader.modified();
                        invader.show();
                    })
                    .moveY(y, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint)
                    .call(() => {
                        if (0 === rowIndex && 0 === columnIndex) {
                            onFinishInvadeAnim(rotateResult.solutionSteps.length);
                        }
                    });
            });
        });
    };

    private startShooting = (): void => {
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
                        if (columnIndex === 0) {
                            this.audioController.playSound(SoundId.SHOT);
                        }

                        bullet.show();
                        const invader = this.invaders.getVanguardInvaderOrUndefined(columnIndex);
                        const target = invader ?
                            this.invaders.localToGlobal(invader) : { x: tilePos.x, y: -bullet.height / 2 };
                        const offset = invader ? (invader.height + bullet.height) / 2 : 0;

                        tween.moveY(target.y + offset, Math.floor(GameScene.ANIM_DURATION / 2))
                            .call(() => {
                                bullet.destroy();
                                if (!invader) {
                                    this.attempter.incorrect();
                                } else if (tile.color === invader.getColor()) {
                                    const soundId = this.isMonolith(invader) ? SoundId.DESTROY_MONOLITH : SoundId.DESTROY;
                                    this.audioController.playSound(soundId);
                                    new Explosion(this, this.effectLayer, target, tile.color);
                                    invader.defeat();

                                    this.timeline.create(invader)
                                        .scaleTo(0, 0, GameScene.ANIM_DURATION / 3, tl.Easing.easeInQuint)
                                        .call(() => {
                                            invader.hide();
                                            this.attempter.correct();
                                        });

                                } else {
                                    this.audioController.playSound(SoundId.SPLASH);
                                    const pos = { x: target.x, y: target.y + invader.height / 2 };
                                    new Spray(this, this.effectLayer, pos, tile.color);
                                    this.effectLayer.append(new Splash(this, tile.color, pos));
                                    this.attempter.incorrect();
                                }
                            });
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

    private isMonolith = (invader: Invader): boolean => invader instanceof Monolith;

    private finishShooting = (): void => {
        if (this.invaders.isAllDefeated()) {
            this.showShootingResult(() => {
                this.audioController.playSound(SoundId.WARP);
                this.background.startWarp();
                this.tiles.isActivate = false;

                this.invadeAnimation(solutionStep => {
                    this.perfectBonus.setRemainingTime(this.countdownTimer.remainingTime);
                    this.waveLabel.nextWave();
                    this.difficultyLabel.optimalMoveCount = solutionStep;
                    this.background.finishWarp();
                    this.nextAttempt();
                });
            });

            if (this.hintTween && !this.hintTween.isFinished()) {
                this.hintTween.cancel();
                if (this.hintTween._target instanceof g.Sprite) {
                    if (!this.hintTween._target.destroyed())
                        this.hintTween._target.destroy();
                }
                this.hintTween = undefined;
            }
        } else {
            if (this.invaders.isMonolithTurn) {
                this.regenerateMonolithAnimation(() => {
                    this.nextAttempt();
                    this.tiles.isActivate = false;

                    if (this.waveLabel.wave <= 6 && !this.shouldShowHint) {
                        this.shouldShowHint = true;
                        this.showHint();
                    }
                });
            } else {
                if (this.attempter.isAllIncorrect()) {
                    this.nextAttempt();
                } else {
                    this.showShootingResult(this.nextAttempt);
                }
                this.tiles.isActivate = false;
            }
        }
    };

    private nextAttempt = (): void => {
        this.attempter.nextAttempt();
        this.fireButton.show();
    };

    private regenerateMonolithAnimation = (onFinishAnim: () => void): void => {
        this.invaders.getInvaders().forEach((row, rowIndex) => {
            row.forEach((monolith, columnIndex) => {
                if (0 === rowIndex && 0 === columnIndex) {
                    this.timeline.create(monolith)
                        .wait(row.length * GameScene.ANIM_DURATION)
                        .call(() => onFinishAnim());
                }
                if (!monolith.isDefeat()) return;

                this.timeline.create(monolith)
                    .wait(Math.floor((row.length - rowIndex) * GameScene.ANIM_DURATION))
                    .call(() => {
                        this.audioController.playSound(SoundId.REGENERATION);
                        monolith.scale(0.5);
                        monolith.opacity = 0.0;
                        monolith.modified();
                        monolith.show();
                    })
                    .scaleTo(1, 1, GameScene.ANIM_DURATION, tl.Easing.easeOutQuint)
                    .con()
                    .fadeIn(GameScene.ANIM_DURATION, tl.Easing.easeOutQuint);
            });
        });
    };

    private showHint = (): void => {
        const message = new g.Sprite({
            scene: this,
            parent: this.hudLayer,
            src: this.asset.getImageById("img_monolith_hint"),
            opacity: 0,
        });
        message.x = this.invaders.x - this.invaders.width / 2 - message.width - BaseScene.SCREEN_PADDING;
        message.y = this.invaders.y + this.invaders.height / 2 - message.height;

        this.hintTween = this.timeline.create(message)
            .fadeIn(GameScene.ANIM_DURATION)
            .wait(3000)
            .fadeOut(GameScene.ANIM_DURATION)
            .call(message.destroy);
    }

    private showShootingResult = (onFinishAnim: () => void): void => {
        if (this.disableShooting) {
            onFinishAnim();
            return;
        }

        const animLabel = (label: g.Label, onAnimFinish: () => void = undefined) => {
            const duration = Math.floor(GameScene.ANIM_DURATION / 2);
            this.timeline.create(label)
                .to({ angle: -5 }, duration, tl.Easing.easeOutQuint)
                .con()
                .fadeIn(duration, tl.Easing.easeOutQuint)
                .con()
                .scaleTo(1, 1, duration, tl.Easing.easeOutQuint)
                .wait(Math.floor(GameScene.ANIM_DURATION * 3))
                .call(() => {
                    label.destroy();
                    onAnimFinish?.();
                });
        };

        const createLabel = (text: string): g.Label => new g.Label({
            scene: this,
            parent: this.hudLayer,
            font: this.bitmapFont,
            fontSize: this.bitmapFont.size * 0.75,
            text: text,
            opacity: 0,
            anchorX: 0.5,
            anchorY: 0.5,
            scaleX: 0.5,
            scaleY: 0.5,
        });

        const calcScore = (): number => {
            const score = (1 << (this.attempter.getCorrect() - 1)) * 10;
            if (!isPerfect) return score;

            return score * (this.invaders.isMonolithTurn ? 2 : 1);
        };

        const calcPerfectBonus = (): number => {
            if (!isPerfect) return 0;

            const timeBonus = this.perfectBonus.getScore(this.countdownTimer.remainingTime);
            return timeBonus * this.difficultyLabel.optimalMoveCount;
        };

        const isPerfect = this.attempter.isPerfect();
        const score = calcScore();
        const perfectBonus = calcPerfectBonus();
        const total = score + perfectBonus;

        this.scoreLabel.addScoreWithAnim(this.timeline, total, Math.floor(GameScene.ANIM_DURATION * 2));

        const resultLabel = createLabel(`${score}p`);
        resultLabel.moveTo(this.invaders.x, this.invaders.y + resultLabel.height * 2);
        animLabel(resultLabel, () => onFinishAnim());

        if (!isPerfect) return;

        this.setTimeout(() => this.audioController.playSound(SoundId.PERFECT), GameScene.ANIM_DURATION / 2);
        const perfectBonusLabel = createLabel(`PT ${perfectBonus}p`);
        perfectBonusLabel.moveTo(resultLabel.x, resultLabel.y + perfectBonusLabel.height * 2);
        animLabel(perfectBonusLabel);
    };

    private createTiles = (): TileLayer => {
        const colorTable: number[][] = [
            [Color.R, Color.R, Color.R],
            [Color.Y, Color.Y, Color.Y],
            [Color.B, Color.B, Color.B],
        ] as const;

        const tiles = new TileLayer(this, colorTable);
        tiles.x = g.game.width / 2;
        tiles.y = g.game.height + tiles.height / 2;
        tiles.onStartRotation = tile => {
            this.audioController.playSound(SoundId.CLICK);
            tile.activate();
            tile.scale(0.8);
            tile.modified();
            this.timeline.create(tile)
                .scaleTo(1, 1, GameScene.ANIM_DURATION / 3, tl.Easing.easeOutQuint);
        };
        tiles.onDecideRotation = tiles => tiles.forEach(tile => tile.activate());
        tiles.onRotation = () => this.audioController.playSound(SoundId.NOTCH);
        tiles.onFinishRotation = hasChanged => {
            this.audioController.playSound(SoundId.CLICK);
            tiles.deactivateAll();
            if (hasChanged) {
                this.difficultyLabel.attempt++;
            }
        };
        return tiles;
    };

    private createInvaders = (): InvaderLayer => {
        const colors = this.tiles.getReverseColors();
        const invaders = new InvaderLayer(this, colors);
        invaders.x = g.game.width / 2;
        invaders.y = GameScene.INVADERS_OFFSET_Y;
        invaders.startAnimation();
        invaders.hideAll();
        return invaders;
    };

    private createFireButton = (entity: g.CommonArea): Button => {
        const button = new Button(this, "img_button_fire");
        const right = entity.x + entity.width / 2;
        button.x = right + (g.game.width - right) / 2 - button.width / 2;
        button.opacity = 0.9;
        button.hide();
        button.onPressed = _button => this.audioController.playSound(SoundId.CLICK);
        button.onClick = (button => {
            if (!this.tiles.isSwiping && !this.tiles.isActivate) {
                this.audioController.playSound(SoundId.CLICK);

                button.hide();
                this.tiles.isActivate = true;
                // 時間切れまでに発射したショットは有効
                if (!this.disableShooting && this.countdownTimer.isFinish()) {
                    this.disableShooting = true;
                }
                this.startShooting();
            }
        });
        return button;
    };

    private createHudLayer = (timeLimit: number): g.E => {
        const layer = new g.E({ scene: this });

        const fontSize = this.bitmapFont.size;
        const margin = fontSize / 2;

        this.scoreLabel = new ScoreLabel(this, this.bitmapFont, fontSize, 0);
        this.scoreLabel.x = g.game.width - this.scoreLabel.width - margin;
        this.scoreLabel.y = margin;
        layer.append(this.scoreLabel);

        this.timeLabel = new TimeLabel(this, this.bitmapFont, fontSize, timeLimit);
        this.timeLabel.x = margin;
        this.timeLabel.y = margin;
        layer.append(this.timeLabel);

        this.difficultyLabel = new DifficultyLabel(this, this.bitmapFont, fontSize / 2);
        this.difficultyLabel.x = g.game.width - this.difficultyLabel.width - margin;
        this.difficultyLabel.y = this.timeLabel.y + this.timeLabel.height + this.difficultyLabel.height * 2.5;
        this.difficultyLabel.opacity = 0.5;
        layer.append(this.difficultyLabel);

        this.waveLabel = new WaveLabel(this, this.bitmapFont, fontSize / 2);
        this.waveLabel.x = this.difficultyLabel.x + this.difficultyLabel.width - this.waveLabel.width;
        this.waveLabel.y = this.difficultyLabel.y - this.waveLabel.height;
        this.waveLabel.opacity = 0.5;
        layer.append(this.waveLabel);

        this.countdownTimer = this.createCountdownTimer(timeLimit);
        return layer;
    };

    private createCountdownTimer = (remainingSec: number): CountdownTimer => {
        const countdownTimer = new CountdownTimer(remainingSec);
        countdownTimer.onTick = this.timeLabel.setTime;
        countdownTimer.onFinish = () => {
            this.timeLabel.setTime(0);
            this.finishGame();
        };
        return countdownTimer;
    };

    private createSprite = (assetId: string): g.Sprite => new g.Sprite({
        scene: this,
        parent: this.hudLayer,
        src: this.asset.getImageById(assetId),
        anchorX: 0.5,
        anchorY: 0.5,
    });

    private createBitmapFont = (): g.BitmapFont => new g.BitmapFont({
        src: this.asset.getImageById("img_font"),
        glyphInfo: this.asset.getJSONContentById("font_glyphs"),
    });

    private createAudioController = (musicVolume: number, soundVolume: number, disable: boolean): AudioController => {
        const audioController = new AudioController(musicVolume, soundVolume, disable);
        audioController.addMusic(this.asset, { assetId: MusicId.BGM });
        const sounds: SoundParam[] = [
            { assetId: SoundId.NOTCH },
            { assetId: SoundId.CLICK },
            { assetId: SoundId.PRESSED_BUTTON },
            { assetId: SoundId.SHOT },
            { assetId: SoundId.WARP },
            { assetId: SoundId.PERFECT },
            { assetId: SoundId.ATTACK },
            { assetId: SoundId.ATTCK_MONOLITH },
            { assetId: SoundId.DESTROY },
            { assetId: SoundId.DESTROY_MONOLITH },
            { assetId: SoundId.SPLASH },
            { assetId: SoundId.REGENERATION },
        ];
        audioController.addSound(this.asset, ...sounds);
        return audioController;
    };
}