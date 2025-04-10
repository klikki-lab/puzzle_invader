import { TileLayer } from "../tile/tileLayer";
import { Alien } from "./alien";
import { Invader } from "./invader";
import { Monolith } from "./monolith";

export type InvaderOrUndefined = Invader | undefined;

type Rotation = "horizontal" | "vertical";

type SolutionStep = {
    orientation: Rotation;
    index: number;
    step: number;
};

type RotateResult = {
    colors: number[][];
    retryCount: number;
    solutionSteps: SolutionStep[];
};

export class InvaderLayer extends g.E {

    private aliens: Alien[][] = [];
    private monoliths: Monolith[][] = [];
    private _isMonolithTurn = false;

    /** 
     * @param scene シーン 
     * @param colorTable 色配列の初期テーブル
     */
    constructor(scene: g.Scene, colorTable: number[][]) {
        super({
            scene: scene,
            width: TileLayer.COLUMN * TileLayer.SIZE,
            height: TileLayer.ROW * TileLayer.SIZE,
            anchorX: 0.5,
        });

        for (let i = 0; i < TileLayer.ROW; i++) {
            const aliens: Alien[] = [];
            const monoliths: Monolith[] = [];

            for (let j = 0; j < TileLayer.COLUMN; j++) {
                const x = j * TileLayer.SIZE + TileLayer.SIZE / 2;
                const y = i * TileLayer.SIZE;
                const alien = new Alien(scene, colorTable[i][j]);
                alien.moveTo(x, y);
                aliens.push(alien);
                this.append(alien);

                const monolith = new Monolith(scene, colorTable[i][j]);
                monolith.moveTo(x, y);
                monoliths.push(monolith);
                this.append(monolith);
            }
            this.aliens.push(aliens);
            this.monoliths.push(monoliths);
        }
    }

    startAnimation = (): void => {
        this.onUpdate.add(() => {
            const x = Math.sin(Math.PI * 2 * ((g.game.age % (g.game.fps * 10)) / (g.game.fps * 10)));
            this.x = g.game.width / 2 + x * TileLayer.SIZE / 5;
            this.modified();
        });
    };

    nextFormation = (
        colorTable: number[][],
        random: g.RandomGenerator,
        isMonolithTurn: boolean,
        rotationAttempts: number): { invaders: (Alien | Monolith)[][], rotateResult: RotateResult } => {

        const result = this.rotate(colorTable, random, rotationAttempts);
        this._isMonolithTurn = isMonolithTurn;
        const invaders = this.getInvaders();
        invaders.forEach((row, rowIndex) => {
            row.forEach((invader, columnIndex) => {
                invader.scale(1);
                invader.opacity = 1.0;
                invader.setColor(result.colors[rowIndex][columnIndex]);
            });
        });
        return { invaders: invaders, rotateResult: result };
    };

    hideAll = (): void => {
        const invaders = this.getInvaders();
        for (const row of invaders) {
            for (const invader of row) invader.hide();
        }
    };

    isAllDestroyed = (): boolean => this.getDestroyCount() === TileLayer.ROW * TileLayer.COLUMN;

    getDestroyCount = (): number => {
        let count = 0;
        const invaders = this.getInvaders();
        for (const row of invaders) {
            for (const invader of row) {
                if (invader.isDefeat()) count++;
            }
        }
        return count;
    };

    getVanguardInvaderOrUndefined = (columnIndex: number): InvaderOrUndefined => {
        const current = this.getInvaders();
        for (let i = current.length - 1; i >= 0; i--) {
            if (!current[i][columnIndex].isDefeat())
                return current[i][columnIndex];
        }
        return undefined;
    };

    getInvaders = (): (Alien | Monolith)[][] => this._isMonolithTurn ? this.monoliths : this.aliens;

    getColors = (): number[][] => this.getInvaders().map(row => row.map(invader => invader.getColor()));

    get isMonolithTurn(): boolean { return this._isMonolithTurn; }

