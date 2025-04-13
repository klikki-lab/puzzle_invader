import { Tile } from "./tile";

export class TileLayer extends g.Pane {

    public static readonly DIVISION = 3;
    public static readonly ROW = 3;
    public static readonly COLUMN = 3;
    public static readonly SIZE = 96;
    private static readonly SWIPE_THRESHOLD = TileLayer.SIZE / 10;

    private _onStartRotation: (tile: Tile) => void;
    private _onDecideOrientation: (tiles: Tile[]) => void;
    private _onRotating: () => void;
    private _onFinishRotation: (hasChanged: boolean) => void;

    private tiles: Tile[][] = [];
    private copies: number[][] = [];
    private prev: g.CommonOffset = { x: 0, y: 0 };
    private isStartSwipe = false;
    private isHorizontalSwipe = false;
    private _isSwiping = false;
    private _isActivate = false;

    constructor(scene: g.Scene, colorTable: number[][]) {
        super({
            scene: scene,
            width: TileLayer.COLUMN * TileLayer.SIZE,
            height: TileLayer.ROW * TileLayer.SIZE,
            anchorX: 0.5,
            anchorY: 0.5,
            touchable: true,
        });

        colorTable.push(...colorTable.map(row => [...row]));
        for (let i = 0; i < TileLayer.ROW; i++) {
            colorTable[i].push(...colorTable[i]);
        }
        this.tiles = this.createTiles(colorTable);
    }

    addPointHandlers = (): void => {
        this.onPointDown.add(this.pointDownHandler);
        this.onPointMove.add(this.pointMoveHandler);
        this.onPointUp.add(this.pointUpHandler);
    };

    _removePointHandlers = (): void => {
        this.onPointDown.remove(this.pointDownHandler);
        this.onPointMove.remove(this.pointMoveHandler);
        this.onPointUp.remove(this.pointUpHandler);
    };

    _resetColors = (colors: number[][]): void => {
        this.tiles.forEach((row, rowIndex) => {
            row.forEach((tile, columnIndex) => {
                tile.color = colors[rowIndex][columnIndex];
                tile.modified();
            });
        });
        this.copyAll();
        this.copies = this.getColors();
    };

    _getTileParams = (): { pos: g.CommonOffset, color: number }[][] => this.tiles.slice(0, TileLayer.ROW)
        .map(row => row.slice(0, TileLayer.COLUMN))
        .map(row => row.map(tile => {
            return {
                pos: this.localToGlobal(tile),
                color: tile.color,
            };
        }));

    getTiles = (): Tile[][] => this.tiles.slice(0, TileLayer.ROW).map(row => row.slice(0, TileLayer.COLUMN));

    getColors = (): number[][] => this.getTiles().map(row => row.map(tile => tile.color));

    getReverseColors = (): number[][] => this.tiles.slice(0, TileLayer.ROW)
        .reverse()
        .map(row => row.slice(0, TileLayer.COLUMN))
        .map(row => row.map(tile => tile.color));

    deactivateAllTiles = (): void =>
        this.tiles.forEach(rows => rows.forEach(tile => tile.deactivate()));

    get isSwiping(): boolean { return this._isSwiping; }

    set isActivate(isActivate: boolean) {
        if (this._isActivate === isActivate) return;

        this._isActivate = isActivate;
        this.tiles.forEach(row => row.forEach(tile => {
            if (isActivate) {
                tile.activate();
            } else {
                tile.deactivate();
            }
        }));
    }

    set onStartRotation(callback: (tile: Tile) => void) { this._onStartRotation = callback; }

    set onDecideRotation(callback: (tiles: Tile[]) => void) { this._onDecideOrientation = callback; }

    set onRotation(callback: () => void) { this._onRotating = callback; }

    set onFinishRotation(callback: (hasChanged: boolean) => void) { this._onFinishRotation = callback; }

