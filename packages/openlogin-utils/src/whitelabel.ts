import Color from "color";

import { type WHITE_LABEL_THEME } from "./interfaces";

function getColorsList(colorsAmount = 3, colorsShiftAmount = 50, mixColor = "black", rotate = 0, saturation = 20, mainColor = "#0346ff") {
  const colorsList = [];

  let step;
  for (step = 0; step < colorsAmount; step += 1) {
    colorsList.push(
      Color(mainColor)
        .rotate(((step + 1) / colorsAmount) * -rotate)
        .saturate(((step + 1) / colorsAmount) * (saturation / 100))
        .mix(Color(mixColor), ((colorsShiftAmount / 100) * (step + 1)) / colorsAmount)
        .hex()
    );
  }

  return colorsList;
}

function generateWhiteLabelTheme(primary: string) {
  const darkSet = getColorsList(3, 50, "black", 0, 20, primary);
  const lightSet = getColorsList(6, 85, "white", 0, 20, primary);
  return [...darkSet.reverse(), ...[primary], ...lightSet];
}

function applyWhiteLabelTheme(rootElement: HTMLElement, theme: WHITE_LABEL_THEME) {
  if (theme.primary) {
    const themeSet = generateWhiteLabelTheme(theme.primary);

    rootElement.style.setProperty("--app-primary-900", themeSet[0]);
    rootElement.style.setProperty("--app-primary-800", themeSet[1]);
    rootElement.style.setProperty("--app-primary-700", themeSet[2]);
    rootElement.style.setProperty("--app-primary-600", themeSet[3]);
    rootElement.style.setProperty("--app-primary-500", themeSet[4]);
    rootElement.style.setProperty("--app-primary-400", themeSet[5]);
    rootElement.style.setProperty("--app-primary-300", themeSet[6]);
    rootElement.style.setProperty("--app-primary-200", themeSet[7]);
    rootElement.style.setProperty("--app-primary-100", themeSet[8]);
    rootElement.style.setProperty("--app-primary-50", themeSet[9]);
  }

  if (theme.onPrimary) {
    rootElement.style.setProperty("--app-on-primary", theme.onPrimary);
  }
}

export { applyWhiteLabelTheme };
