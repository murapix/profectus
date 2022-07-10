/** A object of all CSS variables determined by the current theme. */
export interface ThemeVars {
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

/** An object representing a theme the player can use to change the look of the game. */
export interface Theme {
    /** The values of the theme's CSS variables. */
    variables: ThemeVars;
    /** Whether or not tabs should "float" in the center of their container. */
    floatingTabs: boolean;
    /** Whether or not adjacent features should merge together - removing the margin between them, and only applying the border radius to the first and last elements in the row or column. */
    mergeAdjacent: boolean;
    /** Whether or not to show a pin icon on pinned tooltips. */
    showPin: boolean;
}

declare module "@vue/runtime-dom" {
    /** Make CSS properties accept any CSS variables usually controlled by a theme. */
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface CSSProperties extends Partial<ThemeVars> {}

    interface HTMLAttributes {
        style?: StyleValue;
    }
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
    mergeAdjacent: false,
    showPin: true
};

/** An enum of all available themes and their internal IDs. The keys are their display names. */
export enum Themes {
    Classic = "classic"
}

/** A dictionary of all available themes. */
export default {
    classic: defaultTheme
} as Record<Themes, Theme>;