    private createTiles = (colorTable: number[][]): Tile[][] => {
        const tiles: Tile[][] = [];
        for (let i = 0; i < colorTable.length; i++) {
            const row = [];
            for (let j = 0; j < colorTable[i].length; j++) {
                const tile = new Tile(this.scene, colorTable[i][j]);
                tile.x = j * TileLayer.SIZE + TileLayer.SIZE * 0.5;
                tile.y = i * TileLayer.SIZE + TileLayer.SIZE * 0.5;
                this.append(tile);
                row.push(tile);
            }
            tiles.push(row);
        }
        return tiles;
    };

    private pointDownHandler = (ev: g.PointDownEvent) => {
        if (this._isActivate) return;

        this.isHorizontalSwipe = false;
        this.isStartSwipe = true;
        this.prev = { x: 0, y: 0 };
        this.copies = this.getColors();
        const columnIndex = this.getColumnIndex(ev.point.x);
        const rowIndex = this.getRowIndex(ev.point.y);
        this._onStartRotation(this.tiles[rowIndex][columnIndex]);
    };

    private pointMoveHandler = (ev: g.PointMoveEvent) => {
        if (this._isActivate) {
            if (this.isSwiping) this.finishRotation(ev.point);
            return;
        };

        if (this.isStartSwipe) {
            const deltaX = Math.abs(ev.startDelta.x);
            const deltaY = Math.abs(ev.startDelta.y);
            if (deltaX < TileLayer.SWIPE_THRESHOLD &&
                deltaY < TileLayer.SWIPE_THRESHOLD &&
                Math.abs(deltaX - deltaY) < TileLayer.SWIPE_THRESHOLD) return;

            this.isHorizontalSwipe = deltaX > deltaY;
            this.isStartSwipe = false;
            this._isSwiping = true;

            const tiles = this.isHorizontalSwipe ?
                this.getRowTiles(this.getRowIndex(ev.point.y)) : this.getColumnTiles(this.getColumnIndex(ev.point.x));
            this._onDecideOrientation(tiles);
        }
        if (!this._isSwiping) return;

        if (this.isHorizontalSwipe) {
            const rowIndex = this.getRowIndex(ev.point.y);
            this.translateHorizontal(rowIndex, this.clampTileSize(ev.prevDelta.x));
            this.rotateHorizontal(rowIndex);

            this.prev.x += ev.prevDelta.x;
            if (Math.abs(this.prev.x) > TileLayer.SWIPE_THRESHOLD * 2) {
                this.prev.x = 0;
                this._onRotating();
            }
        } else {
            const columnIndex = this.getColumnIndex(ev.point.x);
            this.translateVertical(columnIndex, this.clampTileSize(ev.prevDelta.y));
            this.rotateVertical(columnIndex);

            this.prev.y += ev.prevDelta.y;
            if (Math.abs(this.prev.y) > TileLayer.SWIPE_THRESHOLD * 2) {
                this.prev.y = 0;
                this._onRotating();
            }
        }
    };

    private pointUpHandler = (ev: g.PointUpEvent): void => {
        if (this._isActivate) return;

        if (this.isSwiping) {
            this.finishRotation(ev.point);
        }
        this._onFinishRotation(this.hasChangedColors());
    };

    private getRowTiles = (rowIndex: number): Tile[] => this.tiles[rowIndex];

    private getColumnTiles = (columnIndex: number): Tile[] => this.tiles.map(row => row[columnIndex]);

    private getRowIndex = (ey: number): number =>
        Math.max(0, Math.min(Math.floor(ey / TileLayer.SIZE), TileLayer.COLUMN - 1));

    private getColumnIndex = (ex: number): number =>
        Math.max(0, Math.min(Math.floor(ex / TileLayer.SIZE), TileLayer.ROW - 1));

    private clampTileSize = (value: number): number =>
        Math.max(-TileLayer.SIZE, Math.min(TileLayer.SIZE, value));

    private translateHorizontal = (rowIndex: number, x: number): void => {
        this.tiles[rowIndex].forEach(column => {
            column.x += x;
            column.modified();
        });
    };

