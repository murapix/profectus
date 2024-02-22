/** An object of the main CSS variables that a layer would want to customize */
export interface LayerTheme {
    "--feature-foreground": string; // feature text
    "--feature-background": string; // feature background
    "--bought": string; // feature background (complete)

    "--border-radius": string; // feature border radius
    "--feature-margin": string; // margin between features
}

/** A object of all CSS variables determined by the current theme. */
export interface Theme extends LayerTheme {
    // Main Layout Colors
    "--foreground": string; // main text
    "--background": string; // main background
    "--raised-background": string; // header background
    "--tooltip-foreground": string; // tooltip text
    "--tooltip-background": string; // tooltip background
    "--locked": string; // feature background (not yet available)
    "--hotkey": string; // hotkey border
    "--star": string; // mark star border
    "--svg-background": string; // svg background

    "--box-shadow-color": string; // feature hover shadow, changelog button text
    "--highlighted": string; // currently hovered (but not selected) options dropdown background
    "--outline": string; // borders between major screen elements
    "--danger": string; // warning
    "--link": string; // links, general button text, active toggle
    "--modal-border": string; // modal border
    "--quarter-transparent": string;
    "--transparent": string;
    
    "--changelog-feature": string; // changelog "feature" background
    "--changelog-fix": string; // changelog "fix" background
    "--changelog-balance": string; // changelog "balance" background
}

declare module "@vue/runtime-dom" {
    /** Make CSS properties accept any CSS variables usually controlled by a theme. */
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface CSSProperties extends Partial<Theme> {}

    interface HTMLAttributes {
        style?: StyleValue;
    }
}

const defaultTheme: Theme = {
    "--foreground": "#D8DEE9",
    "--background": "#2E3440",
    "--raised-background": "#3B4252",
    "--tooltip-foreground": "#E5E9F0",
    "--tooltip-background": "rgba(0, 0, 0, 0.75)",
    "--locked": "#4c566a",
    "--hotkey": "rgba(0, 0, 0, 0.5)",
    "--star": "#fc0",
    "--svg-background": "#2e3440",
    
    "--box-shadow-color": "#E5E9F0",
    "--highlighted": "#434c5e",
    "--outline": "#3B4252",
    "--danger": "#D08770",
    "--link": "#88C0D0",
    "--modal-border": "solid 2px #3B4252",
    "--quarter-transparent": "rgba(0, 0, 0, 0.25)",
    "--transparent": "#0000",
    
    "--changelog-feature": "#B48EAD",
    "--changelog-fix": "#A3BE8C",
    "--changelog-balance": "#EBCB8B",

    "--feature-foreground": "#000",
    "--feature-background": "#4c566a",
    "--bought": "#8FBCBB",
    
    "--border-radius": "15px",
    "--feature-margin": "5px"
};

export default defaultTheme;