    private rotate = (src: number[][], random: g.RandomGenerator, rotationAttempts: number): RotateResult => {
        const copy: number[][] = [];
        for (const colors of src) {
            copy.push([...colors]);
        }

        const shuffleIndexes = (size: number) => {
            const indexes = [...Array(size)].map((_, i) => i);
            for (let i = size - 1; i >= 0; i--) {
                const index = Math.floor(random.generate() * (i + 1))
                const temp = indexes[i]
                indexes[i] = indexes[index]
                indexes[index] = temp
            }
            return indexes
        };

        const solutionSteps: SolutionStep[] = [];
        const rowLength = copy.length;
        const columnLength = copy[0].length;
        const maxRetryTimes = 3;
        // let rotationCount = 0;
        let retryCount = 0;
        let prevRowIndexes = shuffleIndexes(TileLayer.ROW);
        let prevColumnIndexes = shuffleIndexes(TileLayer.COLUMN);
        while (solutionSteps.length < rotationAttempts && retryCount < maxRetryTimes) {
            if (prevRowIndexes.length <= 0 && prevColumnIndexes.length <= 0) {
                prevRowIndexes = shuffleIndexes(TileLayer.ROW);
                prevColumnIndexes = shuffleIndexes(TileLayer.COLUMN);
                retryCount++;
            }

            const rowIndex = this.targetRowIndex(copy, prevRowIndexes);
            const columnIndex = this.targetColumnIndex(copy, prevColumnIndexes);
            if (rowIndex < 0 && columnIndex < 0) {
                break;
            }

            const rowRate = random.generate() * (prevRowIndexes.length / TileLayer.ROW);
            const columnlRate = random.generate() * (prevColumnIndexes.length / TileLayer.COLUMN);
            if (columnIndex < 0 || (rowIndex >= 0 && rowRate > columnlRate)) {
                const rotation = Math.floor(random.generate() * (rowLength - 1)) + 1;
                this.rotateHorizontal(copy, rowIndex, rotation);
                // rotationCount++;
                prevRowIndexes = prevRowIndexes.filter(index => index !== rowIndex);
                if (prevColumnIndexes.length < 1) {
                    prevColumnIndexes = shuffleIndexes(TileLayer.COLUMN);
                }
                solutionSteps.push({ orientation: "horizontal", index: TileLayer.ROW - 1 - rowIndex, step: -rotation });
            } else {
                const rotation = Math.floor(random.generate() * (columnLength - 1)) + 1;
                this.rotateVertical(copy, columnIndex, rotation);
                // rotationCount++;
                prevColumnIndexes = prevColumnIndexes.filter(index => index !== columnIndex);
                if (prevRowIndexes.length < 1) {
                    prevRowIndexes = shuffleIndexes(TileLayer.ROW);
                }
                solutionSteps.push({ orientation: "vertical", index: columnIndex, step: rotation });
            }
        }
        return { colors: copy, retryCount: retryCount, solutionSteps: solutionSteps };
    };

    private targetRowIndex = (src: number[][], prevRowIndexes: number[]): number => {
        for (const index of prevRowIndexes) {
            if (!this.isHorizontalSameColor(src[index])) return index;
        }
        return -1;
    };

    private isHorizontalSameColor = (rows: number[]): boolean => {
        const first = rows[0];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i] !== first) return false;
        }
        return true;
    };

    private rotateHorizontal = (src: number[][], rowIndex: number, rotation: number): void => {
        for (let i = 0; i < rotation; i++) {
            const first = src[rowIndex].shift();
            src[rowIndex].push(first);
        }
    };

    private targetColumnIndex = (src: number[][], prevColumnIndexes: number[]): number => {
        for (const index of prevColumnIndexes) {
            if (!this.isVerticalSameColor(src, index)) return index;
        }
        return -1;
    };

    private isVerticalSameColor = (colors: number[][], column: number): boolean => {
        const row = colors.length;
        const first = colors[0][column];
        for (let i = 1; i < row; i++) {
            if (colors[i][column] !== first) return false;
        }
        return true;
    };

    private rotateVertical = (src: number[][], columnIndex: number, rotation: number): void => {
        const rowLength = src.length;
        for (let i = 0; i < rotation; i++) {
            const first = src[0][columnIndex];
            for (let j = 0; j < rowLength - 1; j++) {
                src[j][columnIndex] = src[j + 1][columnIndex];
            }
            src[rowLength - 1][columnIndex] = first;
        }
    };
}