    private rotateHorizontal = (rowIndex: number): void => {
        this.tiles[rowIndex].forEach((column, index, row) => {
            if (column.getRight() < 0) {
                row.splice(index, 1);
                column.x = row[row.length - 1].x + column.width;
                column.modified();
                row.push(column);
            }
        });

        const row = this.tiles[rowIndex];
        for (let i = row.length - 1; i > 0; i--) {
            const column = row[i];
            if (column.getRight() > column.width * row.length) {
                row.splice(i, 1);
                column.x = row[0].x - column.width;
                column.modified();
                row.unshift(column);
            }
        }
    };

    private translateVertical = (columnIndex: number, y: number): void => {
        this.tiles.forEach(row => {
            row[columnIndex].y += y;
            row[columnIndex].modified();
        });
    };

    private rotateVertical = (columnIndex: number): void => {
        const length = this.tiles.length;
        for (let i = 0; i < length - 1; i++) {
            const column = this.tiles[i][columnIndex];
            if (column.getBottom() < 0) {
                for (let j = 0; j < length - 1; j++) {
                    this.tiles[j][columnIndex] = this.tiles[j + 1][columnIndex];
                }
                column.y = this.tiles[length - 1][columnIndex].y + column.height;
                column.modified()
                this.tiles[length - 1][columnIndex] = column;
            }
        }

        for (let i = length - 1; i > 0; i--) {
            const column = this.tiles[i][columnIndex];
            if (column.getBottom() > column.height * length) {
                for (let j = length - 1; j > 0; j--) {
                    this.tiles[j][columnIndex] = this.tiles[j - 1][columnIndex];
                }
                column.y = this.tiles[0][columnIndex].y - column.height;
                column.modified();
                this.tiles[0][columnIndex] = column;
            }
        }
    };

    private finishHorizontalRotation = (ey: number): void => {
        const rowIndex = this.getRowIndex(ey);
        const column = this.tiles[rowIndex][0];
        if (column.x < 0) {
            this.tiles[rowIndex].splice(0, 1);
            this.tiles[rowIndex].push(column);
        }

        this.tiles[rowIndex].forEach((column, index) => {
            column.x = index * column.width + column.width / 2;
            column.modified();
        });
        this.copyAll();
    };

    private finishVerticalRotation = (ex: number): void => {
        const columnIndex = this.getColumnIndex(ex);
        const column = this.tiles[0][columnIndex];
        if (column.y < 0) {
            for (let i = 0; i < this.tiles.length - 1; i++) {
                this.tiles[i][columnIndex] = this.tiles[i + 1][columnIndex];
            }
            this.tiles[this.tiles.length - 1][columnIndex] = column;
        }

        this.tiles.forEach((row, rowIndex) => {
            const column = row[columnIndex];
            column.y = rowIndex * column.height + column.height / 2;
            column.modified();
        });
        this.copyAll();
    };

    private finishRotation = (pos: g.CommonOffset): void => {
        if (this.isHorizontalSwipe) {
            this.finishHorizontalRotation(pos.y);
        } else {
            this.finishVerticalRotation(pos.x);
        }
        this.finishSwiping();
    };

    private finishSwiping = (): void => {
        this.isHorizontalSwipe = false;
        this.isStartSwipe = false;
        this._isSwiping = false;
    };

    private copyAll = (): void => {
        for (let i = 0; i < TileLayer.ROW; i++) {
            for (let j = 0; j < TileLayer.COLUMN; j++) {
                const color = this.tiles[i][j].color;

                const right = this.tiles[i][j + TileLayer.COLUMN];
                right.color = color;

                const botom = this.tiles[i + TileLayer.ROW][j];
                botom.color = color
            }
        }
    };

    private hasChangedColors = (): boolean => {
        if (!this.copies) return false;

        if (this.copies.length <= 0 ||
            this.copies.length > TileLayer.ROW ||
            this.copies[0].length > TileLayer.COLUMN) return false;


        for (let i = 0; i < TileLayer.ROW; i++) {
            for (let j = 0; j < TileLayer.COLUMN; j++) {
                if (this.tiles[i][j].color !== this.copies[i][j]) return true;
            }
        }
        return false;
    }
}