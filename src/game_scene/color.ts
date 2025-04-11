type ColorType = "R" | "Y" | "B";

export const Color: Record<ColorType, number> = {
    R: 0,
    Y: 1,
    B: 2,
} as const;
