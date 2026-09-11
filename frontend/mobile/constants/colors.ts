/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#0a0a0a',
    tint: '#2f95dc',

    // Core surfaces
    background: '#E8E8E8',
    foreground: '#2B2B2B',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#2B2B2B',

    // Primary action color (buttons, links, active states)
    primary: '#2F7D32',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#F2F2F2',
    secondaryForeground: '#2B2B2B',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E3E3E3',
    mutedForeground: '#6E6E6E',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#DDF3E1',
    accentForeground: '#2B2B2B',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D9D9D9',
    input: '#D9D9D9',
    greenLight: '#74A56D',
    greenDark: '#1F6A2A',
    softGreen: '#DDF3E1',
    gold: '#B97916',
    softGold: '#FFF0CF',
    orange: '#FFAA33',
    blueStatus: '#1976D2',
    softBlue: '#E1F0FA',
    blue: '#2D7DB3',
    purple: '#8A45B7',
  },

  dark: {
    text: '#f7faf7',
    tint: '#58A95C',
    background: '#111712',
    foreground: '#f7faf7',
    card: '#1c241e',
    cardForeground: '#f7faf7',
    primary: '#58A95C',
    primaryForeground: '#ffffff',
    secondary: '#243126',
    secondaryForeground: '#f7faf7',
    muted: '#243126',
    mutedForeground: '#a9b5aa',
    accent: '#294b2d',
    accentForeground: '#f7faf7',
    destructive: '#f27a7a',
    destructiveForeground: '#ffffff',
    border: '#314036',
    input: '#314036',
    greenLight: '#83C986',
    greenDark: '#2D8135',
    softGreen: '#203a25',
    gold: '#e5bd51',
    softGold: '#443b1e',
    orange: '#f2a34f',
    blueStatus: '#60a5fa',
    softBlue: '#1d3542',
    blue: '#75b6e3',
    purple: '#bc76e4',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
