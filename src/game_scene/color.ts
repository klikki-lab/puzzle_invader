type ColorType = "R" | "Y" | "B" | "NONE";

export const Color: Record<ColorType, number> = {
    R: 0,
    Y: 1,
    B: 2,
    NONE: 3,
} as const;
