export namespace ArrayUtil {

    export const equals = (arr1: number[][], arr2: number[][]): boolean => {
        if (arr1.length !== arr2.length) return false;

        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].length !== arr2[i].length) return false;
            for (let j = 0; j < arr1[i].length; j++) {
                if (arr1[i][j] !== arr2[i][j]) return false;
            }
        }
        return true;
    };
}