import * as logger from "../logger";
import setupFunction from "../setup";
import { exists, writeFile, readFile } from "fs";
import { promisify } from "util";

const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export interface IConfig {
  LIBRARY_PATH: string;

  FFMPEG_PATH: string;
  FFPROBE_PATH: string;

  GENERATE_THUMBNAILS: boolean;
  THUMBNAIL_INTERVAL: number;

  PASSWORD: string | null;

  PORT: number;
}

export const defaultConfig: IConfig = {
  LIBRARY_PATH: process.cwd(),
  FFMPEG_PATH: "",
  FFPROBE_PATH: "",
  GENERATE_THUMBNAILS: true,
  THUMBNAIL_INTERVAL: 60,
  PASSWORD: null,
  PORT: 3000
};

let config = JSON.parse(JSON.stringify(defaultConfig)) as IConfig;

export async function checkConfig() {
  if (await existsAsync("config.json")) {
    config = JSON.parse(await readFileAsync("config.json", "utf-8"));

    let defaultOverride = false;
    for (const key in defaultConfig) {
      if (config[key] === undefined) {
        config[key] = defaultConfig[key];
        defaultOverride = true;
      }
    }

    if (defaultOverride) {
      await writeFileAsync("config.json", JSON.stringify(config), "utf-8");
    }
    return false;
  } else {
    config = await setupFunction();
    await writeFileAsync("config.json", JSON.stringify(config), "utf-8");
    logger.warn("Created config.json. Please edit.");
    return true;
  }
}

export async function getConfig() {
  if (await existsAsync("config.json"))
    return JSON.parse(
      await readFileAsync("config.json", "utf-8")
    ) as IConfig;
  return defaultConfig;
}
