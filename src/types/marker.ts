import * as path from "path";

import {
  // actorCollection,
  // actorReferenceCollection,
  imageCollection,
  markerCollection,
} from "../database";
import { singleScreenshot } from "../ffmpeg/screenshot";
import { generateHash } from "../hash";
import * as logger from "../logger";
// import Actor from "./actor";
// import ActorReference from "./actor_reference";
import Image from "./image";
import Label from "./label";
import Scene from "./scene";
import { libraryPath } from "./utility";

export default class Marker {
  _id: string;
  name: string;
  addedOn = +new Date();
  favorite = false;
  bookmark: number | null = null;
  rating = 0;
  customFields: Record<string, boolean | string | number | string[] | null> = {};
  scene: string;
  time: number; // Time in scene in seconds
  thumbnail?: string | null = null;

  static async getAll(): Promise<Marker[]> {
    return markerCollection.getAll();
  }

  static async createMarkerThumbnail(marker: Marker): Promise<void> {
    const scene = await Scene.getById(marker.scene);
    if (!scene || !scene.path) return;

    logger.log("Creating thumbnail for marker " + marker._id);
    const image = new Image(`${marker.name} (thumbnail)`);
    const imagePath = path.join(libraryPath("thumbnails/markers"), image._id) + ".jpg";
    image.path = imagePath;
    image.scene = marker.scene;
    marker.thumbnail = image._id;

    const actors = (await Scene.getActors(scene)).map((l) => l._id);
    await Image.setActors(image, actors);

    const labels = (await Marker.getLabels(marker)).map((l) => l._id);
    await Image.setLabels(image, labels);

    await singleScreenshot(scene.path, imagePath, marker.time + 15, 480);
    await imageCollection.upsert(image._id, image);
    await markerCollection.upsert(marker._id, marker);
  }

  /* static async getActors(marker: Marker): Promise<Actor[]> {
    const references = await ActorReference.getByItem(marker._id);
    return (await actorCollection.getBulk(references.map((r) => r.actor))).filter(Boolean);
  }

  static async setActors(marker: Marker, actorIds: string[]): Promise<void> {
    const references = await ActorReference.getByItem(marker._id);

    const oldActorReferences = references.map((r) => r._id);

    for (const id of oldActorReferences) {
      await actorReferenceCollection.remove(id);
    }

    for (const id of [...new Set(actorIds)]) {
      const actorReference = new ActorReference(marker._id, id, "marker");
      logger.log("Adding actor to marker: " + JSON.stringify(actorReference));
      await actorReferenceCollection.upsert(actorReference._id, actorReference);
    }
  } */

  static async setLabels(marker: Marker, labelIds: string[]): Promise<void> {
    return Label.setForItem(marker._id, labelIds, "marker");
  }

  static async getLabels(marker: Marker): Promise<Label[]> {
    return Label.getForItem(marker._id);
  }

  constructor(name: string, scene: string, time: number) {
    this._id = "mk_" + generateHash();
    this.name = name;
    this.scene = scene;
    this.time = Math.round(time);
  }

  static async getByScene(sceneId: string): Promise<Marker[]> {
    return markerCollection.query("scene-index", sceneId);
  }

  static async getById(_id: string): Promise<Marker | null> {
    return markerCollection.get(_id);
  }

  static async remove(_id: string): Promise<void> {
    await markerCollection.remove(_id);
  }

  static async removeByScene(sceneId: string): Promise<void> {
    for (const marker of await Marker.getByScene(sceneId)) {
      await Marker.remove(marker._id);
    }
  }
}
