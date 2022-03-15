interface ThemeVars {
    "--foreground": string;
    "--background": string;
    "--feature-foreground": string;
    "--tooltip-background": string;
    "--raised-background": string;
    "--points": string;
    "--locked": string;
    "--highlighted": string;
    "--bought": string;
    "--danger": string;
    "--link": string;
    "--outline": string;
    "--accent1": string;
    "--accent2": string;
    "--accent3": string;
    "--border-radius": string;
    "--modal-border": string;
    "--feature-margin": string;
}

export interface Theme {
    variables: ThemeVars;
    floatingTabs: boolean;
    mergeAdjacent: boolean;
}

declare module "@vue/runtime-dom" {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface CSSProperties extends Partial<ThemeVars> {}
}

const defaultTheme: Theme = {
    variables: {
        "--foreground": "#D8DEE9",
        "--background": "#2E3440",
        "--feature-foreground": "#000",
        "--tooltip-background": "rgba(0, 0, 0, 0.75)",
        "--raised-background": "#3B4252",
        "--points": "#E5E9F0",
        "--locked": "#4c566a",
        "--highlighted": "#434c5e",
        "--bought": "#8FBCBB",
        "--danger": "#D08770",
        "--link": "#88C0D0",
        "--outline": "#3B4252",
        "--accent1": "#B48EAD",
        "--accent2": "#A3BE8C",
        "--accent3": "#EBCB8B",

        "--border-radius": "15px",
        "--modal-border": "solid 2px #3B4252",
        "--feature-margin": "5px"
    },
    floatingTabs: false,
    mergeAdjacent: false
};

export enum Themes {
    Classic = "classic"
}

export default {
    classic: defaultTheme
} as Record<Themes, Theme>;
